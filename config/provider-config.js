// Provider configuration management system
import { LLMProviderFactory } from '../llm-provider-factory.js';
import { saveToStorage } from '../storage.js';

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

            this.storage.local.get(['llmProviderConfigs', 'activeProvider', 'llmConfig'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                // Handle legacy single config format
                if (result.llmConfig && !result.llmProviderConfigs) {
                    resolve(result.llmConfig);
                    return;
                }
                
                const configs = result.llmProviderConfigs || {};
                const activeProvider = result.activeProvider;
                
                if (activeProvider && configs[activeProvider]) {
                    resolve(configs[activeProvider]);
                } else {
                    resolve(null);
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

            // Get current provider configs and update the specific provider
            this.storage.local.get(['llmProviderConfigs'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                const currentConfigs = result.llmProviderConfigs || {};
                const updatedConfigs = {
                    ...currentConfigs,
                    [config.type]: configWithTimestamp
                };

                // Save both the provider-specific configs and set active provider
                const saveData = {
                    llmProviderConfigs: updatedConfigs,
                    activeProvider: config.type,
                    // Keep legacy format for backward compatibility
                    llmConfig: configWithTimestamp
                };

                // Use centralized storage function to ensure backup
                Promise.all([
                    saveToStorage('llmProviderConfigs', updatedConfigs),
                    saveToStorage('activeProvider', config.type),
                    saveToStorage('llmConfig', configWithTimestamp)
                ])
                .then(() => resolve(true))
                .catch(error => reject(error));
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

        // Validate model if specified (skip for dynamic providers like Ollama)
        if (config.model) {
            const provider = availableProviders.find(p => p.id === config.type);
            if (provider && provider.models.length > 0 && !provider.models.includes(config.model)) {
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

            this.storage.local.get(['anthropicApiKey', 'llmConfig', 'llmProviderConfigs'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                // If new format already exists, no migration needed
                if (result.llmProviderConfigs) {
                    resolve(false);
                    return;
                }

                let migrationNeeded = false;
                const providerConfigs = {};

                // Migrate existing llmConfig to new format
                if (result.llmConfig) {
                    providerConfigs[result.llmConfig.type] = {
                        ...result.llmConfig,
                        migrated: true
                    };
                    migrationNeeded = true;
                }

                // Migrate legacy anthropicApiKey
                if (result.anthropicApiKey && !providerConfigs.anthropic) {
                    providerConfigs.anthropic = {
                        type: 'anthropic',
                        apiKey: result.anthropicApiKey,
                        model: 'claude-3-5-sonnet-20241022',
                        migrated: true,
                        lastUpdated: Date.now()
                    };
                    migrationNeeded = true;
                }

                if (migrationNeeded) {
                    // Determine active provider (prefer current llmConfig type, fallback to anthropic)
                    const activeProvider = result.llmConfig?.type || 'anthropic';
                    
                    const migrationData = {
                        llmProviderConfigs: providerConfigs,
                        activeProvider: activeProvider
                    };

                    this.storage.local.set(migrationData, () => {
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
        return new Promise((resolve, reject) => {
            if (!this.storage) {
                reject(new Error('Chrome storage not available'));
                return;
            }

            this.storage.local.get(['llmProviderConfigs', 'llmConfig'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                // Check new format first
                const configs = result.llmProviderConfigs || {};
                if (configs[providerType]) {
                    resolve(configs[providerType]);
                    return;
                }
                
                // Fall back to legacy format if the requested provider matches current config
                if (result.llmConfig && result.llmConfig.type === providerType) {
                    resolve(result.llmConfig);
                    return;
                }
                
                resolve(null);
            });
        });
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

        // Validate model for the provider (skip validation for dynamic providers like Ollama)
        const provider = this.getAvailableProviders().find(p => p.id === config.type);
        if (!provider) {
            throw new Error(`Unknown provider ${config.type}`);
        }
        
        // Only validate predefined models for providers that have them
        if (provider.models.length > 0 && !provider.models.includes(model)) {
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
    createDefaultConfig(providerType, apiKey = null) {
        const providers = this.getAvailableProviders();
        const provider = providers.find(p => p.id === providerType);
        
        if (!provider) {
            throw new Error(`Unknown provider: ${providerType}`);
        }

        const config = {
            type: providerType,
            lastUpdated: Date.now()
        };

        // Add API key only for providers that require it
        if (provider.requiresApiKey) {
            config.apiKey = apiKey;
        }

        // Add model (first available model or default for Ollama)
        if (provider.models.length > 0) {
            config.model = provider.models[0];
        } else if (providerType === 'ollama') {
            config.model = 'llama2';
            config.host = 'localhost';
            config.port = 11434;
        }

        return config;
    }

    // Switch to a different provider
    async switchProvider(providerType, apiKey = null) {
        // Try to get existing config for this provider first
        let config = await this.getProviderConfig(providerType);
        
        if (!config) {
            // Create default config if none exists
            config = this.createDefaultConfig(providerType, apiKey);
        } else if (apiKey) {
            // Update API key if provided
            config = { ...config, apiKey, lastUpdated: Date.now() };
        }
        
        // Update active provider without changing the config itself
        return new Promise((resolve, reject) => {
            if (!this.storage) {
                reject(new Error('Chrome storage not available'));
                return;
            }

            Promise.all([
                saveToStorage('activeProvider', providerType),
                saveToStorage('llmConfig', config) // Update legacy format for compatibility
            ])
            .then(() => resolve(true))
            .catch(error => reject(error));
        });
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
            
            // Initialize provider (API key for cloud providers, service test for local providers)
            if (config.type === 'ollama') {
                await provider.initialize(); // No API key for Ollama
            } else {
                await provider.initialize(config.apiKey);
            }
            
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Ollama-specific methods
    async getOllamaConfig() {
        const config = await this.getCurrentConfig();
        if (!config || config.type !== 'ollama') {
            return {
                host: 'localhost',
                port: 11434,
                model: '',
                enabled: false
            };
        }
        return {
            host: config.host || 'localhost',
            port: config.port || 11434,
            model: config.model || '',
            enabled: true
        };
    }

    async saveOllamaConfig(ollamaConfig) {
        const config = {
            type: 'ollama',
            host: ollamaConfig.host || 'localhost',
            port: ollamaConfig.port || 11434,
            model: ollamaConfig.model || '',
            lastUpdated: Date.now()
        };

        return await this.setConfig(config);
    }

    async testOllamaConnection(ollamaConfig) {
        console.log('[Config Debug] Testing Ollama connection with config:', ollamaConfig);
        try {
            const provider = LLMProviderFactory.createProvider('ollama', ollamaConfig);
            console.log('[Config Debug] Created Ollama provider, testing connection');
            await provider.testConnection();
            console.log('[Config Debug] Connection test passed, loading models');
            await provider.loadAvailableModels();
            const models = provider.getAvailableModels();
            console.log('[Config Debug] Models loaded:', models);
            
            return {
                success: true,
                models: models
            };
        } catch (error) {
            console.error('[Config Debug] Ollama connection test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAvailableOllamaModels(ollamaConfig = null) {
        try {
            const config = ollamaConfig || await this.getOllamaConfig();
            const provider = LLMProviderFactory.createProvider('ollama', config);
            await provider.testConnection();
            await provider.loadAvailableModels();
            
            return {
                success: true,
                models: provider.getAvailableModels()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                models: []
            };
        }
    }
}

// Create a singleton instance for easy import (when chrome is available)
export const providerConfig = typeof chrome !== 'undefined' ? new ProviderConfigManager() : null;