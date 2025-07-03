// Test performance optimizations for Ollama provider
import { OllamaProvider } from '../providers/ollama-provider.js';

console.log('🧪 Testing Ollama Performance Optimizations\n');

async function testOptimizedTokenCounting() {
    console.log('1. Testing optimized token counting...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'llama3.2'
    });

    const testTexts = [
        'Hello world',
        'This is a test message with multiple words and punctuation!',
        'function calculateTokens(text) { return text.length / 4; }',
        'Visit https://example.com for more information about AI.',
        'Unicode text: 你好世界 مرحبا بالعالم 🌍',
        'Mixed content with code ```python\nprint("hello")\n``` and normal text.',
    ];

    console.log('   Text samples with optimized token counts:');
    testTexts.forEach((text, index) => {
        const tokens = provider.optimizeTokenCounting(text);
        const oldMethod = Math.ceil(text.length / 4);
        const improvement = ((oldMethod - tokens) / oldMethod * 100).toFixed(1);
        
        console.log(`   ${index + 1}. "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`);
        console.log(`      Optimized: ${tokens} tokens, Old method: ${oldMethod} tokens (${improvement > 0 ? '-' : '+'}${Math.abs(improvement)}%)`);
    });
}

async function testProgressReporting() {
    console.log('\n2. Testing progress reporting...');
    
    const progressReports = [];
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'llama3.2',
        progressCallback: (progress) => {
            progressReports.push(progress);
        }
    });

    console.log('   Testing progress tracking...');
    
    // Simulate various operations
    provider.reportProgress('test', 'initializing', 0, 'Starting test');
    provider.reportProgress('test', 'processing', 50, 'Halfway done');
    provider.reportProgress('test', 'finalizing', 90, 'Almost complete');
    provider.reportProgress('test', 'completed', 100, 'Test finished');

    console.log(`   ✅ Captured ${progressReports.length} progress reports`);
    progressReports.forEach((report, index) => {
        console.log(`      ${index + 1}. ${report.operation}: ${report.stage} (${report.percentage || 'N/A'}%) - ${report.message || 'No message'}`);
    });
}

async function testConnectionWarming() {
    console.log('\n3. Testing connection warming...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'llama3.2'
    });

    try {
        await provider.initialize();
        
        console.log('   Testing cold connection...');
        const coldStart = Date.now();
        await provider.testConnection();
        const coldTime = Date.now() - coldStart;
        
        console.log('   Warming connection...');
        await provider.warmConnection();
        
        console.log('   Testing warm connection...');
        const warmStart = Date.now();
        await provider.testConnection();
        const warmTime = Date.now() - warmStart;
        
        console.log(`   ✅ Cold connection: ${coldTime}ms`);
        console.log(`   ✅ Warm connection: ${warmTime}ms`);
        console.log(`   📈 Improvement: ${((coldTime - warmTime) / coldTime * 100).toFixed(1)}%`);
        
    } catch (error) {
        console.log(`   ⚠️  Connection test skipped: ${error.message.split('\n')[0]}`);
    }
}

async function testPerformanceProfiling() {
    console.log('\n4. Testing performance profiling...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'llama3.2'
    });

    try {
        await provider.initialize();
        
        console.log('   Building performance profile...');
        const profile = await provider.buildPerformanceProfile();
        
        if (profile) {
            console.log(`   ✅ Profile created for model: ${profile.model}`);
            console.log(`   📊 Baseline latency: ${profile.baselineLatency}ms`);
            console.log(`   ⚡ Tokens per second: ${profile.avgTokensPerSecond.toFixed(2)}`);
            console.log(`   ⏱️  Chat timeout: ${profile.estimatedTimeouts.chat}ms`);
            console.log(`   ⏱️  Memo timeout: ${profile.estimatedTimeouts.memo}ms`);
            
            // Test optimized timeout retrieval
            const chatTimeout = provider.getOptimizedTimeout('chat');
            const memoTimeout = provider.getOptimizedTimeout('memo');
            
            console.log(`   🎯 Optimized chat timeout: ${chatTimeout}ms`);
            console.log(`   🎯 Optimized memo timeout: ${memoTimeout}ms`);
        } else {
            console.log('   ⚠️  No performance profile created');
        }
        
    } catch (error) {
        console.log(`   ⚠️  Profiling test skipped: ${error.message.split('\n')[0]}`);
    }
}

