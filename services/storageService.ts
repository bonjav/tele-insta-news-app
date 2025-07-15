import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle, StoredNewsData } from '@/types/news.types';
import { Config } from '@/constants/Config';

const NEWS_STORAGE_KEY = '@news_data';

export class StorageService {
  static async saveNewsData(
    articles: NewsArticle[],
    position: 'start' | 'end' = 'end',
    maxArticles: number = Config.APP.LOCAL_STORAGE_THRESHOLD
  ): Promise<void> {
    try {
      const existingData = await this.getNewsData();
      let finalArticles: NewsArticle[];

      if (existingData) {
        // Combine articles based on position
        finalArticles = position === 'start'
          ? [...articles, ...existingData.articles]
          : [...existingData.articles, ...articles];

        // Remove duplicates based on article ID and sort by ID descending (newest first)
        finalArticles = finalArticles
          .filter((article, index, self) => index === self.findIndex(a => a.id === article.id))
          .sort((a, b) => b.id - a.id);

        // Apply threshold cleanup if exceeding limit
        if (finalArticles.length > Config.APP.CLEANUP_THRESHOLD) {
          console.log(`Cleaning up articles: ${finalArticles.length} -> ${maxArticles}`);
          finalArticles = finalArticles.slice(0, maxArticles); // Keep newest articles
        }
      } else {
        finalArticles = articles
          .filter((article, index, self) => index === self.findIndex(a => a.id === article.id))
          .sort((a, b) => b.id - a.id)
          .slice(0, maxArticles);
      }

      const newsData: StoredNewsData = {
        articles: finalArticles,
        lastUpdated: new Date().toISOString(),
        totalCount: finalArticles.length,
        language: finalArticles[0]?.languageCode || 'en',
        location: finalArticles[0]?.location || 'all',
      };

      console.log(`Saved ${finalArticles.length} articles to storage. IDs: ${finalArticles.slice(0, 3).map(a => a.id).join(', ')}...`);
      await AsyncStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(newsData));
    } catch (error) {
      console.error('Error saving news data:', error);
      throw new Error('Failed to save news data');
    }
  }

  // Add newer articles to the beginning of the list
  static async addNewerArticles(articles: NewsArticle[]): Promise<void> {
    if (articles.length === 0) return;
    console.log(`Adding ${articles.length} newer articles to storage`);
    await this.saveNewsData(articles, 'start');
  }

  // Add older articles to the end of the list
  static async addOlderArticles(articles: NewsArticle[]): Promise<void> {
    if (articles.length === 0) return;
    console.log(`Adding ${articles.length} older articles to storage`);
    await this.saveNewsData(articles, 'end');
  }

  // Replace all articles with new set (for initial load)
  static async replaceAllArticles(articles: NewsArticle[]): Promise<void> {
    console.log(`Replacing all articles with ${articles.length} new articles`);
    try {
      const sortedArticles = articles
        .filter((article, index, self) => index === self.findIndex(a => a.id === article.id))
        .sort((a, b) => b.id - a.id)
        .slice(0, Config.APP.LOCAL_STORAGE_THRESHOLD);

      const newsData: StoredNewsData = {
        articles: sortedArticles,
        lastUpdated: new Date().toISOString(),
        totalCount: sortedArticles.length,
        language: sortedArticles[0]?.languageCode || 'en',
        location: sortedArticles[0]?.location || 'all',
      };

      await AsyncStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(newsData));
    } catch (error) {
      console.error('Error replacing articles:', error);
      throw new Error('Failed to replace articles');
    }
  }

  // Get the highest (newest) article ID in storage
  static async getNewestArticleId(): Promise<number | null> {
    try {
      const data = await this.getNewsData();
      if (!data || data.articles.length === 0) return null;
      
      // Articles should already be sorted by ID descending
      const newestId = Math.max(...data.articles.map(a => a.id));
      console.log('Newest article ID in storage:', newestId);
      return newestId;
    } catch (error) {
      console.error('Error getting newest article ID:', error);
      return null;
    }
  }

  // Get the lowest (oldest) article ID in storage
  static async getOldestArticleId(): Promise<number | null> {
    try {
      const data = await this.getNewsData();
      if (!data || data.articles.length === 0) return null;
      
      // Articles should already be sorted by ID descending
      const oldestId = Math.min(...data.articles.map(a => a.id));
      console.log('Oldest article ID in storage:', oldestId);
      return oldestId;
    } catch (error) {
      console.error('Error getting oldest article ID:', error);
      return null;
    }
  }

  // Check if we need to fetch more articles based on position and threshold
  static async needsMoreArticles(direction: 'newer' | 'older'): Promise<boolean> {
    try {
      const data = await this.getNewsData();
      if (!data || data.articles.length === 0) return true;

      const currentCount = data.articles.length;
      
      // If we have fewer than minimum threshold, we need more articles
      if (currentCount < Config.APP.MIN_ARTICLES_BEFORE_FETCH) {
        console.log(`Need more articles: ${currentCount} < ${Config.APP.MIN_ARTICLES_BEFORE_FETCH}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking if more articles needed:', error);
      return true;
    }
  }

  static async getNewsData(): Promise<StoredNewsData | null> {
    try {
      const data = await AsyncStorage.getItem(NEWS_STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data) as StoredNewsData;
        // Ensure articles are sorted by ID descending
        if (parsedData.articles && parsedData.articles.length > 0) {
          parsedData.articles.sort((a, b) => b.id - a.id);
        }
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving news data:', error);
      return null;
    }
  }

  static async clearNewsData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NEWS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing news data:', error);
    }
  }

  static async isDataStale(maxAgeHours: number = Config.APP.CACHE_EXPIRY_HOURS): Promise<boolean> {
    try {
      const data = await this.getNewsData();
      if (!data) return true;

      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      return hoursDiff > maxAgeHours;
    } catch (error) {
      console.error('Error checking data staleness:', error);
      return true;
    }
  }

  static async findArticleById(articleId: number): Promise<NewsArticle | null> {
    console.log('🗄️ STORAGE - Finding article by ID:', articleId);
    
    try {
      const data = await this.getNewsData();
      console.log('🗄️ STORAGE - Retrieved data:', data ? `${data.articles.length} articles` : 'null');
      
      if (!data) {
        console.log('🗄️ STORAGE - No data found, returning null');
        return null;
      }

      const foundArticle = data.articles.find(article => article.id === articleId);
      console.log('🗄️ STORAGE - Article found:', foundArticle ? `"${foundArticle.title}"` : 'null');
      console.log('🗄️ STORAGE - Available article IDs:', data.articles.map(a => a.id).slice(0, 10));
      
      return foundArticle || null;
    } catch (error) {
      console.error('🗄️ STORAGE - Error finding article by ID:', error);
      return null;
    }
  }

  // Debug method to log current storage state
  static async logStorageState(): Promise<void> {
    try {
      const data = await this.getNewsData();
      if (data && data.articles.length > 0) {
        const articleIds = data.articles.map(a => a.id);
        console.log(`Storage state: ${data.articles.length} articles`);
        console.log(`Article IDs: ${articleIds.slice(0, 5).join(', ')}...${articleIds.slice(-2).join(', ')}`);
        console.log(`Newest: ${Math.max(...articleIds)}, Oldest: ${Math.min(...articleIds)}`);
      } else {
        console.log('Storage state: No articles');
      }
    } catch (error) {
      console.error('Error logging storage state:', error);
    }
  }
}
