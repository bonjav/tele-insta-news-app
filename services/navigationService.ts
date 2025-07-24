import * as Router from 'expo-router';
import { AppState } from 'react-native';
import { StorageService } from '@/services/storageService';
import { supabaseService } from '@/services/supabaseService';
import { AlertUtils } from '@/util/alertUtils';
import type { NewsArticle } from '@/types/news.types';

// NewsAction type from NewsContext
type NewsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ARTICLES'; payload: NewsArticle[] }
  | { type: 'ADD_NEWER_ARTICLES'; payload: NewsArticle[] }
  | { type: 'ADD_OLDER_ARTICLES'; payload: NewsArticle[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_LOCATION'; payload: string | null }
  | { type: 'SET_SPECIFIC_ARTICLE'; payload: NewsArticle }
  | { type: 'CLEAR_SPECIFIC_ARTICLE_FLAG' }
  | { type: 'RESET_STATE' };

// Type for navigation result
export interface NavigationResult {
  success: boolean;
  article?: NewsArticle;
  error?: string;
}

// Type for navigation dependencies (to avoid circular imports)
export interface NavigationDependencies {
  refreshNews: (language: string, location: string | null) => Promise<void>;
  dispatch: (action: NewsAction) => void;
  language: string;
  location: string | null;
}

export class ArticleNavigationService {
  private static dependencies: NavigationDependencies | null = null;
  private static pendingColdStartNotification: any = null;
  private static recentlyHandledNotifications = new Set<string>();
  
  /**
   * Initialize the service with required dependencies
   */
  static initialize(deps: NavigationDependencies) {
    console.log('🧭 NAVIGATION SERVICE - Initializing with dependencies');
    this.dependencies = deps;
    
    // Check if we have a pending cold start notification to handle
    if (this.pendingColdStartNotification) {
      console.log('🧭 NAVIGATION SERVICE - Handling pending cold start notification...');
      const pendingNotification = this.pendingColdStartNotification;
      this.pendingColdStartNotification = null;
      
      // Handle it after a short delay to ensure everything is ready
      setTimeout(() => {
        this.handleNotificationResponse(pendingNotification, 'cold-start-delayed');
      }, 500);
    }
  }

  /**
   * Navigate to a specific article by ID
   * This is the centralized method used by notification handlers, debug panel, etc.
   */
  static async navigateToArticle(articleId: number, context: string = 'unknown'): Promise<NavigationResult> {
    console.log(`🧭 NAVIGATION SERVICE - [${context}] Navigating to article ID:`, articleId);
    
    if (!this.dependencies) {
      console.error('🧭 NAVIGATION SERVICE - Dependencies not initialized');
      return {
        success: false,
        error: 'Navigation service not initialized'
      };
    }

    try {
      const { refreshNews, dispatch, language, location } = this.dependencies;
      
      // Check current app state to determine behavior
      const currentAppState = AppState.currentState;
      console.log(`🧭 NAVIGATION SERVICE - [${context}] Current app state:`, currentAppState);
      
      const isAppInForeground = currentAppState === 'active';
      let foundArticle: NewsArticle | null = null;
      
      if (isAppInForeground) {
        // App is already open - always refresh local store with latest news
        console.log(`🧭 NAVIGATION SERVICE - [${context}] App is in foreground - refreshing local store...`);
        try {
          await refreshNews(language, location);
          console.log(`🧭 NAVIGATION SERVICE - [${context}] Refresh completed successfully`);
        } catch (refreshError) {
          console.error(`🧭 NAVIGATION SERVICE - [${context}] Error during refresh:`, refreshError);
        }
        
        // After refresh, find the article
        try {
          foundArticle = await StorageService.findArticleById(articleId);
          if (foundArticle) {
            console.log(`🧭 NAVIGATION SERVICE - [${context}] Found article after refresh:`, foundArticle.title);
          } else {
            console.warn(`🧭 NAVIGATION SERVICE - [${context}] Article not found in local storage, trying database...`);
            // Try database fallback
            foundArticle = await supabaseService.fetchArticleById(articleId, language);
            if (foundArticle) {
              console.log(`🧭 NAVIGATION SERVICE - [${context}] Found article in database:`, foundArticle.title);
            }
          }
        } catch (storageError) {
          console.error(`🧭 NAVIGATION SERVICE - [${context}] Error during storage lookup:`, storageError);
        }
      } else {
        // App was not open - check local storage first, refresh only if needed
        console.log(`🧭 NAVIGATION SERVICE - [${context}] App was not in foreground - checking local storage first...`);
        
        try {
          // First try to find the article in local storage
          foundArticle = await StorageService.findArticleById(articleId);
          console.log(`🧭 NAVIGATION SERVICE - [${context}] Storage lookup completed`);
          
          if (foundArticle) {
            console.log(`🧭 NAVIGATION SERVICE - [${context}] Found article in local storage:`, foundArticle.title);
          } else {
            console.log(`🧭 NAVIGATION SERVICE - [${context}] Article not found locally, trying database first for cold start...`);
            
            // For notification contexts (especially cold start), try database first before refresh
            // This is more reliable when the app just restarted
            if (context.includes('notification') || context.includes('cold-start')) {
              try {
                console.log(`🧭 NAVIGATION SERVICE - [${context}] Trying database direct lookup for notification...`);
                foundArticle = await supabaseService.fetchArticleById(articleId, language);
                if (foundArticle) {
                  console.log(`🧭 NAVIGATION SERVICE - [${context}] Found article in database (direct):`, foundArticle.title);
                }
              } catch (dbError) {
                console.error(`🧭 NAVIGATION SERVICE - [${context}] Direct database lookup failed:`, dbError);
              }
            }
            
            // If still not found, try refreshing news
            if (!foundArticle) {
              console.log(`🧭 NAVIGATION SERVICE - [${context}] Still not found, refreshing news...`);
              try {
                await refreshNews(language, location);
                console.log(`🧭 NAVIGATION SERVICE - [${context}] Background refresh completed successfully`);
                
                // After refresh, try to find the article again
                foundArticle = await StorageService.findArticleById(articleId);
                if (foundArticle) {
                  console.log(`🧭 NAVIGATION SERVICE - [${context}] Found article after refresh:`, foundArticle.title);
                } else {
                  console.warn(`🧭 NAVIGATION SERVICE - [${context}] Article not found after refresh, trying database again...`);
                  // Try database fallback again
                  foundArticle = await supabaseService.fetchArticleById(articleId, language);
                  if (foundArticle) {
                    console.log(`🧭 NAVIGATION SERVICE - [${context}] Found article in database (post-refresh):`, foundArticle.title);
                  }
                }
              } catch (refreshError) {
                console.error(`🧭 NAVIGATION SERVICE - [${context}] Error during background refresh:`, refreshError);
                // Try database directly if refresh fails
                try {
                  foundArticle = await supabaseService.fetchArticleById(articleId, language);
                  if (foundArticle) {
                    console.log(`🧭 NAVIGATION SERVICE - [${context}] Found article in database (refresh error fallback):`, foundArticle.title);
                  }
                } catch (dbError) {
                  console.error(`🧭 NAVIGATION SERVICE - [${context}] Database fallback failed:`, dbError);
                }
              }
            }
          }
        } catch (storageError) {
          console.error(`🧭 NAVIGATION SERVICE - [${context}] Error during background storage lookup:`, storageError);
          // Try database directly if storage fails
          try {
            foundArticle = await supabaseService.fetchArticleById(articleId, language);
            if (foundArticle) {
              console.log(`🧭 NAVIGATION SERVICE - [${context}] Found article in database (storage error fallback):`, foundArticle.title);
            }
          } catch (dbError) {
            console.error(`🧭 NAVIGATION SERVICE - [${context}] Database fallback after storage error failed:`, dbError);
          }
        }
      }
      
      // Navigate to the news screen first
      console.log(`🧭 NAVIGATION SERVICE - [${context}] Navigating to home screen...`);
      try {
        Router.router.push('/');
        console.log(`🧭 NAVIGATION SERVICE - [${context}] Navigation to home screen completed`);
      } catch (navError) {
        console.error(`🧭 NAVIGATION SERVICE - [${context}] Error navigating to home screen:`, navError);
      }
      
      // Set the article with a delay to ensure the screen is mounted
      if (foundArticle) {
        console.log(`🧭 NAVIGATION SERVICE - [${context}] Setting specific article:`, foundArticle.title, 'with ID:', foundArticle.id);
        
        // Use a shorter delay for notification navigation to be more responsive
        const delay = context.includes('notification') ? 200 : 500;
        
        setTimeout(() => {
          try {
            console.log(`🧭 NAVIGATION SERVICE - [${context}] Dispatching SET_SPECIFIC_ARTICLE action...`);
            dispatch({ 
              type: 'SET_SPECIFIC_ARTICLE', 
              payload: foundArticle! 
            });
            console.log(`🧭 NAVIGATION SERVICE - [${context}] SET_SPECIFIC_ARTICLE action dispatched successfully!`);
          } catch (dispatchError) {
            console.error(`🧭 NAVIGATION SERVICE - [${context}] Error dispatching action:`, dispatchError);
          }
        }, delay);
        
        return {
          success: true,
          article: foundArticle
        };
      } else {
        console.error(`🧭 NAVIGATION SERVICE - [${context}] Article not found anywhere. ArticleId:`, articleId);
        // Log error silently in production, show alert in development
        AlertUtils.logError('ArticleNavigation', `Article not found: ${articleId}`);
        setTimeout(() => {
          AlertUtils.showAlert(
            'Article Not Found',
            'The requested article could not be found. It may have been removed or is no longer available.',
            [{ text: 'OK' }]
          );
        }, 1000);
        
        return {
          success: false,
          error: 'Article not found'
        };
      }
    } catch (error) {
      console.error(`🧭 NAVIGATION SERVICE - [${context}] Error navigating to article:`, error);
      // Log error silently in production, show alert in development
      AlertUtils.logError('ArticleNavigation', 'Failed to open article', error);
      setTimeout(() => {
        AlertUtils.showError('Failed to open the article. Please try again.');
      }, 1000);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle notification response (both background/foreground and cold start)
   */
  static async handleNotificationResponse(
    response: any, 
    context: string = 'notification'
  ): Promise<NavigationResult> {
    console.log(`🔔 NOTIFICATION RESPONSE - [${context}] Response received:`, response);
    
    // Check if notification and content exist
    if (!response?.notification?.request?.content) {
      console.warn(`🔔 NOTIFICATION RESPONSE - [${context}] Invalid notification structure`);
      return {
        success: false,
        error: 'Invalid notification structure'
      };
    }
    
    // Create a unique identifier for this notification to prevent double handling
    const notificationId = response.notification.request.identifier;
    console.log(`🔔 NOTIFICATION RESPONSE - [${context}] Notification ID:`, notificationId);
    
    if (this.recentlyHandledNotifications.has(notificationId)) {
      console.log(`🔔 NOTIFICATION RESPONSE - [${context}] Already handled this notification, skipping...`);
      return {
        success: true,
        error: 'Already handled'
      };
    }
    
    // Mark this notification as handled
    this.recentlyHandledNotifications.add(notificationId);
    
    // Clean up old notifications (keep only last 10)
    if (this.recentlyHandledNotifications.size > 10) {
      const notifications = Array.from(this.recentlyHandledNotifications);
      this.recentlyHandledNotifications.delete(notifications[0]);
    }
    
    const data = response.notification.request.content.data as { 
      articleId: number;
      location: string;
      category: string;
      imageUrl: string;
      notificationId: string;
    };
    
    console.log(`🔔 NOTIFICATION RESPONSE - [${context}] Data:`, data);
    
    // Check if data exists and has articleId
    if (data && data.articleId) {
      return await this.navigateToArticle(data.articleId, `notification-${context}`);
    } else {
      console.warn(`🔔 NOTIFICATION RESPONSE - [${context}] No articleId in notification data. Data:`, data);
      return {
        success: false,
        error: 'No article ID in notification data'
      };
    }
  }

  /**
   * Check for and handle cold start notifications
   */
  static async handleColdStartNotification(): Promise<void> {
    console.log('🔔 COLD START - Checking for last notification response...');
    
    try {
      const Notifications = await import('expo-notifications');
      
      // Wait a bit for the notification system to be ready and for any pending responses
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
      
      if (lastNotificationResponse) {
        console.log('🔔 COLD START - Found last notification response, handling...');
        console.log('🔔 COLD START - Full response structure:', JSON.stringify(lastNotificationResponse, null, 2));
        
        // Wait for dependencies to be ready before handling
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds maximum wait
        
        while (!this.dependencies && attempts < maxAttempts) {
          console.log(`🔔 COLD START - Waiting for dependencies... attempt ${attempts + 1}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (this.dependencies) {
          console.log('🔔 COLD START - Dependencies ready, handling notification...');
          await this.handleNotificationResponse(lastNotificationResponse, 'cold-start');
        } else {
          console.error('🔔 COLD START - Dependencies not ready after waiting, storing for later...');
          // Store the notification to handle later when dependencies are ready
          this.pendingColdStartNotification = lastNotificationResponse;
        }
      } else {
        console.log('🔔 COLD START - No last notification response found');
      }
    } catch (error) {
      console.error('🔔 COLD START - Error checking for cold start notification:', error);
    }
  }

  /**
   * Test method for debug purposes
   */
  static async testArticleNavigation(articleId: number): Promise<NavigationResult> {
    return await this.navigateToArticle(articleId, 'debug-test');
  }
} 