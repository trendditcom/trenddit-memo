import { LLMProviderFactory } from './llm-provider-factory.js';
import { saveToStorage } from './storage.js';

// Provider manager for handling LLM operations
class ProviderManager {
    constructor() {
        this.currentProvider = null;
        this.initialized = false;
    }

    async initializeProvider(config) {
        if (!config || !config.type) {
            throw new Error('Invalid provider configuration');
        }

        try {
            this.currentProvider = LLMProviderFactory.createProvider(config.type, config);
            
            // Initialize provider (with API key if available)
            await this.currentProvider.initialize(config.apiKey || null);
            
            this.initialized = this.currentProvider.initialized;
            return true;
        } catch (error) {
            console.error('Failed to initialize provider:', error);
            throw new Error(`Failed to initialize provider: ${error.message}`);
        }
    }

    async processMemo(content, options = {}) {
        if (!this.currentProvider || !this.currentProvider.initialized) {
            // Try to reinitialize the provider if configuration exists
            const result = await chrome.storage.local.get(['llmConfig']);
            if (result.llmConfig) {
                console.log('Attempting to reinitialize provider for memo processing...');
                try {
                    await this.initializeProvider(result.llmConfig);
                } catch (error) {
                    console.error('Failed to reinitialize provider:', error);
                    throw new Error('LLM provider not configured');
                }
            } else {
                throw new Error('LLM provider not configured');
            }
        }
        return await this.currentProvider.processMemo(content, options);
    }

    async processChat(messages, options = {}) {
        if (!this.currentProvider || !this.currentProvider.initialized) {
            // Try to reinitialize the provider if configuration exists
            const result = await chrome.storage.local.get(['llmConfig']);
            if (result.llmConfig) {
                console.log('Attempting to reinitialize provider for chat...');
                try {
                    await this.initializeProvider(result.llmConfig);
                } catch (error) {
                    console.error('Failed to reinitialize provider:', error);
                    throw new Error('LLM provider not configured');
                }
            } else {
                throw new Error('LLM provider not configured');
            }
        }
        return await this.currentProvider.chat(messages, options);
    }

    getProviderInfo() {
        return this.currentProvider ? this.currentProvider.getProviderInfo() : null;
    }

    isInitialized() {
        return this.initialized && this.currentProvider && this.currentProvider.initialized;
    }

}

// Global provider manager instance
const providerManager = new ProviderManager();

// Function to sanitize text for JSON
function sanitizeForJson(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')        // Escape backslashes
        .replace(/"/g, '\\"')                          // Escape quotes
        .replace(/\n/g, '\\n')                         // Handle newlines
        .replace(/\r/g, '\\r')                         // Handle carriage returns
        .replace(/\t/g, '\\t');                        // Handle tabs
}

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

// Handle YouTube memo creation
async function handleYouTubeMemo(youtubeData) {
    try {
        // Fetch current tags
        const tagsResult = await chrome.storage.local.get(['tags']);
        const tags = tagsResult.tags || [];
        
        console.log('Processing YouTube memo with tags:', tags);
        console.log('Processing YouTube content:', youtubeData.data.metadata.title);
        
        // Format YouTube content for processing
        const formattedContent = formatYouTubeContent(youtubeData.data);
        
        const processedContent = await providerManager.processMemo(formattedContent, {
            url: youtubeData.data.metadata.videoUrl || youtubeData.url,
            tags: tags,
            platform: 'youtube'
        });
        console.log('Received processed YouTube content:', processedContent);
        
        const memo = {
            id: Date.now().toString(),
            url: youtubeData.data.metadata.videoUrl || youtubeData.url,
            favicon: 'https://youtube.com/favicon.ico',
            timestamp: Date.now(),
            sourceHtml: formattedContent,
            title: youtubeData.data.metadata.title || processedContent.title,
            summary: processedContent.summary,
            narrative: processedContent.narrative,
            structuredData: {
                ...processedContent.structuredData,
                platform: 'youtube',
                videoMetadata: youtubeData.data.metadata,
                transcriptAvailable: youtubeData.data.metadata.transcriptAvailable
            },
            tag: processedContent.selectedTag,
            platform: 'youtube'
        };

        // Save to storage
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['memos'], (result) => {
                const memos = result.memos || [];
                memos.unshift(memo);
                chrome.storage.local.set({ memos }, () => {
                    // Notify content script and side panel
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        // Only try to send message to content script if we have an active tab
                        if (tabs && tabs.length > 0) {
                            try {
                                chrome.tabs.sendMessage(tabs[0].id, { action: 'memoSaved' });
                            } catch (error) {
                                console.error('Failed to notify content script:', error);
                                // Don't reject the promise, just log the error
                            }
                        }
                        // Always notify the side panel
                        chrome.runtime.sendMessage({ action: 'memoSaved' });
                        resolve();
                    });
                });
            });
        });

    } catch (error) {
        console.error('Error processing YouTube memo:', error);
        console.error('Error details:', error.message);
        // Notify side panel about error
        chrome.runtime.sendMessage({
            action: 'error',
            error: error.message
        });
    }
}

