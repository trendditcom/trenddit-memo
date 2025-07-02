import { OpenAIProvider } from '../providers/openai-provider.js';
import { LLMProvider } from '../llm-provider-api.js';

describe('OpenAI Provider Tests', () => {
    let provider;
    const mockApiKey = 'sk-test123456789';
    const invalidApiKey = 'invalid-key';

    beforeEach(() => {
        provider = new OpenAIProvider();
    });

    describe('Inheritance Tests', () => {
        it('should extend LLMProvider base class', () => {
            expect(provider).toBeInstanceOf(LLMProvider);
        });
    });

    describe('Constructor Tests', () => {
        it('should initialize with default configuration', () => {
            expect(provider.config).toBeDefined();
            expect(provider.initialized).toBe(false);
            expect(provider.apiKey).toBeNull();
            expect(provider.baseUrl).toBe('https://api.openai.com/v1');
            expect(provider.model).toBe('gpt-4');
        });

        it('should initialize with custom configuration', () => {
            const customConfig = {
                model: 'gpt-3.5-turbo',
                baseUrl: 'https://custom-api.openai.com/v1'
            };
            const customProvider = new OpenAIProvider(customConfig);
            expect(customProvider.model).toBe('gpt-3.5-turbo');
            expect(customProvider.baseUrl).toBe('https://custom-api.openai.com/v1');
        });
    });

    describe('Initialize Method Tests', () => {
        it('should fail without API key', async () => {
            await expect(provider.initialize()).rejects.toThrow('OpenAI API key is required');
        });

        it('should fail with empty API key', async () => {
            await expect(provider.initialize('')).rejects.toThrow('OpenAI API key is required');
        });

        it('should fail with invalid API key format', async () => {
            await expect(provider.initialize(invalidApiKey)).rejects.toThrow('Invalid OpenAI API key format');
        });

        it('should set initialized to true with valid API key format', async () => {
            // Mock fetch for connection test
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [{ id: 'gpt-4', object: 'model' }]
                })
            });

            await provider.initialize(mockApiKey);
            expect(provider.initialized).toBe(true);
            expect(provider.apiKey).toBe(mockApiKey);
        });

        it('should handle connection test failure gracefully', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({
                    error: { message: 'Invalid API key' }
                })
            });

            await expect(provider.initialize(mockApiKey))
                .rejects.toThrow('OpenAI API authentication failed');
        });
    });

    describe('Chat Method Tests', () => {
        it('should fail if not initialized', async () => {
            const messages = [{ role: 'user', content: 'Hello' }];
            await expect(provider.chat(messages)).rejects.toThrow('Provider not initialized');
        });

        it('should process chat messages successfully', async () => {
            // Initialize provider
            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: [{ id: 'gpt-4' }] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        choices: [{
                            message: {
                                role: 'assistant',
                                content: 'Hello! How can I help you?'
                            }
                        }],
                        usage: {
                            prompt_tokens: 10,
                            completion_tokens: 7,
                            total_tokens: 17
                        }
                    })
                });

            await provider.initialize(mockApiKey);

            const messages = [{ role: 'user', content: 'Hello' }];
            const result = await provider.chat(messages);

            expect(result.success).toBe(true);
            expect(result.reply).toBe('Hello! How can I help you?');
            expect(result.usage).toBeDefined();
            expect(result.usage.total_tokens).toBe(17);
        });

        it('should handle chat API errors', async () => {
            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: [{ id: 'gpt-4' }] })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    json: async () => ({
                        error: { message: 'Rate limit exceeded' }
                    })
                });

            await provider.initialize(mockApiKey);

            const messages = [{ role: 'user', content: 'Hello' }];
            await expect(provider.chat(messages)).rejects.toThrow('Rate limit exceeded');
        });
    });

    describe('ProcessMemo Method Tests', () => {
        const sampleContent = `
            <html>
                <head><title>Test Article</title></head>
                <body>
                    <h1>Sample Article</h1>
                    <p>This is a test article content for processing.</p>
                </body>
            </html>
        `;

        it('should fail if not initialized', async () => {
            await expect(provider.processMemo(sampleContent))
                .rejects.toThrow('Provider not initialized');
        });

        it('should process memo content successfully', async () => {
            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: [{ id: 'gpt-4' }] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        choices: [{
                            message: {
                                role: 'assistant',
                                content: JSON.stringify({
                                    title: 'Sample Article',
                                    summary: 'A test article about processing',
                                    narrative: 'This article demonstrates content processing',
                                    structuredData: { topic: 'testing' },
                                    selectedTag: 'article'
                                })
                            }
                        }],
                        usage: { total_tokens: 150 }
                    })
                });

            await provider.initialize(mockApiKey);

            const result = await provider.processMemo(sampleContent);

            expect(result.title).toBe('Sample Article');
            expect(result.summary).toBe('A test article about processing');
            expect(result.narrative).toBe('This article demonstrates content processing');
            expect(result.structuredData.topic).toBe('testing');
            expect(result.selectedTag).toBe('article');
        });

        it('should handle malformed JSON responses', async () => {
            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: [{ id: 'gpt-4' }] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        choices: [{
                            message: {
                                role: 'assistant',
                                content: 'Invalid JSON response'
                            }
                        }],
                        usage: { total_tokens: 50 }
                    })
                });

            await provider.initialize(mockApiKey);

            await expect(provider.processMemo(sampleContent))
                .rejects.toThrow('Failed to parse OpenAI response as JSON');
        });
    });

    describe('Token Calculation Tests', () => {
        it('should calculate tokens for empty string', () => {
            expect(provider.calculateTokens('')).toBe(0);
        });

        it('should calculate tokens for simple text', () => {
            const text = 'Hello world';
            const tokens = provider.calculateTokens(text);
            expect(tokens).toBeGreaterThan(0);
            expect(tokens).toBeLessThan(10); // Should be reasonable estimate
        });

        it('should calculate more tokens for longer text', () => {
            const shortText = 'Hello';
            const longText = 'Hello world this is a much longer text with many more words';
            
            const shortTokens = provider.calculateTokens(shortText);
            const longTokens = provider.calculateTokens(longText);
            
            expect(longTokens).toBeGreaterThan(shortTokens);
        });
    });

    describe('Base Class Integration Tests', () => {
        it('should have access to inherited helper methods', () => {
            expect(typeof provider.createSystemMessage).toBe('function');
            expect(typeof provider.countWords).toBe('function');
            expect(typeof provider.calculateMemosWordCount).toBe('function');
            expect(typeof provider.sanitizeContent).toBe('function');
        });

        it('should use inherited sanitizeContent method', () => {
            const dirtyContent = '<script>alert("xss")</script><p>Clean content</p>';
            const sanitized = provider.sanitizeContent(dirtyContent);
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toContain('Clean content');
        });
    });

    describe('Provider-Specific Method Tests', () => {
        it('should return available models', () => {
            const models = provider.getAvailableModels();
            expect(Array.isArray(models)).toBe(true);
            expect(models).toContain('gpt-4');
            expect(models).toContain('gpt-3.5-turbo');
        });

        it('should return provider info', () => {
            const info = provider.getProviderInfo();
            expect(info.id).toBe('openai');
            expect(info.name).toBe('OpenAI');
            expect(info.requiresApiKey).toBe(true);
        });

        it('should validate config correctly', () => {
            const validConfig = { apiKey: 'sk-test123', model: 'gpt-4' };
            const invalidConfig = { apiKey: '', model: 'invalid-model' };

            expect(provider.validateConfig(validConfig)).toBe(true);
            expect(provider.validateConfig(invalidConfig)).toBe(false);
        });
    });

    // Cleanup
    afterEach(() => {
        delete global.fetch;
    });
});