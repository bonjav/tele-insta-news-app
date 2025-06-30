import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle, StoredNewsData } from '@/types/news.types';
import { Config } from '@/constants/Config';

const NEWS_STORAGE_KEY = '@news_data';

export class StorageService {
  static async saveNewsData(articles: NewsArticle[]): Promise<void> {
    try {
      const newsData: StoredNewsData = {
        articles,
        lastUpdated: new Date().toISOString(),
        totalCount: articles.length,
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
}
