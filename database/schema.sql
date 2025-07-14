-- Drop existing tables if they exist
DROP TABLE IF EXISTS news_article_translation_history cascade;
DROP TABLE IF EXISTS news_article_history cascade;
DROP TABLE IF EXISTS news_article cascade;
DROP TABLE IF EXISTS news_article_translation cascade;
DROP TABLE IF EXISTS schedule_run cascade;
DROP TABLE IF EXISTS app_config cascade;
DROP TABLE IF EXISTS location_config cascade;
DROP TABLE IF EXISTS language_config cascade;

-- Create tables
CREATE TABLE app_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_config_key UNIQUE (config_key)
);

CREATE TABLE location_config (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_location_name UNIQUE (location_name)
);

CREATE TABLE language_config (
  code VARCHAR(2) PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  short_name VARCHAR(3) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE schedule_run (
    id SERIAL PRIMARY KEY,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news_article (
    id SERIAL PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    source_channel VARCHAR(200) NOT NULL,
    title TEXT NOT NULL,
    article_url TEXT NOT NULL,
    image_url TEXT,
    description TEXT NOT NULL,
    category VARCHAR(100),
    published_at TIMESTAMP NOT NULL,
    schedule_run_id INTEGER REFERENCES schedule_run(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_article_url UNIQUE (article_url)
);

CREATE TABLE news_article_translation (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES news_article(id) ON DELETE CASCADE,
    language_code VARCHAR(2) NOT NULL REFERENCES language_config(code),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    published_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_article_language UNIQUE (article_id, language_code)
);

CREATE TABLE news_article_history (
    id SERIAL PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    source_channel VARCHAR(200) NOT NULL,
    title TEXT NOT NULL,
    article_url TEXT NOT NULL,
    image_url TEXT,
    description TEXT NOT NULL,
    category VARCHAR(100),
    published_at TIMESTAMP NOT NULL,
    schedule_run_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news_article_translation_history (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL,
    language_code VARCHAR(2) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    published_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_news_article_location ON news_article(location);
CREATE INDEX idx_news_article_published_at ON news_article(published_at);
CREATE INDEX idx_news_article_schedule_run_id ON news_article(schedule_run_id);
CREATE INDEX idx_news_article_history_location ON news_article_history(location);
CREATE INDEX idx_news_article_history_published_at ON news_article_history(published_at);
CREATE INDEX idx_news_article_history_archived_at ON news_article_history(archived_at);
CREATE INDEX idx_news_article_translation_article_id ON news_article_translation(article_id);
CREATE INDEX idx_news_article_translation_language ON news_article_translation(language_code);
CREATE INDEX idx_news_article_translation_published_at ON news_article_translation(published_at);
CREATE INDEX idx_news_article_translation_history_archived_at ON news_article_translation_history(archived_at);

DROP TABLE IF EXISTS user_preferences cascade;

-- Create user_preferences table
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    push_token VARCHAR(255),
    notifications_enabled BOOLEAN DEFAULT true,
    language_code VARCHAR(2) REFERENCES language_config(code),
    location VARCHAR(255) REFERENCES location_config(location_name),
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_device_id UNIQUE (device_id)
);

-- Create indexes for user_preferences
CREATE INDEX idx_user_preferences_device_id ON user_preferences(device_id);
CREATE INDEX idx_user_preferences_push_token ON user_preferences(push_token);
CREATE INDEX idx_user_preferences_language ON user_preferences(language_code);
CREATE INDEX idx_user_preferences_location ON user_preferences(location);
CREATE INDEX idx_user_preferences_last_active ON user_preferences(last_active_at);


DROP TABLE IF EXISTS notification_status cascade;

-- Create notification status table (single row)
CREATE TABLE notification_status (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one row
    -- Article and Translation Information
    last_notified_article_id INTEGER REFERENCES news_article(id),
    notified_translation_ids INTEGER[] NOT NULL DEFAULT '{}', -- Array of news_article_translation ids that were sent
    -- Notification Details
    notification_title TEXT,
    notification_body TEXT,
    -- Recipients Information
    notified_user_preference_ids INTEGER[] NOT NULL DEFAULT '{}', -- Array of user_preferences ids that were notified
    total_recipients_count INTEGER DEFAULT 0,
    successful_recipients_count INTEGER DEFAULT 0,
    failed_recipients_count INTEGER DEFAULT 0,
    -- Expo API Response Summary
    expo_success_tickets TEXT[] DEFAULT '{}', -- Array of successful ticket IDs
    expo_failed_tickets JSONB, -- Detailed error information for failed tickets
    -- Status Information
    notification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    error_message TEXT,
    -- Timing Information
    last_notification_start_time TIMESTAMP,
    last_notification_end_time TIMESTAMP,
    -- Common fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for monitoring
CREATE INDEX idx_notification_status_article ON notification_status(last_notified_article_id);
CREATE INDEX idx_notification_status_updated ON notification_status(updated_at);


-- Insert default configuration values
INSERT INTO app_config (config_key, config_value, description) VALUES 
('NEWS_COUNT_PER_LOCATION', '10', 'Number of news articles to generate per location'),
('NEWS_UNIQUENESS_HOURS', '1', 'Hours to check for uniqueness of news articles'),
('ARCHIVE_DAYS_THRESHOLD', '30', 'Number of days after which articles should be archived'),
('HISTORY_CLEANUP_DAYS_THRESHOLD', '30', 'Number of days after which history records should be cleaned up'),
('OPENAI_MODEL', 'gpt-3.5-turbo', 'OpenAI model to use for news generation'),
('SCHEDULER_INTERVAL_MINUTES', '15', 'Interval in minutes between news generation runs'),
('NEWS_GENERATION_ENABLED', 'true', 'Enable or disable automatic news generation scheduler'),
('RETRY_ENABLED', 'true', 'Enable or disable retry mechanism for failed operations'),
('MAX_RETRY_ATTEMPTS', '3', 'Maximum number of retry attempts for failed operations')
ON CONFLICT ON CONSTRAINT uk_config_key DO NOTHING;

-- Insert Singapore location
INSERT INTO location_config (location_name, short_name, is_active) VALUES 
('Singapore', 'sg', true)
ON CONFLICT ON CONSTRAINT uk_location_name DO NOTHING;

INSERT INTO language_config (code, name, native_name, short_name) VALUES
  ('en', 'English', 'English', 'EN'),
  ('zh', 'Chinese', '中文', '中文'),
  ('hi', 'Hindi', 'हिंदी', 'हि');