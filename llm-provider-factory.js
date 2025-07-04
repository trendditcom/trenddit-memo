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
    static hasVisionCapability(provider, model) {
        const providers = this.getAvailableProviders();
        const providerConfig = providers.find(p => p.id === provider);
        
        if (!providerConfig || !providerConfig.visionModels) {
            return false;
        }
        
        return providerConfig.visionModels.includes(model);
    }

    // Get vision models for all providers
    static getVisionModels() {
        const providers = this.getAvailableProviders();
        const visionModels = {};
        
        providers.forEach(provider => {
            if (provider.visionModels) {
                visionModels[provider.id] = provider.visionModels;
            }
        });
        
        return visionModels;
    }

    // Save vision capabilities to local storage
    static async saveVisionCapabilities() {
        try {
            const visionModels = this.getVisionModels();
            await chrome.storage.local.set({ visionCapabilities: visionModels });
            console.log('Vision capabilities saved to storage');
        } catch (error) {
            console.error('Failed to save vision capabilities:', error);
        }
    }

    // Load vision capabilities from local storage
    static async loadVisionCapabilities() {
        try {
            const result = await chrome.storage.local.get(['visionCapabilities']);
            return result.visionCapabilities || this.getVisionModels();
        } catch (error) {
            console.error('Failed to load vision capabilities:', error);
            return this.getVisionModels();
        }
    }

    // Check if current provider and model combination has vision capability
    static async getCurrentVisionCapability() {
        try {
            const result = await chrome.storage.local.get(['llmConfig']);
            if (!result.llmConfig) {
                return false;
            }

            const { type: provider, model } = result.llmConfig;
            return this.hasVisionCapability(provider, model);
        } catch (error) {
            console.error('Failed to get current vision capability:', error);
            return false;
        }
    }
} 