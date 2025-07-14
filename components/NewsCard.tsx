import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  Platform,
  ShareContent,
} from 'react-native';
import { ExternalLink, Share2, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NewsArticle } from '@/types/news.types';
import { useTheme } from '@/contexts/ThemeContext';
import * as FileSystem from 'expo-file-system';

// Import notification icon
const notificationIcon = require('@/assets/images/notification-icon.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NewsCardProps {
  article: NewsArticle;
  isActive: boolean;
}

export default function NewsCard({ article, isActive }: NewsCardProps) {
  const [imageError, setImageError] = useState(false);
  const { colors } = useTheme();

  const handleOpenLink = async () => {
    try {
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleShare = async () => {
    try {
      let shareOptions: ShareContent = {
        message: `${article.title}\n\n${article.description}\n\nRead more: ${article.url}`,
        title: article.title,
      };

      // If we have an image URL and no image error occurred, try to share the image
      if (article.image && !imageError) {
        try {
          // Download the image to cache directory
          const filename = `article-${article.id}.jpg`;
          const destinationUri = `${FileSystem.cacheDirectory}${filename}`;
          
          await FileSystem.downloadAsync(
            article.image,
            destinationUri
          );

          // Add the image to share options
          shareOptions = {
            ...shareOptions,
            url: Platform.OS === 'ios' ? destinationUri : `file://${destinationUri}`,
          };

          // Share with image
          await Share.share(shareOptions);

          // Clean up the cached image
          await FileSystem.deleteAsync(destinationUri, { idempotent: true });
        } catch (imageError) {
          console.warn('Failed to share image:', imageError);
          // If image sharing fails, fall back to text-only sharing
          await Share.share(shareOptions);
        }
      } else {
        // If no image or image error, share text only
        await Share.share(shareOptions);
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share article');
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Image Section - Full top portion */}
      <View style={styles.imageSection}>
        {!imageError && article.image ? (
          <Image
            source={{ uri: article.image }}
            style={styles.image}
            resizeMode="cover"
            onError={handleImageError}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📰</Text>
          </View>
        )}
        

      </View>

      {/* Description Section - expanded */}
      <View style={styles.descriptionSection}>
        {/* Share Icon - positioned on the right */}
        <View style={styles.headerContainer}>
          <View style={styles.appNameContainer}>
            <View style={styles.iconContainer}>
              <Image source={notificationIcon} style={styles.appLogo} resizeMode="cover" />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>DailySnapShorts</Text>
          </View>
          <TouchableOpacity style={styles.shareIconContainer} onPress={handleShare}>
            <View style={styles.shareIconBackground}>
              <Share2 size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>
        <Text style={styles.description} numberOfLines={8}>
          {article.description}
        </Text>
      </View>

      {/* Link Section - positioned just above bottom bar */}
      <View style={styles.linkSection}>
        <TouchableOpacity style={styles.readMoreButton} onPress={handleOpenLink}>
          <ExternalLink size={18} color={colors.primary} />
          <Text style={styles.readMoreText}>View Full Article at {article.source.name}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.background,
  },
  // Image Section - Reduced from bottom to give more text space
  imageSection: {
    height: SCREEN_HEIGHT * 0.40,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 60,
    opacity: 0.5,
  },

  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  sourceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Share Icon - positioned on the right
  shareIconContainer: {
    zIndex: 10,
  },
  shareIconBackground: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  // Description Section - expanded to fill space above bottom bar
  descriptionSection: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    paddingBottom: 80, // Adjusted for thinner bottom bar (50px + gap)
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -24,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    marginRight: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  appLogo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    opacity: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    lineHeight: 28,
    marginBottom: 12,
  },
  description: {
    color: colors.secondary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    flex: 1,
  },
  // Link Section - positioned just above bottom bar
  linkSection: {
    position: 'absolute',
    bottom: 60, // Adjusted for thinner bottom bar (50px + 10px gap)
    left: 0,
    right: 0,
    height: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 -1px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  readMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
});
