import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, LanguageConfig, LocationConfig } from '@/types/news.types';
import { supabaseService } from '@/services/supabaseService';
import { locationService } from '@/services/locationService';
import * as Device from 'expo-device';

interface UserPreferences {
  id: number;
  device_id: string;
  push_token: string | null;
  notifications_enabled: boolean;
  language_code: string | null;
  last_active_at: string;
}

interface SettingsState {
  language: string;
  location: string;
  languages: LanguageConfig[];
  locations: LocationConfig[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  userPreferences: UserPreferences | null;
  deviceId: string;
}

interface SettingsContextType {
  state: SettingsState;
  setLanguage: (language: string) => void;
  setLocation: (location: string) => void;
  loadLanguages: () => Promise<void>;
  loadLocations: () => Promise<void>;
  initializeSettings: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

type SettingsAction =
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_LOCATION'; payload: string }
  | { type: 'SET_LANGUAGES'; payload: LanguageConfig[] }
  | { type: 'SET_LOCATIONS'; payload: LocationConfig[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_USER_PREFERENCES'; payload: UserPreferences | null }
  | { type: 'SET_DEVICE_ID'; payload: string };

const initialState: SettingsState = {
  language: 'en',
  location: 'all',
  languages: [],
  locations: [],
  loading: false,
  error: null,
  initialized: false,
  userPreferences: null,
  deviceId: Device.deviceName || Device.modelName || 'unknown_device',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_LANGUAGES':
      return { ...state, languages: action.payload };
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'SET_USER_PREFERENCES':
      return { ...state, userPreferences: action.payload };
    case 'SET_DEVICE_ID':
      return { ...state, deviceId: action.payload };
    default:
      return state;
  }
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
    try {
      const updatedPrefs = await supabaseService.upsertUserPreferences(state.deviceId, {
        ...preferences,
        language_code: state.language,
      });
      dispatch({ type: 'SET_USER_PREFERENCES', payload: updatedPrefs });
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  };

  const setLanguage = async (language: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
    try {
      await AsyncStorage.setItem('app_language', language);
      // Update language in user preferences if we have them
      if (state.userPreferences) {
        await updateUserPreferences({ language_code: language });
      }
    } catch (error) {
      console.error('Failed to save language setting:', error);
    }
  };

  const setLocation = async (location: string) => {
    dispatch({ type: 'SET_LOCATION', payload: location });
    try {
      await AsyncStorage.setItem('app_location', location);
    } catch (error) {
      console.error('Failed to save location setting:', error);
    }
  };

  const loadLanguages = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const languages = await supabaseService.getLanguages();
      dispatch({ type: 'SET_LANGUAGES', payload: languages });
    } catch (error) {
      console.error('Failed to load languages:', error);
      // Don't set error for language loading failure, just use defaults
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadLocations = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const locations = await supabaseService.getLocations();
      dispatch({ type: 'SET_LOCATIONS', payload: locations });
    } catch (error) {
      console.error('Failed to load locations:', error);
      // Don't set error for location loading failure, just use defaults
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const initializeSettings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // First, try to get existing user preferences
      const prefs = await supabaseService.getUserPreferences(state.deviceId);
      dispatch({ type: 'SET_USER_PREFERENCES', payload: prefs });

      // Load saved settings
      const savedLanguage = prefs?.language_code || await AsyncStorage.getItem('app_language');
      const savedLocation = await AsyncStorage.getItem('app_location');

      if (savedLanguage) {
        dispatch({ type: 'SET_LANGUAGE', payload: savedLanguage });
      }

      if (savedLocation) {
        dispatch({ type: 'SET_LOCATION', payload: savedLocation });
      }

      // Load available languages and locations in parallel
      await Promise.allSettled([loadLanguages(), loadLocations()]);

      // If no saved location, try to detect user's location
      if (!savedLocation) {
        try {
          const availableLocationNames = state.locations.map(loc => loc.locationName);
          if (availableLocationNames.length > 0) {
            const defaultLocation = await locationService.getDefaultLocation(availableLocationNames);
            dispatch({ type: 'SET_LOCATION', payload: defaultLocation });
            await AsyncStorage.setItem('app_location', defaultLocation);
          }
        } catch (error) {
          console.warn('Failed to detect user location, using default:', error);
        }
      }

      // If we don't have user preferences yet, create them
      if (!prefs) {
        const newPrefs = await supabaseService.upsertUserPreferences(state.deviceId, {
          language_code: savedLanguage || 'en',
          notifications_enabled: true,
        });
        dispatch({ type: 'SET_USER_PREFERENCES', payload: newPrefs });
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    initializeSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        state,
        setLanguage,
        setLocation,
        loadLanguages,
        loadLocations,
        initializeSettings,
        updateUserPreferences,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 