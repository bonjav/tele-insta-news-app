"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
exports.Config = {
    // Data Source Configuration
    DATA_SOURCE: process.env.EXPO_PUBLIC_DATA_SOURCE || 'database',
    // Supabase Configuration
    SUPABASE: {
        URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
        ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    // News API Configuration
    NEWS_API: {
        BASE_URL: 'http://test.co.mine', //'https://gnews.io/api/v4/top-headlines',
        API_KEY: process.env.EXPO_PUBLIC_NEWS_API_KEY || 'd7adef0fedcfc7207914b456fa24058d',
        DEFAULT_PARAMS: {
            category: 'general',
            lang: 'en',
            country: 'sg',
            max: 10, // Articles per API request
        },
    },
    // App Configuration
    APP: {
        TARGET_ARTICLES_COUNT: 10, // Total articles to fetch and store
        BATCH_SIZE: 2, // Number of API requests to process at once
        CACHE_EXPIRY_HOURS: 6, // Hours before data is considered stale
        REQUEST_DELAY_MS: 500, // Delay between API request batches
        MAX_ARTICLES_IN_DB: parseInt(process.env.EXPO_PUBLIC_MAX_ARTICLES_IN_DB || '1000'),
    },
    // Scheduler Configuration
    SCHEDULER: {
        ENABLED: process.env.EXPO_PUBLIC_SCHEDULER_ENABLED === 'true',
        INTERVAL_HOURS: parseInt(process.env.EXPO_PUBLIC_SCHEDULER_INTERVAL_HOURS || '1'),
        BATCH_SIZE: 50, // Articles to sync per batch
    },
    // Debug Configuration
    DEBUG: {
        ENABLE_DEBUG_PANEL: process.env.EXPO_PUBLIC_ENABLE_DEBUG_PANEL === 'true' || false,
        SHOW_DEBUG_INFO: process.env.EXPO_PUBLIC_SHOW_DEBUG_INFO === 'true' || false,
    },
    // UI Configuration
    UI: {
        SHOW_LOCATION_SETTING: process.env.EXPO_PUBLIC_SHOW_LOCATION_SETTING !== 'false', // Default to true
    },
    // Performance Configuration
    PERFORMANCE: {
        MAX_RENDER_BATCH: 3,
        WINDOW_SIZE: 5,
        INITIAL_NUM_TO_RENDER: 2,
    },
};
