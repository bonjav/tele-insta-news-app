import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Config } from '@/constants/Config';
import { NewsArticle, LanguageConfig, LocationConfig } from '@/types/news.types';

// Database types
export interface DatabaseNewsArticle {
  id: number;
  location: string;
  source_channel: string;
  title: string;
  article_url: string;
  image_url: string | null;
  description: string;
  category: string | null;
  published_at: string;
  schedule_run_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseNewsArticleTranslation {
  id: number;
  article_id: number;
  language_code: string;
  title: string;
  description: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseLanguageConfig {
  code: string;
  name: string;
  native_name: string;
  short_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseLocationConfig {
  id: number;
  location_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      if (!Config.SUPABASE.URL || !Config.SUPABASE.ANON_KEY) {
        console.warn('Supabase credentials not configured');
        return;
      }

      this.client = createClient(Config.SUPABASE.URL, Config.SUPABASE.ANON_KEY);
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
    }
  }

  private isClientReady(): boolean {
    if (!this.client) {
      console.error('Supabase client not initialized');
      return false;
    }
    return true;
  }

  // Convert database article to app format
  private convertToNewsArticle(
    dbArticle: DatabaseNewsArticle, 
    translation: DatabaseNewsArticleTranslation
  ): NewsArticle {
    return {
      id: dbArticle.id,
      title: translation.title,
      description: translation.description,
      url: dbArticle.article_url,
      image: dbArticle.image_url || '',
      publishedAt: translation.published_at,
      source: {
        name: dbArticle.source_channel,
        url: dbArticle.article_url,
      },
      location: dbArticle.location,
      category: dbArticle.category || undefined,
      languageCode: translation.language_code,
    };
  }

  // Fetch news articles from database with language and location filtering
  async fetchNews(
    languageCode: string = 'en',
    location: string = 'all',
    limit: number = 10,
    offset: number = 0
  ): Promise<NewsArticle[]> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      // First, get the article IDs that have translations for the specified language
      const { data: translationData, error: translationError } = await this.client!
        .from('news_article_translation')
        .select('article_id, title, description, published_at, language_code')
        .eq('language_code', languageCode)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (translationError) {
        console.error('Error fetching translations:', translationError);
        throw translationError;
      }

      if (!translationData || translationData.length === 0) {
        return [];
      }

      // Get the article IDs
      const articleIds = translationData.map(t => t.article_id);

      // Fetch the main articles
      let query = this.client!
        .from('news_article')
        .select('*')
        .in('id', articleIds);

      // Filter by location if not 'all'
      if (location !== 'all') {
        query = query.eq('location', location);
      }

      const { data: articleData, error: articleError } = await query;

      if (articleError) {
        console.error('Error fetching articles:', articleError);
        throw articleError;
      }

      if (!articleData) {
        return [];
      }

      // Create a map of translations by article_id
      const translationMap = new Map();
      translationData.forEach(t => {
        translationMap.set(t.article_id, t);
      });

      // Combine articles with their translations
      const combinedArticles = articleData
        .map(article => {
          const translation = translationMap.get(article.id);
          if (translation) {
            return this.convertToNewsArticle(article, translation);
          }
          return null;
        })
        .filter(Boolean) as NewsArticle[];

      return combinedArticles;
    } catch (error) {
      console.error('Failed to fetch news from database:', error);
      throw error;
    }
  }

  // Get available languages
  async getLanguages(): Promise<LanguageConfig[]> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      const { data, error } = await this.client!
        .from('language_config')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching languages:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      return data.map((lang: DatabaseLanguageConfig) => ({
        code: lang.code,
        name: lang.name,
        nativeName: lang.native_name,
        shortName: lang.short_name,
        isActive: lang.is_active,
      }));
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      throw error;
    }
  }

  // Get available locations
  async getLocations(): Promise<LocationConfig[]> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      const { data, error } = await this.client!
        .from('location_config')
        .select('*')
        .eq('is_active', true)
        .order('location_name');

      if (error) {
        console.error('Error fetching locations:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      return data.map((loc: DatabaseLocationConfig) => ({
        id: loc.id,
        locationName: loc.location_name,
        isActive: loc.is_active,
      }));
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      throw error;
    }
  }

  // Get total count of articles for a language and location
  async getArticleCount(languageCode: string = 'en', location: string = 'all'): Promise<number> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      // Get article IDs that have translations for the specified language
      const { data: translationData, error: translationError } = await this.client!
        .from('news_article_translation')
        .select('article_id')
        .eq('language_code', languageCode);

      if (translationError) {
        console.error('Error getting translation count:', translationError);
        throw translationError;
      }

      if (!translationData || translationData.length === 0) {
        return 0;
      }

      const articleIds = translationData.map(t => t.article_id);

      // Count articles with location filter
      let query = this.client!
        .from('news_article')
        .select('id', { count: 'exact', head: true })
        .in('id', articleIds);

      if (location !== 'all') {
        query = query.eq('location', location);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error getting article count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get article count:', error);
      throw error;
    }
  }

  // Check if database is accessible
  async healthCheck(): Promise<boolean> {
    if (!this.isClientReady()) {
      return false;
    }

    try {
      const { error } = await this.client!
        .from('news_article')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
