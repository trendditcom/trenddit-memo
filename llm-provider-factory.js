import { AnthropicProvider } from './providers/anthropic-provider.js';
import { OpenAIProvider } from './providers/openai-provider.js';
import { GeminiProvider } from './providers/gemini-provider.js';

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
                supportsVision: true
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
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }
} 