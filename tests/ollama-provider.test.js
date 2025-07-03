// Tests for OllamaProvider - Local LLM integration
import { describe, it, expect } from './test-runner.js';
import { LLMProvider } from '../llm-provider-api.js';

// Mock OllamaProvider for testing (will be implemented later)
class MockOllamaProvider extends LLMProvider {
    constructor(config = {}) {
        super(config);
        this.host = config.host || 'localhost';
        this.port = config.port || 11434;
        this.baseUrl = `http://${this.host}:${this.port}`;
        this.model = config.model || 'llama2';
        this.availableModels = [];
        this.serviceAvailable = false;
        // Retry configuration
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000; // 1 second default
        this.retryCount = 0;
    }

    async initialize(apiKey = null) {
        // Ollama doesn't use API keys, but we need to test service connectivity
        try {
            await this.testConnection();
            await this.loadAvailableModels();
            this.initialized = true;
            return true;
        } catch (error) {
            throw new Error(`Failed to connect to Ollama: ${error.message}`);
        }
    }

    async testConnection() {
        // Mock service connectivity test
        if (this.host === 'localhost' && this.port === 11434) {
            this.serviceAvailable = true;
            return true;
        }
        throw new Error('Ollama service not available');
    }

    async loadAvailableModels() {
        // Mock model loading
        if (this.serviceAvailable) {
            this.availableModels = [
                { name: 'llama2', size: '3.8GB' },
                { name: 'codellama', size: '3.8GB' },
                { name: 'mistral', size: '4.1GB' }
            ];
        }
    }

    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }
        
        // Mock Ollama response format
        return {
            content: 'Mock Ollama response',
            usage: {
                prompt_tokens: 20,
                completion_tokens: 10,
                total_tokens: 30
            }
        };
    }

    async processMemo(content, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }
        
        // Mock memo processing
        return {
            title: 'Mock Local Title',
            summary: 'Mock local summary processed by Ollama',
            narrative: 'Mock narrative from local model',
            structuredData: { source: 'ollama', model: this.model },
            selectedTag: 'local'
        };
    }

    calculateTokens(text) {
        // Rough token estimate for Ollama models
        return Math.ceil(text.length / 4);
    }

    getAvailableModels() {
        return this.availableModels;
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
                
                if (attempt === this.maxRetries) {
                    break; // Don't delay on the last attempt
                }
                
                const delay = this.calculateRetryDelay(attempt);
                console.log(`[Ollama Retry] Attempt ${attempt}/${this.maxRetries} failed: ${error.message}. Retrying in ${Math.round(delay)}ms...`);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }
}

