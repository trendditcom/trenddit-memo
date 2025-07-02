#!/usr/bin/env node

/**
 * Focused integration test for core functionality
 */

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock Chrome APIs
global.chrome = {
    storage: {
        local: {
            get: (key, callback) => callback({}),
            set: (data, callback) => callback && callback()
        }
    },
    runtime: {
        lastError: null
    }
};

// Test results
let results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
    results.total++;
    try {
        fn();
        results.passed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        results.failed++;
        console.log(`❌ ${name}: ${error.message}`);
    }
}

function expect(actual) {
    return {
        toBeDefined: () => {
            if (actual === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${actual} to be ${expected}`);
            }
        },
        toBeInstanceOf: (expectedClass) => {
            if (!(actual instanceof expectedClass)) {
                throw new Error(`Expected ${actual} to be instance of ${expectedClass.name}`);
            }
        },
        toContain: (expected) => {
            if (!actual.includes(expected)) {
                throw new Error(`Expected ${actual} to contain ${expected}`);
            }
        }
    };
}

console.log('🔍 Running Focused Integration Tests\n');

// Test 1: Provider Factory
try {
    console.log('📦 Testing LLM Provider Factory...');
    const { LLMProviderFactory } = await import('../llm-provider-factory.js');
    
    test('LLMProviderFactory should be defined', () => {
        expect(LLMProviderFactory).toBeDefined();
    });
    
    test('Should get available providers', () => {
        const providers = LLMProviderFactory.getAvailableProviders();
        expect(Array.isArray(providers)).toBe(true);
        console.log(`  Found ${providers.length} providers: ${providers.map(p => p.name).join(', ')}`);
    });
    
} catch (error) {
    results.failed++;
    results.total++;
    console.log(`❌ Provider Factory test failed: ${error.message}`);
}

// Test 2: Configuration Manager
try {
    console.log('\n⚙️ Testing Provider Config Manager...');
    const { ProviderConfigManager } = await import('../config/provider-config.js');
    
    test('ProviderConfigManager should be defined', () => {
        expect(ProviderConfigManager).toBeDefined();
    });
    
    const configManager = new ProviderConfigManager();
    test('Should instantiate ProviderConfigManager', () => {
        expect(configManager).toBeDefined();
    });
    
} catch (error) {
    results.failed++;
    results.total++;
    console.log(`❌ Configuration Manager test failed: ${error.message}`);
}

// Test 3: Individual Providers
const providerTests = [
    { name: 'AnthropicProvider', path: '../providers/anthropic-provider.js' },
    { name: 'OpenAIProvider', path: '../providers/openai-provider.js' },
    { name: 'GeminiProvider', path: '../providers/gemini-provider.js' },
    { name: 'OllamaProvider', path: '../providers/ollama-provider.js' }
];

for (const { name, path } of providerTests) {
    try {
        console.log(`\n🤖 Testing ${name}...`);
        const module = await import(path);
        const Provider = module[name];
        
        test(`${name} should be defined`, () => {
            expect(Provider).toBeDefined();
        });
        
        const provider = new Provider();
        test(`Should instantiate ${name}`, () => {
            expect(provider).toBeDefined();
        });
        
        test(`${name} should have required methods`, () => {
            expect(typeof provider.initialize).toBe('function');
            expect(typeof provider.chat).toBe('function');
            expect(typeof provider.processMemo).toBe('function');
        });
        
    } catch (error) {
        results.failed += 3;
        results.total += 3;
        console.log(`❌ ${name} test failed: ${error.message}`);
    }
}

// Test 4: Core Files Syntax
console.log('\n📄 Testing Core Files Syntax...');
const coreFiles = ['../sidepanel.js', '../background.js', '../content.js'];

for (const file of coreFiles) {
    try {
        await import(file);
        results.passed++;
        results.total++;
        console.log(`✅ ${file} syntax is valid`);
    } catch (error) {
        results.failed++;
        results.total++;
        console.log(`❌ ${file} syntax error: ${error.message}`);
    }
}

// Print results
console.log('\n📊 Focused Integration Test Results:');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Total: ${results.total}`);

if (results.failed === 0) {
    console.log('🎉 All focused tests passed!');
    process.exit(0);
} else {
    console.log('💥 Some tests failed!');
    process.exit(1);
}