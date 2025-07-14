import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNews } from '@/contexts/NewsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { locationService } from '@/services/locationService';

export default function DebugPanel() {
  const { colors } = useTheme();
  const { testNotificationTap } = useNotifications();
  const { state } = useNews();
  const { state: settingsState } = useSettings();
  const [testArticleId, setTestArticleId] = useState('');

  const handleTestNotification = async () => {
    const articleId = parseInt(testArticleId);
    if (isNaN(articleId)) {
      Alert.alert('Invalid Article ID', 'Please enter a valid article ID number');
      return;
    }
    
    try {
      await testNotificationTap(articleId);
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to test notification');
    }
  };

  const handleTestWithFirstArticle = async () => {
    if (state.articles.length > 0) {
      const firstArticleId = state.articles[0].id;
      await testNotificationTap(firstArticleId);
    } else {
      Alert.alert('No Articles', 'No articles available to test with');
    }
  };

  const handleTestLocationDetection = async () => {
    try {
      console.log('Starting location detection test from debug panel...');
      await locationService.debugLocationDetection();
      Alert.alert('Location Test', 'Location detection test completed. Check console for results.');
    } catch (error) {
      console.error('Location detection test error:', error);
      Alert.alert('Error', 'Failed to test location detection');
    }
  };

  const handleClearLocationCache = async () => {
    try {
      locationService.clearCache();
      Alert.alert('Cache Cleared', 'Location cache has been cleared');
    } catch (error) {
      console.error('Clear cache error:', error);
      Alert.alert('Error', 'Failed to clear location cache');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.title, { color: colors.text }]}>Debug Panel</Text>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Detection</Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleTestLocationDetection}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Test Location Detection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={handleClearLocationCache}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Clear Location Cache
          </Text>
        </TouchableOpacity>

        <Text style={[styles.infoText, { color: colors.secondary }]}>
          Detected Country: {settingsState.actualCountry?.countryName || 'None'}
        </Text>
        <Text style={[styles.infoText, { color: colors.secondary }]}>
          Current Location: {settingsState.location || 'Not set'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Notification Tap</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Enter Article ID"
            placeholderTextColor={colors.secondary}
            value={testArticleId}
            onChangeText={setTestArticleId}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleTestNotification}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Test</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={handleTestWithFirstArticle}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Test with First Article
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current State</Text>
        <Text style={[styles.infoText, { color: colors.secondary }]}>
          Articles: {state.articles.length}
        </Text>
        <Text style={[styles.infoText, { color: colors.secondary }]}>
          Current Index: {state.currentIndex}
        </Text>
        <Text style={[styles.infoText, { color: colors.secondary }]}>
          Should Scroll: {state.shouldScrollToTop ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
}); 