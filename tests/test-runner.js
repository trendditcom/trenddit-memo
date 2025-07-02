// Simple test runner for Chrome extension testing
export class TestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    describe(description, testFn) {
        console.group(`📝 ${description}`);
        testFn();
        console.groupEnd();
    }

    it(description, testFn) {
        this.results.total++;
        try {
            testFn();
            this.results.passed++;
            console.log(`✅ ${description}`);
        } catch (error) {
            this.results.failed++;
            console.error(`❌ ${description}: ${error.message}`);
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

    async runTests() {
        console.log('🧪 Running tests...\n');
        // Tests are run when they're defined
        setTimeout(() => {
            console.log('\n📊 Test Results:');
            console.log(`✅ Passed: ${this.results.passed}`);
            console.log(`❌ Failed: ${this.results.failed}`);
            console.log(`📈 Total: ${this.results.total}`);
            
            if (this.results.failed === 0) {
                console.log('🎉 All tests passed!');
            } else {
                console.log('💥 Some tests failed!');
            }
        }, 100);
    }
}

// Global test runner instance
export const testRunner = new TestRunner();

// Export test functions globally
export const { describe, it, expect } = testRunner;