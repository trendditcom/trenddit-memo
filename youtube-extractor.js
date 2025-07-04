/**
 * YouTube Content Extractor
 * Extracts video metadata, transcripts, and other content from YouTube pages
 */

class ContentExtractor {
    constructor() {
        this.platform = 'generic';
    }
    
    canExtract(url) {
        return false;
    }
    
    async extract() {
        return {
            platform: this.platform,
            content: '',
            metadata: {},
            mediaUrls: []
        };
    }
}

class YouTubeExtractor extends ContentExtractor {
    constructor() {
        super();
        this.platform = 'youtube';
    }
    
    canExtract(url) {
        const youtubeRegex = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/;
        return youtubeRegex.test(url);
    }
    
    async extract() {
        try {
            const metadata = await this.extractMetadata();
            const transcript = await this.extractTranscript();
            const videoUrl = this.extractVideoUrl();
            
            return {
                platform: this.platform,
                content: transcript.content,
                metadata: {
                    ...metadata,
                    transcriptAvailable: transcript.available,
                    videoUrl: videoUrl
                },
                mediaUrls: videoUrl ? [videoUrl] : []
            };
        } catch (error) {
            console.error('YouTube extraction error:', error);
            return {
                platform: this.platform,
                content: '',
                metadata: {
                    error: error.message,
                    transcriptAvailable: false
                },
                mediaUrls: [],
                error: error.message
            };
        }
    }
    
    async extractMetadata() {
        const metadata = {};
        
        try {
            // Extract video title
            const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title, h1.ytd-watch-metadata');
            if (titleElement) {
                metadata.title = titleElement.textContent?.trim() || '';
            }
            
            // Extract channel name
            const channelElement = document.querySelector('ytd-channel-name a, .ytd-channel-name a, #channel-name a');
            if (channelElement) {
                metadata.author = channelElement.textContent?.trim() || '';
            }
            
            // Extract video duration
            const durationElement = document.querySelector('.ytp-time-duration, .ytd-thumbnail-overlay-time-status-renderer');
            if (durationElement) {
                metadata.duration = durationElement.textContent?.trim() || '';
            }
            
            // Extract view count
            const viewElement = document.querySelector('.view-count, .ytd-video-view-count-renderer, #info-text');
            if (viewElement) {
                metadata.views = viewElement.textContent?.trim() || '';
            }
            
            // Extract description
            const descriptionElement = document.querySelector('#description, ytd-expander #content, .ytd-video-secondary-info-renderer #description');
            if (descriptionElement) {
                metadata.description = descriptionElement.textContent?.trim() || '';
            }
            
            // Extract upload date
            const dateElement = document.querySelector('#info-strings yt-formatted-string, .ytd-video-primary-info-renderer #info-strings yt-formatted-string');
            if (dateElement) {
                metadata.uploadDate = dateElement.textContent?.trim() || '';
            }
            
            // Extract like/dislike counts if available
            const likeElement = document.querySelector('button[aria-label*="like"] #text, ytd-toggle-button-renderer #text');
            if (likeElement) {
                metadata.likes = likeElement.textContent?.trim() || '';
            }
            
            // Extract subscriber count
            const subscriberElement = document.querySelector('#owner-sub-count, ytd-video-owner-renderer #owner-sub-count');
            if (subscriberElement) {
                metadata.subscribers = subscriberElement.textContent?.trim() || '';
            }
            
        } catch (error) {
            console.error('Error extracting metadata:', error);
            metadata.metadataError = error.message;
        }
        
        return metadata;
    }
    
    async extractTranscript() {
        try {
            // First, try to find and click the transcript button
            const transcriptButton = document.querySelector('button[aria-label*="transcript"], button[aria-label*="Transcript"], button[aria-label*="Show transcript"]');
            
            if (transcriptButton) {
                // Click the button to open transcript
                transcriptButton.click();
                
                // Wait for transcript to load
                await this.waitForElements('.ytd-transcript-segment-renderer, ytd-transcript-segment-renderer', 2000);
                
                // Extract transcript segments
                const transcriptSegments = document.querySelectorAll('.ytd-transcript-segment-renderer, ytd-transcript-segment-renderer .segment-text');
                
                if (transcriptSegments.length > 0) {
                    const transcript = Array.from(transcriptSegments)
                        .map(segment => segment.textContent?.trim())
                        .filter(text => text && text.length > 0)
                        .join('\n');
                    
                    return {
                        available: true,
                        content: transcript
                    };
                }
            }
            
            // If no transcript button found or no segments, try alternative selectors
            const alternativeTranscript = document.querySelector('.ytd-transcript-renderer, #transcript');
            if (alternativeTranscript) {
                return {
                    available: true,
                    content: alternativeTranscript.textContent?.trim() || ''
                };
            }
            
            return {
                available: false,
                content: ''
            };
            
        } catch (error) {
            console.error('Error extracting transcript:', error);
            return {
                available: false,
                content: '',
                error: error.message
            };
        }
    }
    
    extractVideoUrl() {
        try {
            const currentUrl = window.location.href;
            const videoId = this.extractVideoId(currentUrl);
            
            if (videoId) {
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
            
            return currentUrl;
        } catch (error) {
            console.error('Error extracting video URL:', error);
            return window.location.href;
        }
    }
    
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }
    
    async waitForElements(selector, timeout = 2000) {
        return new Promise((resolve) => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                resolve(elements);
                return;
            }
            
            const observer = new MutationObserver((mutations) => {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    observer.disconnect();
                    resolve(elements);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                resolve([]);
            }, timeout);
        });
    }
}

// Content script message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractYouTubeContent') {
        const extractor = new YouTubeExtractor();
        
        if (extractor.canExtract(window.location.href)) {
            extractor.extract().then(result => {
                sendResponse({
                    success: true,
                    data: result
                });
            }).catch(error => {
                sendResponse({
                    success: false,
                    error: error.message
                });
            });
        } else {
            sendResponse({
                success: false,
                error: 'Not a YouTube page'
            });
        }
        
        return true; // Keep the message channel open for async response
    }
});

// Auto-extract on page load if this is a YouTube page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtractor);
} else {
    initializeExtractor();
}

function initializeExtractor() {
    const extractor = new YouTubeExtractor();
    if (extractor.canExtract(window.location.href)) {
        console.log('YouTube extractor initialized for:', window.location.href);
        
        // Listen for navigation changes in SPAs
        let lastUrl = window.location.href;
        const observer = new MutationObserver(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                if (extractor.canExtract(lastUrl)) {
                    console.log('YouTube page navigation detected:', lastUrl);
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Export for testing
if (typeof window !== 'undefined') {
    window.YouTubeExtractor = YouTubeExtractor;
    window.ContentExtractor = ContentExtractor;
}