import { NewsResponse, NewsArticle } from '@/types/news.types';
import { Config } from '@/constants/Config';
import { supabaseService } from './supabaseService';

export class NewsService {
  // Main method to fetch news with database/API fallback
  static async fetchNews(limit: number = Config.APP.TARGET_ARTICLES_COUNT): Promise<NewsArticle[]> {
    console.log(`Fetching news with data source: ${Config.DATA_SOURCE}`);
    
    try {
      if (Config.DATA_SOURCE === 'database') {
        // Try database first
        try {
          const articles = await supabaseService.fetchNews('en', null, limit);
          if (articles.length > 0) {
            console.log(`Successfully fetched ${articles.length} articles from database`);
            return articles;
          } else {
            console.log('No articles found in database, falling back to API');
          }
        } catch (dbError) {
          console.warn('Database fetch failed, falling back to API:', dbError);
        }
      }
      
      // Fallback to API or direct API call
      console.log('Fetching from external API...');
      const apiArticles = await this.fetchBulkNews(limit);
      
      // If we successfully got articles from API and database is configured, 
      // try to sync them to database for future use
      if (apiArticles.length > 0 && Config.DATA_SOURCE === 'database') {
        try {
          // TODO: Implement insertArticles method in supabaseService if needed
          // await supabaseService.insertArticles(apiArticles);
          console.log('API articles fetched (database sync not implemented)');
        } catch (syncError) {
          console.warn('Failed to sync articles to database:', syncError);
          // Don't throw error here, we still have the articles from API
        }
      }
      
      return apiArticles;
    } catch (error) {
      console.error('Error in fetchNews:', error);
      throw new Error('Failed to fetch news from any source');
    }
  }

  private static async fetchNewsPage(page: number = 1): Promise<NewsArticle[]> {
    try {
      const { BASE_URL, API_KEY, DEFAULT_PARAMS } = Config.NEWS_API;
      const params = new URLSearchParams({
        category: DEFAULT_PARAMS.category,
        lang: DEFAULT_PARAMS.lang,
        country: DEFAULT_PARAMS.country,
        max: DEFAULT_PARAMS.max.toString(),
        apikey: API_KEY,
        page: page.toString(),
      });
      
      const url = `${BASE_URL}?${params.toString()}`;
      console.log(`Fetching news from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: NewsResponse = await response.json();
      console.log(`Fetched ${data.articles?.length || 0} articles from page ${page}`);
      return data.articles || [];
    } catch (error) {
      console.error(`Error fetching news page ${page}:`, error);
      throw error;
    }
  }

  static async fetchBulkNews(targetCount: number = Config.APP.TARGET_ARTICLES_COUNT): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = [];
    const articlesPerPage = Config.NEWS_API.DEFAULT_PARAMS.max;
    const maxPages = Math.ceil(targetCount / articlesPerPage);
    const batchSize = Config.APP.BATCH_SIZE;
    
    try {
      for (let i = 0; i < maxPages; i += batchSize) {
        const batchPromises: Promise<NewsArticle[]>[] = [];
        
        // Create batch of requests
        for (let j = 0; j < batchSize && (i + j) < maxPages; j++) {
          const pageNumber = i + j + 1;
          batchPromises.push(this.fetchNewsPage(pageNumber));
        }
        
        // Wait for batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process results
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
          }
        });
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < maxPages) {
          await new Promise(resolve => setTimeout(resolve, Config.APP.REQUEST_DELAY_MS));
        }
        
        // Stop if we have enough articles
        if (allArticles.length >= targetCount) {
          break;
        }
      }
      
      // Remove duplicates based on URL
      const uniqueArticles = allArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.url === article.url)
      );
      
      return uniqueArticles.slice(0, targetCount);
    } catch (error) {
      console.error('Error fetching bulk news:', error);
      throw new Error('Failed to fetch news articles');
    }
  }

  static async fetchLatestNews(): Promise<NewsArticle[]> {
    try {
      return await this.fetchNewsPage(1);
    } catch (error) {
      console.error('Error fetching latest news:', error);
      throw error;
    }
  }

  static formatTimeAgo(dateString: string): string {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - publishedDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  }
}
