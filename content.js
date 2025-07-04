// Check if script is already initialized
if (!window.avnamMemoInitialized) {
    window.avnamMemoInitialized = true;
    
    // Initialize global state
    window.avnamMemo = {
        isHighlightMode: false,
        highlightedElement: null
    };

    // Initialize the content script
    function initialize() {
        // Add styles for highlighting
        const style = document.createElement('style');
        style.textContent = `
            .highlight-outline {
                outline: 2px solid #34D399 !important;
                outline-offset: 2px;
                background-color: rgba(229, 231, 235, 0.2) !important;
                transition: all 0.2s ease;
                position: relative !important;
                z-index: 2147483647 !important;
            }
            .highlight-outline::before {
                content: 'Select Content';
                position: absolute;
                top: -24px;
                left: -2px;
                background-color: #065F46;
                color: white;
                padding: 2px 8px;
                font-size: 11px;
                border-radius: 4px;
                font-family: system-ui, -apple-system, sans-serif;
                z-index: 2147483647;
            }
        `;
        document.head.appendChild(style);
        console.log('Trenddit Memo content script initialized');
    }

    // Listen for messages from the side panel
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Received message:', request);
        if (request.action === 'toggleHighlightMode') {
            // Check if this is a YouTube page
            if (isYouTubePage() && request.enabled) {
                // For YouTube pages, immediately process without hover/selection
                console.log('YouTube page detected - starting automatic processing');
                document.body.style.cursor = 'wait'; // Set hourglass cursor
                
                // Notify user that YouTube is being processed
                chrome.runtime.sendMessage({
                    action: 'savingMemo',
                    message: 'Processing YouTube Page - Hover selection is deactivated, processing content automatically'
                });
                
                // Process YouTube content immediately
                handleYouTubeContent();
                sendResponse({ success: true });
                return;
            }
            
            window.avnamMemo.isHighlightMode = request.enabled;
            document.body.style.cursor = window.avnamMemo.isHighlightMode ? 'crosshair' : 'default';
            
            // Clear any existing highlights when exiting highlight mode
            if (!window.avnamMemo.isHighlightMode && window.avnamMemo.highlightedElement) {
                window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
                window.avnamMemo.highlightedElement = null;
            }
            
            sendResponse({ success: true });
        } else if (request.action === 'extractYouTubeContent') {
            // Handle YouTube content extraction directly
            if (isYouTubePage()) {
                extractYouTubeContent().then(result => {
                    sendResponse({
                        success: true,
                        data: result
                    });
                }).catch(error => {
                    console.error('YouTube extraction error:', error);
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

    // Add mouseover effect for elements
    document.addEventListener('mouseover', (e) => {
        if (!window.avnamMemo.isHighlightMode) return;
        
        if (window.avnamMemo.highlightedElement) {
            window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
        }
        
        window.avnamMemo.highlightedElement = e.target;
        e.target.classList.add('highlight-outline');
        e.stopPropagation();
    });

    document.addEventListener('mouseout', (e) => {
        if (!window.avnamMemo.isHighlightMode || !window.avnamMemo.highlightedElement) return;
        window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
    });

    // Handle click on highlighted element
    document.addEventListener('click', (e) => {
        if (!window.avnamMemo.isHighlightMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target;
        console.log('Selected element:', element);
        
        // Remove hover outline
        if (window.avnamMemo.highlightedElement) {
            window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
            window.avnamMemo.highlightedElement = null;
        }
        
        // Clone the element to strip inline styles and scripts
        const cleanElement = element.cloneNode(true);
        
        // Function to clean content
        function cleanContent(node) {
            // Remove unwanted elements
            const unwantedTags = ['script', 'style', 'link', 'meta', 'noscript', 'iframe', 'object', 'embed'];
            unwantedTags.forEach(tag => {
                const elements = node.getElementsByTagName(tag);
                [...elements].forEach(el => el.remove());
            });
            
            // Remove all comments
            const iterator = document.createNodeIterator(node, NodeFilter.SHOW_COMMENT);
            let currentNode;
            while (currentNode = iterator.nextNode()) {
                currentNode.parentNode.removeChild(currentNode);
            }
            
            // Clean all elements
            const allElements = node.getElementsByTagName('*');
            [...allElements].forEach(el => {
                // Remove all attributes except a few essential ones
                const allowedAttributes = ['href', 'src', 'alt', 'title'];
                [...el.attributes].forEach(attr => {
                    if (!allowedAttributes.includes(attr.name)) {
                        el.removeAttribute(attr.name);
                    }
                });
                
                // Remove empty elements that don't add value
                const emptyTags = ['div', 'span', 'p', 'section', 'article'];
                if (emptyTags.includes(el.tagName.toLowerCase()) && 
                    !el.textContent.trim() && 
                    !el.querySelector('img')) {
                    el.remove();
                }
            });
            
            // Clean whitespace and normalize text
            node.innerHTML = node.innerHTML
                .replace(/(\s{2,}|\n|\t|\r)/g, ' ')
                .replace(/>\s+</g, '><')
                .trim();
            
            return node;
        }
        
        // Clean the content
        const cleanedElement = cleanContent(cleanElement);
        
        const memoData = {
            url: window.location.href,
            favicon: document.querySelector('link[rel="icon"]')?.href || `${window.location.origin}/favicon.ico`,
            timestamp: new Date().toISOString(),
            rawHtml: cleanedElement.innerHTML
        };
        
        console.log('Sending memo data:', memoData);
        
        // Notify that saving is starting
        chrome.runtime.sendMessage({
            action: 'savingMemo'
        });
        
        // Check if this is a YouTube page and handle accordingly
        if (isYouTubePage()) {
            // For YouTube pages, extract video content instead of selected element
            handleYouTubeContent();
        } else {
            // Send the data to the background script
            chrome.runtime.sendMessage({
                action: 'processMemo',
                data: memoData
            }, (response) => {
                if (!response) {
                    console.error('No response received from background script');
                    return;
                }
                
                if (response.success) {
                    // Reset highlight mode and remove selection effect
                    window.avnamMemo.isHighlightMode = false;
                    document.body.style.cursor = 'default';
                    
                    if (window.avnamMemo.highlightedElement) {
                        window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
                        window.avnamMemo.highlightedElement = null;
                    }
                } else {
                    console.error('Failed to process memo:', response.error || 'Unknown error');
                    alert('Failed to save memo. Please try again.');
                }
            });
        }
    });

    // YouTube-specific helper functions
    function isYouTubePage() {
        return window.location.hostname.includes('youtube.com') || 
               window.location.hostname.includes('youtu.be') || 
               window.location.hostname.includes('youtube-nocookie.com');
    }

    function handleYouTubeContent() {
        // Extract YouTube content directly
        extractYouTubeContent().then(result => {
            // Send YouTube data to background script
            chrome.runtime.sendMessage({
                action: 'processYouTubeMemo',
                data: { success: true, data: result }
            }, (memoResponse) => {
                // Always reset cursor regardless of response
                document.body.style.cursor = 'default';
                
                if (!memoResponse) {
                    console.error('No response received from background script');
                    return;
                }
                
                if (memoResponse.success) {
                    // Reset highlight mode and remove selection effect
                    window.avnamMemo.isHighlightMode = false;
                    
                    if (window.avnamMemo.highlightedElement) {
                        window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
                        window.avnamMemo.highlightedElement = null;
                    }
                } else {
                    console.error('Failed to process YouTube memo:', memoResponse.error || 'Unknown error');
                    alert('Failed to save YouTube memo. Please try again.');
                }
            });
        }).catch(error => {
            // Reset cursor on error
            document.body.style.cursor = 'default';
            console.error('Failed to extract YouTube content:', error.message);
            alert('Failed to extract YouTube content. Please try again.');
        });
    }

    // YouTube content extraction function
    async function extractYouTubeContent() {
        try {
            const metadata = await extractYouTubeMetadata();
            const transcript = await extractYouTubeTranscript();
            const videoUrl = extractYouTubeVideoUrl();
            
            return {
                platform: 'youtube',
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
                platform: 'youtube',
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

    async function extractYouTubeMetadata() {
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
            
            // Extract video thumbnail
            const videoId = extractYouTubeVideoId(window.location.href);
            if (videoId) {
                // YouTube provides thumbnails in various qualities
                metadata.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                // Fallback to lower quality if maxresdefault doesn't exist
                metadata.thumbnailFallbacks = [
                    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
                    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                ];
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

    async function extractYouTubeTranscript() {
        try {
            const videoId = extractYouTubeVideoId(window.location.href);
            
            if (!videoId) {
                return {
                    available: false,
                    content: '',
                    error: 'Could not extract video ID'
                };
            }
            
            console.log('Fetching transcript for video:', videoId);
            
            // Use video.google.com API to get transcript over HTTPS
            const transcriptUrl = `https://video.google.com/timedtext?lang=en&v=${videoId}`;
            
            try {
                // Fetch the transcript using the API
                const response = await fetch(transcriptUrl);
                
                if (!response.ok) {
                    console.log('Transcript not available from API, trying alternate languages');
                    // Try alternate language codes if English is not available
                    const altLangs = ['en-US', 'en-GB'];
                    for (const lang of altLangs) {
                        const altUrl = `https://video.google.com/timedtext?lang=${lang}&v=${videoId}`;
                        const altResponse = await fetch(altUrl);
                        if (altResponse.ok) {
                            const xmlText = await altResponse.text();
                            const transcript = parseTranscriptXML(xmlText);
                            return {
                                available: true,
                                content: transcript,
                                language: lang
                            };
                        }
                    }
                    
                    // If API doesn't work, fall back to DOM parsing
                    return await extractTranscriptFromDOM();
                }
                
                const xmlText = await response.text();
                const transcript = parseTranscriptXML(xmlText);
                
                return {
                    available: true,
                    content: transcript,
                    language: 'en'
                };
                
            } catch (apiError) {
                console.log('API transcript fetch failed, falling back to DOM parsing:', apiError);
                // Fall back to DOM parsing if API fails
                return await extractTranscriptFromDOM();
            }
            
        } catch (error) {
            console.error('Error extracting transcript:', error);
            return {
                available: false,
                content: '',
                error: error.message
            };
        }
    }
    
    // Helper function to parse transcript XML
    function parseTranscriptXML(xmlText) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlText, 'text/xml');
            const textElements = doc.querySelectorAll('text');
            
            const transcript = Array.from(textElements)
                .map(element => {
                    const text = element.textContent?.trim() || '';
                    // Decode HTML entities
                    const textarea = document.createElement('textarea');
                    textarea.innerHTML = text;
                    return textarea.value;
                })
                .filter(text => text.length > 0)
                .join(' ');
            
            return transcript;
        } catch (error) {
            console.error('Error parsing transcript XML:', error);
            return '';
        }
    }
    
    // Fallback function to extract transcript from DOM
    async function extractTranscriptFromDOM() {
        try {
            // Try to find and click the transcript button
            const transcriptButton = document.querySelector('button[aria-label*="transcript"], button[aria-label*="Transcript"], button[aria-label*="Show transcript"]');
            
            if (transcriptButton) {
                // Click the button to open transcript
                transcriptButton.click();
                
                // Wait for transcript to load
                await waitForElements('.ytd-transcript-segment-renderer, ytd-transcript-segment-renderer', 2000);
                
                // Extract transcript segments
                const transcriptSegments = document.querySelectorAll('.ytd-transcript-segment-renderer, ytd-transcript-segment-renderer .segment-text');
                
                if (transcriptSegments.length > 0) {
                    const transcript = Array.from(transcriptSegments)
                        .map(segment => segment.textContent?.trim())
                        .filter(text => text && text.length > 0)
                        .join('\n');
                    
                    return {
                        available: true,
                        content: transcript,
                        source: 'DOM'
                    };
                }
            }
            
            return {
                available: false,
                content: '',
                source: 'DOM'
            };
            
        } catch (error) {
            console.error('Error extracting transcript from DOM:', error);
            return {
                available: false,
                content: '',
                error: error.message,
                source: 'DOM'
            };
        }
    }

    function extractYouTubeVideoUrl() {
        try {
            const currentUrl = window.location.href;
            const videoId = extractYouTubeVideoId(currentUrl);
            
            if (videoId) {
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
            
            return currentUrl;
        } catch (error) {
            console.error('Error extracting video URL:', error);
            return window.location.href;
        }
    }

    function extractYouTubeVideoId(url) {
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

    async function waitForElements(selector, timeout = 2000) {
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

    // Initialize the content script
    initialize();
} else {
    console.log('Trenddit Memo content script already initialized');
} 