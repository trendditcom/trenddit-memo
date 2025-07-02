#!/usr/bin/env node

/**
 * Simple test runner that can handle basic provider tests
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

// Simple test results tracker
let testResults = { passed: 0, failed: 0, total: 0 };

// Mock test functions
global.describe = (name, fn) => {
    console.log(`\n📝 ${name}`);
    fn();
};

global.it = (name, fn) => {
    testResults.total++;
    try {
        const result = fn();
        if (result && typeof result.then === 'function') {
            // Handle async test
            return result.then(
                () => {
                    testResults.passed++;
                    console.log(`  ✅ ${name}`);
                },
                (error) => {
                    testResults.failed++;
                    console.log(`  ❌ ${name}: ${error.message}`);
                }
            );
        } else {
            testResults.passed++;
            console.log(`  ✅ ${name}`);
        }
    } catch (error) {
        testResults.failed++;
        console.log(`  ❌ ${name}: ${error.message}`);
    }
};

global.beforeEach = () => {};
global.afterEach = () => {};

// Mock expect function with basic matchers
global.expect = (actual) => ({
    toBe: (expected) => {
        if (actual !== expected) {
            throw new Error(`Expected ${actual} to be ${expected}`);
        }
    },
    toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
        }
    },
    toBeInstanceOf: (expectedClass) => {
        if (!(actual instanceof expectedClass)) {
            throw new Error(`Expected ${actual} to be instance of ${expectedClass.name}`);
        }
    },
    toBeTruthy: () => {
        if (!actual) {
            throw new Error(`Expected ${actual} to be truthy`);
        }
    },
    toBeFalsy: () => {
        if (actual) {
            throw new Error(`Expected ${actual} to be falsy`);
        }
    },
    toBeDefined: () => {
        if (actual === undefined) {
            throw new Error(`Expected value to be defined`);
        }
    },
    toBeNull: () => {
        if (actual !== null) {
            throw new Error(`Expected ${actual} to be null`);
        }
    },
    toContain: (expected) => {
        if (!actual.includes(expected)) {
            throw new Error(`Expected ${actual} to contain ${expected}`);
        }
    },
    toBeGreaterThan: (expected) => {
        if (actual <= expected) {
            throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
    },
    toBeLessThan: (expected) => {
        if (actual >= expected) {
            throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
    },
    toHaveProperty: (property) => {
        if (!(property in actual)) {
            throw new Error(`Expected object to have property ${property}`);
        }
    },
    rejects: {
        toThrow: async (expectedError) => {
            try {
                await actual;
                throw new Error('Expected promise to reject');
            } catch (error) {
                if (expectedError && !error.message.includes(expectedError)) {
                    throw new Error(`Expected error containing "${expectedError}", got "${error.message}"`);
                }
            }
        }
    }
});

// Mock jest functions
global.jest = {
    fn: () => {
        const mockFn = (...args) => {
            if (mockFn._resolvedValues && mockFn._resolvedValues.length > 0) {
                return mockFn._resolvedValues.shift();
            }
            return mockFn._mockReturnValue;
        };
        mockFn._mockReturnValue = undefined;
        mockFn._resolvedValues = [];
        
        mockFn.mockResolvedValue = (value) => {
            mockFn._mockReturnValue = Promise.resolve(value);
            return mockFn;
        };
        
        mockFn.mockResolvedValueOnce = (value) => {
            mockFn._resolvedValues.push(Promise.resolve(value));
            return mockFn;
        };
        
        return mockFn;
    }
};

// Simple test to verify the test runner works
console.log('🧪 Simple Test Runner Started\n');

// Test basic functionality
describe('Test Runner Verification', () => {
    it('should pass simple assertions', () => {
        expect(1 + 1).toBe(2);
        expect('hello').toContain('ell');
        expect(true).toBeTruthy();
    });

    it('should handle async tests', async () => {
        const result = await Promise.resolve('test');
        expect(result).toBe('test');
    });
});

// Try to run a simple provider test
async function runBasicProviderTest() {
    try {
        console.log('\n🔬 Testing Provider Imports...');
        
        // Test if we can import the providers
        const { GeminiProvider } = await import('../providers/gemini-provider.js');
        console.log('✅ GeminiProvider imported successfully');
        
        const provider = new GeminiProvider();
        console.log('✅ GeminiProvider instantiated successfully');
        
        // Test basic properties
        expect(provider).toBeDefined();
        console.log('✅ Provider is defined');
        
        testResults.passed += 3;
        testResults.total += 3;
        
    } catch (error) {
        console.log(`❌ Provider test failed: ${error.message}`);
        testResults.failed += 1;
        testResults.total += 1;
    }
}

// Run the basic test
await runBasicProviderTest();

// Print final results
console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Total: ${testResults.total}`);

if (testResults.failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
} else {
    console.log('💥 Some tests failed!');
    process.exit(1);
}