describe('OllamaProvider Tests', () => {
    let provider;

    // Test 1: Provider extends LLMProvider base class
    it('should extend LLMProvider base class', () => {
        provider = new MockOllamaProvider();
        expect(provider).toBeInstanceOf(LLMProvider);
    });

    // Test 2: Constructor sets up local service configuration
    it('should initialize with default local configuration', () => {
        provider = new MockOllamaProvider();
        expect(provider.initialized).toBe(false);
        expect(provider.host).toBe('localhost');
        expect(provider.port).toBe(11434);
        expect(provider.baseUrl).toBe('http://localhost:11434');
        expect(provider.model).toBe('llama2');
        expect(provider.availableModels).toEqual([]);
    });

    // Test 3: Constructor accepts custom configuration
    it('should accept custom host and port configuration', () => {
        const config = {
            host: '192.168.1.100',
            port: 8080,
            model: 'codellama'
        };
        provider = new MockOllamaProvider(config);
        expect(provider.host).toBe('192.168.1.100');
        expect(provider.port).toBe(8080);
        expect(provider.baseUrl).toBe('http://192.168.1.100:8080');
        expect(provider.model).toBe('codellama');
    });

    // Test 4: Initialize method tests service connectivity
    it('should initialize successfully when service is available', async () => {
        provider = new MockOllamaProvider();
        const result = await provider.initialize();
        expect(result).toBe(true);
        expect(provider.initialized).toBe(true);
        expect(provider.serviceAvailable).toBe(true);
        expect(provider.availableModels.length).toBeGreaterThan(0);
    });

    // Test 5: Initialize fails when service is not available
    it('should fail to initialize when service is not available', async () => {
        provider = new MockOllamaProvider({ host: 'nonexistent', port: 9999 });
        try {
            await provider.initialize();
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toContain('Failed to connect to Ollama');
        }
    });

    // Test 6: Service connectivity test
    it('should test service connectivity correctly', async () => {
        provider = new MockOllamaProvider();
        const result = await provider.testConnection();
        expect(result).toBe(true);
        expect(provider.serviceAvailable).toBe(true);
    });

    // Test 7: Load available models
    it('should load available models when service is available', async () => {
        provider = new MockOllamaProvider();
        await provider.testConnection();
        await provider.loadAvailableModels();
        expect(provider.availableModels.length).toBeGreaterThan(0);
        expect(provider.availableModels[0]).toHaveProperty('name');
        expect(provider.availableModels[0]).toHaveProperty('size');
    });

    // Test 8: Chat method requires initialization
    it('should require initialization before chat', async () => {
        provider = new MockOllamaProvider();
        try {
            await provider.chat([{ role: 'user', content: 'Hello' }]);
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toBe('Provider not initialized');
        }
    });

    // Test 9: Chat method works when initialized
    it('should handle chat when initialized', async () => {
        provider = new MockOllamaProvider();
        await provider.initialize();
        
        const response = await provider.chat([
            { role: 'user', content: 'Hello from local model' }
        ]);
        
        expect(response.content).toBe('Mock Ollama response');
        expect(response.usage).toHaveProperty('prompt_tokens');
        expect(response.usage).toHaveProperty('completion_tokens');
        expect(response.usage).toHaveProperty('total_tokens');
    });

    // Test 10: ProcessMemo method requires initialization
    it('should require initialization before processMemo', async () => {
        provider = new MockOllamaProvider();
        try {
            await provider.processMemo('test content');
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toBe('Provider not initialized');
        }
    });

    // Test 11: ProcessMemo method works when initialized
    it('should process memo when initialized', async () => {
        provider = new MockOllamaProvider();
        await provider.initialize();
        
        const result = await provider.processMemo('test local content');
        
        expect(result.title).toBe('Mock Local Title');
        expect(result.summary).toContain('local summary');
        expect(result.narrative).toContain('local model');
        expect(result.structuredData.source).toBe('ollama');
        expect(result.selectedTag).toBe('local');
    });

    // Test 12: Token calculation works
    it('should calculate tokens correctly for local models', () => {
        provider = new MockOllamaProvider();
        const tokens = provider.calculateTokens('This is a local test message');
        expect(tokens).toBe(8); // Math.ceil(31 / 4) = 8
    });

    // Test 13: Get available models
    it('should return available models list', async () => {
        provider = new MockOllamaProvider();
        await provider.initialize();
        const models = provider.getAvailableModels();
        expect(Array.isArray(models)).toBe(true);
        expect(models.length).toBeGreaterThan(0);
    });

    // Test 14: Inherits base class methods
    it('should inherit base class helper methods', () => {
        provider = new MockOllamaProvider();
        
        // Test system message creation
        const systemMessage = provider.createSystemMessage([], null);
        expect(systemMessage).toBeTruthy();
        expect(typeof systemMessage).toBe('string');
        
        // Test word counting
        const wordCount = provider.countWords('hello local world');
        expect(wordCount).toBe(3);
        
        // Test content sanitization
        const sanitized = provider.sanitizeContent('local "content" test');
        expect(sanitized).toBe('local \\"content\\" test');
    });
});

// Test Ollama-specific functionality
describe('OllamaProvider Local Service Tests', () => {
    it('should handle localhost configuration correctly', () => {
        const provider = new MockOllamaProvider();
        expect(provider.baseUrl).toBe('http://localhost:11434');
    });

    it('should handle custom host configuration', () => {
        const provider = new MockOllamaProvider({
            host: '127.0.0.1',
            port: 8080
        });
        expect(provider.baseUrl).toBe('http://127.0.0.1:8080');
    });

    it('should not require API key for initialization', async () => {
        const provider = new MockOllamaProvider();
        // Should work without API key parameter
        const result = await provider.initialize();
        expect(result).toBe(true);
    });

    it('should handle service detection gracefully', async () => {
        const provider = new MockOllamaProvider({ host: 'localhost', port: 11434 });
        await provider.testConnection();
        expect(provider.serviceAvailable).toBe(true);
    });
});

