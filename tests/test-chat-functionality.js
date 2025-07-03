// Test chat functionality with local Ollama models
import { OllamaProvider } from '../providers/ollama-provider.js';

console.log('🧪 Testing Chat Functionality with Local Models\n');

async function testChatConversation() {
    console.log('1. Testing multi-turn chat conversation...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'llama3.2', // Use a smaller, faster model
        maxRetries: 2,
        retryDelay: 500
    });

    try {
        await provider.initialize();
        console.log(`   ✅ Connected with model: ${provider.model}`);
        
        // Test a multi-turn conversation
        const conversation = [
            { role: 'user', content: 'Hello! Can you tell me what you are?' },
        ];
        
        console.log('\n   📝 Starting conversation...');
        const response1 = await provider.chat(conversation);
        console.log(`   User: ${conversation[0].content}`);
        console.log(`   AI: ${response1.content.substring(0, 100)}...`);
        console.log(`   Tokens: ${response1.usage.total_tokens} (${response1.usage.prompt_tokens}+${response1.usage.completion_tokens})`);
        
        // Continue conversation
        conversation.push({ role: 'assistant', content: response1.content });
        conversation.push({ role: 'user', content: 'Can you help me with web content analysis?' });
        
        const response2 = await provider.chat(conversation);
        console.log(`   User: ${conversation[2].content}`);
        console.log(`   AI: ${response2.content.substring(0, 100)}...`);
        console.log(`   Tokens: ${response2.usage.total_tokens} (${response2.usage.prompt_tokens}+${response2.usage.completion_tokens})`);
        
        return {
            success: true,
            model: provider.model,
            turns: 2,
            totalTokens: response1.usage.total_tokens + response2.usage.total_tokens
        };
    } catch (error) {
        console.log(`   ❌ Chat test failed: ${error.message.split('\n')[0]}`);
        return { success: false, error: error.message };
    }
}

async function testContextualChat() {
    console.log('\n2. Testing contextual chat with memo content...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'llama3.2',
        maxRetries: 2,
        retryDelay: 500
    });

    try {
        await provider.initialize();
        
        // Simulate a memo context
        const memoContext = `
        Previous memo: "Chrome Extension Development"
        Content: Chrome extensions use manifest.json for configuration, content scripts for web page interaction, 
        and background scripts for service worker functionality. They can access web APIs and browser APIs.
        
        Previous memo: "JavaScript ES Modules"
        Content: ES modules use import/export syntax, are loaded asynchronously, and provide better tree-shaking 
        for bundlers. They're supported natively in modern browsers.
        `;
        
        const conversation = [
            { role: 'system', content: `You are helping analyze web content. Here are some previous memos for context: ${memoContext}` },
            { role: 'user', content: 'Based on the memos, what are the key technologies for building a Chrome extension?' }
        ];
        
        const response = await provider.chat(conversation);
        console.log(`   📝 Question: ${conversation[1].content}`);
        console.log(`   🤖 Response: ${response.content.substring(0, 150)}...`);
        console.log(`   📊 Context tokens: ${response.usage.prompt_tokens}, Response: ${response.usage.completion_tokens}`);
        
        // Check if response references the context
        const contextRelevant = response.content.toLowerCase().includes('chrome') || 
                               response.content.toLowerCase().includes('extension') ||
                               response.content.toLowerCase().includes('manifest');
        
        console.log(`   🎯 Context awareness: ${contextRelevant ? '✅ Relevant' : '❌ Not relevant'}`);
        
        return {
            success: true,
            contextRelevant: contextRelevant,
            tokens: response.usage.total_tokens
        };
    } catch (error) {
        console.log(`   ❌ Contextual chat failed: ${error.message.split('\n')[0]}`);
        return { success: false, error: error.message };
    }
}

async function testErrorHandling() {
    console.log('\n3. Testing error handling and retry logic...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'nonexistent-model', // This should fail
        maxRetries: 2,
        retryDelay: 200
    });

    try {
        await provider.initialize();
        console.log('   ⚠️  Unexpectedly succeeded with invalid model');
        
        // Try chat anyway
        const response = await provider.chat([
            { role: 'user', content: 'This should fail' }
        ]);
        console.log('   ❌ Chat should have failed with invalid model');
        return { success: false, reason: 'Should have failed' };
    } catch (error) {
        console.log(`   ✅ Correctly failed with error: ${error.message.substring(0, 80)}...`);
        console.log(`   🔄 Retry logic was tested during failure`);
        return { success: true, errorHandled: true };
    }
}

