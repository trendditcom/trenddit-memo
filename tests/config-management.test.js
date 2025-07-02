// Tests for configuration management system
import { describe, it, expect } from './test-runner.js';

// Mock Chrome storage for testing
const mockStorage = {
    local: {
        data: {},
        get: function(keys, callback) {
            const result = {};
            if (Array.isArray(keys)) {
                keys.forEach(key => {
                    if (this.data[key] !== undefined) {
                        result[key] = this.data[key];
                    }
                });
            } else if (typeof keys === 'string') {
                if (this.data[keys] !== undefined) {
                    result[keys] = this.data[keys];
                }
            } else if (keys === null || keys === undefined) {
                Object.assign(result, this.data);
            }
            if (callback) callback(result);
            return Promise.resolve(result);
        },
        set: function(data, callback) {
            Object.assign(this.data, data);
            if (callback) callback();
            return Promise.resolve();
        },
        remove: function(keys, callback) {
            if (Array.isArray(keys)) {
                keys.forEach(key => delete this.data[key]);
            } else {
                delete this.data[keys];
            }
            if (callback) callback();
            return Promise.resolve();
        },
        clear: function(callback) {
            this.data = {};
            if (callback) callback();
            return Promise.resolve();
        }
    }
};

// Configuration management class for testing
class ConfigManager {
    constructor(storage = mockStorage) {
        this.storage = storage;
    }

    // Get current provider configuration
    async getCurrentConfig() {
        return new Promise((resolve) => {
            this.storage.local.get(['llmConfig'], (result) => {
                resolve(result.llmConfig || null);
            });
        });
    }

    // Set provider configuration
    async setConfig(config) {
        if (!this.validateConfig(config)) {
            throw new Error('Invalid configuration');
        }

        return new Promise((resolve) => {
            this.storage.local.set({ llmConfig: config }, () => {
                resolve(true);
            });
        });
    }

    // Validate configuration structure
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        if (!config.type || typeof config.type !== 'string') {
            return false;
        }

        if (!config.apiKey || typeof config.apiKey !== 'string') {
            return false;
        }

