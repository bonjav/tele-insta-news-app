import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface CountryInfo {
  countryCode: string;
  countryName: string;
}

class LocationService {
  private cachedCountry: CountryInfo | null = null;

  // Get country from device locale
  private getCountryFromLocale(): CountryInfo | null {
    try {
      let locale: string | null = null;
      
      if (Platform.OS === 'web') {
        // For web, use browser's locale
        locale = navigator.language || navigator.languages?.[0];
      } else if (Platform.OS === 'ios') {
        // For iOS
        const { NativeModules } = require('react-native');
        locale = NativeModules?.SettingsManager?.settings?.AppleLocale ||
                 NativeModules?.SettingsManager?.settings?.AppleLanguages?.[0];
      } else if (Platform.OS === 'android') {
        // For Android
        const { NativeModules } = require('react-native');
        locale = NativeModules?.I18nManager?.localeIdentifier;
      }

      console.log('Detected locale:', locale);

      if (locale) {
        const parts = locale.split(/[-_]/);
        console.log('Locale parts:', parts);
        
        if (parts.length >= 2) {
          const countryCode = parts[1].toUpperCase();
          const countryName = this.getCountryName(countryCode);
          console.log('Extracted country code:', countryCode, 'Country name:', countryName);
          return { countryCode, countryName };
        }
      }
    } catch (error) {
      console.error('Failed to get country from locale:', error);
    }
    return null;
  }

  // Get country name from country code
  private getCountryName(countryCode: string): string {
    const countryNames: { [key: string]: string } = {
      'SG': 'Singapore',
      'US': 'United States',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'IN': 'India',
      'CN': 'China',
      'JP': 'Japan',
      'KR': 'South Korea',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'ZA': 'South Africa',
      'EG': 'Egypt',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'MY': 'Malaysia',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'PH': 'Philippines',
      'ID': 'Indonesia',
      'PK': 'Pakistan',
      'BD': 'Bangladesh',
      'LK': 'Sri Lanka',
      'NP': 'Nepal',
      'MM': 'Myanmar',
      'KH': 'Cambodia',
      'LA': 'Laos',
      'MN': 'Mongolia',
      'KZ': 'Kazakhstan',
      'UZ': 'Uzbekistan',
      'KG': 'Kyrgyzstan',
      'TJ': 'Tajikistan',
      'TM': 'Turkmenistan',
      'AF': 'Afghanistan',
      'IR': 'Iran',
      'IQ': 'Iraq',
      'SA': 'Saudi Arabia',
      'AE': 'United Arab Emirates',
      'QA': 'Qatar',
      'KW': 'Kuwait',
      'BH': 'Bahrain',
      'OM': 'Oman',
      'YE': 'Yemen',
      'JO': 'Jordan',
      'LB': 'Lebanon',
      'SY': 'Syria',
      'IL': 'Israel',
      'PS': 'Palestine',
      'TR': 'Turkey',
      'CY': 'Cyprus',
      'GR': 'Greece',
      'BG': 'Bulgaria',
      'RO': 'Romania',
      'HU': 'Hungary',
      'CZ': 'Czech Republic',
      'SK': 'Slovakia',
      'PL': 'Poland',
      'LT': 'Lithuania',
      'LV': 'Latvia',
      'EE': 'Estonia',
      'FI': 'Finland',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'IS': 'Iceland',
      'IE': 'Ireland',
      'PT': 'Portugal',
      'CH': 'Switzerland',
      'AT': 'Austria',
      'BE': 'Belgium',
      'LU': 'Luxembourg',
      'MC': 'Monaco',
      'LI': 'Liechtenstein',
      'AD': 'Andorra',
      'SM': 'San Marino',
      'VA': 'Vatican City',
      'MT': 'Malta',
      'HR': 'Croatia',
      'SI': 'Slovenia',
      'BA': 'Bosnia and Herzegovina',
      'ME': 'Montenegro',
      'MK': 'North Macedonia',
      'AL': 'Albania',
      'RS': 'Serbia',
      'XK': 'Kosovo',
      'UA': 'Ukraine',
      'BY': 'Belarus',
      'MD': 'Moldova',
      'GE': 'Georgia',
      'AM': 'Armenia',
      'AZ': 'Azerbaijan',
      'RU': 'Russia',
    };

    return countryNames[countryCode] || countryCode;
  }

  // Get country from geolocation
  private async getCountryFromGeolocation(): Promise<CountryInfo | null> {
    try {
      console.log('Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return null;
      }

      console.log('Getting current position...');
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      console.log('Current position:', { latitude, longitude });

      // Use reverse geocoding to get country
      console.log('Performing reverse geocoding...');
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      console.log('Reverse geocoding results:', geocode);

      if (geocode.length > 0) {
        const countryCode = geocode[0].isoCountryCode;
        const countryName = geocode[0].country;
        
        console.log('Extracted from geocoding - Country code:', countryCode, 'Country name:', countryName);
        
        if (countryCode && countryName) {
          return { countryCode, countryName };
        }
      }
    } catch (error) {
      console.error('Failed to get country from geolocation:', error);
    }
    return null;
  }

  // Get user's country
  async getUserCountry(): Promise<CountryInfo | null> {
    if (this.cachedCountry) {
      console.log('Using cached country:', this.cachedCountry);
      return this.cachedCountry;
    }

    console.log('No cached country, attempting detection...');

    // Try geolocation first
    console.log('Attempting geolocation-based country detection...');
    let country = await this.getCountryFromGeolocation();
    
    if (country) {
      console.log('Successfully detected country via geolocation:', country);
    } else {
      console.log('Geolocation detection failed, trying locale-based detection...');
      
      // Fallback to locale
      country = this.getCountryFromLocale();
      
      if (country) {
        console.log('Successfully detected country via locale:', country);
      } else {
        console.log('Both geolocation and locale detection failed');
      }
    }

    if (country) {
      console.log('Caching detected country:', country);
      this.cachedCountry = country;
    }

    return country;
  }

  // Clear cached country (for testing)
  clearCache(): void {
    console.log('Clearing cached country');
    this.cachedCountry = null;
  }

  // Debug method to test location detection
  async debugLocationDetection(): Promise<void> {
    console.log('=== DEBUG: Starting location detection test ===');
    
    // Clear cache first
    this.clearCache();
    
    // Test geolocation detection
    console.log('--- Testing geolocation detection ---');
    const geoCountry = await this.getCountryFromGeolocation();
    console.log('Geolocation result:', geoCountry);
    
    // Test locale detection
    console.log('--- Testing locale detection ---');
    const localeCountry = this.getCountryFromLocale();
    console.log('Locale result:', localeCountry);
    
    // Test the full getUserCountry method
    console.log('--- Testing full getUserCountry method ---');
    this.clearCache(); // Clear cache to force fresh detection
    const finalCountry = await this.getUserCountry();
    console.log('Final result:', finalCountry);
    
    console.log('=== DEBUG: Location detection test completed ===');
  }

  // Check if a country is in the available locations
  isCountryInLocations(countryName: string, availableLocations: string[]): boolean {
    return availableLocations.some(location => 
      location.toLowerCase() === countryName.toLowerCase()
    );
  }

  // Get default location based on user's country
  async getDefaultLocation(availableLocations: string[]): Promise<string> {
    const userCountry = await this.getUserCountry();
    
    if (userCountry && this.isCountryInLocations(userCountry.countryName, availableLocations)) {
      return userCountry.countryName;
    }
    
    return 'all'; // Default to all locations if user's country is not available
  }
}

export const locationService = new LocationService(); 