// Format YouTube content for LLM processing
function formatYouTubeContent(youtubeData) {
    const { metadata, content } = youtubeData;
    
    let formatted = `YouTube Video: ${metadata.title || 'Untitled'}\n`;
    formatted += `Channel: ${metadata.author || 'Unknown'}\n`;
    formatted += `URL: ${metadata.videoUrl || 'Unknown'}\n`;
    formatted += `Duration: ${metadata.duration || 'Unknown'}\n`;
    formatted += `Views: ${metadata.views || 'Unknown'}\n`;
    formatted += `Upload Date: ${metadata.uploadDate || 'Unknown'}\n`;
    
    if (metadata.likes) {
        formatted += `Likes: ${metadata.likes}\n`;
    }
    
    if (metadata.subscribers) {
        formatted += `Channel Subscribers: ${metadata.subscribers}\n`;
    }
    
    if (metadata.description) {
        formatted += `\nDescription:\n${metadata.description}\n`;
    }
    
    if (content && content.length > 0) {
        formatted += `\nTranscript:\n${content}\n`;
    } else {
        formatted += `\nTranscript: Not available for this video\n`;
        formatted += `\nNote: Process this YouTube video based on the title, description, and metadata provided above. Create a meaningful summary and analysis even without the transcript.\n`;
    }
    
    return formatted;
}


// Handle updating existing memo with transcript
async function handleMemoTranscriptUpdate(updateData) {
    try {
        const { memoId, transcriptText } = updateData;
        
        console.log('Updating memo with transcript:', memoId, transcriptText.substring(0, 100) + '...');
        
        // Get current memos
        const result = await chrome.storage.local.get(['memos']);
        const memos = result.memos || [];
        
        // Find the memo to update
        const memoIndex = memos.findIndex(m => m.id === memoId);
        if (memoIndex === -1) {
            throw new Error('Memo not found');
        }
        
        const memo = memos[memoIndex];
        
        // Add transcript to source content
        const updatedSourceHtml = memo.sourceHtml + `\n\nTranscript:\n${transcriptText}`;
        
        // Get tags for processing
        const tagsResult = await chrome.storage.local.get(['tags']);
        const tags = tagsResult.tags || [];
        
        // Reprocess the memo with the updated content including transcript
        const processedContent = await providerManager.processMemo(updatedSourceHtml, {
            url: memo.url,
            tags: tags,
            platform: memo.platform || 'youtube'
        });
        
        console.log('Reprocessed memo with transcript:', processedContent);
        
        // Update the memo with new processed content
        const updatedMemo = {
            ...memo,
            sourceHtml: updatedSourceHtml,
            title: processedContent.title || memo.title,
            summary: processedContent.summary || memo.summary,
            narrative: processedContent.narrative || memo.narrative,
            structuredData: {
                ...memo.structuredData,
                ...processedContent.structuredData,
                transcriptAdded: true,
                transcriptLength: transcriptText.length
            },
            tag: processedContent.selectedTag || memo.tag,
            lastUpdated: Date.now()
        };
        
        // Update memos array
        memos[memoIndex] = updatedMemo;
        
        // Save updated memos
        await chrome.storage.local.set({ memos });
        
        // Notify side panel about the update
        chrome.runtime.sendMessage({ 
            action: 'memoUpdated', 
            memo: updatedMemo 
        });
        
        console.log('Successfully updated memo with transcript');
        
    } catch (error) {
        console.error('Error updating memo with transcript:', error);
        throw error;
    }
}

