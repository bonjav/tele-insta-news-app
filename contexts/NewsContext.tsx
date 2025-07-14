import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { NewsArticle, NewsState } from '@/types/news.types';
import { StorageService } from '@/services/storageService';
import { supabaseService } from '@/services/supabaseService';
import { Config } from '@/constants/Config';

interface NewsContextType {
  state: NewsState;
  dispatch: React.Dispatch<NewsAction>;
  refreshNews: (language: string, location: string) => Promise<void>;
  loadMoreNews: (language: string, location: string, direction: 'up' | 'down') => Promise<void>;
}

type NewsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ARTICLES'; payload: NewsArticle[] }
  | { type: 'ADD_ARTICLES'; payload: { articles: NewsArticle[], position: 'start' | 'end' } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_LOCATION'; payload: string }
  | { type: 'SET_SPECIFIC_ARTICLE'; payload: NewsArticle }
  | { type: 'REMOVE_OLD_ARTICLES'; payload: number }
  | { type: 'RESET_STATE' };

const initialState: NewsState = {
  articles: [],
  loading: false,
  error: null,
  refreshing: false,
  currentIndex: 0,
  selectedLanguage: 'en',
  selectedLocation: 'all',
  totalArticlesCount: 0,
};

const NewsContext = createContext<NewsContextType | undefined>(undefined);

function newsReducer(state: NewsState, action: NewsAction): NewsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ARTICLES':
      return { ...state, articles: action.payload };
    case 'ADD_ARTICLES':
      return {
        ...state,
        articles: action.payload.position === 'start'
          ? [...action.payload.articles, ...state.articles]
          : [...state.articles, ...action.payload.articles]
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, selectedLanguage: action.payload };
    case 'SET_LOCATION':
      return { ...state, selectedLocation: action.payload };
    case 'SET_SPECIFIC_ARTICLE':
      // Add the article to the beginning of the list if it doesn't exist
      const exists = state.articles.some(article => article.id === action.payload.id);
      if (!exists) {
        return {
          ...state,
          articles: [action.payload, ...state.articles],
          currentIndex: 0
        };
      }
      return state;
    case 'REMOVE_OLD_ARTICLES':
      return {
        ...state,
        articles: state.articles.slice(0, action.payload)
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface NewsProviderProps {
  children: ReactNode;
}

export function NewsProvider({ children }: NewsProviderProps) {
  const [state, dispatch] = useReducer(newsReducer, initialState);

  const refreshNews = async (language: string, location: string) => {
    try {
      dispatch({ type: 'SET_REFRESHING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Get stored articles first
      const storedData = await StorageService.getNewsData();
      if (storedData && storedData.articles.length > 0) {
        dispatch({ type: 'SET_ARTICLES', payload: storedData.articles });
      }

      // Then fetch fresh articles from the database
      const freshArticles = await supabaseService.fetchNews(
        language,
        location,
        Config.APP.TARGET_ARTICLES_COUNT,
        0
      );

      if (freshArticles && freshArticles.length > 0) {
        dispatch({ type: 'SET_ARTICLES', payload: freshArticles });
        // Update storage with fresh articles
        await StorageService.saveNewsData(freshArticles);
      }

      dispatch({ type: 'SET_LANGUAGE', payload: language });
      dispatch({ type: 'SET_LOCATION', payload: location });
    } catch (error) {
      console.error('Error refreshing news:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh news' });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  };

  const loadMoreNews = async (language: string, location: string, direction: 'up' | 'down') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const currentArticles = state.articles;
      const lastArticle = currentArticles[currentArticles.length - 1];
      const firstArticle = currentArticles[0];

      let newArticles;
      if (direction === 'down') {
        newArticles = await supabaseService.fetchNews(
          language,
          location,
          Config.APP.TARGET_ARTICLES_COUNT,
          lastArticle?.id || 0,
          'down'
        );
      } else {
        newArticles = await supabaseService.fetchNews(
          language,
          location,
          Config.APP.TARGET_ARTICLES_COUNT,
          firstArticle?.id || 0,
          'up'
        );
      }

      if (newArticles && newArticles.length > 0) {
        dispatch({
          type: 'ADD_ARTICLES',
          payload: {
            articles: newArticles,
            position: direction === 'down' ? 'end' : 'start'
          }
        });

        // Update storage
        const allArticles = direction === 'down'
          ? [...currentArticles, ...newArticles]
          : [...newArticles, ...currentArticles];

        // Remove old articles if we exceed the maximum
        if (allArticles.length > Config.APP.MAX_ARTICLES_IN_DB) {
          const articlesToKeep = allArticles.slice(0, Config.APP.MAX_ARTICLES_IN_DB);
          dispatch({ type: 'REMOVE_OLD_ARTICLES', payload: Config.APP.MAX_ARTICLES_IN_DB });
          await StorageService.saveNewsData(articlesToKeep);
        } else {
          await StorageService.saveNewsData(allArticles);
        }
      }
    } catch (error) {
      console.error('Error loading more news:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load more news' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <NewsContext.Provider
      value={{
        state,
        dispatch,
        refreshNews,
        loadMoreNews,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}
