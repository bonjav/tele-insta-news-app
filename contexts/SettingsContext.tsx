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
  location: string | null;
  last_active_at: string;
}

interface SettingsState {
  language: string;
  location: string | null;  // Allow null location
  languages: LanguageConfig[];
  locations: LocationConfig[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  userPreferences: UserPreferences | null;
  deviceId: string;
  actualCountry: { countryCode: string; countryName: string } | null;
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
  | { type: 'SET_LOCATION'; payload: string | null }
  | { type: 'SET_LANGUAGES'; payload: LanguageConfig[] }
  | { type: 'SET_LOCATIONS'; payload: LocationConfig[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_USER_PREFERENCES'; payload: UserPreferences | null }
  | { type: 'SET_DEVICE_ID'; payload: string }
  | { type: 'SET_ACTUAL_COUNTRY'; payload: { countryCode: string; countryName: string } | null };

const initialState: SettingsState = {
  language: 'en',
  location: null,  // Default to null instead of 'all'
  languages: [],
  locations: [],
  loading: false,
  error: null,
  initialized: false,
  userPreferences: null,
  deviceId: Device.deviceName || Device.modelName || 'unknown_device',
  actualCountry: null,
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
    case 'SET_ACTUAL_COUNTRY':
      return { ...state, actualCountry: action.payload };
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
        location: state.location,
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
      // Update location in user preferences if we have them
      if (state.userPreferences) {
        await updateUserPreferences({ location });
      }
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

  const detectUserCountry = async () => {
    try {
      console.log('Starting country detection...');
      const userCountry = await locationService.getUserCountry();
      if (userCountry) {
        console.log('Successfully detected user country:', userCountry);
        dispatch({ type: 'SET_ACTUAL_COUNTRY', payload: userCountry });
        await AsyncStorage.setItem('user_actual_country', JSON.stringify(userCountry));
        return userCountry;
      } else {
        console.warn('No country detected by location service');
      }
    } catch (error) {
      console.error('Failed to detect user country:', error);
    }
    return null;
  };

  const initializeSettings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Load available languages and locations first and wait for them to complete
      console.log('Loading languages and locations...');
      const [languagesResult, locationsResult] = await Promise.allSettled([
        loadLanguages(), 
        loadLocations()
      ]);

      // Check if locations loaded successfully
      let availableLocations: LocationConfig[] = [];
      if (locationsResult.status === 'fulfilled') {
        // Get locations from the database directly since state might not be updated yet
        try {
          availableLocations = await supabaseService.getLocations();
          console.log('Available locations:', availableLocations.map(loc => loc.locationName));
        } catch (error) {
          console.error('Failed to get locations for country detection:', error);
          availableLocations = [];
        }
      } else {
        console.error('Failed to load locations:', locationsResult.reason);
      }

      // First, try to get existing user preferences
      const prefs = await supabaseService.getUserPreferences(state.deviceId);
      dispatch({ type: 'SET_USER_PREFERENCES', payload: prefs });

      // Load saved settings
      const savedLanguage = prefs?.language_code || await AsyncStorage.getItem('app_language');
      const savedLocation = prefs?.location || await AsyncStorage.getItem('app_location');

      // Try to get the actual country from storage or detect it
      const savedActualCountry = await AsyncStorage.getItem('user_actual_country');
      let actualCountry = null;
      
      if (savedActualCountry) {
        actualCountry = JSON.parse(savedActualCountry);
        console.log('Using saved actual country:', actualCountry);
      } else {
        console.log('Detecting user country...');
        actualCountry = await detectUserCountry();
        console.log('Detected country:', actualCountry);
      }
      
      if (actualCountry) {
        dispatch({ type: 'SET_ACTUAL_COUNTRY', payload: actualCountry });
      }

      if (savedLanguage) {
        dispatch({ type: 'SET_LANGUAGE', payload: savedLanguage });
      }

      if (savedLocation) {
        dispatch({ type: 'SET_LOCATION', payload: savedLocation });
      }

      // If no saved location, try to use the actual country if it's supported
      let determinedLocation: string | null = savedLocation;
      
      if (!savedLocation) {
        try {
          const availableLocationNames = availableLocations.map(loc => loc.locationName);
          console.log('Available location names:', availableLocationNames);
          
          // Only set location if the actual country is in our supported locations
          if (actualCountry && availableLocationNames.includes(actualCountry.countryName)) {
            console.log('Setting location to detected country:', actualCountry.countryName);
            determinedLocation = actualCountry.countryName;
            dispatch({ type: 'SET_LOCATION', payload: actualCountry.countryName });
            await AsyncStorage.setItem('app_location', actualCountry.countryName);
          } else {
            console.log('Detected country not in supported locations or no country detected');
            // Otherwise keep it as null
            determinedLocation = null;
            dispatch({ type: 'SET_LOCATION', payload: null });
            await AsyncStorage.setItem('app_location', '');
          }
          
          // Update location in user preferences if they already exist
          if (state.userPreferences) {
            console.log('Updating existing user preferences with location:', determinedLocation);
            await updateUserPreferences({ location: determinedLocation });
          }
        } catch (error) {
          console.warn('Failed to set location:', error);
          // Keep location as null on error
          determinedLocation = null;
          dispatch({ type: 'SET_LOCATION', payload: null });
        }
      }

      // If we don't have user preferences yet, create them
      if (!prefs) {
        console.log('Creating new user preferences with location:', determinedLocation);
        const newPrefs = await supabaseService.upsertUserPreferences(state.deviceId, {
          language_code: savedLanguage || 'en',
          location: determinedLocation,
          notifications_enabled: true,
        });
        dispatch({ type: 'SET_USER_PREFERENCES', payload: newPrefs });
        console.log('Created user preferences:', newPrefs);
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
      console.log('Settings initialization completed');
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