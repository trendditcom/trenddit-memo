// Provider configuration management system
import { LLMProviderFactory } from '../llm-provider-factory.js';

export class ProviderConfigManager {
    constructor() {
        this.storage = (typeof chrome !== 'undefined' && chrome?.storage) || null;
    }

    // Get current provider configuration
    async getCurrentConfig() {
        return new Promise((resolve, reject) => {
            if (!this.storage) {
                reject(new Error('Chrome storage not available'));
                return;
            }

            this.storage.local.get(['llmConfig'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result.llmConfig || null);
                }
            });
        });
    }

    // Set provider configuration
    async setConfig(config) {
        if (!this.validateConfig(config)) {
            throw new Error('Invalid configuration');
        }

        return new Promise((resolve, reject) => {
            if (!this.storage) {
                reject(new Error('Chrome storage not available'));
                return;
            }

            // Add timestamp to configuration
            const configWithTimestamp = {
                ...config,
                lastUpdated: Date.now()
            };

            this.storage.local.set({ llmConfig: configWithTimestamp }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Validate configuration structure
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        // Required fields
        if (!config.type || typeof config.type !== 'string') {
            return false;
        }

        // Validate provider type exists
        const availableProviders = this.getAvailableProviders();
        const providerExists = availableProviders.some(p => p.id === config.type);
        if (!providerExists) {
            return false;
        }

        // Provider-specific validation
        try {
            LLMProviderFactory.validateConfig(config.type, config);
        } catch (error) {
            return false;
        }

        // Validate model if specified
        if (config.model) {
            const provider = availableProviders.find(p => p.id === config.type);
            if (provider && !provider.models.includes(config.model)) {
                return false;
            }
        }

        return true;
    }

    // Migrate from old configuration format
    async migrateFromLegacy() {
        return new Promise((resolve, reject) => {
            if (!this.storage) {
                reject(new Error('Chrome storage not available'));
                return;
            }

            this.storage.local.get(['anthropicApiKey', 'llmConfig'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

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
                        model: 'claude-3-5-sonnet-20241022',
                        migrated: true,
                        lastUpdated: Date.now()
                    };

                    this.storage.local.set({ llmConfig: newConfig }, () => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(true);
                        }
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

        const updatedConfig = {
            ...config,
            apiKey: apiKey,
            lastUpdated: Date.now()
        };

        return await this.setConfig(updatedConfig);
    }

    // Update model for current provider
    async updateModel(model) {
        const config = await this.getCurrentConfig();
        if (!config) {
            throw new Error('No configuration found');
        }

        // Validate model for the provider
        const provider = this.getAvailableProviders().find(p => p.id === config.type);
        if (!provider || !provider.models.includes(model)) {
            throw new Error(`Invalid model ${model} for provider ${config.type}`);
        }

        const updatedConfig = {
            ...config,
            model: model,
            lastUpdated: Date.now()
        };

        return await this.setConfig(updatedConfig);
    }

    // Check if configuration exists and is valid
    async isConfigured() {
        try {
            const config = await this.getCurrentConfig();
            return config && this.validateConfig(config);
        } catch (error) {
            return false;
        }
    }

    // Get available providers from factory
    getAvailableProviders() {
        return LLMProviderFactory.getAvailableProviders();
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
            model: provider.models[0], // Use first model as default
            lastUpdated: Date.now()
        };
    }

    // Switch to a different provider
    async switchProvider(providerType, apiKey) {
        const config = this.createDefaultConfig(providerType, apiKey);
        return await this.setConfig(config);
    }

    // Get configuration status information
    async getConfigStatus() {
        try {
            const config = await this.getCurrentConfig();
            const isValid = config && this.validateConfig(config);
            
            return {
                configured: isValid,
                provider: config?.type || null,
                model: config?.model || null,
                hasApiKey: !!(config?.apiKey),
                lastUpdated: config?.lastUpdated || null,
                migrated: config?.migrated || false
            };
        } catch (error) {
            return {
                configured: false,
                provider: null,
                model: null,
                hasApiKey: false,
                lastUpdated: null,
                migrated: false,
                error: error.message
            };
        }
    }

    // Reset configuration (for testing/debugging)
    async resetConfig() {
        return new Promise((resolve, reject) => {
            if (!this.storage) {
                reject(new Error('Chrome storage not available'));
                return;
            }

            this.storage.local.remove(['llmConfig', 'anthropicApiKey'], () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Export configuration (for backup)
    async exportConfig() {
        const config = await this.getCurrentConfig();
        if (!config) {
            throw new Error('No configuration to export');
        }

        // Remove sensitive data
        const exportConfig = {
            ...config,
            apiKey: '[REDACTED]'
        };

        return {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            config: exportConfig
        };
    }

    // Import configuration (for restore)
    async importConfig(importData, apiKey) {
        if (!importData || !importData.config) {
            throw new Error('Invalid import data');
        }

        const config = {
            ...importData.config,
            apiKey: apiKey, // Use provided API key
            lastUpdated: Date.now()
        };

        if (!this.validateConfig(config)) {
            throw new Error('Invalid configuration in import data');
        }

        return await this.setConfig(config);
    }

    // Test provider connection
    async testProviderConnection(config) {
        try {
            const provider = LLMProviderFactory.createProvider(config.type, config);
            
            // Initialize provider with API key
            await provider.initialize(config.apiKey);
            
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Create a singleton instance for easy import (when chrome is available)
export const providerConfig = typeof chrome !== 'undefined' ? new ProviderConfigManager() : null;