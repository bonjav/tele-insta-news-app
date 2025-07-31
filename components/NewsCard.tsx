import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
  ShareContent,
  ScrollView,
} from 'react-native';
import { ExternalLink, Share2, User } from 'lucide-react-native';
import { NewsArticle } from '@/types/news.types';
import { useTheme } from '@/contexts/ThemeContext';
import { AlertUtils } from '@/util/alertUtils';
import { getResponsiveLayout, getDeviceStyles, getDeviceInfo, getAvailableContentHeight } from '@/util/responsiveUtils';
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
  const responsiveLayout = getResponsiveLayout();
  const deviceStyles = getDeviceStyles();
  const deviceInfo = getDeviceInfo();
  const availableContentHeight = getAvailableContentHeight();

  const handleOpenLink = async () => {
    try {
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      } else {
        AlertUtils.logError('LinkOpening', 'Cannot open this link', article.url);
        AlertUtils.showError('Cannot open this link');
      }
    } catch (error) {
      AlertUtils.logError('LinkOpening', 'Failed to open link', error);
      AlertUtils.showError('Failed to open link');
    }
  };

  const handleShare = async () => {
    try {
      let shareOptions: ShareContent = {
        message: `📰 News shared from DailySnapShorts\n\n${article.title}\n\n${article.description}\n\n🔗 Read the full article here:\n${article.url}\n\n📱 Get more news on DailySnapShorts`,
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
      AlertUtils.logError('ArticleSharing', 'Failed to share article', error);
      AlertUtils.showError('Failed to share article');
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const styles = createStyles(colors, responsiveLayout, deviceStyles, availableContentHeight);

  return (
    <View style={styles.container}>
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
            <Text 
              style={[styles.appName, { color: colors.text }]}
              numberOfLines={undefined}
              ellipsizeMode="tail"
            >
              DailySnapShorts
            </Text>
          </View>
          <TouchableOpacity style={styles.shareIconContainer} onPress={handleShare}>
            <View style={styles.shareIconBackground}>
              <Share2 size={responsiveLayout.iconSize.small} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <Text 
          style={styles.title}
          numberOfLines={undefined}
          ellipsizeMode="tail"
        >
          {article.title}
        </Text>
        <ScrollView 
          style={styles.descriptionScrollContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          bounces={false}
          contentContainerStyle={styles.descriptionContent}
        >
          <Text 
            style={styles.description}
            numberOfLines={undefined}
            ellipsizeMode="tail"
          >
            {article.description}
          </Text>
        </ScrollView>
      </View>

      {/* Link Section - positioned just above bottom bar */}
      <View style={styles.linkSection}>
        <TouchableOpacity style={styles.readMoreButton} onPress={handleOpenLink}>
          <ExternalLink size={responsiveLayout.iconSize.medium} color={colors.primary} />
          <Text style={styles.readMoreText}>View Full Article at {article.source.name}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any, layout: any, deviceStyles: any, availableContentHeight: number) => StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.background,
    overflow: 'hidden',
    position: 'relative', // Ensure proper positioning
  },
  // Image Section - Responsive height based on device type
  imageSection: {
    height: layout.imageHeight,
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
    fontSize: deviceStyles.textStyles.headline.fontSize * 2.5,
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
    paddingHorizontal: layout.contentPadding / 2,
    paddingVertical: 4,
    borderRadius: 15,
    ...deviceStyles.cardShadow,
  },
  sourceText: {
    color: '#FFFFFF',
    fontSize: deviceStyles.textStyles.caption.fontSize,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Share Icon - positioned on the right with responsive sizing
  shareIconContainer: {
    zIndex: 10,
    flexShrink: 0, // Prevent share button from shrinking
    alignSelf: 'center', // Center vertically within container
  },
  shareIconBackground: {
    width: layout.shareButtonSize,
    height: layout.shareButtonSize,
    backgroundColor: colors.primary,
    borderRadius: layout.shareButtonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...deviceStyles.cardShadow,
  },
  // Description Section - calculated height to prevent overflow
  descriptionSection: {
    height: availableContentHeight,
    padding: layout.contentPadding,
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    flex: 1,
    flexDirection: 'column',
    // Small device optimization
    ...(layout.contentPadding < 16 && {
      paddingHorizontal: layout.contentPadding * 0.8,
      paddingVertical: layout.contentPadding * 0.6,
    }),
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.contentPadding * 0.8,
    marginTop: Math.max(layout.headerMarginTop, -layout.contentPadding * 0.8), // Prevent excessive negative margin
    width: '100%',
    minHeight: layout.logoSize,
    paddingTop: 4, // Add small padding to ensure icons are never cut
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: layout.contentPadding * 0.5,
    minWidth: 0, // Allow shrinking below content size
    paddingVertical: 2, // Small vertical padding to prevent text cutoff
  },
  iconContainer: {
    width: layout.logoSize,
    height: layout.logoSize,
    borderRadius: layout.logoSize / 2,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    marginRight: layout.contentPadding / 2.5,
    flexShrink: 0, // Prevent icon from shrinking
    alignSelf: 'center', // Center vertically within container
    ...deviceStyles.cardShadow,
  },
  appLogo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: deviceStyles.textStyles.appName.fontSize,
    fontFamily: 'Inter-Bold',
    opacity: 0.8,
    flexShrink: 1,
    maxWidth: '100%',
    textAlign: 'left',
    // Small device specific adjustments
    ...(layout.contentPadding < 16 && {
      fontSize: deviceStyles.textStyles.appName.fontSize * 0.9,
    }),
  },
  title: {
    color: colors.text,
    fontSize: deviceStyles.textStyles.headline.fontSize,
    fontFamily: 'Inter-Bold',
    lineHeight: deviceStyles.textStyles.headline.lineHeight,
    marginBottom: layout.contentPadding * 0.4, // Reduced margin for small screens
    width: '100%',
    flexShrink: 1,
    textAlign: 'left',
    paddingHorizontal: 0,
    // Remove maxHeight for better wrapping on small devices
    ...(layout.contentPadding < 16 && {
      fontSize: deviceStyles.textStyles.headline.fontSize * 0.9,
      lineHeight: deviceStyles.textStyles.headline.lineHeight * 0.9,
      marginBottom: layout.contentPadding * 0.3,
    }),
  },
  descriptionScrollContainer: {
    flex: 1,
    width: '100%',
    flexShrink: 1,
    flexGrow: 1,
    // Remove maxHeight constraint for small devices to allow better text flow
    ...(layout.contentPadding >= 16 && {
      maxHeight: availableContentHeight * 0.7,
    }),
  },
  descriptionContent: {
    paddingBottom: 10, // Small padding at bottom of scroll content
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  description: {
    color: colors.secondary,
    fontSize: deviceStyles.textStyles.body.fontSize,
    fontFamily: 'Inter-Regular',
    lineHeight: deviceStyles.textStyles.body.lineHeight,
    width: '100%',
    paddingRight: 4, // Small padding to prevent text touching edge
    flexShrink: 1,
    textAlign: 'left',
    paddingHorizontal: 0,
    // Small device specific adjustments
    ...(layout.contentPadding < 16 && {
      fontSize: deviceStyles.textStyles.body.fontSize * 0.95,
      lineHeight: deviceStyles.textStyles.body.lineHeight * 0.95,
      paddingRight: 2,
    }),
  },
  // Link Section - positioned just above bottom bar with responsive sizing
  linkSection: {
    position: 'absolute',
    bottom: layout.linkSectionBottom,
    left: 0,
    right: 0,
    height: layout.linkSectionHeight,
    paddingHorizontal: layout.contentPadding,
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
    fontSize: deviceStyles.textStyles.caption.fontSize,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    flexShrink: 1,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
