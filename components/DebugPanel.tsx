import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { X, Play, MapPin, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNews } from '@/contexts/NewsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { locationService } from '@/services/locationService';
import { ArticleNavigationService } from '@/services/navigationService';
import { AlertUtils } from '@/util/alertUtils';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DebugPanel({ isVisible, onClose }: DebugPanelProps) {
  const { colors } = useTheme();
  const { state, dispatch, refreshNews } = useNews();
  const { state: settingsState } = useSettings();
  const [testArticleId, setTestArticleId] = useState('');

  // Initialize navigation service when debug panel is opened
  React.useEffect(() => {
    if (isVisible) {
      console.log('🐛 DEBUG PANEL - Initializing navigation service for debug testing...');
      ArticleNavigationService.initialize({
        refreshNews,
        dispatch,
        language: settingsState.language || 'en',
        location: settingsState.location
      });
    }
  }, [isVisible, refreshNews, dispatch, settingsState.language, settingsState.location]);

  const handleTestNotification = async () => {
    const articleId = parseInt(testArticleId);
    if (isNaN(articleId)) {
      AlertUtils.showDebugAlert('Invalid Article ID', 'Please enter a valid article ID number');
      return;
    }
    
    try {
      console.log('🐛 DEBUG PANEL - Testing notification tap with article ID:', articleId);
      const result = await ArticleNavigationService.testArticleNavigation(articleId);
      
      if (result.success) {
        console.log('🐛 DEBUG PANEL - Test completed successfully');
        onClose(); // Close debug panel after successful test
      } else {
        console.error('🐛 DEBUG PANEL - Test failed:', result.error);
        AlertUtils.showDebugAlert('Test Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('🐛 DEBUG PANEL - Test notification error:', error);
      AlertUtils.showDebugAlert('Error', 'Failed to test notification');
    }
  };

  const handleTestWithFirstArticle = async () => {
    if (state.articles.length > 0) {
      const firstArticleId = state.articles[0].id;
      console.log('🐛 DEBUG PANEL - Testing with first article ID:', firstArticleId);
      
      try {
        const result = await ArticleNavigationService.testArticleNavigation(firstArticleId);
        
        if (result.success) {
          console.log('🐛 DEBUG PANEL - Test with first article completed successfully');
          onClose(); // Close debug panel after successful test
        } else {
          console.error('🐛 DEBUG PANEL - Test with first article failed:', result.error);
          AlertUtils.showDebugAlert('Test Failed', result.error || 'Unknown error occurred');
        }
      } catch (error) {
        console.error('🐛 DEBUG PANEL - Test with first article error:', error);
        AlertUtils.showDebugAlert('Error', 'Failed to test with first article');
      }
    } else {
      AlertUtils.showDebugAlert('No Articles', 'No articles available to test with');
    }
  };

  const handleTestLocationDetection = async () => {
    try {
      console.log('Starting location detection test from debug panel...');
      await locationService.debugLocationDetection();
      AlertUtils.showDebugAlert('Location Test', 'Location detection test completed. Check console for results.');
    } catch (error) {
      console.error('Location detection test error:', error);
      AlertUtils.showDebugAlert('Error', 'Failed to test location detection');
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Debug Panel</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{state.articles.length}</Text>
                <Text style={[styles.statLabel, { color: colors.secondary }]}>Articles</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{state.currentIndex}</Text>
                <Text style={[styles.statLabel, { color: colors.secondary }]}>Current</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {settingsState.location || 'All'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondary }]}>Location</Text>
              </View>
            </View>

            {/* Notification Test */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔔 Notification Test</Text>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="Article ID"
                  placeholderTextColor={colors.secondary}
                  value={testArticleId}
                  onChangeText={setTestArticleId}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={handleTestNotification}
                >
                  <Play size={14} color="white" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}
                onPress={handleTestWithFirstArticle}
              >
                <Zap size={16} color={colors.secondary} />
                <Text style={[styles.quickButtonText, { color: colors.secondary }]}>
                  Test First Article
                </Text>
              </TouchableOpacity>
            </View>

            {/* Location Test */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 Location Test</Text>
              
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                onPress={handleTestLocationDetection}
              >
                <MapPin size={16} color={colors.primary} />
                <Text style={[styles.quickButtonText, { color: colors.primary }]}>
                  Test Location Detection
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.infoText, { color: colors.secondary }]}>
                Current: {settingsState.actualCountry?.countryName || 'Unknown'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 12,
    marginTop: 4,
  },
}); 