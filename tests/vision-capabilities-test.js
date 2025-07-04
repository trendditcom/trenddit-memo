#!/usr/bin/env node

/**
 * Test vision capabilities functionality added in this session
 */

import { LLMProviderFactory } from '../llm-provider-factory.js';

// Mock Chrome APIs
global.chrome = {
    storage: {
        local: {
            get: (keys, callback) => {
                if (keys.includes('visionCapabilities')) {
                    callback({ visionCapabilities: null });
                } else if (keys.includes('llmConfig')) {
                    callback({ 
                        llmConfig: { 
                            type: 'anthropic', 
                            model: 'claude-opus-4-20250514' 
                        } 
                    });
                } else {
                    callback({});
                }
            },
            set: (data, callback) => callback && callback()
        }
    },
    runtime: {
        lastError: null
    }
};

console.log('🔍 Testing Vision Capabilities...\n');

let tests = { passed: 0, failed: 0, total: 0 };

function test(description, testFn) {
    tests.total++;
    try {
        const result = testFn();
        if (result && typeof result.then === 'function') {
            return result.then(() => {
                tests.passed++;
                console.log(`✅ ${description}`);
            }).catch(error => {
                tests.failed++;
                console.log(`❌ ${description}: ${error.message}`);
            });
        } else {
            tests.passed++;
            console.log(`✅ ${description}`);
        }
    } catch (error) {
        tests.failed++;
        console.log(`❌ ${description}: ${error.message}`);
    }
}

// Test vision capability checks
test('Should identify Anthropic Claude models as vision-capable', () => {
    const hasVision = LLMProviderFactory.hasVisionCapability('anthropic', 'claude-opus-4-20250514');
    if (!hasVision) throw new Error('Claude Opus 4 should have vision capabilities');
});

test('Should identify OpenAI GPT models as vision-capable', () => {
    const hasVision = LLMProviderFactory.hasVisionCapability('openai', 'gpt-4o');
    if (!hasVision) throw new Error('GPT-4o should have vision capabilities');
});

test('Should identify Gemini models as vision-capable', () => {
    const hasVision = LLMProviderFactory.hasVisionCapability('gemini', 'gemini-2.5-pro');
    if (!hasVision) throw new Error('Gemini 2.5 Pro should have vision capabilities');
});

test('Should identify Gemini Pro (old) as text-only', () => {
    const hasVision = LLMProviderFactory.hasVisionCapability('gemini', 'gemini-pro');
    if (hasVision) throw new Error('Gemini Pro (old) should not have vision capabilities');
});

test('Should identify Ollama vision models correctly', () => {
    const hasVision = LLMProviderFactory.hasVisionCapability('ollama', 'llava-v1.6');
    if (!hasVision) throw new Error('Llava should have vision capabilities');
});

test('Should identify Ollama text-only models correctly', () => {
    const hasVision = LLMProviderFactory.hasVisionCapability('ollama', 'llama2');
    if (hasVision) throw new Error('Llama2 should not have vision capabilities');
});

test('Should get vision models for providers', () => {
    const anthropicVisionModels = LLMProviderFactory.getVisionModels('anthropic');
    if (anthropicVisionModels.length === 0) throw new Error('Anthropic should have vision models');
    
    const openaiVisionModels = LLMProviderFactory.getVisionModels('openai');
    if (openaiVisionModels.length === 0) throw new Error('OpenAI should have vision models');
    
    const geminiVisionModels = LLMProviderFactory.getVisionModels('gemini');
    if (geminiVisionModels.length === 0) throw new Error('Gemini should have vision models');
});

test('Should save vision capabilities to storage', async () => {
    const visionData = await LLMProviderFactory.saveVisionCapabilities();
    if (!visionData) throw new Error('Should return vision data');
    if (!visionData.anthropic) throw new Error('Should include Anthropic data');
    if (!visionData.openai) throw new Error('Should include OpenAI data');
    if (!visionData.gemini) throw new Error('Should include Gemini data');
    if (!visionData.ollama) throw new Error('Should include Ollama data');
});

test('Should check current provider vision capability', async () => {
    // This will use the mocked llmConfig
    const hasVision = await LLMProviderFactory.getCurrentVisionCapability();
    // Should return true since we mocked Claude Opus 4
    if (!hasVision) throw new Error('Current provider should have vision capabilities');
});

// Run tests and print results
setTimeout(() => {
    console.log('\n📊 Vision Capabilities Test Results:');
    console.log(`✅ Passed: ${tests.passed}`);
    console.log(`❌ Failed: ${tests.failed}`);
    console.log(`📈 Total: ${tests.total}`);
    
    if (tests.failed === 0) {
        console.log('🎉 All vision capability tests passed!');
        process.exit(0);
    } else {
        console.log('💥 Some vision capability tests failed!');
        process.exit(1);
    }
}, 100); // Small delay to allow async tests to complete