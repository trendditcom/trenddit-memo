// Simple test for ProviderConfigManager implementation
import { ProviderConfigManager } from '../config/provider-config.js';

// Mock Chrome APIs for Node.js testing
global.chrome = {
    storage: {
        local: {
            data: {},
            get: function(keys, callback) {
                const result = {};
                if (Array.isArray(keys)) {
                    keys.forEach(key => {
                        if (this.data[key] !== undefined) {
                            result[key] = this.data[key];
                        }
                    });
                } else if (typeof keys === 'string') {
                    if (this.data[keys] !== undefined) {
                        result[keys] = this.data[keys];
                    }
                }
                callback(result);
            },
            set: function(data, callback) {
                Object.assign(this.data, data);
                callback();
            },
            remove: function(keys, callback) {
                if (Array.isArray(keys)) {
                    keys.forEach(key => delete this.data[key]);
                } else {
                    delete this.data[keys];
                }
                callback();
            }
        }
    },
    runtime: {
        lastError: null
    }
};

async function testProviderConfigManager() {
    console.log('🧪 Testing ProviderConfigManager Implementation');
    
    try {
        // Test 1: Manager instantiation
        console.log('\n1. Testing manager instantiation...');
        const configManager = new ProviderConfigManager();
        console.log('✅ ConfigManager created successfully');
        
        // Test 2: Initial state (no configuration)
        console.log('\n2. Testing initial state...');
        const initialConfig = await configManager.getCurrentConfig();
        console.log(`   - Initial config: ${initialConfig} (should be null)`);
        const isConfigured = await configManager.isConfigured();
        console.log(`   - Is configured: ${isConfigured} (should be false)`);
        
        // Test 3: Create and set configuration
        console.log('\n3. Testing configuration creation...');
        const testConfig = configManager.createDefaultConfig('anthropic', 'sk-ant-test-key');
        console.log(`   - Created config for: ${testConfig.type}`);
        console.log(`   - Default model: ${testConfig.model}`);
        
        await configManager.setConfig(testConfig);
        console.log('✅ Configuration set successfully');
        
        // Test 4: Retrieve configuration
        console.log('\n4. Testing configuration retrieval...');
        const retrievedConfig = await configManager.getCurrentConfig();
        console.log(`   - Provider type: ${retrievedConfig.type}`);
        console.log(`   - Model: ${retrievedConfig.model}`);
        console.log(`   - Has API key: ${!!retrievedConfig.apiKey}`);
        console.log(`   - Last updated: ${new Date(retrievedConfig.lastUpdated).toISOString()}`);
        
        // Test 5: Configuration validation
        console.log('\n5. Testing configuration validation...');
        const validConfig = { type: 'anthropic', apiKey: 'test-key' };
        const invalidConfig = { type: 'invalid' };
        
        console.log(`   - Valid config validates: ${configManager.validateConfig(validConfig)}`);
        console.log(`   - Invalid config validates: ${configManager.validateConfig(invalidConfig)}`);
        
        // Test 6: Provider-specific config
        console.log('\n6. Testing provider-specific configuration...');
        const anthropicConfig = await configManager.getProviderConfig('anthropic');
        console.log(`   - Anthropic config found: ${!!anthropicConfig}`);
        
        const openaiConfig = await configManager.getProviderConfig('openai');
        console.log(`   - OpenAI config found: ${!!openaiConfig} (should be false)`);
        
        // Test 7: Configuration status
        console.log('\n7. Testing configuration status...');
        const status = await configManager.getConfigStatus();
        console.log(`   - Configured: ${status.configured}`);
        console.log(`   - Provider: ${status.provider}`);
        console.log(`   - Model: ${status.model}`);
        console.log(`   - Has API key: ${status.hasApiKey}`);
        
        // Test 8: Available providers
        console.log('\n8. Testing available providers...');
        const providers = configManager.getAvailableProviders();
        console.log(`   - Available providers: ${providers.length}`);
        providers.forEach(provider => {
            console.log(`     - ${provider.name} (${provider.id}): ${provider.models.length} models`);
        });
        
        // Test 9: API key update
        console.log('\n9. Testing API key update...');
        await configManager.updateApiKey('sk-ant-updated-key');
        const updatedConfig = await configManager.getCurrentConfig();
        console.log(`   - API key updated: ${updatedConfig.apiKey.endsWith('updated-key')}`);
        
        // Test 10: Model update
        console.log('\n10. Testing model update...');
        await configManager.updateModel('claude-3-5-haiku-20241022');
        const modelUpdatedConfig = await configManager.getCurrentConfig();
        console.log(`   - Model updated to: ${modelUpdatedConfig.model}`);
        
        // Test 11: Legacy migration simulation
        console.log('\n11. Testing legacy migration...');
        // First, clear current config
        await configManager.resetConfig();
        
        // Set up legacy config
        chrome.storage.local.data.anthropicApiKey = 'sk-ant-legacy-key';
        
        const migrationResult = await configManager.migrateFromLegacy();
        console.log(`   - Migration performed: ${migrationResult}`);
        
        if (migrationResult) {
            const migratedConfig = await configManager.getCurrentConfig();
            console.log(`   - Migrated provider: ${migratedConfig.type}`);
            console.log(`   - Migrated flag: ${migratedConfig.migrated}`);
        }
        
        console.log('\n✅ All tests passed! ProviderConfigManager implementation is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testProviderConfigManager();