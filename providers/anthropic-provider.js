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
        
        // Handle both text and vision responses
        if (data.content && data.content.length > 0) {
            return {
                content: data.content.map(item => ({
                    text: item.text || item.content || ''
                })),
                usage: data.usage
            };
        } else {
            throw new Error('No content in API response');
        }
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
        
        // Test connection - but don't fail initialization if this fails
        // This allows the provider to be initialized even during temporary connectivity issues
        try {
            await this.testConnection();
            console.log('Anthropic provider test connection successful');
        } catch (error) {
            console.warn('Anthropic provider test connection failed, but proceeding with initialization:', error.message);
            // Continue with initialization - the actual API calls will show errors when they happen
        }
        
        this.initialized = true;
        return true;
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
        
        // Truncate content to prevent rate limit errors
        // Leave room for system message and JSON response (approximately 2000 tokens)
        const truncatedContent = this.truncateContent(content, 28000);
        
        const systemMessage = `You are an AI assistant that processes web content into structured memos. 
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
        
        Available tags: ${tags ? tags.map(t => t.name).join(', ') : 'general'}`;

        const userMessage = `Process this web content into a memo:
        URL: ${url || 'Unknown'}
        Content: ${this.sanitizeContent(truncatedContent)}
        
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

            // Parse JSON response with robust fallback strategies
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
                        
                        // Clean up common JSON formatting issues
                        jsonText = jsonText
                            .replace(/,\s*}/g, '}')  // Remove trailing commas
                            .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                            .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
                    }
                    
                    parsedResponse = JSON.parse(jsonText.trim());
                } catch (secondParseError) {
                    console.error('Anthropic response:', response.reply);
                    throw new Error(`Failed to parse Anthropic response as JSON. Response: ${response.reply.substring(0, 200)}...`);
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