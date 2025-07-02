import { LLMProvider } from '../llm-provider-api.js';

export class OpenAIProvider extends LLMProvider {
    constructor(config = {}) {
        super(config);
        this.apiKey = null;
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        this.model = config.model || 'gpt-4';
    }

    async initialize(apiKey) {
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
            throw new Error('OpenAI API key is required');
        }

        if (!apiKey.startsWith('sk-')) {
            throw new Error('Invalid OpenAI API key format. OpenAI API keys start with "sk-"');
        }

        this.apiKey = apiKey;
        this.initialized = true;
        
        // Test connection by listing models
        try {
            await this.testConnection();
            return true;
        } catch (error) {
            throw new Error(`OpenAI API authentication failed: ${error.message}`);
        }
    }

    async testConnection() {
        // Check if provider is initialized first
        if (!this.apiKey) {
            throw new Error('Provider not initialized. Call initialize() first.');
        }

        // Test connection with actual LLM call to ensure full pipeline works
        try {
            const testMessages = [{ role: 'user', content: 'Hi' }];
            const response = await this.chat(testMessages, { 
                max_tokens: 10,  // Minimal tokens to reduce cost
                temperature: 0   // Deterministic response
            });
            
            if (response.success && response.reply) {
                return { status: 'connected', model: this.model };
            } else {
                throw new Error('Invalid response from OpenAI API');
            }
        } catch (error) {
            if (error.message.includes('rate limit')) {
                throw new Error('OpenAI API rate limit exceeded');
            } else if (error.message.includes('insufficient_quota')) {
                throw new Error('OpenAI API quota exceeded');
            } else if (error.message.includes('invalid_api_key')) {
                throw new Error('Invalid OpenAI API key');
            } else {
                throw new Error(`OpenAI connection test failed: ${error.message}`);
            }
        }
    }

    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized. Call initialize() first.');
        }

        // Filter out only API-specific options to avoid "unrecognized arguments" errors
        const apiOptions = {};
        const allowedOptions = ['temperature', 'max_tokens', 'top_p', 'frequency_penalty', 'presence_penalty', 'stop', 'stream', 'logit_bias'];
        
        allowedOptions.forEach(key => {
            if (options[key] !== undefined) {
                apiOptions[key] = options[key];
            }
        });

        const requestBody = {
            model: options.model || this.model,
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            max_tokens: options.max_tokens || 4096,
            temperature: options.temperature || 0.7,
            ...apiOptions
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `OpenAI API error: HTTP ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                reply: data.choices[0].message.content,
                usage: {
                    prompt_tokens: data.usage.prompt_tokens,
                    completion_tokens: data.usage.completion_tokens,
                    total_tokens: data.usage.total_tokens
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async processMemo(content, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized. Call initialize() first.');
        }

        // Sanitize content using inherited method
        const sanitizedContent = this.sanitizeContent(content);
        
        // Create system message for memo processing
        const systemPrompt = `You are an AI assistant that processes web content into structured memos. 
Extract key information from the provided HTML content and return a JSON object with the following structure:
{
    "title": "Main title or heading of the content",
    "summary": "A concise 2-3 sentence summary of the main points",
    "narrative": "A more detailed description of the content and its significance",
    "structuredData": {
        "key": "value pairs of important structured information"
    },
    "selectedTag": "A single relevant tag from: article, research, news, tutorial, reference, documentation, blog, social, product, company, person, event, other"
}

Return only valid JSON without any additional text or formatting.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedContent }
        ];

        try {
            const response = await this.chat(messages, {
                temperature: 0.3, // Lower temperature for more consistent structured output
                ...options
            });

            let parsedResponse;
            try {
                parsedResponse = JSON.parse(response.reply);
            } catch (parseError) {
                throw new Error('Failed to parse OpenAI response as JSON');
            }

            // Validate required fields
            const requiredFields = ['title', 'summary', 'narrative', 'structuredData', 'selectedTag'];
            for (const field of requiredFields) {
                if (!(field in parsedResponse)) {
                    parsedResponse[field] = field === 'structuredData' ? {} : '';
                }
            }

            return parsedResponse;
        } catch (error) {
            throw error;
        }
    }

    calculateTokens(text) {
        if (!text || typeof text !== 'string') {
            return 0;
        }

        // OpenAI GPT models use roughly 4 characters per token
        // This is an approximation - for exact counting, would need tiktoken
        const avgCharsPerToken = 4;
        return Math.ceil(text.length / avgCharsPerToken);
    }

    getAvailableModels() {
        return [
            'gpt-4',
            'gpt-4-turbo-preview',
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k'
        ];
    }

    getProviderInfo() {
        return {
            id: 'openai',
            name: 'OpenAI',
            description: 'GPT models by OpenAI',
            requiresApiKey: true,
            models: this.getAvailableModels()
        };
    }

    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        // Check if config is empty object
        if (Object.keys(config).length === 0) {
            return false;
        }

        // Check API key format
        if (!config.apiKey || typeof config.apiKey !== 'string' || !config.apiKey.startsWith('sk-')) {
            return false;
        }

        // Check model if provided
        if (config.model && !this.getAvailableModels().includes(config.model)) {
            return false;
        }

        return true;
    }
}