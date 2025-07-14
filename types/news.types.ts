export interface NewsSource {
  name: string;
  url: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  description: string;
  content?: string;
  url: string;
  image: string;
  publishedAt: string;
  source: NewsSource;
  location: string;
  category?: string;
  languageCode: string;
}

export interface NewsResponse {
  totalArticles: number;
  articles: NewsArticle[];
}

export interface NewsState {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  currentIndex: number;
  selectedLanguage: string;
  selectedLocation: string;
  totalArticlesCount: number;
}

export interface StoredNewsData {
  articles: NewsArticle[];
  lastUpdated: string;
  totalCount: number;
  language: string;
  location: string;
}

export interface AppSettings {
  language: string;
  location: string;
  theme: 'light' | 'dark';
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  shortName: string;
  isActive: boolean;
}

export interface LocationConfig {
  locationName: string;
  shortName: string;
  isActive: boolean;
}
