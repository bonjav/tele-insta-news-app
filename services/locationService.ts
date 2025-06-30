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

      if (locale) {
        const parts = locale.split(/[-_]/);
        if (parts.length >= 2) {
          const countryCode = parts[1].toUpperCase();
          const countryName = this.getCountryName(countryCode);
          return { countryCode, countryName };
        }
      }
    } catch (error) {
      console.warn('Failed to get country from locale:', error);
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Use reverse geocoding to get country
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode.length > 0) {
        const countryCode = geocode[0].isoCountryCode;
        const countryName = geocode[0].country;
        
        if (countryCode && countryName) {
          return { countryCode, countryName };
        }
      }
    } catch (error) {
      console.warn('Failed to get country from geolocation:', error);
    }
    return null;
  }

  // Get user's country
  async getUserCountry(): Promise<CountryInfo | null> {
    if (this.cachedCountry) {
      return this.cachedCountry;
    }

    // Try geolocation first
    let country = await this.getCountryFromGeolocation();
    
    // Fallback to locale
    if (!country) {
      country = this.getCountryFromLocale();
    }

    if (country) {
      this.cachedCountry = country;
    }

    return country;
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