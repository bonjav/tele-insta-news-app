import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import NewsCard from '@/components/NewsCard';
import { NewsArticle } from '@/types/news.types';
import { useNews } from '@/contexts/NewsContext';
import { useSettingsInitialization } from '@/hooks/useSettingsInitialization';
import { useTheme } from '@/contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NewsScreen() {
  const {
    state: { articles, loading, error, refreshing, currentIndex, shouldScrollToTop },
    dispatch,
    refreshNews,
    loadNewerNews,
    loadOlderNews,
  } = useNews();

  const { isInitialized, isInitializing, hasLoadedInitialNews, settingsState } = useSettingsInitialization();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  // Handle scrolling to specific article from notification
  useEffect(() => {
    if (shouldScrollToTop && flatListRef.current && articles.length > 0) {
      console.log('Scrolling to article at index:', currentIndex, 'of', articles.length);
      
      // Use setTimeout to ensure the FlatList has rendered the new articles
      setTimeout(() => {
        try {
          if (currentIndex >= 0 && currentIndex < articles.length) {
            flatListRef.current?.scrollToIndex({
              index: currentIndex,
              animated: true,
            });
            console.log('Successfully scrolled to index:', currentIndex);
          } else {
            console.warn('Invalid currentIndex:', currentIndex, 'for articles length:', articles.length);
          }
        } catch (error) {
          console.error('Error scrolling to index:', error);
          // Fallback to scrolling to top
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
        // Clear the flag after scrolling
        dispatch({ type: 'CLEAR_SPECIFIC_ARTICLE_FLAG' });
      }, 100);
    }
  }, [shouldScrollToTop, currentIndex, articles.length, dispatch]);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      dispatch({ type: 'SET_CURRENT_INDEX', payload: index });
    }
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    if (settingsState.language) {
      await refreshNews(settingsState.language, settingsState.location);
    }
  }, [settingsState.language, settingsState.location, refreshNews]);

  // Load newer articles (when user pulls down from top)
  const handleLoadNewer = useCallback(async () => {
    if (settingsState.language && !loading && !isLoadingNewer) {
      setIsLoadingNewer(true);
      try {
        console.log('User pulled down - loading newer articles');
        await loadNewerNews(settingsState.language, settingsState.location);
      } finally {
        setIsLoadingNewer(false);
      }
    }
  }, [settingsState.language, settingsState.location, loading, loadNewerNews, isLoadingNewer]);

  // Load older articles (when user scrolls up from bottom)
  const handleLoadOlder = useCallback(async () => {
    if (settingsState.language && !loading && !isLoadingOlder) {
      setIsLoadingOlder(true);
      try {
        console.log('User scrolled up - loading older articles');
        await loadOlderNews(settingsState.language, settingsState.location);
      } finally {
        setIsLoadingOlder(false);
      }
    }
  }, [settingsState.language, settingsState.location, loading, loadOlderNews, isLoadingOlder]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    
    // Check if we're at the top (user can pull down for newer articles)
    if (contentOffset.y <= -50 && !refreshing && !isLoadingNewer) {
      handleLoadNewer();
    }
    
    // Check if we're near the bottom (load older articles)
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 200 && !isLoadingOlder) {
      handleLoadOlder();
    }
  }, [handleLoadNewer, handleLoadOlder, refreshing, isLoadingNewer, isLoadingOlder]);

  const renderNewsCard = ({ item, index }: { item: NewsArticle; index: number }) => (
    <NewsCard
      article={item}
      isActive={index === currentIndex}
    />
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text }]}>
        {isInitializing ? 'Initializing app...' : 'Loading news articles...'}
      </Text>
      <Text style={[styles.loadingSubtext, { color: colors.secondary }]}>
        This may take a moment
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>📰</Text>
      <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
      <Text style={[styles.errorSubtext, { color: colors.secondary }]}>Pull down to refresh</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>📰</Text>
      <Text style={[styles.emptyText, { color: colors.text }]}>No news articles found</Text>
      <Text style={[styles.emptySubtext, { color: colors.secondary }]}>
        Try changing your language or location settings
      </Text>
    </View>
  );

  // Show loading while initializing
  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  // Show loading if we haven't loaded initial news yet
  if (!hasLoadedInitialNews) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  // Show loading if we have no articles and are still loading
  if (loading && articles.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="auto" />
      <FlatList
        ref={flatListRef}
        data={articles}
        renderItem={renderNewsCard}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.cardBackground}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={renderEmptyState()}
        ListHeaderComponent={isLoadingNewer ? (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
        ListFooterComponent={isLoadingOlder ? (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: SCREEN_HEIGHT,
  },
  emptyTitle: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingIndicator: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