// Handle new memo creation
async function handleMemo(memoData) {
    try {
        // Fetch current tags
        const tagsResult = await chrome.storage.local.get(['tags']);
        const tags = tagsResult.tags || [];
        
        console.log('Processing memo with tags:', tags);
        console.log('Processing memo with content length:', memoData.rawHtml.length);
        
        const processedContent = await providerManager.processMemo(memoData.rawHtml, {
            url: memoData.url,
            tags: tags
        });
        console.log('Received processed content:', processedContent);
        
        const memo = {
            id: Date.now().toString(),
            url: memoData.url,
            favicon: memoData.favicon,
            timestamp: memoData.timestamp,
            sourceHtml: memoData.rawHtml,  // Save the cleaned HTML
            title: processedContent.title,
            summary: processedContent.summary,
            narrative: processedContent.narrative,
            structuredData: {
                ...processedContent.structuredData,
                dominantImage: memoData.dominantImage
            },
            tag: processedContent.selectedTag
        };

        // Save to storage
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['memos'], (result) => {
                const memos = result.memos || [];
                memos.unshift(memo);
                chrome.storage.local.set({ memos }, () => {
                    // Notify content script and side panel
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        // Only try to send message to content script if we have an active tab
                        if (tabs && tabs.length > 0) {
                            try {
                                chrome.tabs.sendMessage(tabs[0].id, { action: 'memoSaved' });
                            } catch (error) {
                                console.error('Failed to notify content script:', error);
                                // Don't reject the promise, just log the error
                            }
                        }
                        // Always notify the side panel
                        chrome.runtime.sendMessage({ action: 'memoSaved' });
                        resolve();
                    });
                });
            });
        });

    } catch (error) {
        console.error('Error processing memo:', error);
        console.error('Error details:', error.message);
        // Notify side panel about error
        chrome.runtime.sendMessage({
            action: 'error',
            error: error.message
        });
    }
}

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processMemo') {
        handleMemo(request.data)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    } else if (request.action === 'processYouTubeMemo') {
        handleYouTubeMemo(request.data)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    } else if (request.action === 'setLLMConfig') {
        providerManager.initializeProvider(request.config)
            .then(async () => {
                // Store the configuration using centralized storage function to trigger backup
                await saveToStorage('llmConfig', request.config);
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error('Provider initialization error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Will respond asynchronously
    } else if (request.action === 'setApiKey') {
        // Legacy support - convert to new format
        const config = {
            type: 'anthropic',
            apiKey: request.apiKey
        };
        providerManager.initializeProvider(config)
            .then(async () => {
                // Use centralized storage to trigger backup
                await saveToStorage('llmConfig', config);
                // Keep legacy key for migration compatibility  
                await chrome.storage.local.set({ anthropicApiKey: request.apiKey });
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error('Provider initialization error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Will respond asynchronously
    } else if (request.action === 'extractYouTubeContent') {
        // Forward the request to the YouTube content script
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'extractYouTubeContent' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error communicating with YouTube content script:', chrome.runtime.lastError.message);
                        sendResponse({ 
                            success: false, 
                            error: chrome.runtime.lastError.message 
                        });
                    } else if (response) {
                        sendResponse(response);
                    } else {
                        sendResponse({ 
                            success: false, 
                            error: 'No response from YouTube content script' 
                        });
                    }
                });
            } else {
                sendResponse({ 
                    success: false, 
                    error: 'No active tab found' 
                });
            }
        });
        return true; // Will respond asynchronously
    } else if (request.action === 'chatMessage') {
        providerManager.processChat(request.messages)
            .then(response => {
                // Format response to match expected format
                sendResponse({ 
                    success: true, 
                    reply: response.content || response.reply || response.message,
                    usage: response.usage || null
                });
            })
            .catch(error => {
                console.error('Chat API error:', error);
                sendResponse({ 
                    success: false, 
                    error: error.message 
                });
            });
        return true; // Will respond asynchronously
    } else if (request.action === 'updateMemoWithTranscript') {
        // Handle updating existing memo with transcript
        handleMemoTranscriptUpdate(request.data)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    }
});

// Initialize provider on startup
chrome.storage.local.get(['llmConfig', 'anthropicApiKey'], async (result) => {
    try {
        if (result.llmConfig) {
            // Use new multi-provider configuration
            await providerManager.initializeProvider(result.llmConfig);
        } else if (result.anthropicApiKey) {
            // Migrate from old configuration
            const config = {
                type: 'anthropic',
                apiKey: result.anthropicApiKey
            };
            await providerManager.initializeProvider(config);
            
            // Save new configuration format using centralized storage to trigger backup
            await saveToStorage('llmConfig', config);
        }
    } catch (error) {
        console.error('Failed to initialize provider on startup:', error);
    }
}); 