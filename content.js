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
            window.avnamMemo.isHighlightMode = request.enabled;
            document.body.style.cursor = window.avnamMemo.isHighlightMode ? 'crosshair' : 'default';
            
            // Clear any existing highlights when exiting highlight mode
            if (!window.avnamMemo.isHighlightMode && window.avnamMemo.highlightedElement) {
                window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
                window.avnamMemo.highlightedElement = null;
            }
            
            sendResponse({ success: true });
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
        // Request YouTube content extraction
        chrome.runtime.sendMessage({
            action: 'extractYouTubeContent'
        }, (response) => {
            if (response && response.success) {
                // Send YouTube data to background script
                chrome.runtime.sendMessage({
                    action: 'processYouTubeMemo',
                    data: response
                }, (memoResponse) => {
                    if (!memoResponse) {
                        console.error('No response received from background script');
                        return;
                    }
                    
                    if (memoResponse.success) {
                        // Reset highlight mode and remove selection effect
                        window.avnamMemo.isHighlightMode = false;
                        document.body.style.cursor = 'default';
                        
                        if (window.avnamMemo.highlightedElement) {
                            window.avnamMemo.highlightedElement.classList.remove('highlight-outline');
                            window.avnamMemo.highlightedElement = null;
                        }
                    } else {
                        console.error('Failed to process YouTube memo:', memoResponse.error || 'Unknown error');
                        alert('Failed to save YouTube memo. Please try again.');
                    }
                });
            } else {
                console.error('Failed to extract YouTube content:', response?.error || 'Unknown error');
                alert('Failed to extract YouTube content. Please try again.');
            }
        });
    }

    // Initialize the content script
    initialize();
} else {
    console.log('Trenddit Memo content script already initialized');
} 