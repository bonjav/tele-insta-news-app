import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export interface DeviceInfo {
  type: 'phone' | 'tablet-small' | 'tablet-large' | 'chromebook' | 'desktop';
  width: number;
  height: number;
  isLandscape: boolean;
  scaleFactor: number;
}

export const getDeviceInfo = (): DeviceInfo => {
  const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
  const smallerDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
  const largerDimension = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
  
  let type: DeviceInfo['type'] = 'phone';
  let scaleFactor = 1;

  // Device type classification
  if (Platform.OS === 'web') {
    // Chromebook detection (typically 1366x768 or similar ratios)
    if (smallerDimension >= 768 && largerDimension >= 1200) {
      type = 'chromebook';
      scaleFactor = 1.2;
    } else if (smallerDimension >= 600) {
      type = 'tablet-large';
      scaleFactor = 1.1;
    } else {
      type = 'phone';
      // Scale down for very small web screens
      scaleFactor = smallerDimension < 320 ? 0.85 : 1;
    }
  } else {
    // Mobile/tablet classification based on screen size
    if (smallerDimension >= 768) {
      // 10+ inch tablets
      type = 'tablet-large';
      scaleFactor = 1.3;
    } else if (smallerDimension >= 600) {
      // 7-10 inch tablets
      type = 'tablet-small';
      scaleFactor = 1.15;
    } else {
      // Phones - enhanced classification for better consistency
      type = 'phone';
      // Special handling for foldable phones and very narrow screens
      if (smallerDimension < 280) {
        scaleFactor = 0.8; // Galaxy Fold closed, very narrow screens
      } else if (smallerDimension < 320) {
        scaleFactor = 0.85; // Very small phones
      } else if (smallerDimension < 360) {
        scaleFactor = 0.92; // Small phones (iPhone 12 mini, etc.)
      } else if (smallerDimension < 390) {
        scaleFactor = 0.96; // iPhone 12 Pro, similar devices
      } else {
        scaleFactor = 1; // Larger phones (iPhone Pro Max, etc.)
      }
    }
  }

  return {
    type,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isLandscape,
    scaleFactor,
  };
};

// Responsive scaling functions
export const responsiveScale = (size: number): number => {
  const deviceInfo = getDeviceInfo();
  return Math.round(size * deviceInfo.scaleFactor);
};

export const responsiveFontSize = (size: number): number => {
  const deviceInfo = getDeviceInfo();
  // Slightly less aggressive scaling for fonts
  const fontScaleFactor = 1 + (deviceInfo.scaleFactor - 1) * 0.7;
  return Math.round(size * fontScaleFactor);
};

