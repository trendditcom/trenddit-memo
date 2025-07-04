import { AnthropicProvider } from './providers/anthropic-provider.js';
import { OpenAIProvider } from './providers/openai-provider.js';
import { GeminiProvider } from './providers/gemini-provider.js';
import { OllamaProvider } from './providers/ollama-provider.js';

// Factory class for creating LLM provider instances
export class LLMProviderFactory {
    static createProvider(type, config) {
        switch (type) {
            case 'anthropic':
                return new AnthropicProvider(config);
            case 'openai':
                return new OpenAIProvider(config);
            case 'gemini':
                return new GeminiProvider(config);
            case 'ollama':
                return new OllamaProvider(config);
            default:
                throw new Error(`Provider type '${type}' not implemented yet`);
        }
    }

    // Get list of available providers
    static getAvailableProviders() {
        return [
            {
                id: 'anthropic',
                name: 'Anthropic Claude',
                description: 'Claude AI by Anthropic',
                requiresApiKey: true,
                models: [
                    'claude-opus-4-20250514',
                    'claude-sonnet-4-20250514',
                    'claude-3-7-sonnet-20250219',
                    'claude-3-5-sonnet-20241022',
                    'claude-3-5-haiku-20241022'
                ],
                visionModels: [
                    'claude-opus-4-20250514',
                    'claude-sonnet-4-20250514',
                    'claude-3-7-sonnet-20250219',
                    'claude-3-5-sonnet-20241022',
                    'claude-3-5-haiku-20241022'
                ]
            },
            {
                id: 'openai',
                name: 'OpenAI',
                description: 'GPT models by OpenAI',
                requiresApiKey: true,
                models: [
                    'o4-mini',
                    'gpt-4o',
                    'gpt-4.1',
                    'gpt-4.1-mini'
                ],
                visionModels: [
                    'o4-mini',
                    'gpt-4o',
                    'gpt-4.1',
                    'gpt-4.1-mini'
                ]
},
            {
                id: 'gemini',
                name: 'Google Gemini',
                description: 'Gemini AI models by Google',
                requiresApiKey: true,
                models: [
                    'gemini-2.5-pro',
                    'gemini-2.5-flash',
                    'gemini-1.5-pro',
                    'gemini-1.5-flash',
                    'gemini-pro',
                    'gemini-pro-vision'
                ],
                visionModels: [
                    'gemini-2.5-pro',
                    'gemini-2.5-flash',
                    'gemini-1.5-pro',
                    'gemini-1.5-flash',
                    'gemini-pro-vision'
                ]
            },
            {
                id: 'ollama',
                name: 'Ollama (Local)',
                description: 'Local LLM runner - privacy-focused',
                requiresApiKey: false,
                requiresService: true,
                models: [], // Will be populated dynamically
                isLocal: true,
                visionModels: [
                    'llava',
                    'bakllava',
                    'llava-llama3',
                    'llava-phi3',
                    'llava-v1.6',
                    'moondream'
                ]
            }
        ];
    }

    // Validate provider configuration
    static validateConfig(type, config) {
        switch (type) {
            case 'anthropic':
                if (!config.apiKey) {
                    throw new Error('Anthropic API key is required');
                }
                break;
            case 'openai':
                if (!config.apiKey) {
                    throw new Error('OpenAI API key is required');
                }
                if (!config.apiKey.startsWith('sk-')) {
                    throw new Error('Invalid OpenAI API key format');
                }
                break;
            case 'gemini':
                if (!config.apiKey) {
                    throw new Error('Google AI API key is required for Gemini');
                }
                if (!config.apiKey.startsWith('AIza')) {
                    throw new Error('Invalid Google AI API key format for Gemini');
                }
                break;
            case 'ollama':
                // Validate host/port configuration for Ollama
                if (config.host && !OllamaProvider.isValidHost(config.host)) {
                    throw new Error('Invalid host configuration for Ollama');
                }
                if (config.port && (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)) {
                    throw new Error('Invalid port configuration for Ollama - must be between 1 and 65535');
                }
                break;
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }

    // Check if a specific model has vision capabilities
    static hasVisionCapability(providerType, modelName) {
        const providers = this.getAvailableProviders();
        const provider = providers.find(p => p.id === providerType);
        
        if (!provider) {
            return false;
        }

        // For Ollama, check if model name contains vision keywords
        if (providerType === 'ollama') {
            if (!modelName) return false;
            const visionKeywords = provider.visionModels;
            return visionKeywords.some(keyword => 
                modelName.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        // For other providers, check if model is in visionModels list
        return provider.visionModels && provider.visionModels.includes(modelName);
    }

    // Get all vision-capable models for a provider
    static getVisionModels(providerType) {
        const providers = this.getAvailableProviders();
        const provider = providers.find(p => p.id === providerType);
        
        if (!provider) {
            return [];
        }

        return provider.visionModels || [];
    }

    // Save vision capabilities to local storage
    static async saveVisionCapabilities() {
        try {
            const providers = this.getAvailableProviders();
            const visionData = {};

            for (const provider of providers) {
                visionData[provider.id] = {
                    name: provider.name,
                    hasVision: !!(provider.visionModels && provider.visionModels.length > 0),
                    visionModels: provider.visionModels || [],
                    allModels: provider.models || []
                };
            }

            // Save to local storage
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await new Promise((resolve, reject) => {
                    chrome.storage.local.set({ visionCapabilities: visionData }, () => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve();
                        }
                    });
                });
            }

            return visionData;
        } catch (error) {
            console.error('Failed to save vision capabilities:', error);
            throw error;
        }
    }

    // Load vision capabilities from local storage
    static async loadVisionCapabilities() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                return new Promise((resolve, reject) => {
                    chrome.storage.local.get(['visionCapabilities'], (result) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(result.visionCapabilities || null);
                        }
                    });
                });
            }
            return null;
        } catch (error) {
            console.error('Failed to load vision capabilities:', error);
            return null;
        }
    }

    // Check if current provider and model has vision capability
    static async getCurrentVisionCapability() {
        try {
            // Get current configuration
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await new Promise((resolve, reject) => {
                    chrome.storage.local.get(['llmConfig'], (result) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(result.llmConfig || null);
                        }
                    });
                });

                if (result && result.type && result.model) {
                    return this.hasVisionCapability(result.type, result.model);
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to get current vision capability:', error);
            return false;
        }
    }
} 