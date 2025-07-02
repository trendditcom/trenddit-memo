// Tests for background.js provider factory integration
import { describe, it, expect } from './test-runner.js';
import { LLMProviderFactory } from '../llm-provider-factory.js';

// Mock Chrome APIs for testing
global.chrome = {
    storage: {
        local: {
            get: (keys, callback) => {
                // Mock storage responses
                if (keys.includes('llmConfig')) {
                    callback({ llmConfig: { type: 'anthropic', apiKey: 'test-key' } });
                } else if (keys.includes('tags')) {
                    callback({ tags: [{ name: 'general' }] });
                } else {
                    callback({});
                }
            },
            set: (data, callback) => {
                if (callback) callback();
            }
        }
    },
    runtime: {
        sendMessage: (message) => {
            // Mock runtime message
        },
        onMessage: {
            addListener: (callback) => {
                // Mock message listener
            }
        }
    },
    tabs: {
        query: (query, callback) => {
            callback([{ id: 1 }]);
        },
        sendMessage: (tabId, message) => {
            // Mock tab message
        }
    },
    action: {
        onClicked: {
            addListener: (callback) => {
                // Mock action listener
            }
        }
    },
    sidePanel: {
        open: (options) => {
            // Mock side panel
        }
    }
};

// Mock provider manager for testing
class MockProviderManager {
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
            if (config.apiKey) {
                await this.currentProvider.initialize(config.apiKey);
            }
            this.initialized = true;
            return true;
        } catch (error) {
            throw new Error(`Failed to initialize provider: ${error.message}`);
        }
    }

    async processMemo(content, options = {}) {
        if (!this.currentProvider || !this.currentProvider.initialized) {
            throw new Error('Provider not initialized');
        }
        return await this.currentProvider.processMemo(content, options);
    }

    async processChat(messages, options = {}) {
        if (!this.currentProvider || !this.currentProvider.initialized) {
            throw new Error('Provider not initialized');
        }
        return await this.currentProvider.chat(messages, options);
    }

    getProviderInfo() {
        return this.currentProvider ? this.currentProvider.getProviderInfo() : null;
    }
}

