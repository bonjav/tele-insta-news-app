# 🔧 Debugging Push Notifications in Emulator

This guide explains how to debug push notifications in your local development environment using Android/iOS emulators.

## 🚀 Quick Start

### 1. **Start the Development Server**
```bash
npm run dev
# or
expo start
```

### 2. **Open in Emulator**
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Or scan QR code with Expo Go app

### 3. **Access Debug Panel**
- Look for the "🐛 Debug" button in the top-right corner
- Tap it to open the debug panel
- Use the test buttons to send notifications

## 🔧 How It Works

### **Emulator vs Physical Device**

| Feature | Emulator | Physical Device |
|---------|----------|-----------------|
| Push Tokens | Mock tokens | Real Expo push tokens |
| Local Notifications | ✅ Full support | ✅ Full support |
| Remote Notifications | ❌ Not supported | ✅ Full support |
| Notification Taps | ✅ Simulated | ✅ Real taps |

### **Modified Registration Flow**

The app now detects if it's running in development mode on an emulator and:

1. **Returns mock push tokens** instead of real ones
2. **Enables local notifications** for testing
3. **Provides debug tools** for simulating notification taps

## 🧪 Testing Features

### **Available Test Actions**

1. **Send Test Notification** - Immediate notification
2. **Send Delayed (5s)** - Scheduled notification
3. **Send 3 Notifications** - Multiple notifications
4. **Get Scheduled Count** - Check pending notifications
5. **Cancel All Notifications** - Clear scheduled notifications
6. **Test Notification Tap** - Simulate notification tap

### **Debug Panel Features**

- **Notification Status** - Shows push token, last notification, errors
- **News State** - Shows articles count, current index, loading state
- **Test Actions** - Buttons to trigger various notification tests

## 🔍 Debugging Workflow

### **1. Test Basic Notifications**
```javascript
// In debug panel, tap "Send Test Notification"
// This will show an immediate notification
```

### **2. Test Delayed Notifications**
```javascript
// Tap "Send Delayed (5s)"
// Notification will appear after 5 seconds
```

### **3. Test Notification Tap Handling**
```javascript
// Tap "Test Notification Tap"
// This simulates tapping a notification and navigating to an article
```

### **4. Monitor Console Logs**
Watch the console for detailed logs:
- `🔧 DEBUG:` - Debug service logs
- `🔔 NOTIFICATION TAP:` - Notification tap handling
- `📱 ARTICLE NAVIGATION:` - Article navigation logs

## 🛠️ Advanced Debugging

### **Custom Test Notifications**

You can modify the debug service to test specific scenarios:

```typescript
// In debugNotificationService.ts
async sendCustomNotification(data: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: data.title,
      body: data.body,
      data: data.payload,
    },
    trigger: null, // Immediate
  });
}
```

### **Testing Different App States**

1. **Foreground Testing** - App is open and active
2. **Background Testing** - App is minimized
3. **Killed App Testing** - App was force-closed

### **Testing Notification Tap Scenarios**

1. **Article Exists** - Article is found in local storage
2. **Article Not Found** - Article needs to be fetched from database
3. **Network Error** - Simulate network failures

## 🐛 Common Issues & Solutions

### **Issue: Notifications not showing**
**Solution:**
- Check if notifications are enabled in device settings
- Verify the notification channel is created
- Check console for permission errors

### **Issue: Notification tap not working**
**Solution:**
- Ensure the app is properly handling notification responses
- Check if the article exists in the database
- Verify navigation logic is working

### **Issue: Mock tokens not working**
**Solution:**
- This is expected behavior - mock tokens are for emulator only
- Use the debug panel to test local notifications instead

## 📱 Real Device Testing

When testing on a physical device:

1. **Get real push tokens** from Expo
2. **Test remote notifications** from your backend
3. **Use Expo's push notification tool** to send test notifications

### **Expo Push Notification Tool**
```bash
# Install Expo CLI
npm install -g @expo/cli

# Send test notification
expo push:android:send --to <PUSH_TOKEN> --title "Test" --body "Test message"
```

## 🔄 Integration with Backend

### **Testing Edge Function**
The app includes an edge function for sending notifications:

```typescript
// database/edge-function/send-news-notification/index.ts
// This function can be tested with real devices
```

### **Database Integration**
- Notifications are stored in Supabase
- User preferences track notification settings
- Articles are linked to notifications via articleId

## 📊 Monitoring & Analytics

### **Console Logging**
The app provides extensive logging for debugging:

- Notification registration
- Token updates
- Notification taps
- Article navigation
- Error handling

### **Debug Panel Metrics**
- Push token status
- Notification count
- Article count
- Loading states

## 🎯 Best Practices

1. **Always test on both emulator and physical device**
2. **Use the debug panel for quick testing**
3. **Monitor console logs for detailed debugging**
4. **Test different app states (foreground/background/killed)**
5. **Verify notification permissions**
6. **Test error scenarios**

## 🚨 Troubleshooting

### **Emulator Issues**
- Restart the emulator if notifications stop working
- Clear app data if needed
- Check emulator notification settings

### **Development Server Issues**
- Restart Expo development server
- Clear Metro cache: `expo start -c`
- Check for port conflicts

### **Permission Issues**
- Check device notification settings
- Request permissions explicitly
- Handle permission denial gracefully

---

## 📝 Summary

This setup allows you to:
- ✅ Test notifications in emulator
- ✅ Debug notification tap handling
- ✅ Simulate different app states
- ✅ Monitor notification flow
- ✅ Test error scenarios

The debug panel provides a user-friendly interface for testing, while the console provides detailed logs for advanced debugging. 