#!/usr/bin/env node

/**
 * Test runner for all provider tests
 * This runs tests that don't require browser APIs
 */

import { readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock Chrome APIs for Node.js testing
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

// Mock fetch for Node.js
global.fetch = async (url, options) => {
    throw new Error('Fetch is mocked - tests should mock specific endpoints');
};

class NodeTestRunner {
    constructor() {
        this.results = { passed: 0, failed: 0, total: 0 };
        this.currentSuite = '';
    }

    describe(description, testFn) {
        this.currentSuite = description;
        console.log(`\n📝 ${description}`);
        testFn();
    }

    it(description, testFn) {
        this.results.total++;
        try {
            testFn();
            this.results.passed++;
            console.log(`  ✅ ${description}`);
        } catch (error) {
            this.results.failed++;
            console.log(`  ❌ ${description}: ${error.message}`);
        }
    }

    expect(actual) {
        return {
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
            toThrow: (expectedError) => {
                try {
                    actual();
                    throw new Error('Expected function to throw an error');
                } catch (error) {
                    if (expectedError && !error.message.includes(expectedError)) {
                        throw new Error(`Expected error containing "${expectedError}", got "${error.message}"`);
                    }
                }
            }
        };
    }

    printResults() {
        console.log('\n📊 Test Results:');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Total: ${this.results.total}`);
        
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed!');
            process.exit(0);
        } else {
            console.log('💥 Some tests failed!');
            process.exit(1);
        }
    }
}

// Global test runner instance
const testRunner = new NodeTestRunner();
global.describe = testRunner.describe.bind(testRunner);
global.it = testRunner.it.bind(testRunner);
global.expect = testRunner.expect.bind(testRunner);
global.beforeEach = () => {}; // Mock beforeEach for now

async function runAllTests() {
    console.log('🧪 Running Node.js Tests...\n');

    try {
        // Find all test files
        const testFiles = [];
        const files = await readdir(__dirname);
        
        for (const file of files) {
            if (file.endsWith('.test.js') && file !== 'run-all-tests.js') {
                const filePath = join(__dirname, file);
                const stats = await stat(filePath);
                if (stats.isFile()) {
                    testFiles.push(file);
                }
            }
        }

        console.log(`Found ${testFiles.length} test files: ${testFiles.join(', ')}\n`);

        // Run each test file
        for (const testFile of testFiles) {
            try {
                console.log(`Running ${testFile}...`);
                await import(`./${testFile}`);
            } catch (error) {
                console.error(`Error running ${testFile}: ${error.message}`);
                testRunner.results.failed++;
                testRunner.results.total++;
            }
        }

        testRunner.printResults();

    } catch (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    }
}

runAllTests();