// Mock implementation for testing the provider factory integration
describe('OllamaProvider Factory Integration Tests', () => {
    it('should be creatable through factory pattern', () => {
        const config = { model: 'codellama', host: 'localhost', port: 11434 };
        const provider = new MockOllamaProvider(config);
        expect(provider.config).toEqual(config);
        expect(provider.model).toBe('codellama');
    });

    it('should handle browser-compatible API calls', () => {
        const provider = new MockOllamaProvider();
        expect(provider.baseUrl).toBe('http://localhost:11434');
        // Should use fetch API for browser compatibility
        expect(typeof fetch).toBe('function');
    });

    it('should support local service requirements', () => {
        const provider = new MockOllamaProvider();
        // No API key required
        expect(provider.config.apiKey).toBeUndefined();
        // Should have local service configuration
        expect(provider.host).toBeTruthy();
        expect(provider.port).toBeTruthy();
    });
});

// Test retry logic for intermittent connection issues
describe('OllamaProvider Retry Logic Tests', () => {
    let provider;

    beforeEach(() => {
        provider = new MockOllamaProvider();
        provider.retryCount = 0;
        provider.maxRetries = 3;
        provider.retryDelay = 100; // Shorter delay for tests
    });

    it('should have retry configuration properties', () => {
        expect(provider.maxRetries).toBe(3);
        expect(provider.retryDelay).toBe(100);
        expect(provider.retryCount).toBe(0);
    });

    it('should implement exponential backoff for retries', () => {
        const delay1 = provider.calculateRetryDelay(1);
        const delay2 = provider.calculateRetryDelay(2);
        const delay3 = provider.calculateRetryDelay(3);
        
        expect(delay2).toBeGreaterThan(delay1);
        expect(delay3).toBeGreaterThan(delay2);
    });

    it('should retry failed requests with exponential backoff', async () => {
        let attemptCount = 0;
        provider.mockFailUntilAttempt = 3;
        
        provider.testConnection = async function() {
            attemptCount++;
            if (attemptCount < this.mockFailUntilAttempt) {
                throw new Error('Temporary connection failure');
            }
            this.serviceAvailable = true;
            return true;
        };

        const result = await provider.retryWithBackoff(provider.testConnection.bind(provider));
        expect(result).toBe(true);
        expect(attemptCount).toBe(3);
    });

    it('should fail after maximum retry attempts', async () => {
        provider.testConnection = async function() {
            throw new Error('Persistent connection failure');
        };

        try {
            await provider.retryWithBackoff(provider.testConnection.bind(provider));
            expect(false).toBe(true); // Should not reach here
        } catch (error) {
            expect(error.message).toContain('Persistent connection failure');
        }
    });

    it('should use retry logic in chat method', async () => {
        let attemptCount = 0;
        provider.initialized = true;
        provider.model = 'test-model';
        
        const originalFetch = global.fetch;
        global.fetch = async (url, options) => {
            attemptCount++;
            if (attemptCount < 3) {
                throw new Error('Network error');
            }
            return {
                ok: true,
                json: async () => ({
                    message: { content: 'Retry success' },
                    prompt_eval_count: 10,
                    eval_count: 5
                })
            };
        };

        const response = await provider.chat([{ role: 'user', content: 'test' }]);
        expect(response.content).toBe('Retry success');
        expect(attemptCount).toBe(3);
        
        global.fetch = originalFetch;
    });

    it('should implement sleep utility for retry delays', async () => {
        const startTime = Date.now();
        await provider.sleep(50);
        const endTime = Date.now();
        expect(endTime - startTime).toBeGreaterThanOrEqual(45); // Allow for timing variance
    });
});