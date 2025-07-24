import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Config } from '@/constants/Config';
import { NewsArticle, LanguageConfig, LocationConfig } from '@/types/news.types';

// Partial article interface for Supabase joins
interface PartialDatabaseNewsArticle {
  id: number;
  location: string;
  source_channel: string;
  article_url: string;
  image_url: string | null;
  category: string | null;
}

// Partial translation interface for Supabase joins
interface PartialDatabaseNewsArticleTranslation {
  article_id: number;
  title: string;
  description: string;
  published_at: string;
  language_code: string;
}

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

export interface UserPreferences {
  id: number;
  device_id: string;
  push_token: string | null;
  notifications_enabled: boolean;
  language_code: string | null;
  location: string | null;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

class SupabaseService {
  public client: SupabaseClient | null = null;

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

  // Convert partial article from join to app format
  private convertPartialToNewsArticle(
    partialArticle: PartialDatabaseNewsArticle, 
    translation: PartialDatabaseNewsArticleTranslation
  ): NewsArticle {
    return {
      id: partialArticle.id,
      title: translation.title,
      description: translation.description,
      url: partialArticle.article_url,
      image: partialArticle.image_url || '',
      publishedAt: translation.published_at,
      source: {
        name: partialArticle.source_channel,
        url: partialArticle.article_url,
      },
      location: partialArticle.location,
      category: partialArticle.category || undefined,
      languageCode: translation.language_code,
    };
  }

  // Fetch a specific article by ID with translation
  async fetchArticleById(
    articleId: number,
    languageCode: string = 'en'
  ): Promise<NewsArticle | null> {
    console.log('🗃️ DATABASE - Fetching article by ID:', articleId, 'with language:', languageCode);
    
    if (!this.isClientReady()) {
      console.error('🗃️ DATABASE - Supabase client not ready');
      throw new Error('Supabase client not ready');
    }

    try {
      // Fetch the article
      const { data: article, error: articleError } = await this.client!
        .from('news_article')
        .select('*')
        .eq('id', articleId)
        .single();

      if (articleError) {
        console.error('🗃️ DATABASE - Error fetching article:', articleError);
        throw articleError;
      }

      if (!article) {
        console.log('🗃️ DATABASE - Article not found in database');
        return null;
      }

      console.log('🗃️ DATABASE - Article found:', article.title || 'No title');

      // Fetch the translation
      const { data: translation, error: translationError } = await this.client!
        .from('news_article_translation')
        .select('*')
        .eq('article_id', articleId)
        .eq('language_code', languageCode)
        .single();

      if (translationError) {
        console.error('🗃️ DATABASE - Error fetching translation:', translationError);
        throw translationError;
      }

      if (!translation) {
        console.log('🗃️ DATABASE - Translation not found for language:', languageCode);
        return null;
      }

      console.log('🗃️ DATABASE - Translation found:', translation.title || 'No title');

      // Convert to app format
      const result = this.convertToNewsArticle(article, translation);
      console.log('🗃️ DATABASE - Converted article:', result.title);
      
      return result;
    } catch (error) {
      console.error('🗃️ DATABASE - Error in fetchArticleById:', error);
      throw error;
    }
  }

  // Fetch news with bidirectional loading support
  async fetchNews(
    languageCode: string = 'en',
    location: string | null = null,
    limit: number = Config.APP.INITIAL_LOAD_COUNT,
    fromArticleId: number | null = null, // null = get latest, number = get articles relative to this ID
    direction: 'newer' | 'older' = 'newer' // newer = articles with ID > fromArticleId, older = articles with ID < fromArticleId
  ): Promise<NewsArticle[]> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      console.log(`Fetching ${direction} articles, limit: ${limit}, fromArticleId: ${fromArticleId}, language: ${languageCode}, location: ${location}`);

      let query = this.client!
        .from('news_article_translation')
        .select(`
          article_id,
          title,
          description,
          published_at,
          language_code,
          news_article (
            id,
            location,
            source_channel,
            article_url,
            image_url,
            category
          )
        `)
        .eq('language_code', languageCode);

      // Add location filter only if location is specified and not 'all'
      if (location && location !== 'all') {
        query = query.eq('news_article.location', location);
      }

      // Handle pagination based on direction
      if (fromArticleId === null) {
        // Initial load - get the latest articles
        query = query.order('article_id', { ascending: false });
      } else if (direction === 'newer') {
        // Get articles newer than fromArticleId (higher IDs)
        query = query.gt('article_id', fromArticleId).order('article_id', { ascending: false });
      } else {
        // Get articles older than fromArticleId (lower IDs) 
        query = query.lt('article_id', fromArticleId).order('article_id', { ascending: false });
      }

      const { data: translationData, error: translationError } = await query.limit(limit);

      if (translationError) {
        console.error('Error fetching translations:', translationError);
        throw translationError;
      }

      if (!translationData || translationData.length === 0) {
        console.log('No articles found');
        return [];
      }

      // Convert to NewsArticle format
      const articles: NewsArticle[] = translationData
        .filter(translation => translation.news_article) // Filter out any translations without articles
        .map(translation => {
          // Handle Supabase join - news_article might be an array or object
          const article = Array.isArray(translation.news_article) 
            ? translation.news_article[0] 
            : translation.news_article;
          return this.convertPartialToNewsArticle(article, translation);
        });

      console.log(`Fetched ${articles.length} articles. Article IDs: ${articles.map(a => a.id).join(', ')}`);
      
      return articles; // Always return in descending order (newest first)
    } catch (error) {
      console.error('Failed to fetch news:', error);
      throw error;
    }
  }

  // Get the latest article ID for a given language/location
  async getLatestArticleId(
    languageCode: string = 'en',
    location: string | null = null
  ): Promise<number | null> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      let query = this.client!
        .from('news_article_translation')
        .select('article_id')
        .eq('language_code', languageCode);

      if (location && location !== 'all') {
        query = query.eq('news_article.location', location);
      }

      const { data, error } = await query
        .order('article_id', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error getting latest article ID:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0].article_id : null;
    } catch (error) {
      console.error('Failed to get latest article ID:', error);
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
        shortName: loc.location_name.toLowerCase().substring(0, 2), // Generate shortName from location name
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

  // User preferences methods
  async getUserPreferences(deviceId: string): Promise<UserPreferences | null> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      const { data, error } = await this.client!
        .from('user_preferences')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          return null;
        }
        console.error('Error fetching user preferences:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
      throw error;
    }
  }

  async upsertUserPreferences(
    deviceId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      // First check if the record exists
      const existingPrefs = await this.getUserPreferences(deviceId);

      // Prepare the update data
      const updateData = {
        device_id: deviceId,
        ...preferences,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingPrefs) {
        // Update existing record
        const { data, error } = await this.client!
          .from('user_preferences')
          .update(updateData)
          .eq('device_id', deviceId)
          .select()
          .single();

        if (error) {
          console.error('Error updating user preferences:', error);
          throw error;
        }

        return data;
      } else {
        // Insert new record
        const { data, error } = await this.client!
          .from('user_preferences')
          .insert({
            ...updateData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting user preferences:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Failed to upsert user preferences:', error);
      throw error;
    }
  }

  async updateUserActivity(deviceId: string): Promise<void> {
    if (!this.isClientReady()) {
      throw new Error('Supabase client not ready');
    }

    try {
      const { error } = await this.client!
        .from('user_preferences')
        .update({ last_active_at: new Date().toISOString() })
        .eq('device_id', deviceId);

      if (error) {
        console.error('Error updating user activity:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update user activity:', error);
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
