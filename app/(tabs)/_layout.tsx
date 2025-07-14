import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { House, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colors, theme } = useTheme();
  
  // Contrasting colors for icons
  const contrastingColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const contrastingInactiveColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: contrastingColor,
        tabBarInactiveTintColor: contrastingInactiveColor,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.primary }],
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <House 
              size={focused ? 26 : 22} 
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
              size={focused ? 26 : 22} 
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
    height: 50, // Reduced from 80px to 50px
    paddingBottom: Platform.OS === 'ios' ? 8 : 4, // Adjust for iOS home indicator
    paddingTop: 4,
    position: 'absolute',
    borderTopWidth: 0, // Remove default border
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
});
