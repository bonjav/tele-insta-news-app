import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { Subscription } from "expo-modules-core";
import { registerForPushNotificationsAsync } from '@/util/registerForPushNotificationsAsync';
import { supabaseService } from '@/services/supabaseService';
import * as Device from 'expo-device';
import { AppState } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { useRouter } from 'expo-router';
import { useNews } from '@/contexts/NewsContext';
import { StorageService } from '@/services/storageService';

// Import UserPreferences type directly from supabaseService
import type { UserPreferences } from '@/services/supabaseService';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  testNotificationTap: (articleId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();
  const { state: settingsState } = useSettings();
  const router = useRouter();
  const { dispatch, refreshNews } = useNews();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        updatePushToken(token);
      }
    }).catch(err => {
      console.error('Failed to get push token:', err);
      setError(err);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      console.log('Notification response received:', response);
      
      const data = response.notification.request.content.data as { 
        articleId: number;
        location: string;
        category: string;
        imageUrl: string;
        notificationId: string;
      };
      
      console.log('Notification data:', data);
      
      if (data.articleId) {
        try {
          console.log('Looking for article with ID:', data.articleId);
          
          // First try to find the article in local storage
          const localArticle = await StorageService.findArticleById(data.articleId);
          
          if (localArticle) {
            console.log('Found article in local storage:', localArticle.title);
            // If found in local storage, display it immediately
            dispatch({ 
              type: 'SET_SPECIFIC_ARTICLE', 
              payload: localArticle 
            });
          } else {
            console.log('Article not found in local storage, refreshing news...');
            // If not found in local storage, refresh the news data
            await refreshNews(
              settingsState.language || 'en',
              data.location // Pass location directly, it will be null if not specified
            );
            
            // After refresh, try to find the article again
            const refreshedArticle = await StorageService.findArticleById(data.articleId);
            if (refreshedArticle) {
              console.log('Found article after refresh:', refreshedArticle.title);
              dispatch({ 
                type: 'SET_SPECIFIC_ARTICLE', 
                payload: refreshedArticle 
              });
            } else {
              console.warn('Article not found even after refresh. ArticleId:', data.articleId);
            }
          }
          
          // Navigate to the news screen
          console.log('Navigating to home screen...');
          router.push('/');
        } catch (error) {
          console.error('Error handling notification tap:', error);
        }
      } else {
        console.warn('No articleId in notification data');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [settingsState.language, settingsState.location]);

  const updatePushToken = async (token: string) => {
    try {
      const deviceId = await Device.deviceName;
      if (!deviceId) {
        throw new Error('Device ID not available');
      }

      // First try to get existing preferences
      const existingPrefs = await supabaseService.getUserPreferences(deviceId);
      
      if (existingPrefs) {
        // Update existing preferences
        await supabaseService.upsertUserPreferences(deviceId, {
          ...existingPrefs,
          push_token: token,
          notifications_enabled: notificationsEnabled,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new preferences with default values
        const newPrefs: UserPreferences = {
          device_id: deviceId,
          push_token: token,
          notifications_enabled: notificationsEnabled,
          language_code: settingsState.language || 'en',
          location: settingsState.location || null,
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          id: 0, // This will be set by the database
        };
        await supabaseService.upsertUserPreferences(deviceId, newPrefs);
      }
    } catch (error) {
      console.error('Failed to update push token:', error);
      setError(error as Error);
    }
  };

  const toggleNotifications = async () => {
    try {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      
      const deviceId = await Device.deviceName;
      if (!deviceId) {
        throw new Error('Device ID not available');
      }

      // Update preferences in database
      const existingPrefs = await supabaseService.getUserPreferences(deviceId);
      
      if (existingPrefs) {
        await supabaseService.upsertUserPreferences(deviceId, {
          ...existingPrefs,
          notifications_enabled: newState,
          updated_at: new Date().toISOString(),
        });
      } else {
        const newPrefs: UserPreferences = {
          device_id: deviceId,
          push_token: expoPushToken || null,
          notifications_enabled: newState,
          language_code: settingsState.language || 'en',
          location: settingsState.location || null,
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          id: 0, // This will be set by the database
        };
        await supabaseService.upsertUserPreferences(deviceId, newPrefs);
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      setError(error as Error);
      // Revert state on error
      setNotificationsEnabled(!notificationsEnabled);
    }
  };

  const testNotificationTap = async (articleId: number) => {
    console.log('Testing notification tap for article ID:', articleId);
    
    try {
      // First try to find the article in local storage
      const localArticle = await StorageService.findArticleById(articleId);
      
      if (localArticle) {
        console.log('Found article in local storage:', localArticle.title);
        // If found in local storage, display it immediately
        dispatch({ 
          type: 'SET_SPECIFIC_ARTICLE', 
          payload: localArticle 
        });
      } else {
        console.log('Article not found in local storage, refreshing news...');
        // If not found in local storage, refresh the news data
        await refreshNews(
          settingsState.language || 'en',
          settingsState.location // Pass location directly, it will be null if not specified
        );
        
        // After refresh, try to find the article again
        const refreshedArticle = await StorageService.findArticleById(articleId);
        if (refreshedArticle) {
          console.log('Found article after refresh:', refreshedArticle.title);
          dispatch({ 
            type: 'SET_SPECIFIC_ARTICLE', 
            payload: refreshedArticle 
          });
        } else {
          console.warn('Article not found even after refresh. ArticleId:', articleId);
        }
      }
      
      // Navigate to the news screen
      console.log('Navigating to home screen...');
      router.push('/');
    } catch (error) {
      console.error('Error testing notification tap:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        error,
        notificationsEnabled,
        toggleNotifications,
        testNotificationTap,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}