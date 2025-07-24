import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Switch,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Moon, Sun, Globe, MapPin, ChevronRight, Bug, Bell } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useNews } from '@/contexts/NewsContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Config } from '@/constants/Config';
import DebugPanel from './DebugPanel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

interface SettingsSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
}

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: Array<{ code: string; name: string; nativeName?: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
}

function SelectionModal({ visible, onClose, title, options, selectedValue, onSelect }: SelectionModalProps) {
  const { colors } = useTheme();

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.code}
                style={[
                  styles.modalOption,
                  { borderBottomColor: colors.border },
                  selectedValue === option.code && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleSelect(option.code)}
              >
                <View style={styles.modalOptionLeft}>
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>
                    {option.nativeName || option.name}
                  </Text>
                  {option.nativeName && option.nativeName !== option.name && (
                    <Text style={[styles.modalOptionSubtext, { color: colors.secondary }]}>
                      {option.name}
                    </Text>
                  )}
                </View>
                {selectedValue === option.code && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsSidebar({ isVisible, onClose, slideAnim }: SettingsSidebarProps) {
  const { theme, colors, toggleTheme } = useTheme();
  const { state: settingsState, setLanguage, setLocation } = useSettings();
  const { refreshNews } = useNews();
  const { notificationsEnabled, toggleNotifications } = useNotifications();
  
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);

  const handleLanguageChange = async (language: string) => {
    await setLanguage(language);
    // Refresh news with new language while maintaining current location
    await refreshNews(language, settingsState.location);
  };

  const handleLocationChange = async (location: string) => {
    await setLocation(location);
    // Refresh news with new location while maintaining current language
    await refreshNews(settingsState.language, location);
  };

  const getCurrentLanguageName = () => {
    const currentLang = settingsState.languages.find(lang => lang.code === settingsState.language);
    return currentLang ? currentLang.nativeName : 'English';
  };

  const getCurrentLocationName = () => {
    if (settingsState.location === 'all') return 'All Locations';
    const currentLoc = settingsState.locations.find(loc => loc.locationName === settingsState.location);
    return currentLoc ? currentLoc.locationName : settingsState.location;
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      
      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar,
          { 
            backgroundColor: colors.cardBackground,
            transform: [{ translateX: slideAnim }] 
          }
        ]}
      >
        <SafeAreaView style={styles.sidebarContent} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Notifications Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
              
              <View style={[styles.option, { borderBottomColor: colors.border }]}>
                <View style={styles.optionLeft}>
                  <Bell size={20} color={colors.primary} />
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    Enable Notifications
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
                />
              </View>
            </View>

            {/* Language Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Language</Text>
              
              <TouchableOpacity 
                style={[styles.option, { borderBottomColor: colors.border }]}
                onPress={() => setLanguageModalVisible(true)}
              >
                <View style={styles.optionLeft}>
                  <Globe size={20} color={colors.primary} />
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {getCurrentLanguageName()}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* Location Section - Only show if enabled in config */}
            {Config.UI.SHOW_LOCATION_SETTING && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
                
                <TouchableOpacity 
                  style={[styles.option, { borderBottomColor: colors.border }]}
                  onPress={() => setLocationModalVisible(true)}
                >
                  <View style={styles.optionLeft}>
                    <MapPin size={20} color={colors.primary} />
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {getCurrentLocationName()}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Theme Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
              
              {/* Theme Toggle */}
              <View style={[styles.option, { borderBottomColor: colors.border }]}>
                <View style={styles.optionLeft}>
                  {theme === 'dark' ? (
                    <Moon size={20} color={colors.primary} />
                  ) : (
                    <Sun size={20} color={colors.primary} />
                  )}
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.themeToggle,
                    {
                      backgroundColor: theme === 'dark' ? colors.primary : colors.border,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={toggleTheme}
                >
                  <View
                    style={[
                      styles.themeToggleThumb,
                      {
                        backgroundColor: '#FFFFFF',
                        transform: [{ translateX: theme === 'dark' ? 20 : 0 }],
                      }
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Debug Section - Only show if enabled in config */}
            {Config.DEBUG.ENABLE_DEBUG_PANEL && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Development</Text>
                
                <TouchableOpacity 
                  style={[styles.option, { borderBottomColor: 'transparent' }]}
                  onPress={() => setDebugPanelVisible(true)}
                >
                  <View style={styles.optionLeft}>
                    <Bug size={20} color={colors.primary} />
                    <Text style={[styles.optionText, { color: colors.text }]}>Debug Panel</Text>
                  </View>
                  <ChevronRight size={20} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* App Info */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
              <View style={[styles.option, { borderBottomColor: 'transparent' }]}>
                <Text style={[styles.optionText, { color: colors.secondary }]}>DailySnapShorts v1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {/* Language Selection Modal */}
      <SelectionModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        title="Select Language"
        options={settingsState.languages.map(lang => ({
          code: lang.code,
          name: lang.name,
          nativeName: lang.nativeName,
        }))}
        selectedValue={settingsState.language}
        onSelect={handleLanguageChange}
      />

      {/* Location Selection Modal */}
      <SelectionModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        title="Select Location"
        options={[
          { code: 'all', name: 'All Locations' },
          ...settingsState.locations.map(loc => ({
            code: loc.locationName,
            name: loc.locationName,
          }))
        ]}
        selectedValue={settingsState.location || 'all'}
        onSelect={handleLocationChange}
      />

      {/* Debug Panel */}
      <DebugPanel
        isVisible={debugPanelVisible}
        onClose={() => setDebugPanelVisible(false)}
      />
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
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    ...Platform.select({
      web: {
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  sidebarContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_WIDTH * 0.8,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  modalOptions: {
    maxHeight: SCREEN_WIDTH * 0.6,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalOptionLeft: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  modalOptionSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeToggle: {
    width: 40,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
  },
  themeToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
});
