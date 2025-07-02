// Simple test for Ollama provider timeout fixes
import { OllamaProvider } from '../providers/ollama-provider.js';

// Mock fetch to simulate timeout
const originalFetch = global.fetch;

function mockTimeoutFetch() {
    return new Promise(() => {
        // Never resolves to simulate hanging request
    });
}

function mockSuccessFetch() {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            models: [
                { name: 'llama2', size: '3.8GB' },
                { name: 'codellama', size: '7.3GB' }
            ]
        })
    });
}

console.log('🧪 Testing Ollama Provider Timeout Fixes\n');

async function testTimeoutHandling() {
    console.log('1. Testing timeout handling...');
    
    // Mock hanging fetch
    global.fetch = mockTimeoutFetch;
    
    const provider = new OllamaProvider({ host: 'localhost', port: 11434 });
    
    try {
        // This should timeout and throw an error within 10 seconds
        const startTime = Date.now();
        await provider.testConnection();
        console.log('❌ Test failed: Should have timed out');
        return false;
    } catch (error) {
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        
        if (error.message.includes('timeout') && elapsed < 15000) {
            console.log(`✅ Timeout handled correctly in ${elapsed}ms`);
            return true;
        } else {
            console.log(`❌ Test failed: ${error.message} (took ${elapsed}ms)`);
            return false;
        }
    }
}

async function testSuccessfulConnection() {
    console.log('\n2. Testing successful connection...');
    
    // Mock successful fetch
    global.fetch = mockSuccessFetch;
    
    const provider = new OllamaProvider({ host: 'localhost', port: 11434 });
    
    try {
        const result = await provider.testConnection();
        if (result === true) {
            console.log('✅ Connection test successful');
            
            // Test model loading
            await provider.loadAvailableModels();
            const models = provider.getAvailableModels();
            
            if (models.length === 2 && models[0].name === 'llama2') {
                console.log('✅ Model loading successful');
                return true;
            } else {
                console.log('❌ Model loading failed');
                return false;
            }
        } else {
            console.log('❌ Connection test failed');
            return false;
        }
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return false;
    }
}

async function runTests() {
    let passed = 0;
    let total = 2;
    
    if (await testTimeoutHandling()) passed++;
    if (await testSuccessfulConnection()) passed++;
    
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${total - passed}`);
    console.log(`📈 Total: ${total}`);
    
    if (passed === total) {
        console.log('🎉 All Ollama timeout tests passed!');
        return true;
    } else {
        console.log('💥 Some tests failed!');
        return false;
    }
}

// Run tests and restore fetch
runTests().finally(() => {
    global.fetch = originalFetch;
});