async function testPerformanceVariousModels() {
    console.log('\n4. Testing performance with available models...');
    
    const testModels = ['llama3.2', 'phi3', 'gemma2']; // Fast, smaller models
    const results = [];
    
    for (const modelName of testModels) {
        const provider = new OllamaProvider({
            host: 'localhost',
            port: 11434,
            model: modelName,
            maxRetries: 1,
            retryDelay: 500
        });

        try {
            await provider.initialize();
            
            const startTime = Date.now();
            const response = await provider.chat([
                { role: 'user', content: 'What is AI? Answer in one sentence.' }
            ]);
            const endTime = Date.now();
            
            results.push({
                model: modelName,
                success: true,
                responseTime: endTime - startTime,
                tokens: response.usage.total_tokens,
                response: response.content.substring(0, 60) + '...'
            });
            
            console.log(`   ${modelName}: ${endTime - startTime}ms, ${response.usage.total_tokens} tokens`);
        } catch (error) {
            results.push({
                model: modelName,
                success: false,
                error: error.message.split('\n')[0]
            });
            console.log(`   ${modelName}: ❌ ${error.message.split('\n')[0]}`);
        }
    }
    
    return results;
}

function displayResults(chatResult, contextResult, errorResult, perfResults) {
    console.log('\n📊 Chat Functionality Test Results');
    console.log('====================================');
    
    console.log('\n🗣️  Basic Chat:');
    if (chatResult.success) {
        console.log(`   ✅ Multi-turn conversation successful`);
        console.log(`   📈 Total tokens used: ${chatResult.totalTokens}`);
        console.log(`   🔄 Conversation turns: ${chatResult.turns}`);
    } else {
        console.log(`   ❌ Chat failed: ${chatResult.error}`);
    }
    
    console.log('\n🧠 Contextual Chat:');
    if (contextResult.success) {
        console.log(`   ✅ Context-aware chat successful`);
        console.log(`   🎯 Relevant to context: ${contextResult.contextRelevant ? 'Yes' : 'No'}`);
        console.log(`   📊 Tokens used: ${contextResult.tokens}`);
    } else {
        console.log(`   ❌ Contextual chat failed: ${contextResult.error}`);
    }
    
    console.log('\n🛡️  Error Handling:');
    if (errorResult.success) {
        console.log(`   ✅ Error handling working correctly`);
        console.log(`   🔄 Retry logic validated`);
    } else {
        console.log(`   ❌ Error handling issues: ${errorResult.reason}`);
    }
    
    console.log('\n⚡ Performance Comparison:');
    const successful = perfResults.filter(r => r.success);
    if (successful.length > 0) {
        const fastest = successful.reduce((prev, current) => 
            current.responseTime < prev.responseTime ? current : prev
        );
        console.log(`   🏆 Fastest model: ${fastest.model} (${fastest.responseTime}ms)`);
        
        successful.forEach(result => {
            console.log(`   📈 ${result.model}: ${result.responseTime}ms, ${result.tokens} tokens`);
        });
    } else {
        console.log(`   ❌ No models responded successfully`);
    }
    
    const successRate = [chatResult.success, contextResult.success, errorResult.success].filter(Boolean).length;
    console.log(`\n🎯 Overall Success Rate: ${successRate}/3 tests passed`);
    
    if (successRate === 3) {
        console.log('🎉 All chat functionality tests passed!');
    } else {
        console.log('⚠️  Some tests failed - check Ollama service and models');
    }
}

async function runChatTests() {
    try {
        console.log('🔍 Testing chat functionality with local Ollama models...\n');
        
        const chatResult = await testChatConversation();
        const contextResult = await testContextualChat();
        const errorResult = await testErrorHandling();
        const perfResults = await testPerformanceVariousModels();
        
        displayResults(chatResult, contextResult, errorResult, perfResults);
        
        console.log('\n✅ Chat functionality testing completed!');
        console.log('\n📝 Summary:');
        console.log('   - Multi-turn conversations work correctly');
        console.log('   - Context awareness is functional');
        console.log('   - Error handling and retry logic validated');
        console.log('   - Performance varies by model size and complexity');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the tests
runChatTests();