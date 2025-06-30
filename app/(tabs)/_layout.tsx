import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { House, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'rgba(142, 142, 147, 0.8)',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false, // Hide labels to show only icons
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <House 
              size={focused ? 28 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Settings 
              size={focused ? 28 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent background
    borderTopColor: 'rgba(229, 229, 234, 0.6)',
    borderTopWidth: 0.5,
    elevation: 0,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    height: 80, // Thinner tab bar
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute', // Make it overlay content
    backdropFilter: 'blur(10px)', // iOS blur effect
  },
});
