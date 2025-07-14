import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle, StoredNewsData } from '@/types/news.types';
import { Config } from '@/constants/Config';

const NEWS_STORAGE_KEY = '@news_data';

export class StorageService {
  static async saveNewsData(
    articles: NewsArticle[],
    position: 'start' | 'end' = 'end',
    maxArticles: number = Config.APP.MAX_ARTICLES_IN_DB
  ): Promise<void> {
    try {
      const existingData = await this.getNewsData();
      let finalArticles: NewsArticle[];

      if (existingData) {
        // Combine articles based on position
        finalArticles = position === 'start'
          ? [...articles, ...existingData.articles]
          : [...existingData.articles, ...articles];

        // Remove duplicates based on article ID
        finalArticles = finalArticles.filter((article, index, self) =>
          index === self.findIndex(a => a.id === article.id)
        );

        // Limit the number of articles if exceeding max
        if (finalArticles.length > maxArticles) {
          finalArticles = position === 'end'
            ? finalArticles.slice(0, maxArticles) // Keep newer articles when adding at end
            : finalArticles.slice(-maxArticles); // Keep newer articles when adding at start
        }
      } else {
        finalArticles = articles.slice(0, maxArticles);
      }

      const newsData: StoredNewsData = {
        articles: finalArticles,
        lastUpdated: new Date().toISOString(),
        totalCount: finalArticles.length,
        language: finalArticles[0]?.languageCode || 'en',
        location: finalArticles[0]?.location || 'all',
      };

      await AsyncStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(newsData));
    } catch (error) {
      console.error('Error saving news data:', error);
      throw new Error('Failed to save news data');
    }
  }

  static async getNewsData(): Promise<StoredNewsData | null> {
    try {
      const data = await AsyncStorage.getItem(NEWS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as StoredNewsData;
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
    try {
      const data = await this.getNewsData();
      if (!data) return null;

      return data.articles.find(article => article.id === articleId) || null;
    } catch (error) {
      console.error('Error finding article by ID:', error);
      return null;
    }
  }
}
