import React, { useRef, useCallback, useState } from 'react';
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
    state: { articles, loading, error, refreshing, currentIndex },
    dispatch,
    refreshNews,
    loadMoreNews,
  } = useNews();

  const { isInitialized, isInitializing, hasLoadedInitialNews, settingsState } = useSettingsInitialization();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      dispatch({ type: 'SET_CURRENT_INDEX', payload: index });
    }
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    if (settingsState.language && settingsState.location) {
      await refreshNews(settingsState.language, settingsState.location);
    }
  }, [settingsState.language, settingsState.location, refreshNews]);

  const handleLoadMore = useCallback(async () => {
    if (settingsState.language && settingsState.location && !loading && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await loadMoreNews(settingsState.language, settingsState.location, 'down');
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [settingsState.language, settingsState.location, loading, loadMoreNews, isLoadingMore]);

  const handleLoadPrevious = useCallback(async () => {
    if (settingsState.language && settingsState.location && !loading && !isLoadingPrevious) {
      setIsLoadingPrevious(true);
      try {
        await loadMoreNews(settingsState.language, settingsState.location, 'up');
      } finally {
        setIsLoadingPrevious(false);
      }
    }
  }, [settingsState.language, settingsState.location, loading, loadMoreNews, isLoadingPrevious]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    
    // Check if we're at the top
    if (contentOffset.y <= 0 && !refreshing) {
      handleLoadPrevious();
    }
    
    // Check if we're at the bottom
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 20) {
      handleLoadMore();
    }
  }, [handleLoadMore, handleLoadPrevious, refreshing]);

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
        ListHeaderComponent={isLoadingPrevious ? (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
        ListFooterComponent={isLoadingMore ? (
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
