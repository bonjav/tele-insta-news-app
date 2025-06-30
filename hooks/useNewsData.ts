import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { NewsArticle, NewsState } from '@/types/news.types';
import { NewsService } from '@/services/newsService';
import { StorageService } from '@/services/storageService';
import { Config } from '@/constants/Config';

export function useNewsData() {
  const [state, setState] = useState<NewsState>({
    articles: [],
    loading: true,
    error: null,
    refreshing: false,
    currentIndex: 0,
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // First, try to load from local storage
      const storedData = await StorageService.getNewsData();
      
      if (storedData && storedData.articles.length > 0) {
        // Load from storage first for immediate display
        setState(prev => ({
          ...prev,
          articles: storedData.articles,
          loading: false,
        }));
        setIsInitialLoad(false);

        // Check if data is stale and refresh in background if needed
        const isStale = await StorageService.isDataStale();
        if (isStale) {
          refreshNewsData(false); // Silent refresh
        }
      } else {
        // No local data, fetch from API
        await refreshNewsData(true);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load news. Please try again.',
      }));
    }
  };

  const refreshNewsData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, refreshing: true, error: null }));
      }

      // Fetch new articles
      const newArticles = await NewsService.fetchNews();
      
      if (newArticles.length > 0) {
        // Save to local storage
        await StorageService.saveNewsData(newArticles);
        
        // Update state
        setState(prev => ({
          ...prev,
          articles: newArticles,
          refreshing: false,
          loading: false,
          currentIndex: 0,
        }));

        // Haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setIsInitialLoad(false);
      } else {
        throw new Error('No articles received');
      }
    } catch (error) {
      console.error('Error refreshing news:', error);
      setState(prev => ({
        ...prev,
        refreshing: false,
        loading: false,
        error: 'Failed to refresh news. Please check your connection.',
      }));
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRefresh = useCallback(() => {
    refreshNewsData(true);
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentIndex: index }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    isInitialLoad,
    handleRefresh,
    setCurrentIndex,
    clearError,
    refreshNewsData,
  };
}
