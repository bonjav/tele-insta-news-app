import { Alert } from 'react-native';
import { Config } from '@/constants/Config';

export class AlertUtils {
  /**
   * Show alert only if not in production mode
   * In production, only log to console for debugging
   */
  static showAlert(title: string, message?: string, buttons?: any[], options?: any): void {
    // Always log to console for debugging purposes
    console.log(`🚨 Alert: ${title}${message ? ` - ${message}` : ''}`);
    
    // Only show actual alert if not in production
    if (!Config.DEBUG.IS_PRODUCTION && Config.DEBUG.SHOW_USER_ALERTS) {
      Alert.alert(title, message, buttons, options);
    }
  }

  /**
   * Show error alert only if not in production mode
   * In production, only log to console
   */
  static showError(message: string, error?: any): void {
    // Always log error to console
    console.error(`❌ Error Alert: ${message}`, error);
    
    // Only show actual alert if not in production
    if (!Config.DEBUG.IS_PRODUCTION && Config.DEBUG.SHOW_USER_ALERTS) {
      Alert.alert('Error', message, [{ text: 'OK' }]);
    }
  }

  /**
   * Show debug-only alert (only for debug panel functionality)
   * These are kept even in production for debug panel usage
   */
  static showDebugAlert(title: string, message?: string, buttons?: any[], options?: any): void {
    console.log(`🔧 Debug Alert: ${title}${message ? ` - ${message}` : ''}`);
    
    // Debug alerts are shown if debug panel is enabled
    if (Config.DEBUG.ENABLE_DEBUG_PANEL) {
      Alert.alert(title, message, buttons, options);
    }
  }

  /**
   * Check if alerts should be shown to users
   */
  static shouldShowUserAlerts(): boolean {
    return !Config.DEBUG.IS_PRODUCTION && Config.DEBUG.SHOW_USER_ALERTS;
  }

  /**
   * Silent error logging without any user notification
   */
  static logError(context: string, message: string, error?: any): void {
    console.error(`🔇 Silent Error [${context}]: ${message}`, error);
  }
} 