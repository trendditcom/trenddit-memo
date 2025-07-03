// Test runner for Ollama provider retry logic
import { OllamaProvider } from '../providers/ollama-provider.js';

console.log('🧪 Testing Ollama Provider Retry Logic\n');

// Test the retry functionality
async function testRetryLogic() {
    const provider = new OllamaProvider({ 
        host: 'localhost', 
        port: 11434,
        maxRetries: 3,
        retryDelay: 100 // Short delay for testing
    });

    console.log('1. Testing retry configuration...');
    console.log(`   - maxRetries: ${provider.maxRetries} (should be 3)`);
    console.log(`   - retryDelay: ${provider.retryDelay} (should be 100)`);
    
    console.log('\n2. Testing exponential backoff calculation...');
    const delay1 = provider.calculateRetryDelay(1);
    const delay2 = provider.calculateRetryDelay(2);
    const delay3 = provider.calculateRetryDelay(3);
    
    console.log(`   - Attempt 1 delay: ${Math.round(delay1)}ms`);
    console.log(`   - Attempt 2 delay: ${Math.round(delay2)}ms`);
    console.log(`   - Attempt 3 delay: ${Math.round(delay3)}ms`);
    
    if (delay2 > delay1 && delay3 > delay2) {
        console.log('   ✅ Exponential backoff working correctly');
    } else {
        console.log('   ❌ Exponential backoff not working');
    }

    console.log('\n3. Testing sleep utility...');
    const startTime = Date.now();
    await provider.sleep(50);
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    if (elapsed >= 45 && elapsed <= 100) { // Allow some variance
        console.log(`   ✅ Sleep worked correctly (${elapsed}ms)`);
    } else {
        console.log(`   ❌ Sleep timing off (${elapsed}ms)`);
    }

    console.log('\n4. Testing retry with mock function...');
    let attemptCount = 0;
    
    const mockFunction = async () => {
        attemptCount++;
        if (attemptCount < 3) {
            throw new Error(`Temporary failure ${attemptCount}`);
        }
        return 'Success!';
    };

    try {
        const result = await provider.retryWithBackoff(mockFunction);
        console.log(`   ✅ Retry succeeded after ${attemptCount} attempts: ${result}`);
    } catch (error) {
        console.log(`   ❌ Retry failed: ${error.message}`);
    }

    console.log('\n5. Testing retry failure after max attempts...');
    attemptCount = 0;
    
    const alwaysFailFunction = async () => {
        attemptCount++;
        throw new Error(`Persistent failure ${attemptCount}`);
    };

    try {
        await provider.retryWithBackoff(alwaysFailFunction);
        console.log('   ❌ Should have failed after max attempts');
    } catch (error) {
        if (attemptCount === provider.maxRetries) {
            console.log(`   ✅ Correctly failed after ${attemptCount} attempts: ${error.message}`);
        } else {
            console.log(`   ❌ Wrong number of attempts: ${attemptCount}`);
        }
    }
}

// Test with actual Ollama connection (will fail gracefully if Ollama not running)
async function testOllamaConnection() {
    console.log('\n6. Testing actual Ollama connection with retry...');
    const provider = new OllamaProvider({ 
        host: 'localhost', 
        port: 11434,
        maxRetries: 2,
        retryDelay: 200
    });

    try {
        await provider.initialize();
        console.log('   ✅ Successfully connected to Ollama service');
        console.log(`   ✅ Available models: ${provider.availableModels.length}`);
        
        if (provider.availableModels.length > 0) {
            console.log(`   ✅ First model: ${provider.availableModels[0].name || provider.availableModels[0]}`);
        }
    } catch (error) {
        console.log(`   ⚠️  Could not connect to Ollama (this is expected if service isn't running)`);
        console.log(`   ⚠️  Error: ${error.message.split('\n')[0]}`); // First line only
    }
}

// Run all tests
async function runAllTests() {
    try {
        await testRetryLogic();
        await testOllamaConnection();
        
        console.log('\n✅ Retry logic implementation tests completed!');
        console.log('\n📝 Next steps:');
        console.log('   - Run with actual Ollama service to test real connections');
        console.log('   - Test with various Ollama models');
        console.log('   - Test chat functionality with retry logic');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

runAllTests();