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
import { getResponsiveLayout, getDeviceStyles, getDeviceInfo } from '@/util/responsiveUtils';
import DebugPanel from './DebugPanel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const responsiveLayout = getResponsiveLayout();
  const deviceStyles = getDeviceStyles();

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  const modalStyles = createModalStyles(colors, responsiveLayout, deviceStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <X size={responsiveLayout.iconSize.large} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={modalStyles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.code}
                style={[
                  modalStyles.modalOption,
                  selectedValue === option.code && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleSelect(option.code)}
              >
                <View style={modalStyles.modalOptionLeft}>
                  <Text style={modalStyles.modalOptionText}>
                    {option.nativeName || option.name}
                  </Text>
                  {option.nativeName && option.nativeName !== option.name && (
                    <Text style={modalStyles.modalOptionSubtext}>
                      {option.name}
                    </Text>
                  )}
                </View>
                {selectedValue === option.code && (
                  <View style={modalStyles.selectedIndicator} />
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
  const responsiveLayout = getResponsiveLayout();
  const deviceStyles = getDeviceStyles();
  const deviceInfo = getDeviceInfo();
  
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

  const styles = createStyles(colors, responsiveLayout, deviceStyles);

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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={responsiveLayout.iconSize.large} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Notifications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              
              <View style={styles.option}>
                <View style={styles.optionLeft}>
                  <Bell size={responsiveLayout.iconSize.medium} color={colors.primary} />
                  <Text style={styles.optionText}>
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
              <Text style={styles.sectionTitle}>Language</Text>
              
              <TouchableOpacity 
                style={styles.option}
                onPress={() => setLanguageModalVisible(true)}
              >
                <View style={styles.optionLeft}>
                  <Globe size={responsiveLayout.iconSize.medium} color={colors.primary} />
                  <Text style={styles.optionText}>
                    {getCurrentLanguageName()}
                  </Text>
                </View>
                <ChevronRight size={responsiveLayout.iconSize.medium} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* Location Section - Only show if enabled in config */}
            {Config.UI.SHOW_LOCATION_SETTING && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                
                <TouchableOpacity 
                  style={styles.option}
                  onPress={() => setLocationModalVisible(true)}
                >
                  <View style={styles.optionLeft}>
                    <MapPin size={responsiveLayout.iconSize.medium} color={colors.primary} />
                    <Text style={styles.optionText}>
                      {getCurrentLocationName()}
                    </Text>
                  </View>
                  <ChevronRight size={responsiveLayout.iconSize.medium} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Theme Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appearance</Text>
              
              {/* Theme Toggle */}
              <View style={styles.option}>
                <View style={styles.optionLeft}>
                  {theme === 'dark' ? (
                    <Moon size={responsiveLayout.iconSize.medium} color={colors.primary} />
                  ) : (
                    <Sun size={responsiveLayout.iconSize.medium} color={colors.primary} />
                  )}
                  <Text style={styles.optionText}>
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </Text>
                </View>
                <Switch
                  value={theme === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : theme === 'dark' ? '#FFFFFF' : '#F4F3F4'}
                />
              </View>
            </View>

            {/* Debug Section - Only show if enabled in config */}
            {Config.DEBUG.ENABLE_DEBUG_PANEL && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Development</Text>
                
                <TouchableOpacity 
                  style={[styles.option, { borderBottomColor: 'transparent' }]}
                  onPress={() => setDebugPanelVisible(true)}
                >
                  <View style={styles.optionLeft}>
                    <Bug size={responsiveLayout.iconSize.medium} color={colors.primary} />
                    <Text style={styles.optionText}>Debug Panel</Text>
                  </View>
                  <ChevronRight size={responsiveLayout.iconSize.medium} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* App Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
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

const createStyles = (colors: any, layout: any, deviceStyles: any) => StyleSheet.create({
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
    width: layout.sidebarWidth,
    ...deviceStyles.sidebarShadow,
  },
  sidebarContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layout.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: deviceStyles.textStyles.headline.fontSize + 2,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
    padding: layout.contentPadding,
  },
  section: {
    marginBottom: layout.contentPadding * 1.5,
  },
  sectionTitle: {
    fontSize: deviceStyles.textStyles.body.fontSize + 2,
    fontFamily: 'Inter-Bold',
    marginBottom: layout.contentPadding * 0.75,
    color: colors.text,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.contentPadding * 0.75,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: deviceStyles.textStyles.body.fontSize,
    fontFamily: 'Inter-Regular',
    marginLeft: layout.contentPadding * 0.6,
    color: colors.text,
    flex: 1,
    flexShrink: 1,
  },

});

const createModalStyles = (colors: any, layout: any, deviceStyles: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_WIDTH * 0.8,
    borderRadius: layout.contentPadding * 0.6,
    backgroundColor: colors.cardBackground,
    ...deviceStyles.cardShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layout.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: deviceStyles.textStyles.headline.fontSize,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalOptions: {
    maxHeight: SCREEN_WIDTH * 0.6,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.contentPadding * 0.75,
    paddingHorizontal: layout.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionLeft: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: deviceStyles.textStyles.body.fontSize,
    fontFamily: 'Inter-Regular',
    color: colors.text,
    flexShrink: 1,
  },
  modalOptionSubtext: {
    fontSize: deviceStyles.textStyles.caption.fontSize,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    color: colors.secondary,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
