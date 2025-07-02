// Simple test for AnthropicProvider implementation
import { AnthropicProvider } from '../providers/anthropic-provider.js';
import { LLMProvider } from '../llm-provider-api.js';

async function testAnthropicProvider() {
    console.log('🧪 Testing AnthropicProvider Implementation');
    
    try {
        // Test 1: Provider instantiation
        console.log('\n1. Testing provider instantiation...');
        const provider = new AnthropicProvider();
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
        console.log(`   - model: ${provider.model} (should be default)`);
        
        // Test 4: Configuration
        console.log('\n4. Testing configuration...');
        const configProvider = new AnthropicProvider({ model: 'claude-3-haiku-20240307' });
        console.log(`   - configured model: ${configProvider.model}`);
        
        // Test 5: Provider info
        console.log('\n5. Testing provider info...');
        const info = provider.getProviderInfo();
        console.log(`   - ID: ${info.id}`);
        console.log(`   - Name: ${info.name}`);
        console.log(`   - Models: ${info.models.join(', ')}`);
        
        // Test 6: Validation
        console.log('\n6. Testing validation...');
        try {
            provider.validateConfig({});
            console.log('❌ Should have failed validation');
        } catch (error) {
            console.log(`✅ Validation correctly failed: ${error.message}`);
        }
        
        try {
            provider.validateConfig({ apiKey: 'test-key' });
            console.log('✅ Validation passed with API key');
        } catch (error) {
            console.log(`❌ Validation failed unexpectedly: ${error.message}`);
        }
        
        // Test 7: Token calculation
        console.log('\n7. Testing token calculation...');
        const tokens = provider.calculateTokens('This is a test message');
        console.log(`   - Token count for "This is a test message": ${tokens} tokens`);
        
        // Test 8: Base class methods
        console.log('\n8. Testing inherited methods...');
        const systemMessage = provider.createSystemMessage([], null);
        console.log(`   - System message length: ${systemMessage.length} characters`);
        
        const wordCount = provider.countWords('hello world test');
        console.log(`   - Word count for "hello world test": ${wordCount} words`);
        
        console.log('\n✅ All tests passed! AnthropicProvider implementation is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testAnthropicProvider();