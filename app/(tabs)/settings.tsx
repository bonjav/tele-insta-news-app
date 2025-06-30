import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import SettingsSidebar from '@/components/SettingsSidebar';

const SIDEBAR_WIDTH = 320;

export default function SettingsScreen() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const router = useRouter();

  // Open sidebar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      // Reset animation value and open sidebar
      slideAnim.setValue(-SIDEBAR_WIDTH);
      openSidebar();
      
      // Auto-close after a delay if user doesn't interact
      const timer = setTimeout(() => {
        closeSidebar();
      }, 10000); // Close after 10 seconds of inactivity

      return () => clearTimeout(timer);
    }, [slideAnim])
  );

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
      // Navigate back to home after closing
      router.push('/');
    });
  };

  return (
    <View style={styles.container}>
      <SettingsSidebar
        isVisible={sidebarVisible}
        onClose={closeSidebar}
        slideAnim={slideAnim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
