import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class DebugNotificationService {
  private static instance: DebugNotificationService;
  private notificationId = 0;

  static getInstance(): DebugNotificationService {
    if (!DebugNotificationService.instance) {
      DebugNotificationService.instance = new DebugNotificationService();
    }
    return DebugNotificationService.instance;
  }

  // Send a test notification immediately
  async sendTestNotification(articleId: number = 1, title: string = 'Test News Article') {
    try {
      console.log('🔧 DEBUG: Sending test notification...');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📰 Breaking News!',
          body: title,
          data: {
            articleId: articleId,
            location: 'Test Location',
            category: 'Test Category',
            imageUrl: 'https://via.placeholder.com/300x200',
            notificationId: `debug-${Date.now()}`
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      console.log('🔧 DEBUG: Test notification sent with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('🔧 DEBUG: Error sending test notification:', error);
      throw error;
    }
  }

  // Send a delayed test notification
  async sendDelayedNotification(seconds: number = 5, articleId: number = 1) {
    try {
      console.log(`🔧 DEBUG: Scheduling delayed notification in ${seconds} seconds...`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📰 Delayed News Update',
          body: `This notification was scheduled ${seconds} seconds ago`,
          data: {
            articleId: articleId,
            location: 'Test Location',
            category: 'Test Category',
            imageUrl: 'https://via.placeholder.com/300x200',
            notificationId: `debug-delayed-${Date.now()}`
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          seconds: seconds,
        },
      });

      console.log('🔧 DEBUG: Delayed notification scheduled with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('🔧 DEBUG: Error scheduling delayed notification:', error);
      throw error;
    }
  }

  // Send multiple test notifications
  async sendMultipleNotifications(count: number = 3) {
    console.log(`🔧 DEBUG: Sending ${count} test notifications...`);
    
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        this.sendTestNotification(
          i + 1, 
          `Test Article ${i + 1} - ${new Date().toLocaleTimeString()}`
        )
      );
    }
    
    try {
      const results = await Promise.all(promises);
      console.log('🔧 DEBUG: All test notifications sent:', results);
      return results;
    } catch (error) {
      console.error('🔧 DEBUG: Error sending multiple notifications:', error);
      throw error;
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔧 DEBUG: All scheduled notifications cancelled');
    } catch (error) {
      console.error('🔧 DEBUG: Error cancelling notifications:', error);
      throw error;
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('🔧 DEBUG: Scheduled notifications:', notifications);
      return notifications;
    } catch (error) {
      console.error('🔧 DEBUG: Error getting scheduled notifications:', error);
      throw error;
    }
  }

  // Test notification tap handling
  async testNotificationTap(articleId: number = 1) {
    console.log('🔧 DEBUG: Testing notification tap for article ID:', articleId);
    
    // Simulate the notification data that would be received
    const mockNotificationData = {
      articleId: articleId,
      location: 'Test Location',
      category: 'Test Category',
      imageUrl: 'https://via.placeholder.com/300x200',
      notificationId: `debug-tap-test-${Date.now()}`
    };

    console.log('🔧 DEBUG: Mock notification data:', mockNotificationData);
    
    // This would trigger the same logic as a real notification tap
    return mockNotificationData;
  }
}

export const debugNotificationService = DebugNotificationService.getInstance(); 