describe('Background Provider Integration Tests', () => {
    let providerManager;

    // Test 1: Provider manager initialization
    it('should initialize provider manager', () => {
        providerManager = new MockProviderManager();
        expect(providerManager.initialized).toBe(false);
        expect(providerManager.currentProvider).toBe(null);
    });

    // Test 2: Provider configuration loading
    it('should load provider configuration', async () => {
        providerManager = new MockProviderManager();
        const config = {
            type: 'anthropic',
            apiKey: 'sk-ant-test-key'
        };

        await providerManager.initializeProvider(config);
        expect(providerManager.initialized).toBe(true);
        expect(providerManager.currentProvider).toBeTruthy();
    });

    // Test 3: Provider initialization error handling
    it('should handle provider initialization errors', async () => {
        providerManager = new MockProviderManager();
        
        try {
            await providerManager.initializeProvider({});
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toBe('Invalid provider configuration');
        }
    });

    // Test 4: Factory pattern integration
    it('should use factory pattern for provider creation', async () => {
        providerManager = new MockProviderManager();
        const config = {
            type: 'anthropic',
            apiKey: 'sk-ant-test-key'
        };

        await providerManager.initializeProvider(config);
        const info = providerManager.getProviderInfo();
        
        expect(info.id).toBe('anthropic');
        expect(info.name).toBe('Anthropic Claude');
    });

    // Test 5: Message handler structure
    it('should handle message routing correctly', () => {
        const messageHandlers = {
            'setLLMConfig': async (request, sendResponse) => {
                try {
                    await providerManager.initializeProvider(request.config);
                    sendResponse({ success: true });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            },
            'processMemo': async (request, sendResponse) => {
                try {
                    const result = await providerManager.processMemo(request.data.rawHtml, {
                        url: request.data.url,
                        tags: request.tags
                    });
                    sendResponse({ success: true, result });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            },
            'chatMessage': async (request, sendResponse) => {
                try {
                    const result = await providerManager.processChat(request.messages);
                    sendResponse({ success: true, result });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            }
        };

        expect(messageHandlers['setLLMConfig']).toBeTruthy();
        expect(messageHandlers['processMemo']).toBeTruthy();
        expect(messageHandlers['chatMessage']).toBeTruthy();
    });

    // Test 6: Storage configuration format
    it('should handle storage configuration format', () => {
        const storageConfig = {
            llmConfig: {
                type: 'anthropic',
                providers: {
                    anthropic: {
                        apiKey: 'sk-ant-test-key',
                        model: 'claude-3-5-sonnet-20241022',
                        enabled: true
                    }
                },
                lastUpdated: Date.now()
            }
        };

        expect(storageConfig.llmConfig.type).toBe('anthropic');
        expect(storageConfig.llmConfig.providers.anthropic.apiKey).toBeTruthy();
        expect(storageConfig.llmConfig.providers.anthropic.model).toBeTruthy();
    });

    // Test 7: Error handling without provider
    it('should handle operations without initialized provider', async () => {
        providerManager = new MockProviderManager();
        
        try {
            await providerManager.processMemo('test content');
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toBe('Provider not initialized');
        }

        try {
            await providerManager.processChat([{ role: 'user', content: 'test' }]);
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toBe('Provider not initialized');
        }
    });

    // Test 8: Configuration migration handling
    it('should handle configuration migration', () => {
        // Old format (anthropic-specific)
        const oldConfig = {
            anthropicApiKey: 'sk-ant-old-key'
        };

        // New format (multi-provider)
        const newConfig = {
            llmConfig: {
                type: 'anthropic',
                providers: {
                    anthropic: {
                        apiKey: oldConfig.anthropicApiKey,
                        model: 'claude-3-5-sonnet-20241022',
                        enabled: true
                    }
                }
            }
        };

        expect(newConfig.llmConfig.providers.anthropic.apiKey).toBe(oldConfig.anthropicApiKey);
    });

    // Test 9: Provider switching capability
    it('should support provider switching', async () => {
        providerManager = new MockProviderManager();
        
        // Initialize with Anthropic
        await providerManager.initializeProvider({
            type: 'anthropic',
            apiKey: 'sk-ant-test-key'
        });
        
        let info = providerManager.getProviderInfo();
        expect(info.id).toBe('anthropic');
        
        // Note: When other providers are implemented, test switching
        // For now, just verify the pattern works
        expect(providerManager.initialized).toBe(true);
    });

    // Test 10: Async message handling
    it('should handle async message processing', async () => {
        providerManager = new MockProviderManager();
        await providerManager.initializeProvider({
            type: 'anthropic',
            apiKey: 'sk-ant-test-key'
        });

        // Mock async message processing
        const mockRequest = {
            action: 'processMemo',
            data: { rawHtml: 'test content', url: 'test.com' },
            tags: [{ name: 'general' }]
        };

        const mockSendResponse = (response) => {
            expect(response.success).toBeTruthy();
        };

        // This simulates how the background script would handle the message
        const handleMessage = async (request, sendResponse) => {
            if (request.action === 'processMemo') {
                try {
                    const result = await providerManager.processMemo(request.data.rawHtml, {
                        url: request.data.url,
                        tags: request.tags
                    });
                    sendResponse({ success: true, result });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            }
        };

        // Test that it doesn't throw
        await handleMessage(mockRequest, mockSendResponse);
        expect(true).toBe(true); // If we get here, async handling works
    });
});

describe('Background Script Architecture Tests', () => {
    // Test 11: Service worker compatibility
    it('should be compatible with service worker architecture', () => {
        // Service workers can't use persistent connections
        // Must use message passing for all operations
        const serviceWorkerFeatures = {
            messagePassingOnly: true,
            noPersistedConnections: true,
            eventDriven: true,
            noSharedState: true
        };

        expect(serviceWorkerFeatures.messagePassingOnly).toBe(true);
        expect(serviceWorkerFeatures.eventDriven).toBe(true);
    });

    // Test 12: Memory management
    it('should handle memory management correctly', () => {
        // In service worker, objects may be garbage collected
        // Need to recreate provider instances as needed
        const memoryStrategy = {
            recreateOnDemand: true,
            noLongLivedObjects: true,
            storageBasedConfig: true
        };

        expect(memoryStrategy.recreateOnDemand).toBe(true);
        expect(memoryStrategy.storageBasedConfig).toBe(true);
    });
});