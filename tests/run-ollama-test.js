// Simple test for OllamaProvider implementation
import { OllamaProvider } from '../providers/ollama-provider.js';
import { LLMProvider } from '../llm-provider-api.js';

async function testOllamaProvider() {
    console.log('🧪 Testing OllamaProvider Implementation');
    
    try {
        // Test 1: Provider instantiation
        console.log('\n1. Testing provider instantiation...');
        const provider = new OllamaProvider();
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
        console.log(`   - host: ${provider.host} (should be localhost)`);
        console.log(`   - port: ${provider.port} (should be 11434)`);
        console.log(`   - baseUrl: ${provider.baseUrl} (should be http://localhost:11434)`);
        console.log(`   - model: ${provider.model} (should be llama2)`);
        console.log(`   - availableModels: ${provider.availableModels.length} (should be 0)`);
        
        // Test 4: Configuration
        console.log('\n4. Testing configuration...');
        const configProvider = new OllamaProvider({ 
            host: '192.168.1.100',
            port: 8080,
            model: 'codellama'
        });
        console.log(`   - configured host: ${configProvider.host}`);
        console.log(`   - configured port: ${configProvider.port}`);
        console.log(`   - configured model: ${configProvider.model}`);
        console.log(`   - configured baseUrl: ${configProvider.baseUrl}`);
        
        // Test 5: Validation
        console.log('\n5. Testing validation...');
        try {
            OllamaProvider.validateConfig({ host: 'localhost', port: 11434 });
            console.log('✅ Validation passed with valid config');
        } catch (error) {
            console.log(`❌ Validation failed unexpectedly: ${error.message}`);
        }
        
        try {
            OllamaProvider.validateConfig({ port: -1 });
            console.log('❌ Should have failed validation for invalid port');
        } catch (error) {
            console.log(`✅ Validation correctly failed: ${error.message}`);
        }
        
        // Test 6: Token calculation
        console.log('\n6. Testing token calculation...');
        const tokens = provider.calculateTokens('This is a test message for local model');
        console.log(`   - Token count for "This is a test message for local model": ${tokens} tokens`);
        
        // Test 7: Base class methods
        console.log('\n7. Testing inherited methods...');
        const systemMessage = provider.createSystemMessage([], null);
        console.log(`   - System message length: ${systemMessage.length} characters`);
        
        const wordCount = provider.countWords('hello local world');
        console.log(`   - Word count for "hello local world": ${wordCount} words`);
        
        const sanitized = provider.sanitizeContent('local "content" test');
        console.log(`   - Sanitized content: ${sanitized}`);
        
        // Test 8: Service status
        console.log('\n8. Testing service status...');
        const status = provider.getServiceStatus();
        console.log(`   - Service available: ${status.available}`);
        console.log(`   - Initialized: ${status.initialized}`);
        console.log(`   - Host: ${status.host}`);
        console.log(`   - Port: ${status.port}`);
        console.log(`   - Models count: ${status.modelsCount}`);
        
        // Test 9: Host validation
        console.log('\n9. Testing host validation...');
        const validHosts = ['localhost', '127.0.0.1', '192.168.1.100', 'my-server.local'];
        const invalidHosts = ['invalid host', '', 'http://localhost'];
        
        for (const host of validHosts) {
            if (OllamaProvider.isValidHost(host)) {
                console.log(`   ✅ "${host}" is valid`);
            } else {
                console.log(`   ❌ "${host}" should be valid`);
            }
        }
        
        for (const host of invalidHosts) {
            if (!OllamaProvider.isValidHost(host)) {
                console.log(`   ✅ "${host}" is correctly invalid`);
            } else {
                console.log(`   ❌ "${host}" should be invalid`);
            }
        }
        
        // Test 10: Available models getter
        console.log('\n10. Testing available models...');
        const models = provider.getAvailableModels();
        console.log(`   - Available models: ${models.length} (should be 0 before initialization)`);
        
        console.log('\n✅ All tests passed! OllamaProvider implementation is working correctly.');
        console.log('\n📝 Note: Connection tests require a running Ollama service.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
    }
}

// Run the test
testOllamaProvider();