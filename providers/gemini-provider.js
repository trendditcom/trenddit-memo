import { LLMProvider } from '../llm-provider-api.js';

export class GeminiProvider extends LLMProvider {
    constructor(config = {}) {
        super(config);
        this.apiKey = null;
        this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1';
        this.model = config.model || 'gemini-2.5-pro';
    }

    async initialize(apiKey) {
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
            throw new Error('Google AI API key is required');
        }

        if (!apiKey.startsWith('AIza')) {
            throw new Error('Invalid Google AI API key format. Google AI API keys start with "AIza"');
        }

        this.apiKey = apiKey;
        this.initialized = true;
        
        // Test connection by listing models
        try {
            await this.testConnection();
            return true;
        } catch (error) {
            throw new Error(`Google AI API authentication failed: ${error.message}`);
        }
    }

    async testConnection() {
        // Check if provider is initialized first
        if (!this.apiKey) {
            throw new Error('Provider not initialized. Call initialize() first.');
        }

        // Test connection with a simple models list request first
        try {
            const response = await fetch(
                `${this.baseUrl}/models?key=${this.apiKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 403) {
                    throw new Error('Invalid Gemini API key or insufficient permissions');
                } else if (response.status === 429) {
                    throw new Error('Gemini API quota exceeded or rate limit exceeded');
                } else {
                    throw new Error(errorData.error?.message || `Google AI API error: HTTP ${response.status}`);
                }
            }

            // If models list succeeds, do a minimal content generation test
            const testMessages = [{ role: 'user', content: 'Test' }];
            const chatResponse = await this.chat(testMessages, { 
                max_tokens: 50,
                temperature: 0
            });
            
            if (chatResponse.success && chatResponse.reply) {
                return { status: 'connected', model: this.model };
            } else {
                throw new Error('Connection established but content generation failed');
            }
        } catch (error) {
            if (error.message.includes('PERMISSION_DENIED')) {
                throw new Error('Invalid Gemini API key or insufficient permissions');
            } else if (error.message.includes('QUOTA_EXCEEDED')) {
                throw new Error('Gemini API quota exceeded');
            } else if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
                throw new Error('Gemini API rate limit exceeded');
            } else {
                throw new Error(`Gemini connection test failed: ${error.message}`);
            }
        }
    }

    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized. Call initialize() first.');
        }

        // Convert messages to Gemini format
        const contents = this.formatMessagesForGemini(messages);

        // Filter out only API-specific options to avoid issues with extra arguments
        const generationConfig = {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.max_tokens || 4096,
            topP: options.topP || 0.8,
            topK: options.topK || 40
        };

        const requestBody = {
            contents: contents,
            generationConfig: generationConfig,
            safetySettings: options.safetySettings || this.getDefaultSafetySettings()
        };

        try {
            const response = await fetch(
                `${this.baseUrl}/models/${options.model || this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Google AI API error: HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Handle safety filtering
            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                throw new Error('Content was blocked by safety filters');
            }

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                // More detailed error handling for empty responses
                if (data.candidates?.[0]?.finishReason) {
                    throw new Error(`Gemini response blocked: ${data.candidates[0].finishReason}`);
                } else if (!data.candidates || data.candidates.length === 0) {
                    throw new Error('No candidates returned by Gemini API - possible content filtering');
                } else {
                    throw new Error('No response generated by Gemini - empty response content');
                }
            }

            return {
                success: true,
                reply: data.candidates[0].content.parts[0].text,
                usage: {
                    prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
                    completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
                    total_tokens: data.usageMetadata?.totalTokenCount || 0
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
        
        // Create system prompt for memo processing
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

Return only valid JSON without any additional text or formatting.

Content to process:
${sanitizedContent}`;

        const messages = [
            { role: 'user', content: systemPrompt }
        ];

        try {
            const response = await this.chat(messages, {
                temperature: 0.3, // Lower temperature for more consistent structured output
                model: 'gemini-2.5-flash', // Use efficient model for text processing
                ...options
            });

            let parsedResponse;
            try {
                // First try to parse as-is
                parsedResponse = JSON.parse(response.reply);
            } catch (parseError) {
                // Try to extract JSON from markdown code blocks or other formatting
                try {
                    let jsonText = response.reply;
                    
                    // Remove markdown code blocks if present
                    const jsonBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
                    if (jsonBlockMatch) {
                        jsonText = jsonBlockMatch[1];
                    }
                    
                    // Try to find JSON object boundaries
                    const openBrace = jsonText.indexOf('{');
                    const closeBrace = jsonText.lastIndexOf('}');
                    
                    if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
                        jsonText = jsonText.substring(openBrace, closeBrace + 1);
                    }
                    
                    parsedResponse = JSON.parse(jsonText.trim());
                } catch (secondParseError) {
                    console.error('Gemini response:', response.reply);
                    throw new Error(`Failed to parse Gemini response as JSON. Response: ${response.reply.substring(0, 200)}...`);
                }
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

    formatMessagesForGemini(messages) {
        const contents = [];
        
        for (const message of messages) {
            // Convert role format
            const role = message.role === 'assistant' ? 'model' : 'user';
            
            contents.push({
                role: role,
                parts: [{ text: message.content }]
            });
        }
        
        return contents;
    }

    calculateTokens(text) {
        if (!text || typeof text !== 'string') {
            return 0;
        }

        // Gemini models use roughly 4 characters per token (similar to GPT)
        // This is an approximation - for exact counting, would need Gemini's tokenizer
        const avgCharsPerToken = 4;
        return Math.ceil(text.length / avgCharsPerToken);
    }

    getAvailableModels() {
        return [
            'gemini-2.5-pro',
            'gemini-2.5-flash',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-pro',
            'gemini-pro-vision'
        ];
    }

    getProviderInfo() {
        return {
            id: 'gemini',
            name: 'Google Gemini',
            description: 'Gemini AI models by Google',
            requiresApiKey: true,
            models: this.getAvailableModels(),
            supportsVision: true,
            supportsSystemMessages: false // Gemini doesn't have explicit system messages
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
        if (!config.apiKey || typeof config.apiKey !== 'string' || !config.apiKey.startsWith('AIza')) {
            return false;
        }

        // Check model if provided
        if (config.model && !this.getAvailableModels().includes(config.model)) {
            return false;
        }

        return true;
    }

    getDefaultSafetySettings() {
        return [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
        ];
    }

    getSafetySettings(level = 'BLOCK_MEDIUM_AND_ABOVE') {
        const categories = [
            'HARM_CATEGORY_HARASSMENT',
            'HARM_CATEGORY_HATE_SPEECH',
            'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            'HARM_CATEGORY_DANGEROUS_CONTENT'
        ];

        return categories.map(category => ({
            category: category,
            threshold: level
        }));
    }

    getGenerationConfig(options = {}) {
        return {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 4096,
            topP: options.topP || 0.8,
            topK: options.topK || 40,
            candidateCount: 1 // Gemini currently only supports 1
        };
    }
}