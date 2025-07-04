import { testRunner } from './test-runner.js';

const { describe, it, expect } = testRunner;

// Mock Chrome APIs
global.chrome = {
    runtime: {
        sendMessage: () => Promise.resolve(),
        onMessage: {
            addListener: () => {}
        }
    }
};

// Mock DOM for testing
const createMockDocument = () => {
    const elements = new Map();
    
    return {
        querySelector: (selector) => elements.get(selector) || null,
        querySelectorAll: (selector) => elements.get(selector + '_all') || [],
        setElement: (selector, element) => elements.set(selector, element),
        setElements: (selector, elements) => elements.set(selector + '_all', elements)
    };
};

describe('YouTube Extractor Tests', () => {
    describe('Class Structure Tests', () => {
        it('should export YouTubeExtractor class', () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            expect(typeof YouTubeExtractor).toBe('function');
        });

        it('should have required methods', () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            const extractor = new YouTubeExtractor();
            
            expect(typeof extractor.canExtract).toBe('function');
            expect(typeof extractor.extract).toBe('function');
            expect(extractor.platform).toBe('youtube');
        });
    });

    describe('URL Detection Tests', () => {
        it('should detect valid YouTube video URLs', () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            const extractor = new YouTubeExtractor();
            
            const validUrls = [
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://youtube.com/watch?v=dQw4w9WgXcQ',
                'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
                'https://youtu.be/dQw4w9WgXcQ',
                'https://www.youtube.com/embed/dQw4w9WgXcQ'
            ];

            validUrls.forEach(url => {
                expect(extractor.canExtract(url)).toBe(true);
            });
        });

        it('should reject non-YouTube URLs', () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            const extractor = new YouTubeExtractor();
            
            const invalidUrls = [
                'https://vimeo.com/123456',
                'https://twitter.com/status/123456',
                'https://example.com'
            ];

            invalidUrls.forEach(url => {
                expect(extractor.canExtract(url)).toBe(false);
            });
        });
    });

    describe('Video Metadata Extraction Tests', () => {
        it('should extract video metadata', async () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            const extractor = new YouTubeExtractor();
            
            // Mock document
            const mockDoc = createMockDocument();
            mockDoc.setElement('h1.ytd-video-primary-info-renderer, h1.title', 
                { textContent: 'Test Video Title' });
            mockDoc.setElement('ytd-channel-name a, .ytd-channel-name a', 
                { textContent: 'Test Channel' });
            mockDoc.setElement('.ytp-time-duration', 
                { textContent: '10:30' });
            mockDoc.setElement('.view-count, .ytd-video-view-count-renderer', 
                { textContent: '1,234,567 views' });
            mockDoc.setElement('#description, ytd-expander', 
                { textContent: 'This is a test video description.' });
            
            // Replace global document temporarily
            const originalDoc = global.document;
            global.document = mockDoc;
            
            const result = await extractor.extract();
            
            // Restore document
            global.document = originalDoc;
            
            expect(result.platform).toBe('youtube');
            expect(result.metadata.title).toBe('Test Video Title');
            expect(result.metadata.author).toBe('Test Channel');
            expect(result.metadata.duration).toBe('10:30');
            expect(result.metadata.views).toBe('1,234,567 views');
            expect(result.metadata.description).toBe('This is a test video description.');
        });
    });

    describe('Transcript Extraction Tests', () => {
        it('should extract transcript when available', async () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            const extractor = new YouTubeExtractor();
            
            // Mock document with transcript
            const mockDoc = createMockDocument();
            
            // Mock transcript button
            let transcriptClicked = false;
            mockDoc.setElement('button[aria-label*="transcript"], button[aria-label*="Transcript"]', {
                click: () => { transcriptClicked = true; }
            });
            
            // Mock transcript segments
            mockDoc.setElements('.ytd-transcript-segment-renderer', [
                { textContent: '0:00 First line of transcript' },
                { textContent: '0:05 Second line of transcript' },
                { textContent: '0:10 Third line of transcript' }
            ]);
            
            // Replace global document temporarily
            const originalDoc = global.document;
            global.document = mockDoc;
            
            const result = await extractor.extract();
            
            // Restore document
            global.document = originalDoc;
            
            expect(result.content).toContain('First line of transcript');
            expect(result.content).toContain('Second line of transcript');
            expect(result.content).toContain('Third line of transcript');
        });

        it('should handle missing transcript gracefully', async () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            const extractor = new YouTubeExtractor();
            
            // Mock document without transcript
            const mockDoc = createMockDocument();
            
            // Replace global document temporarily
            const originalDoc = global.document;
            global.document = mockDoc;
            
            const result = await extractor.extract();
            
            // Restore document
            global.document = originalDoc;
            
            expect(result.metadata.transcriptAvailable).toBe(false);
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle extraction errors gracefully', async () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            const extractor = new YouTubeExtractor();
            
            // Mock document that throws errors
            const mockDoc = {
                querySelector: () => { throw new Error('DOM access error'); },
                querySelectorAll: () => { throw new Error('DOM access error'); }
            };
            
            // Replace global document temporarily
            const originalDoc = global.document;
            global.document = mockDoc;
            
            const result = await extractor.extract();
            
            // Restore document
            global.document = originalDoc;
            
            expect(result.platform).toBe('youtube');
            expect(result.error).toBeTruthy();
        });
    });

    describe('Content Structure Tests', () => {
        it('should return proper content structure', async () => {
            const YouTubeExtractor = window.YouTubeExtractor;
            const extractor = new YouTubeExtractor();
            
            // Mock minimal document
            const mockDoc = createMockDocument();
            mockDoc.setElement('h1.ytd-video-primary-info-renderer, h1.title', 
                { textContent: 'Test Video' });
            
            // Replace global document temporarily
            const originalDoc = global.document;
            global.document = mockDoc;
            
            const result = await extractor.extract();
            
            // Restore document
            global.document = originalDoc;
            
            // Verify structure matches ContentExtractor interface
            expect(result.platform).toBe('youtube');
            expect(typeof result.content).toBe('string');
            expect(typeof result.metadata).toBe('object');
            expect(Array.isArray(result.mediaUrls)).toBe(true);
        });
    });
});

// Run tests
testRunner.runTests();