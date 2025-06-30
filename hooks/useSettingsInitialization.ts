import { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useNews } from '@/contexts/NewsContext';

export function useSettingsInitialization() {
  const { state: settingsState } = useSettings();
  const { refreshNews } = useNews();
  const [hasLoadedInitialNews, setHasLoadedInitialNews] = useState(false);

  // Check if settings are initialized and we haven't loaded news yet
  const shouldLoadNews = settingsState.initialized && 
                        settingsState.language && 
                        settingsState.location && 
                        !hasLoadedInitialNews;

  useEffect(() => {
    if (shouldLoadNews) {
      // Add a small delay to ensure settings are properly set
      const timer = setTimeout(() => {
        refreshNews(settingsState.language, settingsState.location)
          .then(() => {
            setHasLoadedInitialNews(true);
          })
          .catch(error => {
            console.warn('Failed to load initial news:', error);
            setHasLoadedInitialNews(true); // Mark as loaded even if failed
          });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldLoadNews, settingsState.language, settingsState.location]);

  return {
    isInitialized: settingsState.initialized,
    isInitializing: settingsState.loading,
    settingsState,
    hasLoadedInitialNews,
  };
} 