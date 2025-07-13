import { supabaseService } from './supabaseService';

export interface TestArticle {
  location: string;
  source_channel: string;
  title: string;
  article_url: string;
  image_url?: string;
  description: string;
  category?: string;
  translations: Array<{
    language_code: string;
    title: string;
    description: string;
  }>;
}

export const testDataService = {
  async testNotificationTrigger() {
    try {
      // 1. First, ensure we have a test user with notifications enabled
      const testDevice = {
        device_id: 'test_device_' + Date.now(),
        push_token: 'ExponentPushToken[test_token]',
        notifications_enabled: true,
        language_code: 'en'
      };

      console.log('Creating test user preferences...');
      const userPref = await supabaseService.upsertUserPreferences(
        testDevice.device_id,
        testDevice
      );
      console.log('Test user created:', userPref);

      // 2. Create a test news article
      const { data: article, error: articleError } = await supabaseService.client!
        .from('news_article')
        .insert({
          location: 'Singapore',
          source_channel: 'Test Channel',
          title: 'Test Article',
          article_url: 'https://example.com/test',
          description: 'This is a test article',
          published_at: new Date().toISOString(),
          category: 'test'
        })
        .select()
        .single();

      if (articleError) {
        throw new Error(`Failed to create test article: ${articleError.message}`);
      }
      console.log('Test article created:', article);

      // 3. Create article translation
      const { data: translation, error: translationError } = await supabaseService.client!
        .from('news_article_translation')
        .insert({
          article_id: article.id,
          language_code: 'en',
          title: 'Test Article Translation',
          description: 'This is a test article translation',
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (translationError) {
        throw new Error(`Failed to create test translation: ${translationError.message}`);
      }
      console.log('Test translation created:', translation);

      // 4. Wait a bit to allow the trigger to process
      console.log('Waiting for trigger to process...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 5. Clean up test data
      console.log('Cleaning up test data...');
      await Promise.all([
        supabaseService.client!.from('user_preferences').delete().eq('device_id', testDevice.device_id),
        supabaseService.client!.from('news_article').delete().eq('id', article.id)
      ]);

      console.log('Test completed successfully!');
      return true;
    } catch (error) {
      console.error('Test failed:', error);
      return false;
    }
  }
};

export class TestDataService {
  static async addTestData() {
    try {
      const testArticles: TestArticle[] = [
        {
          location: 'Singapore',
          source_channel: 'Channel News Asia',
          title: 'Singapore Economy Shows Strong Recovery',
          article_url: 'https://example.com/article1',
          image_url: 'https://picsum.photos/800/600?random=1',
          description: 'Singapore\'s economy has shown remarkable resilience and recovery in the post-pandemic era.',
          category: 'Economy',
          translations: [
            {
              language_code: 'en',
              title: 'Singapore Economy Shows Strong Recovery',
              description: 'Singapore\'s economy has shown remarkable resilience and recovery in the post-pandemic era.',
            },
            {
              language_code: 'zh',
              title: '新加坡经济显示强劲复苏',
              description: '新加坡经济在后疫情时代显示出显著的韧性和复苏。',
            },
            {
              language_code: 'hi',
              title: 'सिंगापुर की अर्थव्यवस्था में मजबूत सुधार',
              description: 'सिंगापुर की अर्थव्यवस्था ने महामारी के बाद के युग में उल्लेखनीय लचीलापन और सुधार दिखाया है।',
            },
          ],
        },
        {
          location: 'Singapore',
          source_channel: 'The Straits Times',
          title: 'New Technology Hub Opens in Singapore',
          article_url: 'https://example.com/article2',
          image_url: 'https://picsum.photos/800/600?random=2',
          description: 'A state-of-the-art technology hub has opened in Singapore, attracting global tech companies.',
          category: 'Technology',
          translations: [
            {
              language_code: 'en',
              title: 'New Technology Hub Opens in Singapore',
              description: 'A state-of-the-art technology hub has opened in Singapore, attracting global tech companies.',
            },
            {
              language_code: 'zh',
              title: '新加坡新科技中心开业',
              description: '一个最先进的科技中心在新加坡开业，吸引了全球科技公司。',
            },
            {
              language_code: 'hi',
              title: 'सिंगापुर में नया प्रौद्योगिकी केंद्र खुला',
              description: 'सिंगापुर में एक अत्याधुनिक प्रौद्योगिकी केंद्र खुला है, जो वैश्विक तकनीकी कंपनियों को आकर्षित कर रहा है।',
            },
          ],
        },
        {
          location: 'Singapore',
          source_channel: 'Today Online',
          title: 'Singapore Leads in Sustainable Development',
          article_url: 'https://example.com/article3',
          image_url: 'https://picsum.photos/800/600?random=3',
          description: 'Singapore continues to lead the way in sustainable development and green initiatives.',
          category: 'Environment',
          translations: [
            {
              language_code: 'en',
              title: 'Singapore Leads in Sustainable Development',
              description: 'Singapore continues to lead the way in sustainable development and green initiatives.',
            },
            {
              language_code: 'zh',
              title: '新加坡在可持续发展方面领先',
              description: '新加坡继续在可持续发展和绿色倡议方面引领潮流。',
            },
            {
              language_code: 'hi',
              title: 'सिंगापुर सतत विकास में अग्रणी',
              description: 'सिंगापुर सतत विकास और हरित पहल में अग्रणी बना हुआ है।',
            },
          ],
        },
      ];

      console.log('Adding test data to database...');

      for (const article of testArticles) {
        // Insert main article
        const { data: articleData, error: articleError } = await supabaseService.client!
          .from('news_article')
          .insert({
            location: article.location,
            source_channel: article.source_channel,
            title: article.title,
            article_url: article.article_url,
            image_url: article.image_url,
            description: article.description,
            category: article.category,
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (articleError) {
          console.error('Error inserting article:', articleError);
          continue;
        }

        // Insert translations
        for (const translation of article.translations) {
          const { error: translationError } = await supabaseService.client!
            .from('news_article_translation')
            .insert({
              article_id: articleData.id,
              language_code: translation.language_code,
              title: translation.title,
              description: translation.description,
              published_at: new Date().toISOString(),
            });

          if (translationError) {
            console.error('Error inserting translation:', translationError);
          }
        }
      }

      console.log('Test data added successfully!');
    } catch (error) {
      console.error('Failed to add test data:', error);
    }
  }

  static async checkDatabaseConnection() {
    try {
      const isHealthy = await supabaseService.healthCheck();
      console.log('Database connection:', isHealthy ? 'OK' : 'FAILED');
      return isHealthy;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  static async getSampleData() {
    try {
      const articles = await supabaseService.fetchNews('en', 'all', 5, 0);
      console.log('Sample articles:', articles.length);
      return articles;
    } catch (error) {
      console.error('Failed to get sample data:', error);
      return [];
    }
  }
} 