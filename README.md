# TeleInstaNews App

A modern news application with multi-language support and location-based content filtering.

## Features

### 🌍 Multi-Language Support
- **Default Language**: English
- **Supported Languages**: 
  - English (en)
  - Chinese (zh) - 中文
  - Hindi (hi) - हिंदी
- **Dynamic Content**: News articles are fetched in the selected language
- **User Experience**: When changing language, the app maintains the current article position

### 📍 Location-Based Content
- **Automatic Detection**: App detects user's country based on device location
- **Smart Defaults**: 
  - If user's country is in the available locations list, it's set as default
  - Otherwise, "All Locations" is selected
- **Manual Selection**: Users can manually change location in settings
- **Available Locations**: Currently supports Singapore (expandable)

### 🎨 User Interface
- **Dark/Light Theme**: Toggle between dark and light modes (dark mode is default)
- **Settings Sidebar**: Easy access to language, location, and theme settings
- **Smooth Animations**: Fluid transitions and interactions
- **Responsive Design**: Optimized for mobile devices

### 📱 Technical Features
- **Database-First**: All data is fetched from Supabase database
- **Real-time Updates**: News refreshes when settings change
- **Offline Support**: Cached data for better performance
- **Pull-to-Refresh**: Manual refresh functionality
- **Infinite Scroll**: Load more articles as user scrolls

### 🐛 Debug Features
- **Configurable Debug Panel**: Development tools accessible through settings
- **Database Testing**: Test database connection and add sample data
- **Environment Control**: Enable/disable debug features via environment variables

## Database Schema

The app uses a modern database schema with separate tables for articles and translations:

### Core Tables
- `news_article`: Main article data (location, source, metadata)
- `news_article_translation`: Article translations by language
- `language_config`: Available languages and their metadata
- `location_config`: Available locations for content filtering

### Key Features
- **Normalized Design**: Articles and translations are properly separated
- **Efficient Queries**: Optimized joins for fast data retrieval
- **Scalable**: Easy to add new languages and locations

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tele-insta-news-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_MAX_ARTICLES_IN_DB=1000
   
   # Debug Configuration (optional)
   EXPO_PUBLIC_ENABLE_DEBUG_PANEL=false
   EXPO_PUBLIC_SHOW_DEBUG_INFO=false
   ```

4. **Database Setup**
   Run the SQL schema in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of database/schema.sql
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Configuration

### Debug Settings

The app includes configurable debug features that can be enabled via environment variables:

#### Enable Debug Panel
To make the debug panel visible in the settings sidebar:
```
EXPO_PUBLIC_ENABLE_DEBUG_PANEL=true
```

#### Show Debug Information
To display additional debug information throughout the app:
```
EXPO_PUBLIC_SHOW_DEBUG_INFO=true
```

**Note**: Debug features are disabled by default for production builds. Only enable them during development or testing.

## Usage

### Changing Language
1. Open the settings sidebar (swipe from left or tap settings icon)
2. Tap on the current language
3. Select your preferred language from the modal
4. News will automatically refresh in the new language

### Changing Location
1. Open the settings sidebar
2. Tap on the current location
3. Select your preferred location or "All Locations"
4. News will automatically refresh for the selected location

### Theme Toggle
1. Open the settings sidebar
2. Toggle between Light Mode and Dark Mode
3. Theme changes are applied immediately

### Debug Panel (if enabled)
1. Open the settings sidebar
2. Tap on "Debug Panel" in the Development section
3. Use the debug tools to test database connection and add sample data

## Architecture

### Context Providers
- **ThemeProvider**: Manages app theme state
- **SettingsProvider**: Manages language and location settings
- **NewsProvider**: Manages news data and current article index

### Services
- **SupabaseService**: Database operations and data fetching
- **LocationService**: Device location detection and country mapping

### Key Components
- **NewsScreen**: Main news display with infinite scroll
- **SettingsSidebar**: Settings management interface
- **NewsCard**: Individual article display component
- **DebugPanel**: Development tools and database testing interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
