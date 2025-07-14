import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { X, Play, MapPin, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNews } from '@/contexts/NewsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { locationService } from '@/services/locationService';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DebugPanel({ isVisible, onClose }: DebugPanelProps) {
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
      onClose(); // Close debug panel after test
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to test notification');
    }
  };

  const handleTestWithFirstArticle = async () => {
    if (state.articles.length > 0) {
      const firstArticleId = state.articles[0].id;
      await testNotificationTap(firstArticleId);
      onClose(); // Close debug panel after test
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