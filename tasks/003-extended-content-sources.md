# Task: Extended Content Sources

## Overview
Enable capturing and processing content from YouTube videos, Twitter threads, and other social media platforms directly within the extension.

## Development Tasks

### Phase 1: YouTube Integration
[x] Create youtube-extractor.js content script for YouTube pages
[x] Implement YouTube transcript extraction using YouTube's API or DOM parsing
[x] Extract video metadata (title, author, duration, views, description)
[x] Add YouTube-specific content processing in background.js
[x] Create YouTube video icon and styling for memo display
[ ] Test with various YouTube video types (shorts, live streams, regular videos)

### Phase 2: Twitter/X Integration
[ ] Create twitter-extractor.js content script for Twitter/X pages
[ ] Implement thread detection and extraction logic
[ ] Handle quoted tweets and embedded media
[ ] Extract tweet metadata (author, timestamp, engagement metrics)
[ ] Add Twitter-specific content processing and formatting
[ ] Create Twitter icon and styling for memo display
[ ] Test with different thread types (single tweets, long threads, conversations)

### Phase 3: Core Extension Updates
[x] Update manifest.json with new content script matches for YouTube and Twitter domains
[x] Extend the content capture flow to detect and handle platform-specific content
[x] Add platform detection logic in background.js
[x] Update memo data structure to include platform-specific metadata
[x] Ensure all LLM providers can process extended content types
[ ] Add platform filtering to memo list view

### Phase 4: Platform-Specific UI Enhancements
[x] Add platform indicators to memo cards
[x] Implement platform-specific preview formatting
[x] Create rich media previews for YouTube videos
[ ] Add thread visualization for Twitter content
[ ] Update export functionality to preserve platform-specific formatting

### Phase 5: Additional Social Media Platforms
[ ] Research and prioritize other platforms (Reddit, LinkedIn, Instagram)
[ ] Create modular content extractor framework for easy platform additions
[ ] Implement at least one additional platform as proof of concept
[ ] Document the process for adding new platforms

### Phase 6: Testing and Polish
[ ] Test cross-origin content extraction with all platforms
[ ] Verify compatibility with all LLM providers
[ ] Test performance with large threads/transcripts
[ ] Add error handling for platform-specific edge cases
[ ] Update user documentation and help text

## Implementation Instructions

### Architecture Guidelines
1. **Modular Design**: Create separate content extractors for each platform that implement a common interface
2. **Progressive Enhancement**: Ensure basic text capture works even if platform-specific features fail
3. **Performance**: Implement lazy loading for large content (long YouTube transcripts, Twitter threads)
4. **Privacy**: Respect user privacy settings and platform terms of service

### Technical Considerations
1. **Content Scripts**: Each platform needs its own content script with specific DOM selectors
2. **API Integration**: Where possible, use official APIs (YouTube Data API) with fallback to DOM parsing
3. **Rate Limiting**: Implement appropriate delays and throttling for content extraction
4. **Storage**: Consider storage limits for large transcripts and implement compression if needed

### Content Extractor Interface
```javascript
class ContentExtractor {
  constructor() {
    this.platform = 'generic';
  }
  
  canExtract(url) {
    // Return true if this extractor can handle the URL
  }
  
  async extract() {
    // Return structured content object
    return {
      platform: this.platform,
      content: '',
      metadata: {},
      mediaUrls: []
    };
  }
}
```

### Testing Strategy
1. Create test fixtures for each platform with various content types
2. Test with real-world examples (viral tweets, popular YouTube videos)
3. Verify LLM processing works correctly with extended content
4. Test edge cases (deleted content, private videos, protected tweets)

### Security Considerations
1. Sanitize all extracted content to prevent XSS
2. Validate URLs before processing
3. Handle authentication gracefully (some content may require login)
4. Respect robots.txt and platform terms of service

## Success Criteria
- Users can capture content from YouTube videos with one click
- Twitter threads are captured and preserved with proper formatting
- All existing features (chat, tags, export) work with new content types
- Performance remains smooth even with large content pieces
- At least 3 social media platforms are supported