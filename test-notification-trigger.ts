import { createClient } from '@supabase/supabase-js';
import { Config } from './constants/Config';

const supabase = createClient(Config.SUPABASE.URL, Config.SUPABASE.ANON_KEY);

async function testNotificationTrigger() {
  try {
    // 1. First, ensure we have a test user with notifications enabled
    const testDevice = {
      device_id: 'test_device_' + Date.now(),
      push_token: 'ExponentPushToken[test_token]',
      notifications_enabled: true,
      language_code: 'en'
    };

    console.log('Creating test user preferences...');
    const { data: userPref, error: userError } = await supabase
      .from('user_preferences')
      .upsert(testDevice)
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }
    console.log('Test user created:', userPref);

    // 2. Create a test news article
    const testArticle = {
      location: 'Singapore',
      source_channel: 'Test Channel',
      title: 'Test Article',
      article_url: 'https://example.com/test',
      description: 'This is a test article',
      published_at: new Date().toISOString(),
      category: 'test'
    };

    console.log('Creating test article...');
    const { data: article, error: articleError } = await supabase
      .from('news_article')
      .insert(testArticle)
      .select()
      .single();

    if (articleError) {
      throw new Error(`Failed to create test article: ${articleError.message}`);
    }
    console.log('Test article created:', article);

    // 3. Create article translation
    const testTranslation = {
      article_id: article.id,
      language_code: 'en',
      title: 'Test Article Translation',
      description: 'This is a test article translation',
      published_at: new Date().toISOString()
    };

    console.log('Creating test translation...');
    const { data: translation, error: translationError } = await supabase
      .from('news_article_translation')
      .insert(testTranslation)
      .select()
      .single();

    if (translationError) {
      throw new Error(`Failed to create test translation: ${translationError.message}`);
    }
    console.log('Test translation created:', translation);

    // 4. Wait a bit to allow the trigger to process
    console.log('Waiting for trigger to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Clean up test data
    console.log('Cleaning up test data...');
    await Promise.all([
      supabase.from('user_preferences').delete().eq('device_id', testDevice.device_id),
      supabase.from('news_article').delete().eq('id', article.id)
    ]);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testNotificationTrigger(); 