// Layout-specific responsive values
export const getResponsiveLayout = () => {
  const deviceInfo = getDeviceInfo();
  
  // Adjust padding for consistent layout across all devices
  const getContentPadding = () => {
    if (deviceInfo.type === 'phone') {
      if (deviceInfo.width < 280) {
        return 8; // Galaxy Fold closed, very narrow
      } else if (deviceInfo.width < 320) {
        return 12; // Very small screens
      } else if (deviceInfo.width < 360) {
        return 14; // Small screens (iPhone 12 mini)
      } else if (deviceInfo.width < 390) {
        return 16; // iPhone 12 Pro size
      } else {
        return 18; // Larger phones
      }
    }
    return responsiveScale(24); // Tablets
  };
  
  // Check if device is iPad (common iPad dimensions)
  const isIpad = () => {
    const smallerDim = Math.min(deviceInfo.width, deviceInfo.height);
    const largerDim = Math.max(deviceInfo.width, deviceInfo.height);
    
    // iPad Mini: 768×1024, 810×1080
    // iPad Air: 820×1180, 834×1194
    return (smallerDim >= 768 && smallerDim <= 834) && 
           (largerDim >= 1024 && largerDim <= 1194);
  };
  
  // Get safe header margin for tablets to prevent text cutoff
  const getHeaderMarginTop = () => {
    if (deviceInfo.type === 'phone') {
      return -getContentPadding() * 1.2; // Original behavior for phones
    } else if (isIpad()) {
      return 0; // No negative margin for iPads to prevent icon cutoff
    } else {
      return -getContentPadding() * 0.3; // Very safe margin for other tablets
    }
  };
  
  return {
    // NewsCard proportions - adjusted for small devices to fit without scrolling
    imageHeight: deviceInfo.type === 'phone' 
      ? (deviceInfo.width < 360 ? SCREEN_HEIGHT * 0.32 : SCREEN_HEIGHT * 0.38) 
      : deviceInfo.type === 'tablet-small'
      ? SCREEN_HEIGHT * 0.35
      : SCREEN_HEIGHT * 0.32,
    
    contentPadding: getContentPadding(),
    headerMarginTop: getHeaderMarginTop(), // New safe margin calculation
    
    tabBarHeight: deviceInfo.type === 'phone' 
      ? 50 
      : responsiveScale(60),
    
    sidebarWidth: deviceInfo.type === 'chromebook' 
      ? Math.min(400, SCREEN_WIDTH * 0.35)
      : deviceInfo.type === 'tablet-large'
      ? Math.min(350, SCREEN_WIDTH * 0.4)
      : SCREEN_WIDTH * 0.8,
      
    // Icon sizes
    iconSize: {
      small: responsiveScale(16),
      medium: responsiveScale(20),
      large: responsiveScale(24),
    },
    
    // Logo and share button sizes in NewsCard
    logoSize: responsiveScale(28),
    shareButtonSize: responsiveScale(28),
    
    // Bottom spacing adjustments - reduced for small devices
    linkSectionBottom: deviceInfo.type === 'phone' 
      ? (deviceInfo.width < 360 ? 50 : 60)
      : responsiveScale(70),
    linkSectionHeight: deviceInfo.width < 360 ? responsiveScale(40) : responsiveScale(50),
  };
};

// Utility to check if device should use tablet/desktop-like behavior
export const isTabletOrLarger = (): boolean => {
  const deviceInfo = getDeviceInfo();
  return ['tablet-small', 'tablet-large', 'chromebook'].includes(deviceInfo.type);
};

// Utility for conditional styling based on device type
export const getDeviceStyles = () => {
  const deviceInfo = getDeviceInfo();
  const layout = getResponsiveLayout();
  
  return {
    // Shadow styles that scale appropriately
    cardShadow: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: responsiveScale(2) },
        shadowOpacity: 0.1,
        shadowRadius: responsiveScale(4),
      },
      android: {
        elevation: responsiveScale(4),
      },
      web: {
        boxShadow: `0 ${responsiveScale(2)}px ${responsiveScale(8)}px rgba(0, 0, 0, 0.1)`,
      },
    }),
    
    sidebarShadow: Platform.select({
      web: {
        boxShadow: `${responsiveScale(2)}px 0 ${responsiveScale(10)}px rgba(0, 0, 0, 0.25)`,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: responsiveScale(2), height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: responsiveScale(10),
        elevation: responsiveScale(10),
      },
    }),
    
    // Responsive text styles with optimized line heights
    textStyles: getConsistentTextStyles(),
  };
}; 

// Utility to check if screen is very narrow (needs special handling)
export const isVeryNarrowScreen = (): boolean => {
  const deviceInfo = getDeviceInfo();
  return deviceInfo.width < 360;
};

// Get minimum safe padding for text containers
export const getMinSafePadding = (): number => {
  const deviceInfo = getDeviceInfo();
  if (deviceInfo.width < 320) {
    return 8; // Minimal padding for very small screens
  } else if (deviceInfo.width < 360) {
    return 12; // Small padding for narrow screens
  }
  return 16; // Standard minimum padding
}; 

