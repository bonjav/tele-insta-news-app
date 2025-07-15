import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { NewsArticle, NewsState } from '@/types/news.types';
import { StorageService } from '@/services/storageService';
import { supabaseService } from '@/services/supabaseService';
import { Config } from '@/constants/Config';

interface NewsContextType {
  state: NewsState;
  dispatch: React.Dispatch<NewsAction>;
  refreshNews: (language: string, location: string | null) => Promise<void>;
  loadNewerNews: (language: string, location: string | null) => Promise<void>;
  loadOlderNews: (language: string, location: string | null) => Promise<void>;
}

type NewsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ARTICLES'; payload: NewsArticle[] }
  | { type: 'ADD_NEWER_ARTICLES'; payload: NewsArticle[] }
  | { type: 'ADD_OLDER_ARTICLES'; payload: NewsArticle[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_LOCATION'; payload: string | null }
  | { type: 'SET_SPECIFIC_ARTICLE'; payload: NewsArticle }
  | { type: 'CLEAR_SPECIFIC_ARTICLE_FLAG' }
  | { type: 'RESET_STATE' };

const initialState: NewsState = {
  articles: [],
  loading: false,
  error: null,
  refreshing: false,
  currentIndex: 0,
  selectedLanguage: 'en',
  selectedLocation: null,
  totalArticlesCount: 0,
  shouldScrollToTop: false,
};

const NewsContext = createContext<NewsContextType | undefined>(undefined);

function newsReducer(state: NewsState, action: NewsAction): NewsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ARTICLES':
      // Sort articles by ID descending (newest first)
      const sortedArticles = [...action.payload].sort((a, b) => b.id - a.id);
      return { ...state, articles: sortedArticles };
    case 'ADD_NEWER_ARTICLES':
      // Add newer articles to the beginning, remove duplicates, sort
      const newerArticles = [...action.payload, ...state.articles]
        .filter((article, index, self) => index === self.findIndex(a => a.id === article.id))
        .sort((a, b) => b.id - a.id);
      return { ...state, articles: newerArticles };
    case 'ADD_OLDER_ARTICLES':
      // Add older articles to the end, remove duplicates, sort
      const olderArticles = [...state.articles, ...action.payload]
        .filter((article, index, self) => index === self.findIndex(a => a.id === article.id))
        .sort((a, b) => b.id - a.id);
      return { ...state, articles: olderArticles };
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
      console.log('📰 SET_SPECIFIC_ARTICLE - Action received for article:', action.payload.title, 'with ID:', action.payload.id);
      console.log('📰 SET_SPECIFIC_ARTICLE - Current articles count:', state.articles.length);
      
      // Add the article to the beginning of the list if it doesn't exist
      const exists = state.articles.some(article => article.id === action.payload.id);
      console.log('📰 SET_SPECIFIC_ARTICLE - Article exists in current articles:', exists);
      
      if (!exists) {
        console.log('📰 SET_SPECIFIC_ARTICLE - Adding new article to beginning of list');
        const articlesWithNew = [action.payload, ...state.articles]
          .sort((a, b) => b.id - a.id);
        console.log('📰 SET_SPECIFIC_ARTICLE - New articles count:', articlesWithNew.length);
        console.log('📰 SET_SPECIFIC_ARTICLE - Setting currentIndex to 0 and shouldScrollToTop to true');
        return {
          ...state,
          articles: articlesWithNew,
          currentIndex: 0,
          shouldScrollToTop: true
        };
      }
      // If article exists, just set it as current and scroll to it
      const existingIndex = state.articles.findIndex(article => article.id === action.payload.id);
      console.log('📰 SET_SPECIFIC_ARTICLE - Article found at existing index:', existingIndex);
      console.log('📰 SET_SPECIFIC_ARTICLE - Setting currentIndex to', existingIndex, 'and shouldScrollToTop to true');
      return {
        ...state,
        currentIndex: existingIndex,
        shouldScrollToTop: true
      };
    case 'CLEAR_SPECIFIC_ARTICLE_FLAG':
      console.log('🏁 CLEAR_SPECIFIC_ARTICLE_FLAG - Clearing shouldScrollToTop flag');
      return { ...state, shouldScrollToTop: false };
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

  // Initial news loading - always fetch latest articles
  const refreshNews = async (language: string, location: string | null) => {
    try {
      dispatch({ type: 'SET_REFRESHING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('=== REFRESH NEWS: Loading latest articles ===');

      // Load from storage first for immediate display
      const storedData = await StorageService.getNewsData();
      if (storedData && storedData.articles.length > 0) {
        console.log(`Loaded ${storedData.articles.length} articles from storage`);
        dispatch({ type: 'SET_ARTICLES', payload: storedData.articles });
      }

      // Fetch latest articles from database (newest first)
      const freshArticles = await supabaseService.fetchNews(
        language,
        location || null,
        Config.APP.INITIAL_LOAD_COUNT,
        null, // Get latest articles
        'newer'
      );

      if (freshArticles && freshArticles.length > 0) {
        console.log(`Fetched ${freshArticles.length} fresh articles from database`);
        
        // Replace storage with fresh articles
        await StorageService.replaceAllArticles(freshArticles);
        
        // Update state
        dispatch({ type: 'SET_ARTICLES', payload: freshArticles });
        
        await StorageService.logStorageState();
      }

      dispatch({ type: 'SET_LANGUAGE', payload: language });
      dispatch({ type: 'SET_LOCATION', payload: location || null });
      
      console.log('=== REFRESH NEWS: Completed ===');
    } catch (error) {
      console.error('Error refreshing news:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh news' });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  };

  // Load newer articles (swipe down)
  const loadNewerNews = async (language: string, location: string | null) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('=== LOAD NEWER: Fetching newer articles ===');

      // Get the newest article ID from storage
      const newestId = await StorageService.getNewestArticleId();
      if (!newestId) {
        console.log('No articles in storage, doing initial load');
        await refreshNews(language, location);
        return;
      }

      // Fetch articles newer than the newest we have
      const newerArticles = await supabaseService.fetchNews(
        language,
        location || null,
        Config.APP.LOAD_MORE_BATCH_SIZE,
        newestId,
        'newer'
      );

      if (newerArticles && newerArticles.length > 0) {
        console.log(`Fetched ${newerArticles.length} newer articles`);
        
        // Add to storage and state
        await StorageService.addNewerArticles(newerArticles);
        dispatch({ type: 'ADD_NEWER_ARTICLES', payload: newerArticles });
        
        await StorageService.logStorageState();
      } else {
        console.log('No newer articles available');
      }

      console.log('=== LOAD NEWER: Completed ===');
    } catch (error) {
      console.error('Error loading newer news:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load newer news' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load older articles (swipe up)
  const loadOlderNews = async (language: string, location: string | null) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('=== LOAD OLDER: Fetching older articles ===');

      // Check if we need to fetch more articles from database
      const needsMore = await StorageService.needsMoreArticles('older');
      
      if (needsMore) {
        // Get the oldest article ID from storage
        const oldestId = await StorageService.getOldestArticleId();
        
        // Fetch older articles from database
        const olderArticles = await supabaseService.fetchNews(
          language,
          location || null,
          Config.APP.LOAD_MORE_BATCH_SIZE,
          oldestId,
          'older'
        );

        if (olderArticles && olderArticles.length > 0) {
          console.log(`Fetched ${olderArticles.length} older articles from database`);
          
          // Add to storage and state
          await StorageService.addOlderArticles(olderArticles);
          dispatch({ type: 'ADD_OLDER_ARTICLES', payload: olderArticles });
          
          await StorageService.logStorageState();
        } else {
          console.log('No older articles available in database');
        }
      } else {
        console.log('Sufficient articles in storage, no database fetch needed');
      }

      console.log('=== LOAD OLDER: Completed ===');
    } catch (error) {
      console.error('Error loading older news:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load older news' });
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
        loadNewerNews,
        loadOlderNews,
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
