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
} from 'react-native';
import { ExternalLink, Share2, User } from 'lucide-react-native';
import { NewsArticle } from '@/types/news.types';
import { useTheme } from '@/contexts/ThemeContext';

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
      await Share.share({
        message: `${article.title}\n\n${article.description}\n\nRead more: ${article.url}`,
        title: article.title,
        url: article.url,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share article');
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Image Section - 35% of screen */}
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
        
        {/* Source Overlay */}
        <View style={styles.imageOverlay}>
          <View style={styles.metaContainer}>
            <View style={styles.sourceContainer}>
              <User size={14} color="white" />
              <Text style={styles.sourceText}>{article.source.name}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description Section - expanded */}
      <View style={styles.descriptionSection}>
        {/* Share Icon - positioned on the right */}
        <TouchableOpacity style={styles.shareIconContainer} onPress={handleShare}>
          <View style={styles.shareIconBackground}>
            <Share2 size={16} color="white" />
          </View>
        </TouchableOpacity>

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
          <Text style={styles.readMoreText}>Read Full Article</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe Indicators */}
      <View style={styles.indicatorContainer}>
        <View style={styles.swipeIndicator}>
          <Text style={styles.indicatorText}>↑ Swipe up for next</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.background,
  },
  // Image Section - 35% of screen
  imageSection: {
    height: SCREEN_HEIGHT * 0.35,
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
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    padding: 12,
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
    position: 'absolute',
    top: -10,
    right: 0,
    zIndex: 10,
  },
  shareIconBackground: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Description Section - expanded to fill space above bottom bar
  descriptionSection: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    paddingBottom: 100, // Space for link section above bottom bar
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
    bottom: 110, // Just above the 60px bottom bar with small gap
    left: 0,
    right: 0,
    height: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 10, // Ensure it's clickable above other elements
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  // Indicators
  indicatorContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  swipeIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  indicatorText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
  },
});
