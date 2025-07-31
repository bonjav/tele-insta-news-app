import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { House, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getResponsiveLayout, getDeviceStyles } from '@/util/responsiveUtils';

export default function TabLayout() {
  const { colors, theme } = useTheme();
  const responsiveLayout = getResponsiveLayout();
  const deviceStyles = getDeviceStyles();
  
  // Contrasting colors for icons
  const contrastingColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const contrastingInactiveColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  
  const styles = createStyles(colors, responsiveLayout, deviceStyles);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: contrastingColor,
        tabBarInactiveTintColor: contrastingInactiveColor,
        tabBarStyle: styles.tabBar,
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
              size={focused ? responsiveLayout.iconSize.large + 2 : responsiveLayout.iconSize.medium} 
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
              size={focused ? responsiveLayout.iconSize.large + 2 : responsiveLayout.iconSize.medium} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const createStyles = (colors: any, layout: any, deviceStyles: any) => StyleSheet.create({
  tabBar: {
    height: layout.tabBarHeight,
    paddingBottom: Platform.OS === 'ios' ? layout.tabBarHeight * 0.16 : layout.tabBarHeight * 0.08,
    paddingTop: layout.tabBarHeight * 0.08,
    position: 'absolute',
    borderTopWidth: 0,
    backgroundColor: colors.primary,
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
