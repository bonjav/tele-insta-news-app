# One News Per Page Implementation

## Overview

The DailySnapShorts app is designed to display **exactly one news article per page/screen** with smooth vertical pagination between articles. This provides a focused, distraction-free reading experience similar to social media stories.

## Implementation Details

### Core Architecture

#### FlatList with Paging
- **`pagingEnabled={true}`**: Enables page-by-page scrolling
- **`snapToInterval={SCREEN_HEIGHT}`**: Each page is exactly one screen height
- **`snapToAlignment="start"`**: Articles align to screen top
- **`decelerationRate="fast"`**: Quick snapping between articles

#### Single Article Display
```typescript
// Each NewsCard takes full screen dimensions
container: {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  backgroundColor: colors.background,
  overflow: 'hidden', // Prevents content spillover
}

// FlatList wrapper ensures single article focus
newsCardContainer: {
  width: '100%',
  height: SCREEN_HEIGHT,
  justifyContent: 'center',
  alignItems: 'center',
}
```

### Optimized Rendering

#### Memory Efficiency
- **`maxToRenderPerBatch={1}`**: Renders only one article at a time
- **`windowSize={3}`**: Keeps minimal articles in memory
- **`initialNumToRender={1}`**: Starts with single article
- **`removeClippedSubviews={true}`**: Removes off-screen content

#### Smooth Navigation
- **`bounces={false}`**: Prevents overscroll past article boundaries
- **`itemVisiblePercentThreshold={80}`**: Requires 80% visibility to consider active
- **`minimumViewTime={100}`**: Prevents accidental rapid scrolling

### Article Layout Structure

Each page contains **exactly one complete news article** with:

1. **Image Section** (40% of screen height on mobile)
   - Full-width article image or placeholder
   - Responsive height based on device type

2. **Content Section** (flexible height)
   - DailySnapShorts logo (left)
   - Share button (right)
   - Article title (scrollable if long)
   - Article description (scrollable)

3. **Action Section** (fixed at bottom)
   - "View Full Article" link
   - Above tab navigation

### Responsive Behavior

#### Cross-Device Consistency
- **Mobile Phones**: Portrait orientation, full-screen articles
- **Tablets**: Enhanced spacing, same single-article focus
- **Chromebook/Web**: Consistent with mobile behavior
- **Foldable Devices**: Adapts to narrow/wide modes

#### Screen Size Adaptations
```typescript
// Dynamic sizing based on device
imageHeight: deviceInfo.type === 'phone' 
  ? SCREEN_HEIGHT * 0.40 
  : deviceInfo.type === 'tablet-small'
  ? SCREEN_HEIGHT * 0.35
  : SCREEN_HEIGHT * 0.32
```

### Navigation Patterns

#### Vertical Scrolling
- **Swipe Up**: Navigate to next (older) article
- **Swipe Down**: Navigate to previous (newer) article
- **Pull to Refresh**: Load latest articles
- **Infinite Scroll**: Automatic loading of more articles

#### Content Scrolling
- **Title**: Wraps naturally, fully visible
- **Description**: Scrollable within article bounds
- **No Overlap**: Description scrolling doesn't affect article navigation

### Benefits

#### User Experience
1. **Focused Reading**: One article at a time eliminates distractions
2. **Consistent Layout**: Same structure across all articles
3. **Smooth Navigation**: Natural swipe gestures between articles
4. **Full Content Access**: All text is scrollable and readable

#### Performance
1. **Memory Efficient**: Only renders current + adjacent articles
2. **Fast Loading**: Optimized batch rendering
3. **Smooth Scrolling**: Hardware-accelerated pagination
4. **Battery Friendly**: Minimal off-screen rendering

#### Accessibility
1. **Screen Reader Friendly**: One article context at a time
2. **Touch Optimized**: Large swipe areas for navigation
3. **Consistent Focus**: Clear article boundaries
4. **Responsive Text**: Adapts to accessibility text sizes

### Technical Implementation

#### FlatList Configuration
```typescript
<FlatList
  data={articles}
  renderItem={renderNewsCard}
  pagingEnabled={true}
  snapToInterval={SCREEN_HEIGHT}
  maxToRenderPerBatch={1}
  windowSize={3}
  initialNumToRender={1}
  bounces={false}
  viewabilityConfig={{
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }}
/>
```

#### Article Container
```typescript
const renderNewsCard = ({ item, index }) => (
  <View style={styles.newsCardContainer}>
    <NewsCard article={item} isActive={index === currentIndex} />
  </View>
);
```

### Quality Assurance

#### Testing Matrix
- ✅ **One Article Visible**: Only current article is displayed
- ✅ **Smooth Pagination**: Clean transitions between articles
- ✅ **Content Accessibility**: All text readable within article
- ✅ **Memory Efficiency**: Optimal rendering performance
- ✅ **Cross-Platform**: Consistent on Android, iOS, Web

#### Edge Cases Handled
- Very long articles with extensive text
- Articles with no images
- Network connectivity issues
- Device orientation changes
- Accessibility text size changes

## Usage

The one-news-per-page system works automatically:

1. **Open App**: Displays first article in full screen
2. **Navigate**: Swipe up/down between articles
3. **Read**: Scroll within article content if needed
4. **Refresh**: Pull down to load newer articles
5. **Infinite**: Automatically loads more as you scroll

**Key Feature**: Every user sees exactly one complete news article at a time, ensuring focused reading and consistent experience across all devices. 