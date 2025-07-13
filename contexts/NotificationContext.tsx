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

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { state: settingsState, updateUserPreferences } = useSettings();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settingsState.userPreferences?.notifications_enabled ?? true
  );

  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  // Initialize notification state from user preferences
  useEffect(() => {
    if (settingsState.userPreferences) {
      setNotificationsEnabled(settingsState.userPreferences.notifications_enabled);
    }
  }, [settingsState.userPreferences]);

  // Update user activity on app focus
  useEffect(() => {
    const updateActivity = async () => {
      try {
        await updateUserPreferences({});
      } catch (error) {
        console.error('Failed to update user activity:', error);
      }
    };

    // Set up app state change listener
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        updateActivity();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (notificationsEnabled) {
      registerForPushNotificationsAsync().then(
        async (token) => {
          setExpoPushToken(token || null);
          // Update token in preferences
          if (token) {
            try {
              await updateUserPreferences({
                push_token: token,
                notifications_enabled: true
              });
            } catch (error) {
              console.error('Failed to update push token:', error);
            }
          }
        },
        (error) => setError(error)
      );
    } else {
      setExpoPushToken(null);
      // Clear token in preferences
      try {
        updateUserPreferences({
          push_token: null,
          notifications_enabled: false
        });
      } catch (error) {
        console.error('Failed to clear push token:', error);
      }
    }

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received: ", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "🔔 Notification Response: ",
          JSON.stringify(response, null, 2),
          JSON.stringify(response.notification.request.content.data, null, 2)
        );
        // Handle the notification response here
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [notificationsEnabled]);

  const toggleNotifications = async () => {
    try {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      
      await updateUserPreferences({
        notifications_enabled: newState,
      });
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      // Revert state on error
      setNotificationsEnabled(!notificationsEnabled);
      throw error;
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
};