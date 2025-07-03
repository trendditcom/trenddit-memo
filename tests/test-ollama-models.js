// Test various Ollama models for compatibility and functionality
import { OllamaProvider } from '../providers/ollama-provider.js';

console.log('🧪 Testing Various Ollama Models\n');

async function testAvailableModels() {
    console.log('1. Testing model discovery...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        maxRetries: 2,
        retryDelay: 500
    });

    try {
        await provider.initialize();
        console.log(`   ✅ Connected to Ollama service`);
        console.log(`   ✅ Found ${provider.availableModels.length} models`);
        
        if (provider.availableModels.length === 0) {
            console.log('   ⚠️  No models found. Please install at least one model with:');
            console.log('      ollama pull llama2');
            return [];
        }

        console.log('\n   Available models:');
        provider.availableModels.forEach((model, index) => {
            const modelName = model.name || model;
            const size = model.size ? `(${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)` : '';
            console.log(`   ${index + 1}. ${modelName} ${size}`);
        });

        return provider.availableModels;
    } catch (error) {
        console.log(`   ❌ Failed to connect: ${error.message.split('\n')[0]}`);
        return [];
    }
}

async function testModelChat(modelName, testPrompt = "Hello! Please respond with a short greeting.") {
    console.log(`\n2. Testing chat with model: ${modelName}`);
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: modelName,
        maxRetries: 2,
        retryDelay: 500
    });

    try {
        await provider.initialize();
        
        const startTime = Date.now();
        const response = await provider.chat([
            { role: 'user', content: testPrompt }
        ]);
        const endTime = Date.now();
        
        console.log(`   ✅ Chat successful (${endTime - startTime}ms)`);
        console.log(`   📝 Response: ${response.content.substring(0, 100)}${response.content.length > 100 ? '...' : ''}`);
        console.log(`   📊 Tokens - Prompt: ${response.usage.prompt_tokens}, Completion: ${response.usage.completion_tokens}`);
        
        return {
            success: true,
            model: modelName,
            responseTime: endTime - startTime,
            responseLength: response.content.length,
            tokens: response.usage.total_tokens
        };
    } catch (error) {
        console.log(`   ❌ Chat failed: ${error.message.split('\n')[0]}`);
        return {
            success: false,
            model: modelName,
            error: error.message
        };
    }
}

async function testMemoProcessing(modelName, sampleContent = '<html><body><h1>Test Article</h1><p>This is a test article about AI and machine learning.</p></body></html>') {
    console.log(`\n3. Testing memo processing with model: ${modelName}`);
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: modelName,
        maxRetries: 2,
        retryDelay: 500
    });

    try {
        await provider.initialize();
        
        const startTime = Date.now();
        const result = await provider.processMemo(sampleContent, {
            url: 'https://example.com/test-article',
            tags: [
                { name: 'technology' },
                { name: 'ai' },
                { name: 'research' }
            ]
        });
        const endTime = Date.now();
        
        console.log(`   ✅ Memo processing successful (${endTime - startTime}ms)`);
        console.log(`   📄 Title: ${result.title}`);
        console.log(`   📝 Summary: ${result.summary.substring(0, 80)}${result.summary.length > 80 ? '...' : ''}`);
        console.log(`   🏷️  Tag: ${result.selectedTag}`);
        
        return {
            success: true,
            model: modelName,
            processingTime: endTime - startTime,
            result: result
        };
    } catch (error) {
        console.log(`   ❌ Memo processing failed: ${error.message.split('\n')[0]}`);
        return {
            success: false,
            model: modelName,
            error: error.message
        };
    }
}

async function testModelPerformance(models) {
    console.log('\n4. Performance comparison across models...\n');
    
    const results = [];
    const testPrompt = "Explain what AI is in one sentence.";
    
    for (let i = 0; i < Math.min(models.length, 5); i++) { // Test up to 5 models
        const model = models[i];
        const modelName = model.name || model;
        
        console.log(`Testing ${modelName}...`);
        
        // Test chat performance
        const chatResult = await testModelChat(modelName, testPrompt);
        
        // Test memo processing performance  
        const memoResult = await testMemoProcessing(modelName);
        
        results.push({
            model: modelName,
            chat: chatResult,
            memo: memoResult
        });
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}

function displayPerformanceResults(results) {
    console.log('\n📊 Performance Summary:');
    console.log('=====================================');
    
    const successfulModels = results.filter(r => r.chat.success && r.memo.success);
    const failedModels = results.filter(r => !r.chat.success || !r.memo.success);
    
    if (successfulModels.length > 0) {
        console.log('\n✅ Working Models:');
        successfulModels.forEach(result => {
            console.log(`   ${result.model}:`);
            console.log(`      Chat: ${result.chat.responseTime}ms (${result.chat.tokens} tokens)`);
            console.log(`      Memo: ${result.memo.processingTime}ms`);
        });
        
        // Find fastest model
        const fastestChat = successfulModels.reduce((prev, current) => 
            current.chat.responseTime < prev.chat.responseTime ? current : prev
        );
        const fastestMemo = successfulModels.reduce((prev, current) => 
            current.memo.processingTime < prev.memo.processingTime ? current : prev
        );
        
        console.log('\n🏆 Performance Winners:');
        console.log(`   Fastest Chat: ${fastestChat.model} (${fastestChat.chat.responseTime}ms)`);
        console.log(`   Fastest Memo: ${fastestMemo.model} (${fastestMemo.memo.processingTime}ms)`);
    }
    
    if (failedModels.length > 0) {
        console.log('\n❌ Failed Models:');
        failedModels.forEach(result => {
            console.log(`   ${result.model}:`);
            if (!result.chat.success) console.log(`      Chat Error: ${result.chat.error.split('\n')[0]}`);
            if (!result.memo.success) console.log(`      Memo Error: ${result.memo.error.split('\n')[0]}`);
        });
    }
    
    console.log(`\n📈 Success Rate: ${successfulModels.length}/${results.length} models working`);
    
    return {
        total: results.length,
        successful: successfulModels.length,
        failed: failedModels.length,
        fastestChat: successfulModels.length > 0 ? fastestChat.model : null,
        fastestMemo: successfulModels.length > 0 ? fastestMemo.model : null
    };
}

async function runModelTests() {
    try {
        console.log('🔍 Discovering available Ollama models...\n');
        
        const models = await testAvailableModels();
        
        if (models.length === 0) {
            console.log('\n❌ No models available for testing');
            console.log('Please install models with: ollama pull <model-name>');
            console.log('Recommended models: llama2, mistral, codellama');
            return;
        }
        
        console.log('\n🧪 Running comprehensive model tests...\n');
        const results = await testModelPerformance(models);
        
        const summary = displayPerformanceResults(results);
        
        console.log('\n✅ Model testing completed!');
        console.log('\n📝 Recommendations:');
        
        if (summary.successful > 0) {
            console.log(`   - Use ${summary.fastestChat} for quick chat responses`);
            console.log(`   - Use ${summary.fastestMemo} for memo processing`);
            console.log(`   - All ${summary.successful} working models are suitable for production use`);
        } else {
            console.log('   - Check Ollama service status and model installations');
            console.log('   - Ensure CORS is configured: OLLAMA_ORIGINS="chrome-extension://*"');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the tests
runModelTests();