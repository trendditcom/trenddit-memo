// Ollama Provider for local LLM integration
import { LLMProvider } from '../llm-provider-api.js';

export class OllamaProvider extends LLMProvider {
    constructor(config = {}) {
        super(config);
        this.host = config.host || 'localhost';
        this.port = config.port || 11434;
        this.baseUrl = `http://${this.host}:${this.port}`;
        this.model = config.model || 'llama2';
        this.availableModels = [];
        this.serviceAvailable = false;
    }

    async initialize(apiKey = null) {
        // Ollama doesn't use API keys, but we need to test service connectivity
        // Following Anthropic's pattern: don't fail initialization on connection issues
        try {
            await this.testConnection();
            await this.loadAvailableModels();
            console.log('Ollama provider test connection successful');
        } catch (error) {
            console.warn('Ollama provider test connection failed, but proceeding with initialization:', error.message);
            console.warn('Note: If you see CORS errors, ensure Ollama is configured with OLLAMA_ORIGINS=chrome-extension://* environment variable (note: ORIGINS with S!)');
            // Continue with initialization - actual API calls will show specific errors when they happen
            // This allows recovery from temporary connectivity issues
        }
        
        this.initialized = true;
        return true;
    }

    async testConnection() {
        console.log(`[Ollama Debug] Testing connection to ${this.baseUrl}/api/tags`);
        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            console.log(`[Ollama Debug] Making fetch request to ${this.baseUrl}/api/tags`);
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log(`[Ollama Debug] Received response with status: ${response.status}`);

            if (!response.ok) {
                console.error(`[Ollama Debug] Service responded with error status ${response.status}`);
                if (response.status === 403) {
                    const corsMessage = `Ollama CORS Error (403): Chrome extension requests are blocked.\n\n` +
                        `To fix this:\n` +
                        `1. Stop ALL Ollama processes: pkill ollama\n` +
                        `2. Set environment variable: OLLAMA_ORIGINS=chrome-extension://* (note: ORIGINS with S!)\n` +
                        `3. Restart Ollama service\n\n` +
                        `On macOS/Linux: OLLAMA_ORIGINS="chrome-extension://*" ollama serve\n` +
                        `On Windows: set OLLAMA_ORIGINS=chrome-extension://* && ollama serve\n\n` +
                        `Alternative (less secure): OLLAMA_ORIGINS="*" ollama serve\n\n` +
                        `See docs/ollama-setup.md for detailed instructions.`;
                    throw new Error(corsMessage);
                }
                throw new Error(`Service responded with status ${response.status}`);
            }

            this.serviceAvailable = true;
            console.log(`[Ollama Debug] Connection test successful`);
            return true;
        } catch (error) {
            this.serviceAvailable = false;
            console.error(`[Ollama Debug] Connection test failed:`, error);
            if (error.name === 'AbortError') {
                throw new Error(`Ollama service timeout - check if service is running on ${this.baseUrl}`);
            }
            throw new Error(`Ollama service not available: ${error.message}`);
        }
    }

    async loadAvailableModels() {
        console.log(`[Ollama Debug] Loading available models from ${this.baseUrl}/api/tags`);
        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            console.log(`[Ollama Debug] Making fetch request for models`);
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log(`[Ollama Debug] Models response status: ${response.status}`);

            if (!response.ok) {
                console.error(`[Ollama Debug] Failed to fetch models with status: ${response.status}`);
                if (response.status === 403) {
                    const corsMessage = `Ollama CORS Error (403): Chrome extension requests are blocked.\n\n` +
                        `To fix this:\n` +
                        `1. Stop ALL Ollama processes: pkill ollama\n` +
                        `2. Set environment variable: OLLAMA_ORIGINS=chrome-extension://* (note: ORIGINS with S!)\n` +
                        `3. Restart Ollama service\n\n` +
                        `On macOS/Linux: OLLAMA_ORIGINS="chrome-extension://*" ollama serve\n` +
                        `On Windows: set OLLAMA_ORIGINS=chrome-extension://* && ollama serve\n\n` +
                        `Alternative (less secure): OLLAMA_ORIGINS="*" ollama serve\n\n` +
                        `See docs/ollama-setup.md for detailed instructions.`;
                    throw new Error(corsMessage);
                }
                throw new Error(`Failed to fetch models: ${response.status}`);
            }

            const data = await response.json();
            console.log(`[Ollama Debug] Raw models data:`, data);
            this.availableModels = data.models || [];
            console.log(`[Ollama Debug] Parsed ${this.availableModels.length} models:`, this.availableModels.map(m => m.name || m));
            
            // If no model is selected and models are available, use the first one
            if (!this.model && this.availableModels.length > 0) {
                this.model = this.availableModels[0].name;
                console.log(`[Ollama Debug] Auto-selected model: ${this.model}`);
            }
        } catch (error) {
            console.error(`[Ollama Debug] Error loading models:`, error);
            if (error.name === 'AbortError') {
                console.warn('Loading models timed out:', error.message);
            } else {
                console.warn('Failed to load available models:', error.message);
            }
            this.availableModels = [];
        }
    }

    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }

        if (!this.model) {
            throw new Error('No model selected for Ollama');
        }

        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for chat

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: false,
                    options: {
                        temperature: options.temperature || 0.7,
                        // Only include valid Ollama options
                        ...(options.top_p && { top_p: options.top_p }),
                        ...(options.top_k && { top_k: options.top_k }),
                        ...(options.repeat_penalty && { repeat_penalty: options.repeat_penalty }),
                        ...(options.seed && { seed: options.seed }),
                        ...(options.num_predict && { num_predict: options.num_predict })
                    }
                })
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 403) {
                    const corsMessage = `Ollama CORS Error (403): Chrome extension requests are blocked.\n\n` +
                        `To fix this:\n` +
                        `1. Stop ALL Ollama processes: pkill ollama\n` +
                        `2. Set environment variable: OLLAMA_ORIGINS=chrome-extension://* (note: ORIGINS with S!)\n` +
                        `3. Restart Ollama service\n\n` +
                        `On macOS/Linux: OLLAMA_ORIGINS="chrome-extension://*" ollama serve\n` +
                        `On Windows: set OLLAMA_ORIGINS=chrome-extension://* && ollama serve\n\n` +
                        `Alternative (less secure): OLLAMA_ORIGINS="*" ollama serve\n\n` +
                        `See docs/ollama-setup.md for detailed instructions.`;
                    throw new Error(corsMessage);
                }
                throw new Error(`Ollama chat failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                content: data.message?.content || '',
                usage: {
                    prompt_tokens: data.prompt_eval_count || 0,
                    completion_tokens: data.eval_count || 0,
                    total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                }
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Ollama chat timeout - model may be slow or service unavailable`);
            }
            throw new Error(`Ollama chat error: ${error.message}`);
        }
    }

    async processMemo(content, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }

        const systemPrompt = `You are a helpful AI assistant. Process the following webpage content and extract:
1. A concise title (max 100 characters)
2. A brief summary (max 300 characters)
3. A narrative description (max 500 characters)
4. Any structured data (if applicable) - return as JSON object
5. Suggested tags (return array of strings)

Please respond in JSON format with these fields: title, summary, narrative, structured_data, suggested_tags.

Important: Ensure your response is valid JSON that can be parsed.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: this.sanitizeContent(content) }
        ];

        try {
            // Filter out non-Ollama options (url, tags) before passing to chat
            const chatOptions = {
                temperature: options.temperature || 0.7
            };
            const response = await this.chat(messages, chatOptions);
            
            // Parse the JSON response
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(response.content);
            } catch (parseError) {
                // Fallback if JSON parsing fails
                parsedResponse = {
                    title: 'Processed Content',
                    summary: 'Content processed by local model',
                    narrative: response.content.substring(0, 500),
                    structured_data: {},
                    suggested_tags: ['local']
                };
            }

            return {
                title: parsedResponse.title || 'Untitled',
                summary: parsedResponse.summary || 'No summary available',
                narrative: parsedResponse.narrative || 'No narrative available',
                structuredData: parsedResponse.structured_data || {},
                selectedTag: parsedResponse.suggested_tags?.[0] || 'general'
            };
        } catch (error) {
            // Provide more context for CORS errors
            if (error.message.includes('CORS Error')) {
                throw new Error(`Memo processing failed: ${error.message}`);
            }
            // Add suggestion to check Ollama service for other errors
            throw new Error(`Memo processing failed: ${error.message}. Please ensure Ollama service is running and accessible.`);
        }
    }

    calculateTokens(text) {
        // Rough token estimate for Ollama models (similar to other providers)
        // This is an approximation; actual token counting varies by model
        return Math.ceil(text.length / 4);
    }

    getAvailableModels() {
        return this.availableModels;
    }

    // Additional Ollama-specific methods
    async getModelInfo(modelName = null) {
        const model = modelName || this.model;
        if (!model) {
            throw new Error('No model specified');
        }

        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${this.baseUrl}/api/show`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({ name: model })
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to get model info: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Model info timeout - check if service is running`);
            }
            throw new Error(`Model info error: ${error.message}`);
        }
    }

    async pullModel(modelName) {
        try {
            // Add timeout to prevent hanging (longer timeout for model downloads)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for model pull

            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({ name: modelName })
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.status}`);
            }

            // Note: This is a streaming endpoint, in a real implementation
            // you might want to handle the stream for progress updates
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Model pull timeout - download may be slow or service unavailable`);
            }
            throw new Error(`Model pull error: ${error.message}`);
        }
    }

    // Validate configuration
    static validateConfig(config) {
        if (config.host && !this.isValidHost(config.host)) {
            throw new Error('Invalid host configuration');
        }

        if (config.port) {
            const port = parseInt(config.port);
            if (!Number.isInteger(port) || port < 1 || port > 65535) {
                throw new Error('Invalid port configuration - must be between 1 and 65535');
            }
        }

        return true;
    }

    static isValidHost(host) {
        // Simple validation for localhost, IP addresses, or hostnames
        const localhostRegex = /^(localhost|127\.0\.0\.1|::1)$/;
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
        
        return localhostRegex.test(host) || ipRegex.test(host) || hostnameRegex.test(host);
    }

    // Get service status
    getServiceStatus() {
        return {
            available: this.serviceAvailable,
            initialized: this.initialized,
            host: this.host,
            port: this.port,
            baseUrl: this.baseUrl,
            model: this.model,
            modelsCount: this.availableModels.length
        };
    }
}