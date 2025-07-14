import { useSettings } from '@/contexts/SettingsContext';

export function useUserCountry() {
  const { state } = useSettings();
  
  return {
    actualCountry: state.actualCountry,
    isUsingActualCountry: state.actualCountry?.countryName === state.location,
    currentLocation: state.location
  };
} 