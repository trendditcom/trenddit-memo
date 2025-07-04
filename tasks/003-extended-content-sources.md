# Task: Extended Content Sources

## Overview
Enable capturing and processing content from YouTube videos, Twitter threads, and other social media platforms directly within the extension.

## Development Tasks

### Phase 1: YouTube Integration
[x] Integrate YouTube content extraction directly into content.js
[x] Implement automatic YouTube detection - show hourglass cursor instead of hover/selection UI
[x] Implement YouTube transcript extraction using video.google.com API with DOM fallback
[x] Extract video metadata (title, author, duration, views, description)
[x] Extract video thumbnail URL from YouTube video ID
[x] Add YouTube-specific content processing in background.js
[x] Create YouTube video thumbnail display in memo detail view and memo list
[x] Add specialized YouTube processing notification ("Processing YouTube Page")
[x] Implement robust JSON parsing for YouTube content across all LLM providers
[x] Add token counting and content truncation for large YouTube transcripts
[x] Test with various YouTube video types (shorts, live streams, regular videos)

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

### Phase 4: Platform-Specific UI Enhancements
[x] Add platform indicators to memo cards
[x] Implement platform-specific preview formatting
[x] Create rich media previews for YouTube videos
[ ] Add thread visualization for Twitter content
[ ] Update export functionality to preserve platform-specific formatting

### Phase 5: Additional Social Media Platforms
[ ] Research and prioritize LinkedIn and Reddit
[ ] Create modular content extractor framework for easy platform additions
[ ] Implement LinkedIn and Reddit platforms
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
5. **YouTube-Specific**: Automatically detect YouTube pages and process without hover/selection UI
6. **API-First Approach**: Use official APIs (video.google.com for transcripts) with DOM parsing as fallback
7. **Automatic Processing**: Show hourglass cursor during YouTube processing instead of interactive selection
8. **Specialized Notifications**: Provide clear user feedback for platform-specific processing
9. **Content Truncation**: Implement token counting and content truncation for large video transcripts
10. **Multi-Provider Support**: Ensure YouTube content works seamlessly with all LLM providers

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
- Users can capture content from YouTube videos with one click (automatic detection)
- YouTube thumbnails are displayed in memo details and lists
- YouTube transcripts are extracted using API with DOM fallback
- Video metadata (title, author, duration, views, description) is captured
- Specialized processing notifications provide clear user feedback
- Large YouTube transcripts are handled with token counting and truncation
- All existing features (chat, tags, export) work with YouTube content
- Performance remains smooth even with large transcript content
- YouTube integration works seamlessly with all LLM providers (Anthropic, OpenAI, Gemini, Ollama)
- Twitter threads are captured and preserved with proper formatting
- At least 3 social media platforms are supported