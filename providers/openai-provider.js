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
        
        // Test connection - but don't fail initialization if this fails
        // This allows the provider to be initialized even during temporary connectivity issues
        try {
            await this.testConnection();
            console.log('OpenAI provider test connection successful');
        } catch (error) {
            console.warn('OpenAI provider test connection failed, but proceeding with initialization:', error.message);
            // Continue with initialization - the actual API calls will show errors when they happen
        }
        
        this.initialized = true;
        return true;
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

        const { url, tags } = options;
        
        // Truncate content to prevent rate limit errors
        // Leave room for system message and JSON response (approximately 2000 tokens)
        const truncatedContent = this.truncateContent(content, 28000);
        
        // Sanitize content using inherited method
        const sanitizedContent = this.sanitizeContent(truncatedContent);
        
        // Create system message for memo processing
        const systemPrompt = `You are an AI assistant that processes web content into structured memos. 
        Given HTML content and a URL, you will:
        1. Extract and summarize the key information
        2. Create a narrative version
        3. Generate structured data
        4. Select the most appropriate tag from the available tags
        
        Special instructions for YouTube content:
        - If transcript is not available, focus on the video title, description, metadata, and channel information
        - Create a meaningful summary based on the available information
        - Do not return generic error messages like "content not accessible"
        - Always provide a substantive analysis based on the YouTube metadata provided
        
        Available tags: ${tags ? tags.map(t => t.name).join(', ') : 'general'}
        
        Return only valid JSON without any additional text or formatting.`;

        const userMessage = `Process this web content into a memo:
        URL: ${url || 'Unknown'}
        Content: ${sanitizedContent}
        
        Return the results in this JSON format:
        {
            "title": "Extracted title",
            "summary": "Brief summary",
            "narrative": "Narrative version",
            "structuredData": {}, // Relevant structured data
            "selectedTag": "Most appropriate tag"
        }`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
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

    async analyzeImage(imageData, prompt = "Explain what this image is about") {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }

        try {
            // Validate input data
            if (!imageData || typeof imageData !== 'object') {
                throw new Error('Invalid image data provided');
            }

            // Validate base64 data
            if (!imageData.base64 || typeof imageData.base64 !== 'string') {
                throw new Error('No base64 image data provided');
            }

            // Validate base64 format
            const base64Regex = /^[A-Za-z0-9+/]+=*$/;
            if (!base64Regex.test(imageData.base64)) {
                throw new Error('Invalid base64 format');
            }

            // Normalize media type
            let mediaType = imageData.mediaType || 'image/jpeg';
            mediaType = this.normalizeMediaType(mediaType);
            
            // Validate media type
            const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!acceptedTypes.includes(mediaType)) {
                console.warn(`Unsupported media type: ${mediaType}, defaulting to image/jpeg`);
                mediaType = 'image/jpeg';
            }

            console.log(`Analyzing image with OpenAI - media type: ${mediaType}, base64 length: ${imageData.base64.length}`);

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 1024,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mediaType};base64,${imageData.base64}`
                                    }
                                }
                            ]
                        }
                    ]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'OpenAI API request failed');
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response from OpenAI API');
            }

            return {
                success: true,
                analysis: data.choices[0].message.content,
                usage: data.usage
            };

        } catch (error) {
            console.error('Error analyzing image with OpenAI:', error);
            
            // Provide specific error messages for common issues
            if (error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else if (error.message.includes('quota')) {
                throw new Error('API quota exceeded. Please check your usage.');
            } else if (error.message.includes('authentication') || error.message.includes('Unauthorized')) {
                throw new Error('Authentication failed. Please check your API key.');
            } else if (error.message.includes('Invalid image')) {
                throw new Error('Unsupported image format. Please use JPEG, PNG, GIF, or WebP.');
            } else if (error.message.includes('Invalid base64')) {
                throw new Error('Invalid image data format. Please try again.');
            } else if (error.message.includes('API request failed')) {
                throw new Error('Failed to communicate with OpenAI API. Please check your connection.');
            } else {
                throw new Error(`Could not process image: ${error.message}`);
            }
        }
    }

    // Normalize media type for compatibility
    normalizeMediaType(mediaType) {
        if (!mediaType) return 'image/jpeg';
        
        // Remove parameters like charset
        mediaType = mediaType.split(';')[0].toLowerCase().trim();
        
        // Normalize variations
        if (mediaType === 'image/jpg') {
            return 'image/jpeg';
        }
        
        return mediaType;
    }
}