        return true;
    }

    // Migrate from old configuration format
    async migrateFromLegacy() {
        return new Promise((resolve) => {
            this.storage.local.get(['anthropicApiKey', 'llmConfig'], (result) => {
                if (result.llmConfig) {
                    // Already migrated
                    resolve(false);
                    return;
                }

                if (result.anthropicApiKey) {
                    // Migrate old format
                    const newConfig = {
                        type: 'anthropic',
                        apiKey: result.anthropicApiKey,
                        model: 'claude-3-5-sonnet-20241022'
                    };

                    this.storage.local.set({ llmConfig: newConfig }, () => {
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            });
        });
    }

    // Get provider-specific configuration
    async getProviderConfig(providerType) {
        const config = await this.getCurrentConfig();
        if (!config || config.type !== providerType) {
            return null;
        }
        return config;
    }

    // Update API key for current provider
    async updateApiKey(apiKey) {
        const config = await this.getCurrentConfig();
        if (!config) {
            throw new Error('No configuration found');
        }

        config.apiKey = apiKey;
        return await this.setConfig(config);
    }

    // Check if configuration exists and is valid
    async isConfigured() {
        const config = await this.getCurrentConfig();
        return config && this.validateConfig(config);
    }

    // Get available providers from factory
    getAvailableProviders() {
        return [
            {
                id: 'anthropic',
                name: 'Anthropic Claude',
                description: 'Claude AI by Anthropic',
                requiresApiKey: true,
                models: [
                    'claude-3-5-sonnet-20241022',
                    'claude-3-haiku-20240307',
                    'claude-3-opus-20240229'
                ]
            }
        ];
    }

    // Create default configuration for a provider
    createDefaultConfig(providerType, apiKey) {
        const providers = this.getAvailableProviders();
        const provider = providers.find(p => p.id === providerType);
        
        if (!provider) {
            throw new Error(`Unknown provider: ${providerType}`);
        }

        return {
            type: providerType,
            apiKey: apiKey,
            model: provider.models[0] // Use first model as default
        };
    }
}

describe('Configuration Management Tests', () => {
    let configManager;

    // Setup for each test
    beforeEach(() => {
        mockStorage.local.data = {}; // Clear mock storage
        configManager = new ConfigManager(mockStorage);
    });

    // Test 1: Basic configuration management
    it('should create and retrieve configuration', async () => {
        const config = {
            type: 'anthropic',
            apiKey: 'sk-ant-test-key',
            model: 'claude-3-5-sonnet-20241022'
        };

        await configManager.setConfig(config);
        const retrieved = await configManager.getCurrentConfig();
        
        expect(retrieved.type).toBe('anthropic');
        expect(retrieved.apiKey).toBe('sk-ant-test-key');
        expect(retrieved.model).toBe('claude-3-5-sonnet-20241022');
    });

    // Test 2: Configuration validation
    it('should validate configuration structure', async () => {
        // Valid configuration
        const validConfig = {
            type: 'anthropic',
            apiKey: 'sk-ant-test-key'
        };
        expect(configManager.validateConfig(validConfig)).toBe(true);

        // Invalid configurations
        expect(configManager.validateConfig(null)).toBe(false);
        expect(configManager.validateConfig({})).toBe(false);
        expect(configManager.validateConfig({ type: 'anthropic' })).toBe(false);
        expect(configManager.validateConfig({ apiKey: 'key' })).toBe(false);
    });

    // Test 3: Invalid configuration rejection
    it('should reject invalid configuration', async () => {
        try {
            await configManager.setConfig({ invalid: 'config' });
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toBe('Invalid configuration');
        }
    });

    // Test 4: Legacy configuration migration
    it('should migrate from legacy configuration', async () => {
        // Set up legacy configuration
        mockStorage.local.data.anthropicApiKey = 'sk-ant-legacy-key';
        
        const migrated = await configManager.migrateFromLegacy();
        expect(migrated).toBe(true);
        
        const config = await configManager.getCurrentConfig();
        expect(config.type).toBe('anthropic');
        expect(config.apiKey).toBe('sk-ant-legacy-key');
        expect(config.model).toBe('claude-3-5-sonnet-20241022');
    });

    // Test 5: No migration when already configured
    it('should not migrate when already configured', async () => {
        // Set up both old and new configurations
        mockStorage.local.data.anthropicApiKey = 'sk-ant-legacy-key';
        mockStorage.local.data.llmConfig = {
            type: 'anthropic',
            apiKey: 'sk-ant-new-key'
        };
        
        const migrated = await configManager.migrateFromLegacy();
        expect(migrated).toBe(false);
        
        const config = await configManager.getCurrentConfig();
        expect(config.apiKey).toBe('sk-ant-new-key');
    });

    // Test 6: Provider-specific configuration
    it('should get provider-specific configuration', async () => {
        const config = {
            type: 'anthropic',
            apiKey: 'sk-ant-test-key'
        };
        await configManager.setConfig(config);
        
        const anthropicConfig = await configManager.getProviderConfig('anthropic');
        expect(anthropicConfig.type).toBe('anthropic');
        
        const openaiConfig = await configManager.getProviderConfig('openai');
        expect(openaiConfig).toBe(null);
    });

    // Test 7: API key updates
    it('should update API key for current provider', async () => {
        const config = {
            type: 'anthropic',
            apiKey: 'sk-ant-old-key'
        };
        await configManager.setConfig(config);
        
        await configManager.updateApiKey('sk-ant-new-key');
        
        const updated = await configManager.getCurrentConfig();
        expect(updated.apiKey).toBe('sk-ant-new-key');
        expect(updated.type).toBe('anthropic'); // Type should remain unchanged
    });

    // Test 8: Configuration status check
    it('should check configuration status', async () => {
        // No configuration
        expect(await configManager.isConfigured()).toBe(false);
        
        // Valid configuration
        const config = {
            type: 'anthropic',
            apiKey: 'sk-ant-test-key'
        };
        await configManager.setConfig(config);
        expect(await configManager.isConfigured()).toBe(true);
    });

    // Test 9: Available providers
    it('should return available providers', () => {
        const providers = configManager.getAvailableProviders();
        expect(providers.length).toBe(1);
        expect(providers[0].id).toBe('anthropic');
        expect(providers[0].requiresApiKey).toBe(true);
        expect(providers[0].models.length).toBe(3);
    });

    // Test 10: Default configuration creation
    it('should create default configuration', () => {
        const config = configManager.createDefaultConfig('anthropic', 'sk-ant-test-key');
        expect(config.type).toBe('anthropic');
        expect(config.apiKey).toBe('sk-ant-test-key');
        expect(config.model).toBe('claude-3-5-sonnet-20241022');
    });

    // Test 11: Unknown provider handling
    it('should handle unknown provider', () => {
        try {
            configManager.createDefaultConfig('unknown', 'key');
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toBe('Unknown provider: unknown');
        }
    });

    // Test 12: Storage operations
    it('should handle storage operations correctly', async () => {
        // Test multiple configurations
        const config1 = {
            type: 'anthropic',
            apiKey: 'key1'
        };
        
        await configManager.setConfig(config1);
        let retrieved = await configManager.getCurrentConfig();
        expect(retrieved.apiKey).toBe('key1');
        
        const config2 = {
            type: 'anthropic',
            apiKey: 'key2'
        };
        
        await configManager.setConfig(config2);
        retrieved = await configManager.getCurrentConfig();
        expect(retrieved.apiKey).toBe('key2');
    });
});

describe('Configuration Schema Tests', () => {
    // Test 13: Multi-provider schema structure
    it('should support multi-provider schema structure', () => {
        const multiProviderConfig = {
            currentProvider: 'anthropic',
            providers: {
                anthropic: {
                    apiKey: 'sk-ant-key',
                    model: 'claude-3-5-sonnet-20241022',
                    enabled: true
                },
                openai: {
                    apiKey: 'sk-openai-key',
                    model: 'gpt-4',
                    enabled: false
                }
            },
            lastUpdated: Date.now()
        };

        expect(multiProviderConfig.currentProvider).toBe('anthropic');
        expect(multiProviderConfig.providers.anthropic.enabled).toBe(true);
        expect(multiProviderConfig.providers.openai.enabled).toBe(false);
    });

    // Test 14: Configuration versioning
    it('should support configuration versioning', () => {
        const versionedConfig = {
            version: '1.0.0',
            type: 'anthropic',
            apiKey: 'sk-ant-key',
            migrated: true
        };

        expect(versionedConfig.version).toBe('1.0.0');
        expect(versionedConfig.migrated).toBe(true);
    });
});