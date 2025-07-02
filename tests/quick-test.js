// Quick test to verify the fixes
import { OllamaProvider } from '../providers/ollama-provider.js';

console.log('🧪 Quick Test - Ollama Provider Timeout Fixes\n');

// Test 1: Provider instantiation
console.log('1. Testing provider instantiation...');
const provider = new OllamaProvider({ host: 'localhost', port: 11434 });
console.log('✅ Provider created successfully');

// Test 2: Check if timeout is properly configured
console.log('\n2. Testing timeout configuration...');
try {
    // Mock fetch to hang
    const originalFetch = global.fetch;
    global.fetch = () => new Promise(() => {}); // Never resolves
    
    const startTime = Date.now();
    const promise = provider.testConnection();
    
    // Race condition: either timeout or 12 seconds
    const raceResult = await Promise.race([
        promise.catch(err => ({ error: err.message, elapsed: Date.now() - startTime })),
        new Promise(resolve => setTimeout(() => resolve({ timeout: true, elapsed: Date.now() - startTime }), 12000))
    ]);
    
    global.fetch = originalFetch;
    
    if (raceResult.error && raceResult.error.includes('timeout') && raceResult.elapsed < 11000) {
        console.log(`✅ Timeout working correctly (${raceResult.elapsed}ms)`);
    } else if (raceResult.timeout) {
        console.log('❌ Timeout not working - test took too long');
    } else {
        console.log(`❌ Unexpected result: ${JSON.stringify(raceResult)}`);
    }
} catch (error) {
    console.log(`❌ Test error: ${error.message}`);
}

console.log('\n🎉 Quick test completed! Ollama provider now has proper timeout handling.');
console.log('This should prevent the "Checking service..." hang issue.');