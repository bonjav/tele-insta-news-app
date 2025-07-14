import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
async function sendExpoNotification(pushToken, title, body, data) {
  try {
    const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    if (!expoAccessToken) {
      throw new Error('EXPO_ACCESS_TOKEN is not configured in environment variables');
    }
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Authorization': `Bearer ${expoAccessToken}`
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
        badge: 1
      })
    });
    const responseData = await response.json();
    if (!response.ok) {
      if (responseData.errors) {
        const [error] = responseData.errors;
        if (error.code === 'UNAUTHORIZED') {
          console.error('Expo authorization failed. Please check EXPO_ACCESS_TOKEN');
          throw new Error('EXPO_AUTH_ERROR');
        } else if (error.code === 'PUSH_TOO_MANY_EXPERIENCE_IDS') {
          throw new Error('INVALID_TOKEN');
        } else if (error.code === 'PUSH_TOO_MANY_NOTIFICATIONS') {
          throw new Error('RATE_LIMIT');
        } else if (error.code === 'PUSH_TOO_MANY_REQUESTS') {
          throw new Error('RATE_LIMIT');
        }
        throw new Error(error.message || 'Unknown push notification error');
      }
      throw new Error(`Failed to send notification: ${JSON.stringify(responseData)}`);
    }
    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'EXPO_AUTH_ERROR') {
        throw {
          code: 'EXPO_AUTH_ERROR',
          message: 'Expo authorization failed. Check access token configuration.',
          shouldRetry: false
        };
      }
      if (error.message === 'UNAUTHORIZED_TOKEN' || error.message === 'INVALID_TOKEN') {
        // We should invalidate this token
        throw {
          code: error.message,
          message: 'Push token is invalid or unauthorized',
          shouldInvalidateToken: true
        };
      }
    }
    throw error;
  }
}
async function updateNotificationStatus(supabaseClient, articleId, status, results, error) {
  const successfulResults = results.filter((r)=>r.status === 'success');
  const failedResults = results.filter((r)=>r.status === 'error');
  const notifiedUserIds = results.map((r)=>r.userPreferenceId);
  const notifiedTranslationIds = results.filter((r)=>r.translationId).map((r)=>r.translationId);
  const successTickets = successfulResults.map((r)=>r.ticket).filter(Boolean);
  const failedTickets = failedResults.reduce((acc, curr)=>{
    if (curr.error) {
      acc[curr.userPreferenceId] = curr.error;
    }
    return acc;
  }, {});
  const { error: updateError } = await supabaseClient.from('notification_status').update({
    last_notified_article_id: articleId,
    notified_translation_ids: notifiedTranslationIds,
    notified_user_preference_ids: notifiedUserIds,
    total_recipients_count: results.length,
    successful_recipients_count: successfulResults.length,
    failed_recipients_count: failedResults.length,
    expo_success_tickets: successTickets,
    expo_failed_tickets: failedTickets,
    notification_status: status,
    error_message: error,
    last_notification_end_time: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  }).eq('id', 1);
  if (updateError) {
    console.error('Failed to update notification status:', updateError);
    throw updateError;
  }
}
async function fetchTranslationWithRetry(supabaseClient, articleId, languageCode, maxRetries = 5, delayMs = 1000) {
  for(let attempt = 1; attempt <= maxRetries; attempt++){
    const { data: translations, error } = await supabaseClient.from('news_article_translation').select('id, title, description').eq('article_id', articleId).eq('language_code', languageCode);
    if (error) {
      return {
        data: null,
        error
      };
    }
    if (translations && translations.length > 0) {
      return {
        data: translations[0],
        error: null
      };
    }
    //console.log(`No translation found on attempt ${attempt}/${maxRetries}, waiting ${delayMs}ms before retry...`);
    if (attempt < maxRetries) {
      await new Promise((resolve)=>setTimeout(resolve, delayMs));
    }
  }
  return {
    data: null,
    error: {
      message: `No translation found after ${maxRetries} attempts`,
      code: 'NO_TRANSLATION_AFTER_RETRY'
    }
  };
}
serve(async (req)=>{
  const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
  let articleData;
  let notificationId;
  let articleLocation;
  const notificationResults = [];
  try {
    // Get and validate the request body
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    if (!body) throw new Error('Request body is empty');
    if (!body.record) throw new Error('Request body is missing record data');
    articleData = body.record;
    console.log('Article data:', JSON.stringify(articleData, null, 2));
    if (!articleData.id) throw new Error('Article data is missing ID');
    notificationId = body.notification_id;
    console.log('Notification ID:', notificationId);
    articleLocation = articleData.location;
    console.log('New Article from :', articleLocation);
    // Initialize notification status
    await updateNotificationStatus(supabaseClient, articleData.id, 'in_progress', [], null);
    // Get all active user preferences with valid push tokens
    const { data: userPrefs, error: userError } = await supabaseClient.from('user_preferences').select('*').eq('notifications_enabled', true).not('push_token', 'is', null).or(`location.is.null,location.eq.${articleLocation}`);
    if (userError) {
      console.error('Error fetching user preferences:', userError);
      await updateNotificationStatus(supabaseClient, articleData.id, 'failed', notificationResults, userError.message);
      throw userError;
    }
    console.log(`Found ${userPrefs?.length || 0} users with notifications enabled`);
    if (!userPrefs?.length) {
      await updateNotificationStatus(supabaseClient, articleData.id, 'completed', notificationResults, null);
      return new Response(JSON.stringify({
        success: true,
        notificationsSent: 0,
        message: 'No users to notify'
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // Send notifications to each user
    await Promise.all(userPrefs.map(async (pref)=>{
      try {
        if (!pref.push_token || !pref.language_code) {
          console.warn('Invalid user preferences:', JSON.stringify(pref, null, 2));
          notificationResults.push({
            status: 'error',
            error: {
              code: 'INVALID_PREFERENCES',
              message: 'Missing push token or language code'
            },
            userPreferenceId: pref.id
          });
          return;
        }
        // Replace the translation fetching code with the retry mechanism
        const { data: translation, error: translationError } = await fetchTranslationWithRetry(supabaseClient, articleData.id, pref.language_code);
        if (translationError) {
          console.error(`Translation error for language ${pref.language_code}:`, translationError);
          notificationResults.push({
            status: 'error',
            error: {
              code: translationError.code || 'TRANSLATION_ERROR',
              message: translationError.message
            },
            userPreferenceId: pref.id
          });
          return;
        }
        if (!translation) {
          console.warn(`No translation found for article ${articleData.id} in language ${pref.language_code} after all retries`);
          notificationResults.push({
            status: 'error',
            error: {
              code: 'NO_TRANSLATION',
              message: 'Translation not found after multiple retries'
            },
            userPreferenceId: pref.id
          });
          return;
        }
        console.log(`Sending notification to user with token ${pref.push_token}`);
        try {
          const result = await sendExpoNotification(pref.push_token, translation.title, translation.description, {
            articleId: articleData.id,
            location: articleData.location,
            category: articleData.category,
            imageUrl: articleData.image_url,
            notificationId
          });
          console.log(`Notification sent successfully to ${pref.push_token}:`, JSON.stringify(result, null, 2));
          notificationResults.push({
            status: 'success',
            ticket: result.id,
            userPreferenceId: pref.id,
            translationId: translation.id
          });
        } catch (notificationError) {
          console.error(`Failed to send notification to token ${pref.push_token}:`, notificationError);
          if (notificationError.shouldInvalidateToken) {
            // Invalidate the token in the database
            const { error: updateError } = await supabaseClient.from('user_preferences').update({
              push_token: null,
              notifications_enabled: false,
              last_token_error: notificationError.message,
              updated_at: new Date().toISOString()
            }).eq('id', pref.id);
            if (updateError) {
              console.error('Failed to invalidate push token:', updateError);
            }
          }
          notificationResults.push({
            status: 'error',
            error: {
              code: notificationError.code || 'SEND_ERROR',
              message: notificationError.message || String(notificationError)
            },
            userPreferenceId: pref.id
          });
        }
      } catch (error) {
        console.error(`Error processing notification for user ${pref.id}:`, error);
        notificationResults.push({
          status: 'error',
          error: {
            code: 'PROCESSING_ERROR',
            message: error instanceof Error ? error.message : String(error)
          },
          userPreferenceId: pref.id
        });
      }
    }));
    // Update final status
    await updateNotificationStatus(supabaseClient, articleData.id, 'completed', notificationResults, null);
    return new Response(JSON.stringify({
      success: true,
      notificationsSent: notificationResults.filter((r)=>r.status === 'success').length,
      totalAttempted: notificationResults.length
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in edge function:', error);
    console.error('Stack trace:', error.stack);
    console.error('Article data at error:', JSON.stringify(articleData, null, 2));
    if (articleData?.id) {
      try {
        await updateNotificationStatus(supabaseClient, articleData.id, 'failed', notificationResults, error instanceof Error ? error.message : String(error));
      } catch (updateError) {
        console.error('Could not update notification status:', updateError);
      }
    }
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      articleData: articleData || null
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
