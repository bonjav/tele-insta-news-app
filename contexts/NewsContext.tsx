import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { NewsArticle, NewsState } from '@/types/news.types';

interface NewsContextType {
  state: NewsState;
  dispatch: React.Dispatch<NewsAction>;
  refreshNews: (language: string, location: string) => Promise<void>;
  loadMoreNews: (language: string, location: string) => Promise<void>;
}

type NewsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ARTICLES'; payload: NewsArticle[] }
  | { type: 'ADD_ARTICLES'; payload: NewsArticle[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_LOCATION'; payload: string }
  | { type: 'RESET_STATE' };

const initialState: NewsState = {
  articles: [],
  loading: false,
  error: null,
  refreshing: false,
  currentIndex: 0,
  selectedLanguage: 'en',
  selectedLocation: 'all',
};

const NewsContext = createContext<NewsContextType | undefined>(undefined);

function newsReducer(state: NewsState, action: NewsAction): NewsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ARTICLES':
      return { ...state, articles: action.payload, error: null };
    case 'ADD_ARTICLES':
      return { ...state, articles: [...state.articles, ...action.payload] };
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
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Import here to avoid circular dependency
      const { supabaseService } = await import('@/services/supabaseService');
      const articles = await supabaseService.fetchNews(language, location, 10, 0);
      
      dispatch({ type: 'SET_ARTICLES', payload: articles });
      dispatch({ type: 'SET_LANGUAGE', payload: language });
      dispatch({ type: 'SET_LOCATION', payload: location });
      
      // Maintain current index if possible, otherwise reset to 0
      const currentIndex = Math.min(state.currentIndex, articles.length - 1);
      dispatch({ type: 'SET_CURRENT_INDEX', payload: Math.max(0, currentIndex) });
    } catch (error) {
      console.error('Failed to refresh news:', error);
      // Only set error if we don't have any articles (don't override existing content)
      if (state.articles.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load news' });
      }
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadMoreNews = async (language: string, location: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Import here to avoid circular dependency
      const { supabaseService } = await import('@/services/supabaseService');
      const articles = await supabaseService.fetchNews(language, location, 10, state.articles.length);
      
      dispatch({ type: 'ADD_ARTICLES', payload: articles });
    } catch (error) {
      console.error('Failed to load more news:', error);
      // Don't set error for load more failures, just log them
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <NewsContext.Provider value={{ state, dispatch, refreshNews, loadMoreNews }}>
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
