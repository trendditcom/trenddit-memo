import { GeminiProvider } from '../providers/gemini-provider.js';
import { LLMProvider } from '../llm-provider-api.js';

describe('Gemini Provider Tests', () => {
    let provider;
    const mockApiKey = 'AIzaSyTest123456789012345678901234567890';
    const invalidApiKey = 'invalid-key';

    beforeEach(() => {
        provider = new GeminiProvider();
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
            expect(provider.baseUrl).toBe('https://generativelanguage.googleapis.com/v1');
            expect(provider.model).toBe('gemini-pro');
        });

        it('should initialize with custom configuration', () => {
            const customConfig = {
                model: 'gemini-pro-vision',
                baseUrl: 'https://custom-api.googleapis.com/v1'
            };
            const customProvider = new GeminiProvider(customConfig);
            expect(customProvider.model).toBe('gemini-pro-vision');
            expect(customProvider.baseUrl).toBe('https://custom-api.googleapis.com/v1');
        });
    });

    describe('Initialize Method Tests', () => {
        it('should fail without API key', async () => {
            await expect(provider.initialize()).rejects.toThrow('Google AI API key is required');
        });

        it('should fail with empty API key', async () => {
            await expect(provider.initialize('')).rejects.toThrow('Google AI API key is required');
        });

        it('should fail with invalid API key format', async () => {
            await expect(provider.initialize(invalidApiKey)).rejects.toThrow('Invalid Google AI API key format');
        });

        it('should set initialized to true with valid API key format', async () => {
            // Mock fetch for connection test
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    models: [{ name: 'models/gemini-pro', displayName: 'Gemini Pro' }]
                })
            });

            await provider.initialize(mockApiKey);
            expect(provider.initialized).toBe(true);
            expect(provider.apiKey).toBe(mockApiKey);
        });

        it('should handle connection test failure gracefully', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({
                    error: { message: 'API key not valid' }
                })
            });

            await expect(provider.initialize(mockApiKey))
                .rejects.toThrow('Google AI API authentication failed');
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
                    json: async () => ({ models: [{ name: 'models/gemini-pro' }] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        candidates: [{
                            content: {
                                parts: [{ text: 'Hello! How can I help you today?' }]
                            }
                        }],
                        usageMetadata: {
                            promptTokenCount: 8,
                            candidatesTokenCount: 9,
                            totalTokenCount: 17
                        }
                    })
                });

            await provider.initialize(mockApiKey);

            const messages = [{ role: 'user', content: 'Hello' }];
            const result = await provider.chat(messages);

            expect(result.success).toBe(true);
            expect(result.reply).toBe('Hello! How can I help you today?');
            expect(result.usage).toBeDefined();
            expect(result.usage.total_tokens).toBe(17);
        });

        it('should handle chat API errors', async () => {
            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ models: [{ name: 'models/gemini-pro' }] })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    json: async () => ({
                        error: { message: 'Quota exceeded' }
                    })
                });

            await provider.initialize(mockApiKey);

            const messages = [{ role: 'user', content: 'Hello' }];
            await expect(provider.chat(messages)).rejects.toThrow('Quota exceeded');
        });

        it('should handle safety filtering responses', async () => {
            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ models: [{ name: 'models/gemini-pro' }] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        candidates: [{
                            finishReason: 'SAFETY'
                        }],
                        usageMetadata: {
                            promptTokenCount: 8,
                            candidatesTokenCount: 0,
                            totalTokenCount: 8
                        }
                    })
                });

            await provider.initialize(mockApiKey);

            const messages = [{ role: 'user', content: 'Test message' }];
            await expect(provider.chat(messages)).rejects.toThrow('Content was blocked by safety filters');
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
                    json: async () => ({ models: [{ name: 'models/gemini-pro' }] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        candidates: [{
                            content: {
                                parts: [{ 
                                    text: JSON.stringify({
                                        title: 'Sample Article',
                                        summary: 'A test article about processing',
                                        narrative: 'This article demonstrates content processing',
                                        structuredData: { topic: 'testing' },
                                        selectedTag: 'article'
                                    })
                                }]
                            }
                        }],
                        usageMetadata: { totalTokenCount: 150 }
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
                    json: async () => ({ models: [{ name: 'models/gemini-pro' }] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        candidates: [{
                            content: {
                                parts: [{ text: 'Invalid JSON response' }]
                            }
                        }],
                        usageMetadata: { totalTokenCount: 50 }
                    })
                });

            await provider.initialize(mockApiKey);

            await expect(provider.processMemo(sampleContent))
                .rejects.toThrow('Failed to parse Gemini response as JSON');
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
            expect(models).toContain('gemini-pro');
            expect(models).toContain('gemini-pro-vision');
        });

        it('should return provider info', () => {
            const info = provider.getProviderInfo();
            expect(info.id).toBe('gemini');
            expect(info.name).toBe('Google Gemini');
            expect(info.requiresApiKey).toBe(true);
        });

        it('should validate config correctly', () => {
            const validConfig = { apiKey: 'AIzaSyTest123456789012345678901234567890', model: 'gemini-pro' };
            const invalidConfig = { apiKey: '', model: 'invalid-model' };

            expect(provider.validateConfig(validConfig)).toBe(true);
            expect(provider.validateConfig(invalidConfig)).toBe(false);
        });

        it('should handle safety settings', () => {
            const safetySettings = provider.getDefaultSafetySettings();
            expect(Array.isArray(safetySettings)).toBe(true);
            expect(safetySettings.length).toBeGreaterThan(0);
        });
    });

    describe('Safety and Content Filtering Tests', () => {
        it('should provide configurable safety settings', () => {
            const settings = provider.getSafetySettings('BLOCK_NONE');
            expect(Array.isArray(settings)).toBe(true);
            settings.forEach(setting => {
                expect(setting).toHaveProperty('category');
                expect(setting).toHaveProperty('threshold');
            });
        });

        it('should handle different safety levels', () => {
            const noneSettings = provider.getSafetySettings('BLOCK_NONE');
            const lowSettings = provider.getSafetySettings('BLOCK_ONLY_HIGH');
            
            expect(noneSettings).toBeDefined();
            expect(lowSettings).toBeDefined();
            expect(noneSettings.length).toBe(lowSettings.length);
        });
    });

    // Cleanup
    afterEach(() => {
        delete global.fetch;
    });
});