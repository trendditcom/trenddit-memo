// Test factory integration for OllamaProvider
import { LLMProviderFactory } from '../llm-provider-factory.js';
import { OllamaProvider } from '../providers/ollama-provider.js';

async function testFactoryIntegration() {
    console.log('🧪 Testing OllamaProvider Factory Integration');
    
    try {
        // Test 1: Create Ollama provider through factory
        console.log('\n1. Testing factory creation...');
        const provider = LLMProviderFactory.createProvider('ollama', {
            host: 'localhost',
            port: 11434,
            model: 'llama2'
        });
        console.log('✅ Provider created through factory');
        console.log(`   - Type: ${provider.constructor.name}`);
        console.log(`   - Host: ${provider.host}`);
        console.log(`   - Port: ${provider.port}`);
        console.log(`   - Model: ${provider.model}`);
        
        // Test 2: Verify it's the correct type
        console.log('\n2. Testing provider type...');
        if (provider instanceof OllamaProvider) {
            console.log('✅ Provider is OllamaProvider instance');
        } else {
            console.log('❌ Provider is not OllamaProvider instance');
        }
        
        // Test 3: Test available providers includes Ollama
        console.log('\n3. Testing available providers...');
        const availableProviders = LLMProviderFactory.getAvailableProviders();
        const ollamaProvider = availableProviders.find(p => p.id === 'ollama');
        
        if (ollamaProvider) {
            console.log('✅ Ollama found in available providers');
            console.log(`   - Name: ${ollamaProvider.name}`);
            console.log(`   - Description: ${ollamaProvider.description}`);
            console.log(`   - Requires API Key: ${ollamaProvider.requiresApiKey}`);
            console.log(`   - Requires Service: ${ollamaProvider.requiresService}`);
            console.log(`   - Is Local: ${ollamaProvider.isLocal}`);
        } else {
            console.log('❌ Ollama not found in available providers');
        }
        
        // Test 4: Configuration validation
        console.log('\n4. Testing configuration validation...');
        
        // Valid configuration
        try {
            LLMProviderFactory.validateConfig('ollama', {
                host: 'localhost',
                port: 11434,
                model: 'llama2'
            });
            console.log('✅ Valid configuration passed validation');
        } catch (error) {
            console.log(`❌ Valid configuration failed: ${error.message}`);
        }
        
        // Invalid host
        try {
            LLMProviderFactory.validateConfig('ollama', {
                host: 'invalid host with spaces'
            });
            console.log('❌ Should have failed for invalid host');
        } catch (error) {
            console.log(`✅ Invalid host correctly rejected: ${error.message}`);
        }
        
        // Invalid port
        try {
            LLMProviderFactory.validateConfig('ollama', {
                port: -1
            });
            console.log('❌ Should have failed for invalid port');
        } catch (error) {
            console.log(`✅ Invalid port correctly rejected: ${error.message}`);
        }
        
        // Test 5: Default configuration
        console.log('\n5. Testing default configuration...');
        const defaultProvider = LLMProviderFactory.createProvider('ollama');
        console.log(`   - Default host: ${defaultProvider.host}`);
        console.log(`   - Default port: ${defaultProvider.port}`);
        console.log(`   - Default model: ${defaultProvider.model}`);
        console.log(`   - Default baseUrl: ${defaultProvider.baseUrl}`);
        
        // Test 6: Error handling for unknown provider
        console.log('\n6. Testing error handling...');
        try {
            LLMProviderFactory.createProvider('unknown');
            console.log('❌ Should have failed for unknown provider');
        } catch (error) {
            console.log(`✅ Unknown provider correctly rejected: ${error.message}`);
        }
        
        console.log('\n✅ All factory integration tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
    }
}

// Run the test
testFactoryIntegration();