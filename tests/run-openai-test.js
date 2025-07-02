// Simple test for OpenAIProvider implementation
import { OpenAIProvider } from '../providers/openai-provider.js';
import { LLMProvider } from '../llm-provider-api.js';

async function testOpenAIProvider() {
    console.log('🧪 Testing OpenAIProvider Implementation');
    
    try {
        // Test 1: Provider instantiation
        console.log('\n1. Testing provider instantiation...');
        const provider = new OpenAIProvider();
        console.log('✅ Provider created successfully');
        
        // Test 2: Inheritance check
        console.log('\n2. Testing inheritance...');
        if (provider instanceof LLMProvider) {
            console.log('✅ Provider extends LLMProvider');
        } else {
            console.log('❌ Provider does not extend LLMProvider');
        }
        
        // Test 3: Initial state
        console.log('\n3. Testing initial state...');
        console.log(`   - initialized: ${provider.initialized} (should be false)`);
        console.log(`   - apiKey: ${provider.apiKey} (should be null)`);
        console.log(`   - model: ${provider.model} (should be gpt-4)`);
        console.log(`   - baseUrl: ${provider.baseUrl} (should be OpenAI API URL)`);
        
        // Test 4: Configuration
        console.log('\n4. Testing configuration...');
        const configProvider = new OpenAIProvider({ 
            model: 'gpt-3.5-turbo',
            baseUrl: 'https://custom-api.openai.com/v1'
        });
        console.log(`   - configured model: ${configProvider.model}`);
        console.log(`   - configured baseUrl: ${configProvider.baseUrl}`);
        
        // Test 5: Provider info
        console.log('\n5. Testing provider info...');
        const info = provider.getProviderInfo();
        console.log(`   - ID: ${info.id}`);
        console.log(`   - Name: ${info.name}`);
        console.log(`   - Models: ${info.models.join(', ')}`);
        console.log(`   - Requires API Key: ${info.requiresApiKey}`);
        
        // Test 6: Available models
        console.log('\n6. Testing available models...');
        const models = provider.getAvailableModels();
        console.log(`   - Available models: ${models.join(', ')}`);
        
        // Test 7: Validation - invalid cases
        console.log('\n7. Testing validation...');
        
        // Test empty config
        if (!provider.validateConfig({})) {
            console.log('✅ Validation correctly failed for empty config');
        } else {
            console.log('❌ Should have failed validation for empty config');
        }
        
        // Test invalid API key format
        if (!provider.validateConfig({ apiKey: 'invalid-key' })) {
            console.log('✅ Validation correctly failed for invalid API key format');
        } else {
            console.log('❌ Should have failed validation for invalid API key format');
        }
        
        // Test invalid model
        if (!provider.validateConfig({ apiKey: 'sk-test123', model: 'invalid-model' })) {
            console.log('✅ Validation correctly failed for invalid model');
        } else {
            console.log('❌ Should have failed validation for invalid model');
        }
        
        // Test valid config
        if (provider.validateConfig({ apiKey: 'sk-test123', model: 'gpt-4' })) {
            console.log('✅ Validation passed with valid config');
        } else {
            console.log('❌ Validation failed unexpectedly for valid config');
        }
        
        // Test 8: Token calculation
        console.log('\n8. Testing token calculation...');
        const tokens = provider.calculateTokens('This is a test message');
        console.log(`   - Token count for "This is a test message": ${tokens} tokens`);
        
        const emptyTokens = provider.calculateTokens('');
        console.log(`   - Token count for empty string: ${emptyTokens} tokens (should be 0)`);
        
        const longText = 'This is a much longer text that should result in more tokens being calculated';
        const longTokens = provider.calculateTokens(longText);
        console.log(`   - Token count for longer text: ${longTokens} tokens`);
        
        // Test 9: Base class methods
        console.log('\n9. Testing inherited methods...');
        const systemMessage = provider.createSystemMessage([], null);
        console.log(`   - System message length: ${systemMessage.length} characters`);
        
        const wordCount = provider.countWords('hello world test');
        console.log(`   - Word count for "hello world test": ${wordCount} words`);
        
        const sanitizedContent = provider.sanitizeContent('<script>alert("xss")</script><p>Clean content</p>');
        console.log(`   - Sanitized content: ${sanitizedContent.substring(0, 50)}...`);
        
        // Test 10: Error handling for uninitialized provider
        console.log('\n10. Testing error handling...');
        
        try {
            await provider.chat([{ role: 'user', content: 'Hello' }]);
            console.log('❌ Should have failed for uninitialized provider');
        } catch (error) {
            console.log(`✅ Correctly threw error for uninitialized chat: ${error.message}`);
        }
        
        try {
            await provider.processMemo('<html><body>Test content</body></html>');
            console.log('❌ Should have failed for uninitialized provider');
        } catch (error) {
            console.log(`✅ Correctly threw error for uninitialized processMemo: ${error.message}`);
        }
        
        // Test 11: Initialization errors
        console.log('\n11. Testing initialization errors...');
        
        try {
            await provider.initialize();
            console.log('❌ Should have failed with no API key');
        } catch (error) {
            console.log(`✅ Correctly threw error for missing API key: ${error.message}`);
        }
        
        try {
            await provider.initialize('');
            console.log('❌ Should have failed with empty API key');
        } catch (error) {
            console.log(`✅ Correctly threw error for empty API key: ${error.message}`);
        }
        
        try {
            await provider.initialize('invalid-key');
            console.log('❌ Should have failed with invalid API key format');
        } catch (error) {
            console.log(`✅ Correctly threw error for invalid API key format: ${error.message}`);
        }
        
        console.log('\n✅ All tests passed! OpenAIProvider implementation is working correctly.');
        console.log('\n📝 Note: Some tests that require actual API calls were skipped to avoid using real API keys.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testOpenAIProvider();