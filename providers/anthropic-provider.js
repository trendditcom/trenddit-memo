// AnthropicProvider implementation extending LLMProvider base class
import { LLMProvider } from '../llm-provider-api.js';

// Browser-compatible Anthropic client
class AnthropicClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.anthropic.com/v1';
    }

    async messages(options) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: options.model || "claude-sonnet-4-20250514",
                max_tokens: options.max_tokens || 4096,
                system: options.system,
                messages: options.messages
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return {
            content: [{ text: data.content[0].text }],
            usage: data.usage
        };
    }
}

// Anthropic provider implementation
export class AnthropicProvider extends LLMProvider {
    constructor(config = {}) {
        super(config);
        this.apiKey = null;
        this.client = null;
        this.baseUrl = 'https://api.anthropic.com/v1';
        this.model = config.model || 'claude-sonnet-4-20250514';
    }

    async initialize(apiKey) {
        if (!apiKey) {
            throw new Error('Anthropic API key is required');
        }
        
        this.apiKey = apiKey;
        this.client = new AnthropicClient(apiKey);
        
        // Test connection
        try {
            await this.testConnection();
            this.initialized = true;
            return true;
        } catch (error) {
            throw new Error(`Failed to initialize Anthropic provider: ${error.message}`);
        }
    }

    async testConnection() {
        if (!this.client) {
            throw new Error('Client not initialized');
        }

        // Simple test message
        const response = await this.client.messages({
            model: this.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Test' }]
        });
        
        return response.content && response.content.length > 0;
    }

    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }

        // Extract system message if it exists
        const systemMessage = messages.find(m => m.role === 'system')?.content;
        const chatMessages = messages.filter(m => m.role !== 'system');

        try {
            // Filter out only API-specific options to avoid potential issues
            const apiOptions = {};
            const allowedOptions = ['temperature', 'top_p', 'top_k', 'stream', 'stop_sequences'];
            
            allowedOptions.forEach(key => {
                if (options[key] !== undefined) {
                    apiOptions[key] = options[key];
                }
            });

            const response = await this.client.messages({
                model: options.model || this.model,
                max_tokens: options.max_tokens || 4096,
                system: systemMessage,
                messages: chatMessages,
                ...apiOptions
            });

            return {
                success: true,
                reply: response.content[0].text,
                usage: response.usage
            };
        } catch (error) {
            console.error('Anthropic chat API error:', error);
            throw new Error(`Chat failed: ${error.message}`);
        }
    }

    async processMemo(content, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }

        const { url, tags } = options;
        
        const systemMessage = `You are an AI assistant that processes web content into structured memos. 
        Given HTML content and a URL, you will:
        1. Extract and summarize the key information
        2. Create a narrative version
        3. Generate structured data
        4. Select the most appropriate tag from the available tags
        
        Available tags: ${tags ? tags.map(t => t.name).join(', ') : 'general'}`;

        const userMessage = `Process this web content into a memo:
        URL: ${url || 'Unknown'}
        Content: ${this.sanitizeContent(content)}
        
        Return the results in this JSON format:
        {
            "title": "Extracted title",
            "summary": "Brief summary",
            "narrative": "Narrative version",
            "structuredData": {}, // Relevant structured data
            "selectedTag": "Most appropriate tag"
        }`;

        try {
            const response = await this.chat([
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage }
            ], options);

            // Parse JSON response
            const jsonMatch = response.reply.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from API');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error processing memo with Anthropic:', error);
            throw new Error(`Memo processing failed: ${error.message}`);
        }
    }

    calculateTokens(text) {
        if (!text) return 0;
        // Rough approximation: 1 token ≈ 4 characters for English text
        // Anthropic uses a more sophisticated tokenizer, but this is a reasonable estimate
        return Math.ceil(text.length / 4);
    }

    // Get available models
    getAvailableModels() {
        return [
            'claude-opus-4-20250514',
            'claude-sonnet-4-20250514',
            'claude-3-7-sonnet-20250219',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022'
        ];
    }

    // Get provider info
    getProviderInfo() {
        return {
            id: 'anthropic',
            name: 'Anthropic Claude',
            description: 'Claude AI by Anthropic',
            requiresApiKey: true,
            models: this.getAvailableModels(),
            baseUrl: this.baseUrl
        };
    }

    // Validate configuration
    validateConfig(config) {
        if (!config.apiKey) {
            throw new Error('Anthropic API key is required');
        }
        
        if (config.model && !this.getAvailableModels().includes(config.model)) {
            throw new Error(`Invalid model: ${config.model}`);
        }
        
        return true;
    }
}