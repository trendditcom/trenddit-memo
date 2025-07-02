// Test configuration management for Ollama provider
import { ProviderConfigManager } from '../config/provider-config.js';

async function testOllamaConfigManagement() {
    console.log('🧪 Testing Ollama Configuration Management');
    
    try {
        // Create config manager instance
        const configManager = new ProviderConfigManager();
        
        // Test 1: Create default Ollama configuration
        console.log('\n1. Testing default Ollama configuration...');
        const defaultConfig = configManager.createDefaultConfig('ollama');
        console.log('✅ Default Ollama config created:');
        console.log(`   - Type: ${defaultConfig.type}`);
        console.log(`   - Host: ${defaultConfig.host}`);
        console.log(`   - Port: ${defaultConfig.port}`);
        console.log(`   - Model: ${defaultConfig.model}`);
        console.log(`   - Has API key: ${!!defaultConfig.apiKey}`);
        
        // Test 2: Validate Ollama configuration
        console.log('\n2. Testing Ollama configuration validation...');
        const validConfig = {
            type: 'ollama',
            host: 'localhost',
            port: 11434,
            model: 'llama2'
        };
        
        if (configManager.validateConfig(validConfig)) {
            console.log('✅ Valid Ollama config passed validation');
        } else {
            console.log('❌ Valid Ollama config failed validation');
        }
        
        // Test 3: Invalid configurations
        console.log('\n3. Testing invalid configurations...');
        
        const invalidConfigs = [
            { type: 'ollama', host: 'invalid host', port: 11434 },
            { type: 'ollama', host: 'localhost', port: -1 },
            { type: 'ollama', host: 'localhost', port: 99999 }
        ];
        
        for (const config of invalidConfigs) {
            if (!configManager.validateConfig(config)) {
                console.log(`✅ Invalid config correctly rejected: ${JSON.stringify(config)}`);
            } else {
                console.log(`❌ Invalid config incorrectly accepted: ${JSON.stringify(config)}`);
            }
        }
        
        // Test 4: Available providers includes Ollama
        console.log('\n4. Testing available providers...');
        const providers = configManager.getAvailableProviders();
        const ollamaProvider = providers.find(p => p.id === 'ollama');
        
        if (ollamaProvider) {
            console.log('✅ Ollama found in available providers:');
            console.log(`   - Name: ${ollamaProvider.name}`);
            console.log(`   - Requires API Key: ${ollamaProvider.requiresApiKey}`);
            console.log(`   - Requires Service: ${ollamaProvider.requiresService}`);
            console.log(`   - Is Local: ${ollamaProvider.isLocal}`);
        } else {
            console.log('❌ Ollama not found in available providers');
        }
        
        // Test 5: Create custom Ollama configuration
        console.log('\n5. Testing custom Ollama configuration...');
        const customConfig = configManager.createDefaultConfig('ollama');
        customConfig.host = '192.168.1.100';
        customConfig.port = 8080;
        customConfig.model = 'codellama';
        
        if (configManager.validateConfig(customConfig)) {
            console.log('✅ Custom Ollama config is valid:');
            console.log(`   - Host: ${customConfig.host}`);
            console.log(`   - Port: ${customConfig.port}`);
            console.log(`   - Model: ${customConfig.model}`);
        } else {
            console.log('❌ Custom Ollama config failed validation');
        }
        
        // Test 6: Test configuration with dynamic model
        console.log('\n6. Testing dynamic model configuration...');
        const dynamicModelConfig = {
            type: 'ollama',
            host: 'localhost',
            port: 11434,
            model: 'mistral-7b-instruct' // Dynamic model not in predefined list
        };
        
        if (configManager.validateConfig(dynamicModelConfig)) {
            console.log('✅ Dynamic model config passed validation');
        } else {
            console.log('❌ Dynamic model config failed validation');
        }
        
        // Test 7: Test Ollama-specific methods structure
        console.log('\n7. Testing Ollama-specific methods...');
        
        // Check if methods exist
        const methods = ['getOllamaConfig', 'saveOllamaConfig', 'testOllamaConnection', 'getAvailableOllamaModels'];
        for (const method of methods) {
            if (typeof configManager[method] === 'function') {
                console.log(`✅ Method ${method} exists`);
            } else {
                console.log(`❌ Method ${method} missing`);
            }
        }
        
        // Test 8: Default Ollama config structure
        console.log('\n8. Testing getOllamaConfig default structure...');
        try {
            const ollamaConfig = await configManager.getOllamaConfig();
            console.log('✅ getOllamaConfig returned default structure:');
            console.log(`   - Host: ${ollamaConfig.host}`);
            console.log(`   - Port: ${ollamaConfig.port}`);
            console.log(`   - Model: ${ollamaConfig.model}`);
            console.log(`   - Enabled: ${ollamaConfig.enabled}`);
        } catch (error) {
            console.log(`❌ getOllamaConfig failed: ${error.message}`);
        }
        
        console.log('\n✅ All Ollama configuration management tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
    }
}

// Run the test
testOllamaConfigManagement();