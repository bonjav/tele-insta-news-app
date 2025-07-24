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
import { useSettings } from '@/contexts/SettingsContext';
import { useRouter } from 'expo-router';
import { useNews } from '@/contexts/NewsContext';
import { ArticleNavigationService } from '@/services/navigationService';

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
  const { dispatch, refreshNews } = useNews();

  // Initialize the navigation service with dependencies (only once)
  useEffect(() => {
    console.log('🔔 NOTIFICATION CONTEXT - Initializing navigation service...');
    ArticleNavigationService.initialize({
      refreshNews,
      dispatch,
      language: settingsState.language || 'en',
      location: settingsState.location
    });
  }, [refreshNews, dispatch]); // Remove language and location from deps to prevent frequent re-initialization

  // Update navigation service when language/location changes
  useEffect(() => {
    console.log('🔔 NOTIFICATION CONTEXT - Updating navigation service language/location...');
    ArticleNavigationService.initialize({
      refreshNews,
      dispatch,
      language: settingsState.language || 'en',
      location: settingsState.location
    });
  }, [settingsState.language, settingsState.location]);

  // Initialize notification state from existing user preferences
  useEffect(() => {
    const initializeNotificationState = async () => {
      try {
        const deviceId = await Device.deviceName;
        if (deviceId) {
          const existingPrefs = await supabaseService.getUserPreferences(deviceId);
          if (existingPrefs && existingPrefs.notifications_enabled !== undefined) {
            console.log('Loading existing notification state:', existingPrefs.notifications_enabled);
            setNotificationsEnabled(existingPrefs.notifications_enabled);
          }
        }
      } catch (error) {
        console.warn('Failed to load existing notification state:', error);
      }
    };

    initializeNotificationState();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Push token obtained successfully, enabling notifications');
        // If we successfully got a push token, it means user granted permissions
        setNotificationsEnabled(true);
        setExpoPushToken(token);
        updatePushToken(token, true); // Pass true to indicate notifications should be enabled
      }
    }).catch(err => {
      console.error('Failed to get push token:', err);
      setError(err);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Use the centralized navigation service for notification responses
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      console.log('🔔 RESPONSE LISTENER - Received notification response');
      await ArticleNavigationService.handleNotificationResponse(response, 'foreground-background');
    });

    // Handle cold start notifications with a delay to ensure proper initialization
    setTimeout(async () => {
      console.log('🔔 COLD START HANDLER - Starting cold start check...');
      await ArticleNavigationService.handleColdStartNotification();
    }, 1000); // Wait 1 second for app to fully initialize

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const updatePushToken = async (token: string, forceEnable: boolean = false) => {
    try {
      const deviceId = await Device.deviceName;
      if (!deviceId) {
        throw new Error('Device ID not available');
      }

      // First try to get existing preferences
      const existingPrefs = await supabaseService.getUserPreferences(deviceId);
      
      if (existingPrefs) {
        // Update existing preferences - preserve existing notification setting unless forcing enable
        const notificationSetting = forceEnable ? true : existingPrefs.notifications_enabled;
        console.log('Updating existing preferences with notifications_enabled:', notificationSetting);
        
        await supabaseService.upsertUserPreferences(deviceId, {
          ...existingPrefs,
          push_token: token,
          notifications_enabled: notificationSetting,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new preferences - enable notifications if user granted permissions (forceEnable = true)
        const notificationSetting = forceEnable;
        console.log('Creating new preferences with notifications_enabled:', notificationSetting);
        
        const newPrefs: UserPreferences = {
          device_id: deviceId,
          push_token: token,
          notifications_enabled: notificationSetting,
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
      console.log('Toggling notifications from', notificationsEnabled, 'to', newState);
      setNotificationsEnabled(newState);
      
      const deviceId = await Device.deviceName;
      if (!deviceId) {
        throw new Error('Device ID not available');
      }

      // Update preferences in database
      const existingPrefs = await supabaseService.getUserPreferences(deviceId);
      
      if (existingPrefs) {
        console.log('Updating existing preferences with notifications_enabled:', newState);
        await supabaseService.upsertUserPreferences(deviceId, {
          ...existingPrefs,
          notifications_enabled: newState,
          updated_at: new Date().toISOString(),
        });
      } else {
        console.log('Creating new preferences with notifications_enabled:', newState);
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
      
      console.log('Successfully updated notification preferences');
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      setError(error as Error);
      // Revert state on error
      setNotificationsEnabled(!notificationsEnabled);
    }
  };

  // Simplified test method using the navigation service
  const testNotificationTap = async (articleId: number) => {
    console.log('🧪 TEST NOTIFICATION TAP - Testing with article ID:', articleId);
    const result = await ArticleNavigationService.testArticleNavigation(articleId);
    if (!result.success) {
      console.error('🧪 TEST NOTIFICATION TAP - Test failed:', result.error);
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