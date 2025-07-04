import { testRunner } from './test-runner.js';

// Test runner for YouTube extractor
console.log('Starting YouTube extractor tests...');

// Load the test file
import('./youtube-extractor.test.js').then(() => {
    console.log('YouTube extractor tests loaded successfully');
}).catch(error => {
    console.error('Failed to load YouTube extractor tests:', error);
});

// Run the tests
testRunner.runTests();