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
        } else if (request.action === 'captureTranscript') {
            // Handle transcript capture for existing memo
            if (isYouTubePage()) {
                window.avnamMemo.transcriptCaptureMemoId = request.memoId;
                window.avnamMemo.isTranscriptCaptureMode = true;
                window.avnamMemo.isHighlightMode = true;
                document.body.style.cursor = 'crosshair';
                
                // Add visual indicator for transcript capture mode
                const indicator = document.createElement('div');
                indicator.id = 'transcript-capture-indicator';
                indicator.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #ef4444;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    z-index: 2147483647;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                `;
                indicator.textContent = 'Transcript Capture Mode - Click on transcript text';
                document.body.appendChild(indicator);
                
                sendResponse({ success: true });
            } else {
                sendResponse({
                    success: false,
                    error: 'Not a YouTube page'
                });
            }
            return true;
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
        
        // Check if this is transcript capture mode
        if (window.avnamMemo.isTranscriptCaptureMode && isYouTubePage()) {
            // Handle transcript capture for existing memo
            handleTranscriptCapture(element, window.avnamMemo.transcriptCaptureMemoId);
        } else if (isYouTubePage() && !window.avnamMemo.isTranscriptCaptureMode) {
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

    function handleTranscriptCapture(element, memoId) {
        try {
            // Extract transcript text from the selected element
            const transcriptText = element.textContent || element.innerText || '';
            
            if (!transcriptText.trim()) {
                alert('No text content found in selected element. Please select transcript text.');
                return;
            }
            
            // Clean up the transcript text
            const cleanedTranscript = transcriptText
                .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                .replace(/[\n\r\t]/g, ' ')  // Replace newlines and tabs with spaces
                .trim();
            
            console.log('Captured transcript text:', cleanedTranscript.substring(0, 100) + '...');
            
            // Send transcript data to background script to update existing memo
            chrome.runtime.sendMessage({
                action: 'updateMemoWithTranscript',
                data: {
                    memoId: memoId,
                    transcriptText: cleanedTranscript
                }
            }, (response) => {
                // Reset transcript capture mode
                window.avnamMemo.isTranscriptCaptureMode = false;
                window.avnamMemo.isHighlightMode = false;
                window.avnamMemo.transcriptCaptureMemoId = null;
                document.body.style.cursor = 'default';
                
                // Remove transcript capture indicator
                const indicator = document.getElementById('transcript-capture-indicator');
                if (indicator) {
                    indicator.remove();
                }
                
                // Remove highlight from element
                if (window.avnamMemo.highlightedElement) {
                    window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
                    window.avnamMemo.highlightedElement = null;
                }
                
                if (!response) {
                    console.error('No response received from background script');
                    alert('Failed to update memo with transcript. Please try again.');
                    return;
                }
                
                if (response.success) {
                    alert('Transcript successfully added to memo!');
                } else {
                    console.error('Failed to update memo with transcript:', response.error || 'Unknown error');
                    alert('Failed to update memo with transcript. Please try again.');
                }
            });
            
        } catch (error) {
            console.error('Error capturing transcript:', error);
            alert('Failed to capture transcript. Please try again.');
            
            // Reset transcript capture mode on error
            window.avnamMemo.isTranscriptCaptureMode = false;
            window.avnamMemo.isHighlightMode = false;
            window.avnamMemo.transcriptCaptureMemoId = null;
            document.body.style.cursor = 'default';
            
            const indicator = document.getElementById('transcript-capture-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    }

    // YouTube content extraction function
    async function extractYouTubeContent() {
        try {
            const metadata = await extractYouTubeMetadata();
            const videoUrl = extractYouTubeVideoUrl();
            
            return {
                platform: 'youtube',
                content: '', // No automatic transcript extraction
                metadata: {
                    ...metadata,
                    transcriptAvailable: false, // Manual transcript capture only
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
            // Extract video title using multiple selectors
            const titleSelectors = [
                'h1.ytd-video-primary-info-renderer',
                'h1.title',
                'h1.ytd-watch-metadata',
                'h1.ytd-videoPrimaryInfoRenderer',
                '#container h1',
                '.ytd-video-primary-info-renderer .title',
                'ytd-watch-metadata h1',
                'h1[class*="title"]'
            ];
            
            let titleElement = null;
            for (const selector of titleSelectors) {
                titleElement = document.querySelector(selector);
                if (titleElement && titleElement.textContent?.trim()) {
                    metadata.title = titleElement.textContent.trim();
                    break;
                }
            }
            
            // Fallback: try to extract from page title
            if (!metadata.title && document.title) {
                const pageTitle = document.title.replace(' - YouTube', '');
                if (pageTitle !== 'YouTube') {
                    metadata.title = pageTitle;
                }
            }
            
            // Extract channel name using multiple selectors
            const channelSelectors = [
                'ytd-channel-name a',
                '.ytd-channel-name a',
                '#channel-name a',
                'ytd-video-owner-renderer a',
                '#owner-text a',
                '.ytd-video-owner-renderer .ytd-channel-name a',
                'a[href*="/channel/"]',
                'a[href*="/@"]'
            ];
            
            let channelElement = null;
            for (const selector of channelSelectors) {
                channelElement = document.querySelector(selector);
                if (channelElement && channelElement.textContent?.trim()) {
                    metadata.author = channelElement.textContent.trim();
                    break;
                }
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
            
            // Extract video duration using multiple selectors
            const durationSelectors = [
                '.ytp-time-duration',
                '.ytd-thumbnail-overlay-time-status-renderer',
                '.ytp-time-display .ytp-time-duration',
                'span.ytd-thumbnail-overlay-time-status-renderer',
                '.badge-shape-wiz__text'
            ];
            
            for (const selector of durationSelectors) {
                const durationElement = document.querySelector(selector);
                if (durationElement && durationElement.textContent?.trim()) {
                    metadata.duration = durationElement.textContent.trim();
                    break;
                }
            }
            
            // Extract view count using multiple selectors
            const viewSelectors = [
                '.view-count',
                '.ytd-video-view-count-renderer',
                '#info-text',
                'ytd-video-view-count-renderer',
                '.view-count-text',
                '#info .style-scope.ytd-video-primary-info-renderer',
                'span[class*="view"]'
            ];
            
            for (const selector of viewSelectors) {
                const viewElement = document.querySelector(selector);
                if (viewElement && viewElement.textContent?.trim()) {
                    const viewText = viewElement.textContent.trim();
                    if (viewText.includes('view') || viewText.includes('watching')) {
                        metadata.views = viewText;
                        break;
                    }
                }
            }
            
            // Extract description using multiple selectors
            const descriptionSelectors = [
                '#description',
                'ytd-expander #content',
                '.ytd-video-secondary-info-renderer #description',
                'ytd-video-secondary-info-renderer #description',
                '.description-text',
                '#meta-contents #description',
                '#description-text'
            ];
            
            for (const selector of descriptionSelectors) {
                const descriptionElement = document.querySelector(selector);
                if (descriptionElement && descriptionElement.textContent?.trim()) {
                    metadata.description = descriptionElement.textContent.trim();
                    break;
                }
            }
            
            // Extract upload date using multiple selectors
            const dateSelectors = [
                '#info-strings yt-formatted-string',
                '.ytd-video-primary-info-renderer #info-strings yt-formatted-string',
                '#info-text',
                '.ytd-video-primary-info-renderer #info-text',
                'ytd-video-primary-info-renderer #info-strings'
            ];
            
            for (const selector of dateSelectors) {
                const dateElement = document.querySelector(selector);
                if (dateElement && dateElement.textContent?.trim()) {
                    const dateText = dateElement.textContent.trim();
                    if (dateText.includes('ago') || dateText.includes('Premiered') || dateText.includes('Streamed')) {
                        metadata.uploadDate = dateText;
                        break;
                    }
                }
            }
            
            // Extract like/dislike counts if available
            const likeSelectors = [
                'button[aria-label*="like"] #text',
                'ytd-toggle-button-renderer #text',
                'button[aria-label*="Like"] #text',
                '.ytd-toggle-button-renderer #text'
            ];
            
            for (const selector of likeSelectors) {
                const likeElement = document.querySelector(selector);
                if (likeElement && likeElement.textContent?.trim()) {
                    metadata.likes = likeElement.textContent.trim();
                    break;
                }
            }
            
            // Extract subscriber count using multiple selectors
            const subscriberSelectors = [
                '#owner-sub-count',
                'ytd-video-owner-renderer #owner-sub-count',
                '.ytd-video-owner-renderer #owner-sub-count',
                '#subscriber-count',
                'ytd-subscribe-button-renderer #subscriber-count'
            ];
            
            for (const selector of subscriberSelectors) {
                const subscriberElement = document.querySelector(selector);
                if (subscriberElement && subscriberElement.textContent?.trim()) {
                    metadata.subscribers = subscriberElement.textContent.trim();
                    break;
                }
            }
            
            // Extract category/genre if available
            const categorySelectors = [
                '#super-title a',
                '.ytd-video-primary-info-renderer #super-title a',
                'ytd-badge-supported-renderer'
            ];
            
            for (const selector of categorySelectors) {
                const categoryElement = document.querySelector(selector);
                if (categoryElement && categoryElement.textContent?.trim()) {
                    metadata.category = categoryElement.textContent.trim();
                    break;
                }
            }
            
            // Add video URL for reference
            metadata.videoUrl = window.location.href;
            
        } catch (error) {
            console.error('Error extracting metadata:', error);
            metadata.metadataError = error.message;
        }
        
        return metadata;
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