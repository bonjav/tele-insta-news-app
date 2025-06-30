import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TestDataService } from '@/services/testDataService';
import { supabaseService } from '@/services/supabaseService';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DebugPanel({ isVisible, onClose }: DebugPanelProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleCheckConnection = async () => {
    setLoading(true);
    try {
      const isConnected = await TestDataService.checkDatabaseConnection();
      Alert.alert(
        'Database Connection',
        isConnected ? 'Connected successfully!' : 'Connection failed!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check connection');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestData = async () => {
    setLoading(true);
    try {
      await TestDataService.addTestData();
      Alert.alert('Success', 'Test data added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add test data');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSampleData = async () => {
    setLoading(true);
    try {
      const articles = await TestDataService.getSampleData();
      Alert.alert('Sample Data', `Found ${articles.length} articles`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get sample data');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
      <View style={[styles.panel, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.text }]}>Debug Panel</Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleCheckConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Checking...' : 'Check Database Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleAddTestData}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Adding...' : 'Add Test Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleGetSampleData}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Get Sample Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.border }]}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  panel: {
    width: 300,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
}); 