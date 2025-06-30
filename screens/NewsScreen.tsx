import React, { useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  RefreshControl,
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
    if (settingsState.language && settingsState.location && !loading) {
      await loadMoreNews(settingsState.language, settingsState.location);
    }
  }, [settingsState.language, settingsState.location, loading, loadMoreNews]);

  const renderNewsCard = ({ item, index }: { item: NewsArticle; index: number }) => (
    <NewsCard
      article={item}
      isActive={index === currentIndex}
    />
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>
        {isInitializing ? 'Initializing app...' : 'Loading news articles...'}
      </Text>
      <Text style={styles.loadingSubtext}>
        This may take a moment
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>📰</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Text style={styles.errorSubtext}>Pull down to refresh</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>📰</Text>
      <Text style={styles.emptyText}>No news articles found</Text>
      <Text style={styles.emptySubtext}>
        Try changing your language or location settings
      </Text>
    </View>
  );

  // Show loading while initializing
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  // Show loading if we haven't loaded initial news yet
  if (!hasLoadedInitialNews) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  // Show loading if we have no articles and are still loading
  if (loading && articles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  // Only show error if we're initialized, have loaded initial news, not loading, and have an error
  if (error && articles.length === 0 && isInitialized && hasLoadedInitialNews && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  // Show empty state if we have no articles but no error
  if (articles.length === 0 && isInitialized && hasLoadedInitialNews && !loading && !error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            tintColor="white"
            titleColor="white"
            title="Pull to refresh articles"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorTitle: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
    textAlign: 'center',
  },
  counterContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});