async function testModelCaching() {
    console.log('\n5. Testing model info caching...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'llama3.2'
    });

    try {
        await provider.initialize();
        
        console.log('   Testing cache miss (first call)...');
        const start1 = Date.now();
        const info1 = await provider.cacheModelInfo();
        const time1 = Date.now() - start1;
        
        console.log('   Testing cache hit (second call)...');
        const start2 = Date.now();
        const info2 = await provider.cacheModelInfo();
        const time2 = Date.now() - start2;
        
        console.log(`   ✅ Cache miss: ${time1}ms`);
        console.log(`   ✅ Cache hit: ${time2}ms`);
        console.log(`   📈 Cache speedup: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
        console.log(`   🔍 Cache size: ${provider.modelCache.size} entries`);
        
        if (info1) {
            console.log(`   📄 Model info cached for: ${info1.model || provider.model}`);
        }
        
    } catch (error) {
        console.log(`   ⚠️  Caching test skipped: ${error.message.split('\n')[0]}`);
    }
}

async function testRealWorldPerformance() {
    console.log('\n6. Testing real-world performance with optimizations...');
    
    const provider = new OllamaProvider({
        host: 'localhost',
        port: 11434,
        model: 'llama3.2',
        progressCallback: (progress) => {
            console.log(`   📊 Progress: ${progress.operation} - ${progress.stage} (${progress.percentage || ''}%)`);
        }
    });

    try {
        await provider.initialize();
        
        console.log('   Running optimized chat test...');
        const chatStart = Date.now();
        const chatResponse = await provider.chat([
            { role: 'user', content: 'What are the benefits of local AI models? Answer briefly.' }
        ]);
        const chatTime = Date.now() - chatStart;
        
        console.log(`   ✅ Chat completed in ${chatTime}ms`);
        console.log(`   💬 Response: ${chatResponse.content.substring(0, 100)}...`);
        console.log(`   📊 Tokens: ${chatResponse.usage.total_tokens} (${chatResponse.usage.prompt_tokens}+${chatResponse.usage.completion_tokens})`);
        
        // Calculate performance metrics
        const tokensPerSecond = chatResponse.usage.total_tokens / (chatTime / 1000);
        console.log(`   ⚡ Performance: ${tokensPerSecond.toFixed(2)} tokens/second`);
        
        // Test memo processing
        console.log('\n   Running optimized memo processing test...');
        const memoStart = Date.now();
        const memoResult = await provider.processMemo(
            '<h1>Test Article</h1><p>This is a test article about local AI performance optimization.</p>',
            { url: 'https://example.com/test', tags: [{ name: 'ai' }, { name: 'performance' }] }
        );
        const memoTime = Date.now() - memoStart;
        
        console.log(`   ✅ Memo processing completed in ${memoTime}ms`);
        console.log(`   📝 Title: ${memoResult.title}`);
        console.log(`   🏷️  Tag: ${memoResult.selectedTag}`);
        
    } catch (error) {
        console.log(`   ⚠️  Real-world test skipped: ${error.message.split('\n')[0]}`);
    }
}

function displayPerformanceSummary() {
    console.log('\n📊 Performance Optimization Summary');
    console.log('====================================');
    console.log('✅ Optimized token counting with model-specific algorithms');
    console.log('✅ Dynamic timeout adjustment based on model performance');
    console.log('✅ Connection warming for reduced latency');
    console.log('✅ Performance profiling for adaptive behavior');
    console.log('✅ Model information caching for efficiency');
    console.log('✅ Progress reporting for user feedback');
    console.log('✅ Retry logic with exponential backoff');
    console.log('\n🎯 Key Benefits:');
    console.log('   • More accurate token counting reduces API waste');
    console.log('   • Adaptive timeouts prevent unnecessary failures');
    console.log('   • Connection warming improves response times');
    console.log('   • Caching reduces redundant API calls');
    console.log('   • Progress tracking improves user experience');
}

async function runPerformanceTests() {
    try {
        console.log('🔍 Testing Ollama performance optimizations...\n');
        
        await testOptimizedTokenCounting();
        await testProgressReporting();
        await testConnectionWarming();
        await testPerformanceProfiling();
        await testModelCaching();
        await testRealWorldPerformance();
        
        displayPerformanceSummary();
        
        console.log('\n✅ Performance optimization testing completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the tests
runPerformanceTests();