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

// Import UserPreferences type directly from supabaseService
import type { UserPreferences } from '@/services/supabaseService';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
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
  const { setSpecificArticle } = useNews();

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

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { articleId?: number; languageCode?: string };
      
      if (data.articleId) {
        // Load the article in the specified language or user's preferred language
        setSpecificArticle(
          data.articleId,
          data.languageCode || settingsState.language || 'en'
        ).then(() => {
          // Navigate to the news screen
          router.push('/');
        }).catch(error => {
          console.error('Error loading notification article:', error);
        });
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
  }, [settingsState.language]);

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

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        error,
        notificationsEnabled,
        toggleNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}