// Get optimized line height for better text readability
export const getOptimizedLineHeight = (fontSize: number): number => {
  const deviceInfo = getDeviceInfo();
  // Progressive line height reduction for smaller screens
  if (deviceInfo.width < 280) {
    return Math.round(fontSize * 1.2); // Very tight for Galaxy Fold closed
  } else if (deviceInfo.width < 320) {
    return Math.round(fontSize * 1.25); // Tight for very small screens
  } else if (deviceInfo.width < 360) {
    return Math.round(fontSize * 1.3); // Slightly tighter for small screens
  }
  return Math.round(fontSize * 1.4); // Standard line height
};

// Get consistent text styles for all components
export const getConsistentTextStyles = () => {
  const deviceInfo = getDeviceInfo();
  
  // Adjust base font sizes for very small devices
  let baseHeadlineSize = 22;
  let baseBodySize = 16;
  let baseCaptionSize = 14;
  let baseAppNameSize = 14;
  
  // Progressive font size reduction for smaller screens
  if (deviceInfo.width < 280) {
    // Galaxy Fold closed - very compact sizes
    baseHeadlineSize = 18;
    baseBodySize = 14;
    baseCaptionSize = 12;
    baseAppNameSize = 12;
  } else if (deviceInfo.width < 320) {
    // Very small phones - compact sizes
    baseHeadlineSize = 19;
    baseBodySize = 15;
    baseCaptionSize = 13;
    baseAppNameSize = 13;
  } else if (deviceInfo.width < 360) {
    // Small phones - slightly reduced sizes
    baseHeadlineSize = 20;
    baseBodySize = 15;
    baseCaptionSize = 13;
    baseAppNameSize = 13;
  }
  
  return {
    headline: {
      fontSize: responsiveFontSize(baseHeadlineSize),
      lineHeight: getOptimizedLineHeight(responsiveFontSize(baseHeadlineSize)),
    },
    body: {
      fontSize: responsiveFontSize(baseBodySize),
      lineHeight: getOptimizedLineHeight(responsiveFontSize(baseBodySize)),
    },
    caption: {
      fontSize: responsiveFontSize(baseCaptionSize),
      lineHeight: getOptimizedLineHeight(responsiveFontSize(baseCaptionSize)),
    },
    appName: {
      fontSize: responsiveFontSize(baseAppNameSize),
      lineHeight: getOptimizedLineHeight(responsiveFontSize(baseAppNameSize)),
    },
  };
}; 

// Calculate available content height to prevent scrolling
export const getAvailableContentHeight = () => {
  const deviceInfo = getDeviceInfo();
  const layout = getResponsiveLayout();
  
  // Total height minus image, link section, and tab bar
  const availableHeight = SCREEN_HEIGHT - layout.imageHeight - layout.linkSectionHeight - layout.tabBarHeight;
  
  // Reserve space for header container, padding, and margins
  // Account for: logoSize + contentPadding (top/bottom) + marginBottom + safe space for marginTop
  const headerSpace = layout.logoSize + (layout.contentPadding * 1.8) + Math.abs(layout.headerMarginTop * 0.5);
  const contentHeight = availableHeight - headerSpace;
  
  return Math.max(contentHeight, 100); // Minimum 100px for content
};

// Get optimized proportions for small screens to fit without scrolling
export const getScreenFitLayout = () => {
  const deviceInfo = getDeviceInfo();
  const isSmallScreen = deviceInfo.width < 360 || deviceInfo.height < 640;
  
  if (isSmallScreen) {
    return {
      imageHeightRatio: 0.30,     // Reduced from 0.40
      contentPaddingRatio: 0.6,   // Reduced padding
      headerSpaceRatio: 0.08,     // Compact header
      linkSectionRatio: 0.06,     // Smaller link section
    };
  }
  
  return {
    imageHeightRatio: 0.38,
    contentPaddingRatio: 1,
    headerSpaceRatio: 0.10,
    linkSectionRatio: 0.08,
  };
}; 