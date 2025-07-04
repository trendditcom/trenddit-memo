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
        // Retry configuration for intermittent connection issues
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000; // 1 second default
        this.retryCount = 0;
        
        // Performance optimizations
        this.modelCache = new Map(); // Cache model info and capabilities
        this.connectionPool = null; // Keep connection warm
        this.performanceProfile = null; // Store model performance characteristics
        this.optimizedTimeouts = {
            connection: 15000,     // 15s for connection tests
            chat: 120000,          // 2min for chat (increased for local models)
            memo: 180000,          // 3min for memo processing
            modelPull: 600000      // 10min for model downloads
        };
        
        // Progress tracking
        this.progressCallback = config.progressCallback || null;
        this.currentOperation = null;
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

        // Performance optimization: Build profile if needed (skip if this is profiling call)
        if (!options.skipProfiling && !this.performanceProfile) {
            await this.warmConnection();
            // Don't await profiling to avoid circular dependency
            this.buildPerformanceProfile().catch(err => 
                console.warn('[Ollama Performance] Background profiling failed:', err.message)
            );
        }

        // Report progress for longer operations
        this.reportProgress('chat', 'starting', 0, `Using model: ${this.model}`);

        // Define the chat function to retry
        const performChat = async () => {
            // Use optimized timeout based on model performance
            const timeout = this.getOptimizedTimeout('chat');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
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

                this.reportProgress('chat', 'processing', 50, 'Parsing response');
                const data = await response.json();
                
                this.reportProgress('chat', 'completed', 100, 'Response received');
                
                return {
                    content: data.message?.content || '',
                    usage: {
                        prompt_tokens: data.prompt_eval_count || 0,
                        completion_tokens: data.eval_count || 0,
                        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                    }
                };
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    this.reportProgress('chat', 'timeout', 0, `Timeout after ${timeout}ms`);
                    throw new Error(`Ollama chat timeout after ${timeout}ms - model may be slow or service unavailable`);
                }
                throw error;
            }
        };

        // Use retry logic for the chat operation
        try {
            const result = await this.retryWithBackoff(performChat);
            
            // Update performance metrics if we have a profile
            if (this.performanceProfile && result.usage) {
                const currentTime = Date.now();
                const timeSinceStart = currentTime - (this.performanceProfile.lastChatStart || currentTime);
                if (timeSinceStart > 0) {
                    const tokensPerSecond = result.usage.total_tokens / (timeSinceStart / 1000);
                    // Update rolling average
                    this.performanceProfile.avgTokensPerSecond = 
                        (this.performanceProfile.avgTokensPerSecond + tokensPerSecond) / 2;
                }
            }
            
            return result;
        } catch (error) {
            this.reportProgress('chat', 'error', 0, error.message);
            throw new Error(`Ollama chat error: ${error.message}`);
        }
    }

    async processMemo(content, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }

        // Report progress for memo processing
        this.reportProgress('memo', 'starting', 0, 'Processing web content');

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
            // Filter out non-Ollama options (url, tags) before passing to chat
            const chatOptions = {
                temperature: options.temperature || 0.7
            };
            
            this.reportProgress('memo', 'analyzing', 30, 'Analyzing content structure');
            
            const response = await this.chat([
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage }
            ], chatOptions);

            this.reportProgress('memo', 'parsing', 80, 'Extracting structured data');

            // Parse JSON response - try to find JSON in the response like Anthropic does
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from API');
            }

            const result = JSON.parse(jsonMatch[0]);
            this.reportProgress('memo', 'completed', 100, 'Memo processing complete');
            
            return result;
        } catch (error) {
            this.reportProgress('memo', 'error', 0, error.message);
            console.error('Error processing memo with Ollama:', error);
            throw new Error(`Memo processing failed: ${error.message}`);
        }
    }

    calculateTokens(text) {
        // Use optimized token counting for better accuracy
        return this.optimizeTokenCounting(text);
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

    // Performance optimization methods
    async buildPerformanceProfile() {
        if (!this.model || this.performanceProfile) {
            return this.performanceProfile;
        }

        console.log(`[Ollama Performance] Building performance profile for ${this.model}...`);
        
        try {
            const modelInfo = await this.getModelInfo();
            const testStart = Date.now();
            
            // Test with a small prompt to measure baseline performance
            const testResponse = await this.chat([
                { role: 'user', content: 'Hi' }
            ], { skipProfiling: true });
            
            const testDuration = Date.now() - testStart;
            const tokensPerSecond = testResponse.usage.total_tokens / (testDuration / 1000);
            
            this.performanceProfile = {
                model: this.model,
                size: modelInfo.size || 0,
                avgTokensPerSecond: tokensPerSecond,
                baselineLatency: testDuration,
                created: Date.now(),
                // Estimate timeouts based on model size and performance
                estimatedTimeouts: {
                    chat: Math.max(60000, testDuration * 10),
                    memo: Math.max(120000, testDuration * 20)
                }
            };
            
            // Update optimized timeouts based on performance
            this.optimizedTimeouts.chat = this.performanceProfile.estimatedTimeouts.chat;
            this.optimizedTimeouts.memo = this.performanceProfile.estimatedTimeouts.memo;
            
            console.log(`[Ollama Performance] Profile complete: ${tokensPerSecond.toFixed(1)} tokens/sec, ${testDuration}ms baseline`);
            
        } catch (error) {
            console.warn(`[Ollama Performance] Could not build performance profile: ${error.message}`);
            // Use default profile
            this.performanceProfile = {
                model: this.model,
                avgTokensPerSecond: 5, // Conservative default
                baselineLatency: 3000,
                created: Date.now(),
                estimatedTimeouts: {
                    chat: this.optimizedTimeouts.chat,
                    memo: this.optimizedTimeouts.memo
                }
            };
        }
        
        return this.performanceProfile;
    }

    getOptimizedTimeout(operation) {
        if (this.performanceProfile) {
            return this.performanceProfile.estimatedTimeouts[operation] || this.optimizedTimeouts[operation];
        }
        return this.optimizedTimeouts[operation];
    }

    reportProgress(operation, stage, percentage = null, message = null) {
        this.currentOperation = operation;
        
        const progress = {
            operation,
            stage,
            percentage,
            message,
            timestamp: Date.now()
        };
        
        console.log(`[Ollama Progress] ${operation}: ${stage}${percentage ? ` (${percentage}%)` : ''}${message ? ` - ${message}` : ''}`);
        
        if (this.progressCallback) {
            this.progressCallback(progress);
        }
        
        return progress;
    }

    async warmConnection() {
        if (this.connectionPool) {
            return this.connectionPool;
        }
        
        try {
            // Pre-warm the connection with a simple API call
            await this.testConnection();
            this.connectionPool = { warmed: true, timestamp: Date.now() };
            console.log('[Ollama Performance] Connection warmed successfully');
        } catch (error) {
            console.warn('[Ollama Performance] Failed to warm connection:', error.message);
        }
        
        return this.connectionPool;
    }

    optimizeTokenCounting(text) {
        // More accurate token counting for Ollama models
        // Different models have different tokenization strategies
        
        if (!text || typeof text !== 'string') {
            return 0;
        }
        
        // Model-specific token counting optimizations
        const modelLower = this.model.toLowerCase();
        let tokensPerWord = 1.3; // Default ratio
        
        if (modelLower.includes('llama')) {
            tokensPerWord = 1.25; // LLaMA models are more efficient
        } else if (modelLower.includes('phi')) {
            tokensPerWord = 1.35; // Phi models use more tokens
        } else if (modelLower.includes('gemma')) {
            tokensPerWord = 1.3; // Gemma balanced
        } else if (modelLower.includes('mistral')) {
            tokensPerWord = 1.2; // Mistral efficient tokenization
        } else if (modelLower.includes('qwen')) {
            tokensPerWord = 1.4; // Qwen models use more tokens for multilingual support
        }
        
        // Calculate based on word count and character patterns
        const words = text.trim().split(/\s+/).length;
        const chars = text.length;
        
        // Adjust for special characters, code, and formatting
        let specialTokenMultiplier = 1.0;
        if (text.includes('```') || text.includes('<code>')) {
            specialTokenMultiplier += 0.2; // Code uses more tokens
        }
        if (text.includes('http://') || text.includes('https://')) {
            specialTokenMultiplier += 0.1; // URLs use more tokens
        }
        if (/[^\x00-\x7F]/.test(text)) {
            specialTokenMultiplier += 0.15; // Unicode characters
        }
        
        // Final calculation
        const estimatedTokens = Math.ceil(words * tokensPerWord * specialTokenMultiplier);
        
        // Fallback to character-based estimation if word count seems off
        const charBasedTokens = Math.ceil(chars / 3.5);
        
        return Math.max(estimatedTokens, charBasedTokens);
    }

    async cacheModelInfo(modelName = null) {
        const model = modelName || this.model;
        if (!model) return null;
        
        if (this.modelCache.has(model)) {
            const cached = this.modelCache.get(model);
            // Cache is valid for 1 hour
            if (Date.now() - cached.timestamp < 3600000) {
                return cached.info;
            }
        }
        
        try {
            const info = await this.getModelInfo(model);
            this.modelCache.set(model, {
                info,
                timestamp: Date.now()
            });
            return info;
        } catch (error) {
            console.warn(`[Ollama Performance] Failed to cache model info for ${model}:`, error.message);
            return null;
        }
    }

    // Retry logic for intermittent connection issues
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    calculateRetryDelay(attempt) {
        // Exponential backoff: delay * (2 ^ attempt) with some jitter
        const baseDelay = this.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
        return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
    }

    async retryWithBackoff(fn, ...args) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn(...args);
            } catch (error) {
                lastError = error;
                
                // Don't retry on certain types of errors (403, 404, etc.)
                if (error.name === 'AbortError' || 
                    error.message.includes('403') || 
                    error.message.includes('404') ||
                    error.message.includes('Invalid JSON')) {
                    console.log(`[Ollama Retry] Not retrying for error type: ${error.message}`);
                    throw error;
                }
                
                if (attempt === this.maxRetries) {
                    break; // Don't delay on the last attempt
                }
                
                const delay = this.calculateRetryDelay(attempt);
                console.log(`[Ollama Retry] Attempt ${attempt}/${this.maxRetries} failed: ${error.message}. Retrying in ${Math.round(delay)}ms...`);
                await this.sleep(delay);
            }
        }
        
        console.log(`[Ollama Retry] All ${this.maxRetries} attempts failed. Giving up.`);
        throw lastError;
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