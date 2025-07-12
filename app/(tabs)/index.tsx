import { useNotification } from '@/contexts/NotificationContext';
import NewsScreen from '@/screens/NewsScreen';

export default function HomeScreen() {
  const { notification, expoPushToken, error } = useNotification();

  if(error){
    console.error('Error registering for push notifications:', error);
  }

  if(expoPushToken){
    console.log('Push token:', expoPushToken);
  }

  if(notification){
    console.log('Notification:', notification);
  }

  return <NewsScreen />;
}
