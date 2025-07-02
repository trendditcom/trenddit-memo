# Trenddit Memo: Complete Rewrite Technical Specification

> **Project**: Trenddit Memo - Enhanced Web Content Capture and AI-Powered Organization  
> **Based on**: WebMemo analysis and modern web extension best practices  
> **Target**: Complete rewrite with improved architecture, multi-provider support, and enhanced UX  
> **Date**: December 2024

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Design](#architecture-design)
4. [Technical Specifications](#technical-specifications)
5. [Implementation Plan](#implementation-plan)
6. [Security and Privacy](#security-and-privacy)
7. [Testing Strategy](#testing-strategy)
8. [Performance Requirements](#performance-requirements)
9. [Development Workflow](#development-workflow)
10. [Migration Strategy](#migration-strategy)
11. [Requirements and Dependencies](#requirements-and-dependencies)
12. [Code Standards](#code-standards)

---

## Executive Summary

### Project Vision

Trenddit Memo is a modern, extensible browser extension that transforms how users capture, organize, and interact with web content using AI. Building on the solid foundation of WebMemo, this rewrite addresses architectural limitations, expands LLM provider support, and implements modern development practices.

### Key Improvements Over WebMemo

- **Multi-LLM Provider Support**: OpenAI GPT, Anthropic Claude, Google Gemini, local models via Ollama
- **Enhanced Content Processing**: Images, videos, PDFs, and rich media support
- **Robust Error Handling**: Graceful fallbacks, retry mechanisms, and offline capabilities
- **Modern TypeScript Architecture**: Type safety, better IDE support, maintainable code
- **Comprehensive Testing**: Unit, integration, and E2E testing with Playwright
- **Performance Optimization**: Efficient storage, memory management, and async operations
- **Advanced Build System**: Vite-based development with hot reload and optimized production builds

### Core Features Retained

- Chrome Extension Manifest V3 compliance
- Side panel interface with intuitive UX
- Content capture via hover-and-click interaction
- Tag-based organization system
- Context-aware chat interface
- Local-first data storage with cloud backup
- Real-time status feedback and error handling

---

## Current State Analysis

### WebMemo Strengths (To Retain)

#### ✅ **Excellent User Experience**
- Intuitive content capture with visual feedback
- Clean, responsive side panel interface
- Tag-based organization system
- Context-aware chat with memo citations
- Real-time status notifications

#### ✅ **Solid Technical Foundation**
- Manifest V3 compliance with service worker architecture
- Modular ES6 codebase with clear separation of concerns
- Robust content sanitization and security practices
- Local-first storage with chrome.storage API
- Cross-origin content capture capabilities

#### ✅ **Privacy-First Approach**
- Data remains on user's device
- Secure API key management
- No external tracking or analytics
- Comprehensive Content Security Policy

### WebMemo Limitations (To Address)

#### ❌ **Limited Extensibility**
- Single LLM provider (Anthropic Claude only)
- Hard-coded API integration without abstraction
- Limited content type support (HTML text only)
- No plugin or extension system

#### ❌ **Error Handling & Resilience**
- Poor recovery from API failures
- Limited retry mechanisms
- Minimal rate limiting handling
- Network error management gaps

#### ❌ **Development Experience**
- Minimal build system (only bundles background.js)
- No TypeScript support
- Absence of testing framework
- Limited development tooling

#### ❌ **Performance & Scalability**
- No optimization for large datasets
- Memory management issues with extensive usage
- Storage quota management lacking
- No full-text search capabilities

#### ❌ **Content Processing Limitations**
- HTML text content only
- No image, video, or PDF processing
- Limited structured data extraction
- No file upload capabilities

---

## Architecture Design

### Overall Architecture Principles

1. **Modularity**: Clear separation between core, providers, and UI components
2. **Extensibility**: Plugin-based architecture for LLM providers and content processors
3. **Type Safety**: Full TypeScript implementation with strict type checking
4. **Performance**: Lazy loading, efficient storage, and optimized memory usage
5. **Resilience**: Comprehensive error handling with graceful degradation
6. **Security**: Zero-trust security model with secure API handling
7. **Testability**: Architecture designed for comprehensive testing coverage

### Core Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Trenddit Memo Extension                   │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (TypeScript + React/Preact)                      │
│  ├── Side Panel Interface                                  │
│  ├── Content Script Overlay                                │
│  ├── Settings Panel                                        │
│  └── Chat Interface                                        │
├─────────────────────────────────────────────────────────────┤
│  Core Business Logic (TypeScript)                          │
│  ├── Content Capture Engine                                │
│  ├── Tag Management System                                 │
│  ├── Storage Manager                                       │
│  ├── Search & Filter Engine                                │
│  └── State Management (Zustand)                            │
├─────────────────────────────────────────────────────────────┤
│  Provider Abstraction Layer                                │
│  ├── LLM Provider Interface                                │
│  ├── Content Processor Interface                           │
│  ├── Storage Provider Interface                            │
│  └── Export Provider Interface                             │
├─────────────────────────────────────────────────────────────┤
│  Provider Implementations                                  │
│  ├── LLM: OpenAI, Anthropic, Google, Ollama               │
│  ├── Content: HTML, PDF, Image, Video                      │
│  ├── Storage: Chrome, IndexedDB, Cloud Sync               │
│  └── Export: JSON, CSV, HTML, Markdown                     │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                      │
│  ├── Service Worker (Background)                           │
│  ├── Message Bus & Event System                            │
│  ├── Error Handling & Recovery                             │
│  ├── Performance Monitoring                                │
│  └── Security & Validation                                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

#### Content Capture Flow
```
Web Page → Content Script → Content Processor → LLM Provider → Storage Manager → UI Update
    ↓           ↓              ↓                    ↓              ↓            ↓
Hover/Click → Clean HTML → Extract Features → Generate Summary → Save Memo → Refresh List
```

#### Chat Interaction Flow
```
User Query → Chat Manager → Context Builder → LLM Provider → Response Formatter → UI Display
     ↓           ↓              ↓                ↓              ↓                ↓
Tag Selection → Load Memos → Build Context → Process Chat → Format Citations → Show Response
```

#### Storage & Sync Flow
```
Local Storage (Primary) ↔ Storage Manager ↔ Cloud Backup (Optional)
      ↓                        ↓                    ↓
   Chrome API              Conflict Resolution    External Services
```

---

## Technical Specifications

### Development Stack

#### Core Technologies
- **Language**: TypeScript 5.3+
- **Build System**: Vite 5.0+ with custom extension configuration
- **UI Framework**: Preact (lightweight React alternative)
- **State Management**: Zustand (lightweight, TypeScript-first)
- **Styling**: Tailwind CSS 3.4+ with component variants
- **Testing**: Vitest + Playwright + @testing-library

#### Extension Framework
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Target Browsers**: Chrome, Edge, Brave (Chromium-based)
- **Minimum Chrome Version**: 120+ (for latest APIs)
- **Architecture**: Service Worker + Side Panel + Content Scripts

#### Build & Development
- **Package Manager**: pnpm (fast, efficient, modern)
- **Bundler**: Vite with esbuild for super-fast builds
- **Code Quality**: ESLint + Prettier + husky pre-commit hooks
- **Type Checking**: TypeScript strict mode with path mapping
- **Asset Optimization**: Built-in image optimization and compression

### Project Structure

```
trenddit-memo/
├── src/
│   ├── background/                 # Service worker
│   │   ├── index.ts
│   │   ├── message-handler.ts
│   │   └── lifecycle-manager.ts
│   ├── content/                    # Content scripts
│   │   ├── index.ts
│   │   ├── content-capture.ts
│   │   ├── overlay-ui.ts
│   │   └── dom-utils.ts
│   ├── sidepanel/                  # Main UI
│   │   ├── index.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── utils/
│   ├── core/                       # Business logic
│   │   ├── storage/
│   │   ├── providers/
│   │   ├── content-processing/
│   │   ├── tag-management/
│   │   └── search/
│   ├── types/                      # TypeScript definitions
│   │   ├── memo.ts
│   │   ├── providers.ts
│   │   ├── storage.ts
│   │   └── ui.ts
│   ├── shared/                     # Shared utilities
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── validation.ts
│   │   └── errors.ts
│   └── assets/                     # Static files
│       ├── icons/
│       ├── images/
│       └── styles/
├── tests/                          # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                          # Documentation
├── scripts/                       # Build scripts
├── public/                        # Static assets
└── config/                        # Configuration files
```

### LLM Provider Architecture

#### Provider Interface Definition

```typescript
interface LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly models: LLMModel[];
  readonly capabilities: LLMCapabilities;
  
  initialize(config: LLMConfig): Promise<void>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  processMemo(content: string, options?: ProcessOptions): Promise<MemoData>;
  validateConfig(config: LLMConfig): ValidationResult;
  
  // Advanced features
  streamChat?(messages: ChatMessage[], options?: StreamOptions): AsyncIterable<ChatDelta>;
  calculateTokens?(text: string): number;
  getUsage?(): Promise<UsageStats>;
}

interface LLMModel {
  id: string;
  name: string;
  maxTokens: number;
  inputCostPer1K: number;
  outputCostPer1K: number;
  capabilities: string[];
}

interface LLMCapabilities {
  chat: boolean;
  streaming: boolean;
  functionCalling: boolean;
  imageAnalysis: boolean;
  codeGeneration: boolean;
  maxContextLength: number;
}
```

#### Supported LLM Providers

##### 1. **OpenAI Provider**
```typescript
class OpenAIProvider implements LLMProvider {
  models = [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
    { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16385 },
  ];
  
  capabilities = {
    chat: true,
    streaming: true,
    functionCalling: true,
    imageAnalysis: true, // GPT-4V
    codeGeneration: true,
    maxContextLength: 128000
  };
}
```

##### 2. **Anthropic Provider**
```typescript
class AnthropicProvider implements LLMProvider {
  models = [
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', maxTokens: 200000 },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', maxTokens: 200000 },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', maxTokens: 200000 },
  ];
  
  capabilities = {
    chat: true,
    streaming: true,
    functionCalling: false,
    imageAnalysis: true, // Claude 3
    codeGeneration: true,
    maxContextLength: 200000
  };
}
```

##### 3. **Google Provider**
```typescript
class GoogleProvider implements LLMProvider {
  models = [
    { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 32768 },
    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', maxTokens: 16384 },
    { id: 'gemini-ultra', name: 'Gemini Ultra', maxTokens: 32768 },
  ];
  
  capabilities = {
    chat: true,
    streaming: true,
    functionCalling: true,
    imageAnalysis: true, // Gemini Vision
    codeGeneration: true,
    maxContextLength: 32768
  };
}
```

##### 4. **Ollama Provider (Local)**
```typescript
class OllamaProvider implements LLMProvider {
  models = [
    { id: 'llama2', name: 'Llama 2', maxTokens: 4096 },
    { id: 'codellama', name: 'Code Llama', maxTokens: 4096 },
    { id: 'mistral', name: 'Mistral', maxTokens: 8192 },
  ];
  
  capabilities = {
    chat: true,
    streaming: true,
    functionCalling: false,
    imageAnalysis: false,
    codeGeneration: true,
    maxContextLength: 8192
  };
}
```

### Content Processing Architecture

#### Enhanced Content Types Support

```typescript
interface ContentProcessor {
  readonly type: ContentType;
  readonly supportedFormats: string[];
  
  canProcess(content: string | File | URL): boolean;
  process(input: ProcessInput): Promise<ProcessedContent>;
  extractMetadata(input: ProcessInput): Promise<ContentMetadata>;
}

enum ContentType {
  HTML = 'html',
  PDF = 'pdf',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  CODE = 'code',
  MARKDOWN = 'markdown'
}

interface ProcessedContent {
  title: string;
  summary: string;
  narrative: string;
  structuredData: Record<string, any>;
  extractedText: string;
  metadata: ContentMetadata;
  embedding?: number[]; // For semantic search
}
```

#### Content Processor Implementations

##### HTML Processor (Enhanced)
```typescript
class HTMLContentProcessor implements ContentProcessor {
  type = ContentType.HTML;
  supportedFormats = ['text/html'];
  
  async process(input: ProcessInput): Promise<ProcessedContent> {
    // Enhanced HTML cleaning with better content extraction
    const cleanedHtml = this.cleanHTML(input.content);
    const extractedText = this.extractTextContent(cleanedHtml);
    const structuredData = this.extractStructuredData(cleanedHtml);
    
    // Use multiple extraction strategies
    const title = this.extractTitle(cleanedHtml) || this.generateTitle(extractedText);
    const metadata = await this.extractMetadata(cleanedHtml);
    
    return {
      title,
      summary: await this.generateSummary(extractedText),
      narrative: await this.generateNarrative(extractedText),
      structuredData,
      extractedText,
      metadata
    };
  }
  
  private cleanHTML(html: string): string {
    // Enhanced cleaning with better content preservation
    // Remove scripts, styles, ads, navigation
    // Preserve semantic structure and important attributes
    // Handle edge cases and malformed HTML
  }
}
```

##### PDF Processor (New)
```typescript
class PDFContentProcessor implements ContentProcessor {
  type = ContentType.PDF;
  supportedFormats = ['application/pdf'];
  
  async process(input: ProcessInput): Promise<ProcessedContent> {
    // Use PDF.js or similar library for text extraction
    const pdfText = await this.extractTextFromPDF(input.file);
    const images = await this.extractImagesFromPDF(input.file);
    const metadata = await this.extractPDFMetadata(input.file);
    
    return {
      title: metadata.title || this.generateTitle(pdfText),
      summary: await this.generateSummary(pdfText),
      narrative: await this.generateNarrative(pdfText),
      structuredData: { pageCount: metadata.pageCount, images },
      extractedText: pdfText,
      metadata
    };
  }
}
```

##### Image Processor (New)
```typescript
class ImageContentProcessor implements ContentProcessor {
  type = ContentType.IMAGE;
  supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  async process(input: ProcessInput): Promise<ProcessedContent> {
    // Use vision-capable LLM for image analysis
    const imageAnalysis = await this.analyzeImage(input.file);
    const ocrText = await this.extractTextFromImage(input.file);
    const metadata = await this.extractImageMetadata(input.file);
    
    return {
      title: imageAnalysis.title || 'Image Content',
      summary: imageAnalysis.description,
      narrative: imageAnalysis.detailedDescription,
      structuredData: { 
        ocrText, 
        objects: imageAnalysis.objects,
        colors: imageAnalysis.colors 
      },
      extractedText: ocrText,
      metadata
    };
  }
}
```

### Storage Architecture

#### Enhanced Storage Management

```typescript
interface StorageManager {
  // Core CRUD operations
  saveMemo(memo: Memo): Promise<string>;
  getMemo(id: string): Promise<Memo | null>;
  updateMemo(id: string, updates: Partial<Memo>): Promise<void>;
  deleteMemo(id: string): Promise<void>;
  
  // Bulk operations
  getMemos(filter?: MemoFilter): Promise<Memo[]>;
  saveMemos(memos: Memo[]): Promise<string[]>;
  deleteMemos(ids: string[]): Promise<void>;
  
  // Search and indexing
  searchMemos(query: SearchQuery): Promise<SearchResult[]>;
  indexMemo(memo: Memo): Promise<void>;
  rebuildIndex(): Promise<void>;
  
  // Storage management
  getStorageUsage(): Promise<StorageUsage>;
  optimizeStorage(): Promise<void>;
  exportData(format: ExportFormat): Promise<ExportResult>;
  importData(data: ImportData): Promise<ImportResult>;
  
  // Sync and backup
  syncToCloud(): Promise<SyncResult>;
  restoreFromCloud(): Promise<RestoreResult>;
  createBackup(): Promise<BackupResult>;
}

interface MemoFilter {
  tags?: string[];
  dateRange?: DateRange;
  contentType?: ContentType[];
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

interface SearchQuery {
  text: string;
  filters?: MemoFilter;
  sortBy?: 'relevance' | 'date' | 'title';
  includeContent?: boolean;
}
```

#### Storage Implementation Strategy

##### Primary Storage: Chrome Local Storage
```typescript
class ChromeStorageManager implements StorageManager {
  private static readonly MEMO_PREFIX = 'memo:';
  private static readonly INDEX_KEY = 'search:index';
  private static readonly METADATA_KEY = 'storage:metadata';
  
  async saveMemo(memo: Memo): Promise<string> {
    const key = `${ChromeStorageManager.MEMO_PREFIX}${memo.id}`;
    
    // Compress large content
    if (memo.content.length > 10000) {
      memo.content = await this.compressContent(memo.content);
      memo.isCompressed = true;
    }
    
    await chrome.storage.local.set({ [key]: memo });
    await this.updateIndex(memo);
    await this.updateMetadata();
    
    return memo.id;
  }
  
  async searchMemos(query: SearchQuery): Promise<SearchResult[]> {
    // Implement full-text search using inverted index
    const index = await this.getSearchIndex();
    const results = this.performSearch(index, query);
    
    return results.map(result => ({
      memo: result.memo,
      score: result.score,
      highlights: this.generateHighlights(result.memo, query.text)
    }));
  }
}
```

##### Secondary Storage: IndexedDB for Large Data
```typescript
class IndexedDBStorageManager implements StorageManager {
  private db: IDBDatabase;
  
  async initialize(): Promise<void> {
    this.db = await this.openDatabase();
    await this.setupStores();
  }
  
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TrendditMemo', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        const memoStore = db.createObjectStore('memos', { keyPath: 'id' });
        memoStore.createIndex('tags', 'tags', { multiEntry: true });
        memoStore.createIndex('date', 'timestamp');
        memoStore.createIndex('title', 'title');
        
        const searchStore = db.createObjectStore('search', { keyPath: 'term' });
        const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' });
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

### Security & Privacy Architecture

#### API Key Management
```typescript
class SecureAPIKeyManager {
  private static readonly ENCRYPTION_KEY = 'trenddit-memo-key';
  
  async storeAPIKey(provider: string, apiKey: string): Promise<void> {
    const encrypted = await this.encrypt(apiKey);
    await chrome.storage.local.set({
      [`api_key_${provider}`]: encrypted
    });
  }
  
  async getAPIKey(provider: string): Promise<string | null> {
    const result = await chrome.storage.local.get([`api_key_${provider}`]);
    const encrypted = result[`api_key_${provider}`];
    
    if (!encrypted) return null;
    
    return await this.decrypt(encrypted);
  }
  
  private async encrypt(data: string): Promise<string> {
    // Use Web Crypto API for encryption
    const key = await this.getEncryptionKey();
    const encoded = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt('AES-GCM', key, encoded);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }
  
  private async getEncryptionKey(): Promise<CryptoKey> {
    const keyData = new TextEncoder().encode(SecureAPIKeyManager.ENCRYPTION_KEY);
    return await crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
}
```

#### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; worker-src 'self'; connect-src https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com http://localhost:11434; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';"
  }
}
```

---

## Implementation Plan

### Phase 1: Foundation & Core Architecture (4-6 weeks)

#### Week 1-2: Project Setup & Infrastructure
- [x] Initialize TypeScript project with Vite
- [x] Configure build system and development environment
- [x] Set up ESLint, Prettier, and pre-commit hooks
- [x] Create project structure and module organization
- [x] Implement basic Chrome extension Manifest V3 setup
- [x] Configure path mapping and module resolution

**Deliverables:**
- Working TypeScript build system
- Configured development environment
- Basic Chrome extension loading in browser
- Documentation setup with project structure

#### Week 3-4: Core Storage & State Management
- [x] Implement enhanced storage manager with compression
- [x] Create TypeScript interfaces for all data types
- [x] Set up Zustand stores for state management
- [x] Implement search indexing and full-text search
- [x] Add storage quota management and cleanup
- [x] Create data migration utilities

**Deliverables:**
- Complete storage system with indexing
- Type-safe state management
- Search functionality
- Data import/export capabilities

#### Week 5-6: Content Processing Engine
- [x] Implement enhanced HTML content processor
- [x] Create content processor interface and factory
- [x] Add PDF processing capabilities
- [x] Implement image content processing
- [x] Create content sanitization and validation
- [x] Add structured data extraction

**Deliverables:**
- Multi-format content processing
- Enhanced content extraction
- Secure content sanitization
- Extensible processor architecture

### Phase 2: LLM Provider System (3-4 weeks)

#### Week 7-8: Provider Architecture
- [x] Design and implement LLM provider interface
- [x] Create provider factory and registration system
- [x] Implement OpenAI provider with all models
- [x] Implement Anthropic provider (migration from existing)
- [x] Add comprehensive error handling and retry logic
- [x] Create provider capability negotiation system

**Deliverables:**
- Extensible LLM provider system
- OpenAI and Anthropic providers
- Robust error handling
- Provider switching capabilities

#### Week 9-10: Additional Providers & Features
- [x] Implement Google Gemini provider
- [x] Add Ollama local provider
- [x] Implement streaming chat responses
- [x] Add token counting and cost estimation
- [x] Create provider performance monitoring
- [x] Add fallback provider system

**Deliverables:**
- Complete multi-provider support
- Advanced chat features
- Cost monitoring and optimization
- Provider failover capabilities

### Phase 3: Enhanced UI & User Experience (3-4 weeks)

#### Week 11-12: Modern UI Framework
- [x] Migrate to Preact with TypeScript
- [x] Implement modern component architecture
- [x] Create responsive design system
- [x] Add dark mode and theme support
- [x] Implement accessibility features
- [x] Add keyboard shortcuts and navigation

**Deliverables:**
- Modern TypeScript UI framework
- Complete design system
- Accessibility compliance
- Enhanced user interactions

#### Week 13-14: Advanced Features
- [x] Implement advanced search and filtering
- [x] Add bulk operations for memos
- [x] Create advanced export/import features
- [x] Add collaborative features (sharing, comments)
- [x] Implement offline mode capabilities
- [x] Add extension settings and customization

**Deliverables:**
- Advanced search capabilities
- Collaboration features
- Offline functionality
- Comprehensive settings

### Phase 4: Testing & Quality Assurance (2-3 weeks)

#### Week 15-16: Comprehensive Testing
- [x] Set up unit testing with Vitest
- [x] Implement integration testing
- [x] Add E2E testing with Playwright
- [x] Create performance testing suite
- [x] Add accessibility testing
- [x] Implement automated testing pipeline

**Deliverables:**
- Complete testing infrastructure
- High test coverage (>90%)
- Automated CI/CD pipeline
- Performance benchmarks

#### Week 17: Quality Assurance & Documentation
- [x] Code review and optimization
- [x] Security audit and penetration testing
- [x] Performance optimization
- [x] Documentation completion
- [x] User acceptance testing
- [x] Beta release preparation

**Deliverables:**
- Production-ready codebase
- Complete documentation
- Security validation
- Beta release package

### Phase 5: Migration & Launch (2-3 weeks)

#### Week 18-19: Data Migration & Deployment
- [x] Create migration tools from WebMemo
- [x] Implement gradual rollout system
- [x] Set up monitoring and analytics
- [x] Create user onboarding experience
- [x] Prepare support documentation
- [x] Plan marketing and communication

**Deliverables:**
- Seamless migration from WebMemo
- Production deployment
- Monitoring dashboard
- User support system

#### Week 20: Launch & Post-Launch Support
- [x] Official launch and distribution
- [x] Monitor system performance and usage
- [x] Address user feedback and issues
- [x] Plan future enhancements
- [x] Create community and support channels
- [x] Begin work on next iteration

**Deliverables:**
- Successful product launch
- Active user community
- Feedback collection system
- Roadmap for future development

---

## Security and Privacy

### Security Architecture Principles

#### 1. **Zero-Trust Security Model**
- Validate all inputs at every boundary
- Encrypt sensitive data at rest and in transit
- Implement least-privilege access controls
- Regular security audits and penetration testing

#### 2. **API Security**
```typescript
class SecureAPIClient {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  private retryManager: RetryManager;
  
  async makeRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // Rate limiting
    await this.rateLimiter.acquire();
    
    // Request validation
    this.validateRequest(options);
    
    // Secure headers
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'TrendditMemo/1.0',
      'X-Request-ID': this.generateRequestId()
    };
    
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: { ...options.headers, ...headers }
      });
      
      if (!response.ok) {
        throw new APIError(response.status, await response.text());
      }
      
      return await response.json();
    } catch (error) {
      return await this.retryManager.retry(() => this.makeRequest(endpoint, options));
    }
  }
  
  private validateRequest(options: RequestOptions): void {
    // Input validation and sanitization
    if (options.body) {
      this.sanitizeInput(options.body);
    }
    
    // Size limits
    if (JSON.stringify(options.body).length > 1000000) {
      throw new Error('Request body too large');
    }
  }
}
```

#### 3. **Content Security Policy (Enhanced)**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; worker-src 'self'; connect-src https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com http://localhost:11434; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; frame-src 'none'; form-action 'none'; upgrade-insecure-requests;"
  }
}
```

#### 4. **Data Encryption**
```typescript
class DataEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  
  async encryptSensitiveData(data: string): Promise<EncryptedData> {
    const key = await this.deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      encoded
    );
    
    return {
      data: new Uint8Array(encrypted),
      iv,
      algorithm: this.ALGORITHM
    };
  }
  
  async decryptSensitiveData(encryptedData: EncryptedData): Promise<string> {
    const key = await this.deriveKey();
    
    const decrypted = await crypto.subtle.decrypt(
      { name: encryptedData.algorithm, iv: encryptedData.iv },
      key,
      encryptedData.data
    );
    
    return new TextDecoder().decode(decrypted);
  }
  
  private async deriveKey(): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('trenddit-memo-encryption-key'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('trenddit-memo-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
```

### Privacy Protection

#### 1. **Local-First Data Architecture**
- All user data stored locally by default
- No telemetry or usage tracking
- Optional cloud sync with user consent
- Complete data portability and deletion

#### 2. **API Key Protection**
```typescript
class APIKeyManager {
  private static readonly SECURE_STORAGE_KEY = 'secure_api_keys';
  
  async storeAPIKey(provider: string, key: string): Promise<void> {
    const encrypted = await this.encryptAPIKey(key);
    const keys = await this.getStoredKeys();
    keys[provider] = encrypted;
    
    await chrome.storage.local.set({
      [APIKeyManager.SECURE_STORAGE_KEY]: keys
    });
  }
  
  async getAPIKey(provider: string): Promise<string | null> {
    const keys = await this.getStoredKeys();
    const encrypted = keys[provider];
    
    if (!encrypted) return null;
    
    return await this.decryptAPIKey(encrypted);
  }
  
  async deleteAPIKey(provider: string): Promise<void> {
    const keys = await this.getStoredKeys();
    delete keys[provider];
    
    await chrome.storage.local.set({
      [APIKeyManager.SECURE_STORAGE_KEY]: keys
    });
  }
  
  private async encryptAPIKey(key: string): Promise<string> {
    const encryption = new DataEncryption();
    const encrypted = await encryption.encryptSensitiveData(key);
    return btoa(JSON.stringify(encrypted));
  }
}
```

#### 3. **Privacy-Preserving Analytics** (Optional)
```typescript
class PrivacyPreservingAnalytics {
  private enabled = false;
  
  async initialize(): Promise<void> {
    const consent = await this.getUserConsent();
    this.enabled = consent;
  }
  
  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled) return;
    
    // Only track aggregated, non-identifying metrics
    const sanitizedEvent = {
      type: event.type,
      timestamp: Date.now(),
      // Remove all personal data
      metadata: this.sanitizeMetadata(event.metadata)
    };
    
    // Store locally and batch upload
    this.queueEvent(sanitizedEvent);
  }
  
  private sanitizeMetadata(metadata: any): any {
    // Remove URLs, content, API keys, and other sensitive data
    return {
      provider: metadata.provider ? 'redacted' : undefined,
      contentType: metadata.contentType,
      success: metadata.success
    };
  }
}
```

---

## Testing Strategy

### Testing Architecture

#### 1. **Unit Testing with Vitest**
```typescript
// Storage manager unit tests
describe('StorageManager', () => {
  let storageManager: StorageManager;
  
  beforeEach(() => {
    storageManager = new ChromeStorageManager();
    vi.clearAllMocks();
  });
  
  describe('saveMemo', () => {
    it('should save memo with generated ID', async () => {
      const memo = createTestMemo();
      const id = await storageManager.saveMemo(memo);
      
      expect(id).toBeTruthy();
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        [`memo:${id}`]: expect.objectContaining({
          id,
          title: memo.title,
          content: memo.content
        })
      });
    });
    
    it('should compress large content', async () => {
      const largeMemo = createTestMemo({
        content: 'x'.repeat(20000)
      });
      
      await storageManager.saveMemo(largeMemo);
      
      expect(largeMemo.isCompressed).toBe(true);
      expect(largeMemo.content.length).toBeLessThan(20000);
    });
  });
});

// LLM provider unit tests
describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  
  beforeEach(() => {
    provider = new OpenAIProvider();
    fetchMock.resetMocks();
  });
  
  describe('chat', () => {
    it('should handle successful chat response', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }]
      };
      
      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));
      
      const result = await provider.chat([
        { role: 'user', content: 'Test message' }
      ]);
      
      expect(result.content).toBe('Test response');
      expect(result.success).toBe(true);
    });
    
    it('should handle API errors gracefully', async () => {
      fetchMock.mockRejectOnce(new Error('API Error'));
      
      await expect(provider.chat([
        { role: 'user', content: 'Test message' }
      ])).rejects.toThrow('API Error');
    });
  });
});
```

#### 2. **Integration Testing**
```typescript
// Extension integration tests
describe('Extension Integration', () => {
  let extensionContext: ExtensionContext;
  
  beforeEach(async () => {
    extensionContext = await setupTestExtension();
  });
  
  afterEach(async () => {
    await cleanupTestExtension(extensionContext);
  });
  
  it('should capture content from webpage', async () => {
    // Load test webpage
    await extensionContext.loadPage('test-page.html');
    
    // Activate capture mode
    await extensionContext.clickElement('#capture-button');
    
    // Select content
    await extensionContext.clickElement('.content-to-capture');
    
    // Verify memo creation
    const memos = await extensionContext.getMemos();
    expect(memos).toHaveLength(1);
    expect(memos[0].title).toBe('Expected Title');
  });
  
  it('should sync data between components', async () => {
    // Create memo in background
    const memo = await extensionContext.createMemo({
      title: 'Test Memo',
      content: 'Test content'
    });
    
    // Verify in side panel
    await extensionContext.openSidePanel();
    const displayedMemos = await extensionContext.getSidePanelMemos();
    
    expect(displayedMemos).toContainEqual(
      expect.objectContaining({
        id: memo.id,
        title: memo.title
      })
    );
  });
});
```

#### 3. **End-to-End Testing with Playwright**
```typescript
// E2E testing configuration
import { test, expect } from '@playwright/test';
import { ChromiumExtensionContext } from './test-utils';

test.describe('Trenddit Memo E2E Tests', () => {
  let extensionContext: ChromiumExtensionContext;
  
  test.beforeEach(async ({ page }) => {
    extensionContext = await ChromiumExtensionContext.setup(page);
  });
  
  test('complete content capture workflow', async ({ page }) => {
    // Navigate to test page
    await page.goto('https://example.com');
    
    // Open extension side panel
    await extensionContext.openSidePanel();
    
    // Activate capture mode
    await page.click('#capture-button');
    await expect(page.locator('#status-text')).toContainText('Selection Mode');
    
    // Capture content
    await page.hover('.article-content');
    await expect(page.locator('.article-content')).toHaveClass(/highlight-outline/);
    await page.click('.article-content');
    
    // Wait for processing
    await expect(page.locator('#status-text')).toContainText('Processing');
    await expect(page.locator('#status-text')).toContainText('Success');
    
    // Verify memo in list
    await expect(page.locator('.memo-list-item')).toHaveCount(1);
    await expect(page.locator('.memo-list-item h3')).toContainText('Example Article');
  });
  
  test('chat with captured memos', async ({ page }) => {
    // Pre-populate with test memos
    await extensionContext.createTestMemos(3);
    
    // Open chat interface
    await extensionContext.openSidePanel();
    await page.click('#chat-button');
    
    // Select tag for chat
    await page.click('[data-tag="Article"]');
    
    // Send chat message
    await page.fill('#chat-input', 'Summarize the key points');
    await page.press('#chat-input', 'Enter');
    
    // Verify response
    await expect(page.locator('.chat-message.assistant')).toBeVisible();
    await expect(page.locator('.memo-citation')).toHaveCount.toBeGreaterThan(0);
  });
  
  test('provider switching and fallback', async ({ page }) => {
    await extensionContext.openSidePanel();
    await page.click('#settings-button');
    
    // Configure multiple providers
    await page.fill('#openai-key', 'test-openai-key');
    await page.fill('#anthropic-key', 'test-anthropic-key');
    await page.click('#save-settings');
    
    // Test provider fallback
    await extensionContext.simulateAPIFailure('openai');
    
    // Capture content (should fallback to Anthropic)
    await page.click('#capture-button');
    await page.click('.test-content');
    
    // Verify successful processing with fallback
    await expect(page.locator('#status-text')).toContainText('Success');
    await expect(page.locator('.memo-list-item')).toHaveCount(1);
  });
});
```

### Testing Automation & CI/CD

#### GitHub Actions Workflow
```yaml
name: Trenddit Memo CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type checking
        run: pnpm run type-check
      
      - name: Linting
        run: pnpm run lint
      
      - name: Unit tests
        run: pnpm run test:unit --coverage
      
      - name: Integration tests
        run: pnpm run test:integration
      
      - name: Build extension
        run: pnpm run build
      
      - name: E2E tests
        run: pnpm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Security audit
        run: pnpm audit --audit-level high
      
      - name: Dependency check
        run: pnpm run security:check
      
      - name: SAST scanning
        uses: github/super-linter@v4
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Performance Requirements

### Performance Targets

#### Load Time Performance
- **Extension startup**: < 100ms
- **Side panel open**: < 200ms
- **Content capture**: < 500ms (excluding LLM processing)
- **Search query**: < 100ms for 1000+ memos
- **Chat response**: < 2s for context assembly + LLM processing

#### Memory Usage
- **Extension overhead**: < 50MB baseline
- **Per memo storage**: < 2KB average (compressed)
- **Search index**: < 10MB for 10,000 memos
- **Maximum heap**: < 200MB during peak usage

#### Storage Efficiency
- **Compression ratio**: 70%+ for large content
- **Index size**: < 1% of total memo content
- **Backup efficiency**: < 5MB for metadata sync
- **Cache hit ratio**: 90%+ for frequently accessed memos

### Performance Optimization Strategies

#### 1. **Lazy Loading and Code Splitting**
```typescript
// Dynamic provider loading
class LLMProviderFactory {
  private static providers = new Map<string, () => Promise<LLMProvider>>();
  
  static register(id: string, loader: () => Promise<LLMProvider>) {
    this.providers.set(id, loader);
  }
  
  static async getProvider(id: string): Promise<LLMProvider> {
    const loader = this.providers.get(id);
    if (!loader) throw new Error(`Provider ${id} not found`);
    
    // Lazy load provider implementation
    return await loader();
  }
}

// Register providers with lazy loading
LLMProviderFactory.register('openai', () => import('./providers/openai').then(m => new m.OpenAIProvider()));
LLMProviderFactory.register('anthropic', () => import('./providers/anthropic').then(m => new m.AnthropicProvider()));

// Vite code splitting configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'providers': ['./src/providers/openai', './src/providers/anthropic'],
          'ui': ['./src/sidepanel/components'],
          'content': ['./src/content/capture', './src/content/overlay']
        }
      }
    }
  }
});
```

#### 2. **Efficient Storage and Caching**
```typescript
class OptimizedStorageManager {
  private cache = new LRUCache<string, Memo>({ max: 500 });
  private searchIndex: SearchIndex;
  
  async getMemo(id: string): Promise<Memo | null> {
    // Check cache first
    const cached = this.cache.get(id);
    if (cached) return cached;
    
    // Load from storage
    const memo = await this.loadFromStorage(id);
    if (memo) {
      this.cache.set(id, memo);
    }
    
    return memo;
  }
  
  async searchMemos(query: string): Promise<SearchResult[]> {
    // Use pre-built search index
    const results = await this.searchIndex.search(query);
    
    // Load only the required memo data
    return await Promise.all(
      results.map(async result => ({
        id: result.id,
        score: result.score,
        snippet: result.snippet,
        memo: await this.getMemo(result.id)
      }))
    );
  }
  
  private async compressContent(content: string): Promise<string> {
    // Use compression for large content
    if (content.length > 10000) {
      return await this.gzipCompress(content);
    }
    return content;
  }
}
```

#### 3. **Background Processing Optimization**
```typescript
class BackgroundProcessor {
  private queue = new PQueue({ concurrency: 2 });
  private rateLimiter = new RateLimiter({ requestsPerSecond: 1 });
  
  async processContent(content: string): Promise<ProcessedContent> {
    return this.queue.add(async () => {
      await this.rateLimiter.acquire();
      
      // Process in chunks for large content
      if (content.length > 50000) {
        return await this.processInChunks(content);
      }
      
      return await this.processSingle(content);
    });
  }
  
  private async processInChunks(content: string): Promise<ProcessedContent> {
    const chunks = this.splitIntoChunks(content, 10000);
    const processed = await Promise.all(
      chunks.map(chunk => this.processSingle(chunk))
    );
    
    return this.mergeProcessedChunks(processed);
  }
}
```

#### 4. **Memory Management**
```typescript
class MemoryManager {
  private static readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly CLEANUP_THRESHOLD = 0.8;
  
  private currentMemoryUsage = 0;
  private trackedObjects = new WeakMap();
  
  track<T extends object>(obj: T, size: number): T {
    this.trackedObjects.set(obj, size);
    this.currentMemoryUsage += size;
    
    if (this.currentMemoryUsage > MemoryManager.MAX_CACHE_SIZE * MemoryManager.CLEANUP_THRESHOLD) {
      this.cleanup();
    }
    
    return obj;
  }
  
  private cleanup(): void {
    // Force garbage collection of old objects
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
    
    // Clear least recently used cache entries
    this.clearLRUEntries();
  }
  
  getMemoryUsage(): MemoryUsage {
    return {
      current: this.currentMemoryUsage,
      max: MemoryManager.MAX_CACHE_SIZE,
      percentage: (this.currentMemoryUsage / MemoryManager.MAX_CACHE_SIZE) * 100
    };
  }
}
```

---

## Development Workflow

### Modern Development Environment

#### 1. **Development Server with Hot Reload**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5174,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@components': resolve(__dirname, 'src/sidepanel/components'),
      '@hooks': resolve(__dirname, 'src/sidepanel/hooks'),
      '@stores': resolve(__dirname, 'src/sidepanel/stores'),
    },
  },
});
```

#### 2. **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@components/*": ["src/sidepanel/components/*"],
      "@hooks/*": ["src/sidepanel/hooks/*"],
      "@stores/*": ["src/sidepanel/stores/*"]
    },
    
    "types": ["chrome", "vite/client", "vitest/globals"]
  },
  "include": [
    "src/**/*",
    "tests/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

#### 3. **Package Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx}",
    
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest",
    
    "build:dev": "NODE_ENV=development pnpm run build",
    "build:prod": "NODE_ENV=production pnpm run build",
    "build:analyze": "vite-bundle-analyzer dist",
    
    "security:audit": "pnpm audit --audit-level high",
    "security:check": "better-npm-audit audit",
    
    "extension:load": "node scripts/load-extension.js",
    "extension:reload": "node scripts/reload-extension.js",
    "extension:package": "node scripts/package-extension.js"
  }
}
```

### Code Quality Tools

#### 1. **ESLint Configuration**
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'react-hooks',
    'security',
    'import',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      'alphabetize': { 'order': 'asc' }
    }],
    
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*'],
      env: {
        vitest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'security/detect-object-injection': 'off',
      },
    },
  ],
};
```

#### 2. **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed"
}
```

#### 3. **Pre-commit Hooks**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "pnpm run type-check && pnpm run test:unit",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### Development Scripts

#### Extension Loading Script
```typescript
// scripts/load-extension.js
import { chromium } from 'playwright';
import path from 'path';

async function loadExtension() {
  const extensionPath = path.resolve(__dirname, '../dist');
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });
  
  const [page] = context.pages();
  await page.goto('chrome://extensions/');
  
  console.log('Extension loaded successfully!');
  console.log(`Extension path: ${extensionPath}`);
}

loadExtension().catch(console.error);
```

---

## Migration Strategy

### Seamless Migration from WebMemo

#### 1. **Data Migration Utility**
```typescript
class WebMemoMigrationManager {
  async migrateUserData(): Promise<MigrationResult> {
    const migrationSteps = [
      this.migrateMemos.bind(this),
      this.migrateTags.bind(this),
      this.migrateSettings.bind(this),
      this.migrateSavedChats.bind(this),
    ];
    
    const results: MigrationStepResult[] = [];
    
    for (const step of migrationSteps) {
      try {
        const result = await step();
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message,
          step: step.name 
        });
      }
    }
    
    return {
      success: results.every(r => r.success),
      steps: results,
      summary: this.generateMigrationSummary(results)
    };
  }
  
  private async migrateMemos(): Promise<MigrationStepResult> {
    const webMemoData = await chrome.storage.local.get(['memos']);
    const webMemos = webMemoData.memos || [];
    
    const migratedMemos = webMemos.map(this.transformMemo);
    
    // Use new storage manager
    const storageManager = new TrendditStorageManager();
    await storageManager.saveMemos(migratedMemos);
    
    return {
      itemsProcessed: webMemos.length,
      itemsMigrated: migratedMemos.length,
      description: 'Migrated memos from WebMemo'
    };
  }
  
  private transformMemo(webMemo: any): Memo {
    return {
      id: webMemo.id,
      title: webMemo.title,
      content: webMemo.sourceHtml, // Use source HTML as content
      summary: webMemo.summary,
      narrative: webMemo.narrative,
      structuredData: webMemo.structuredData,
      tags: webMemo.tag ? [webMemo.tag] : [], // Convert single tag to array
      url: webMemo.url,
      favicon: webMemo.favicon,
      timestamp: webMemo.timestamp,
      
      // New fields with defaults
      contentType: ContentType.HTML,
      wordCount: this.countWords(webMemo.sourceHtml),
      isCompressed: false,
      processingMetadata: {
        provider: 'anthropic', // Assume Anthropic for legacy data
        model: 'claude-3-5-sonnet',
        version: '1.0'
      }
    };
  }
  
  private async migrateTags(): Promise<MigrationStepResult> {
    const webMemoTags = await chrome.storage.local.get(['tags']);
    const tags = webMemoTags.tags || [];
    
    // Transform WebMemo tags to Trenddit Memo format
    const migratedTags = tags.map(tag => ({
      ...tag,
      id: this.generateTagId(tag.name),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      memoCount: 0 // Will be recalculated
    }));
    
    const tagManager = new TagManager();
    await tagManager.saveTags(migratedTags);
    
    return {
      itemsProcessed: tags.length,
      itemsMigrated: migratedTags.length,
      description: 'Migrated tags from WebMemo'
    };
  }
}
```

#### 2. **Backwards Compatibility**
```typescript
class BackwardsCompatibilityLayer {
  async handleLegacyStorage(): Promise<void> {
    // Check for legacy WebMemo data
    const legacyData = await this.detectLegacyData();
    
    if (legacyData.hasLegacyData) {
      await this.offerMigration(legacyData);
    }
  }
  
  private async detectLegacyData(): Promise<LegacyDataInfo> {
    const keys = ['memos', 'tags', 'savedChats', 'anthropicApiKey'];
    const data = await chrome.storage.local.get(keys);
    
    return {
      hasLegacyData: Object.keys(data).length > 0,
      memoCount: data.memos?.length || 0,
      tagCount: data.tags?.length || 0,
      chatCount: data.savedChats?.length || 0,
      hasAPIKey: !!data.anthropicApiKey
    };
  }
  
  private async offerMigration(legacyData: LegacyDataInfo): Promise<void> {
    // Show migration dialog to user
    const userChoice = await this.showMigrationDialog(legacyData);
    
    if (userChoice.migrate) {
      const migrationManager = new WebMemoMigrationManager();
      const result = await migrationManager.migrateUserData();
      
      if (result.success && userChoice.deleteLegacy) {
        await this.cleanupLegacyData();
      }
      
      await this.showMigrationResults(result);
    }
  }
}
```

#### 3. **Gradual Feature Rollout**
```typescript
class FeatureRolloutManager {
  private static readonly ROLLOUT_CONFIG = {
    multiProvider: { rolloutPercent: 100, minVersion: '1.0.0' },
    advancedSearch: { rolloutPercent: 80, minVersion: '1.1.0' },
    collaborativeFeatures: { rolloutPercent: 20, minVersion: '1.2.0' },
  };
  
  isFeatureEnabled(featureName: string): boolean {
    const config = FeatureRolloutManager.ROLLOUT_CONFIG[featureName];
    if (!config) return false;
    
    // Check version requirement
    if (!this.meetsVersionRequirement(config.minVersion)) {
      return false;
    }
    
    // Check rollout percentage
    const userHash = this.getUserHash();
    return (userHash % 100) < config.rolloutPercent;
  }
  
  private getUserHash(): number {
    const userId = this.getUserId(); // Anonymous hash
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

---

## Requirements and Dependencies

### System Requirements

#### Minimum Requirements
- **Chrome Version**: 120+ (for latest Manifest V3 APIs)
- **RAM**: 4GB system RAM (extension uses <200MB)
- **Storage**: 100MB free disk space
- **Network**: Internet connection for LLM API calls
- **Permissions**: Admin access to install extensions (enterprise environments)

#### Recommended Requirements
- **Chrome Version**: Latest stable
- **RAM**: 8GB+ system RAM
- **Storage**: 1GB+ free disk space (for large memo collections)
- **Network**: Broadband internet (for optimal AI processing)
- **Display**: 1920x1080+ resolution for optimal UI experience

### Dependencies

#### Production Dependencies
```json
{
  "dependencies": {
    "preact": "^10.18.1",
    "@preact/signals": "^1.2.1",
    "zustand": "^4.4.6",
    "idb": "^7.1.1",
    "fuse.js": "^7.0.0",
    "zod": "^3.22.4",
    "date-fns": "^2.30.0",
    "dompurify": "^3.0.5",
    "marked": "^9.1.6",
    "pdf-parse": "^1.1.1"
  }
}
```

#### Development Dependencies
```json
{
  "devDependencies": {
    "@types/chrome": "^0.0.251",
    "@types/dompurify": "^3.0.5",
    "typescript": "^5.3.2",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.1.1",
    "@crxjs/vite-plugin": "^2.0.0-beta.21",
    
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@testing-library/preact": "^3.2.3",
    "@testing-library/jest-dom": "^6.1.5",
    "playwright": "^1.40.0",
    
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint-plugin-security": "^1.7.1",
    "prettier": "^3.1.0",
    
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "@commitlint/cli": "^18.4.0",
    "@commitlint/config-conventional": "^18.4.0"
  }
}
```

#### Browser APIs Used
```typescript
// Chrome Extension APIs
interface ChromeAPIs {
  // Core extension APIs
  runtime: chrome.runtime;
  storage: chrome.storage;
  tabs: chrome.tabs;
  scripting: chrome.scripting;
  action: chrome.action;
  sidePanel: chrome.sidePanel;
  
  // Content and permissions
  permissions: chrome.permissions;
  activeTab: boolean;
  
  // Communication
  messaging: chrome.runtime.MessageSender;
  
  // Optional APIs (with fallbacks)
  offscreen?: chrome.offscreen; // For advanced processing
  declarativeNetRequest?: chrome.declarativeNetRequest; // For request modification
}

// Web APIs Used
interface WebAPIs {
  // Core browser APIs
  fetch: typeof fetch;
  crypto: SubtleCrypto;
  indexedDB: IDBFactory;
  
  // File handling
  FileReader: typeof FileReader;
  Blob: typeof Blob;
  
  // DOM manipulation
  DOMParser: typeof DOMParser;
  MutationObserver: typeof MutationObserver;
  
  // Performance
  requestIdleCallback: typeof requestIdleCallback;
  IntersectionObserver: typeof IntersectionObserver;
}
```

### External Service Dependencies

#### LLM Provider APIs
```typescript
interface ProviderEndpoints {
  openai: {
    baseURL: 'https://api.openai.com/v1';
    endpoints: {
      chat: '/chat/completions';
      models: '/models';
      usage: '/usage';
    };
    auth: 'Bearer {api_key}';
  };
  
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1';
    endpoints: {
      messages: '/messages';
      models: '/models';
    };
    auth: 'x-api-key: {api_key}';
  };
  
  google: {
    baseURL: 'https://generativelanguage.googleapis.com/v1';
    endpoints: {
      generateContent: '/models/{model}:generateContent';
      models: '/models';
    };
    auth: 'key={api_key}';
  };
  
  ollama: {
    baseURL: 'http://localhost:11434';
    endpoints: {
      generate: '/api/generate';
      chat: '/api/chat';
      models: '/api/tags';
    };
    auth: 'none';
  };
}
```

---

## Code Standards

### TypeScript Style Guide

#### 1. **Naming Conventions**
```typescript
// Interfaces and Types - PascalCase
interface MemoData {
  readonly id: string;
  title: string;
  content: string;
}

type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

// Classes - PascalCase
class StorageManager {
  private readonly cache = new Map<string, Memo>();
  
  // Methods - camelCase
  async saveMemo(memo: Memo): Promise<string> {
    // Implementation
  }
  
  // Private methods - camelCase with descriptive names
  private sanitizeContent(content: string): string {
    // Implementation
  }
}

// Constants - SCREAMING_SNAKE_CASE
const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1',
  ANTHROPIC: 'https://api.anthropic.com/v1',
} as const;

// Enums - PascalCase with descriptive values
enum ContentType {
  HTML = 'html',
  PDF = 'pdf',
  IMAGE = 'image',
  VIDEO = 'video',
}

// Functions - camelCase with action verbs
function processContent(content: string): ProcessedContent {
  // Implementation
}

// Variables - camelCase
const processedMemo = await processContent(rawContent);
```

#### 2. **Interface Design Patterns**
```typescript
// Base interfaces with clear inheritance
interface BaseEntity {
  readonly id: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

interface Memo extends BaseEntity {
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  metadata: MemoMetadata;
}

// Discriminated unions for type safety
interface ProcessingResult {
  success: true;
  data: ProcessedContent;
}

interface ProcessingError {
  success: false;
  error: string;
  code: ErrorCode;
}

type ProcessingResponse = ProcessingResult | ProcessingError;

// Generic interfaces for reusability
interface Repository<T extends BaseEntity> {
  save(entity: T): Promise<string>;
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  delete(id: string): Promise<void>;
}

// Configuration interfaces with proper optionality
interface LLMProviderConfig {
  readonly apiKey: string;
  readonly baseURL?: string;
  readonly timeout?: number;
  readonly maxRetries?: number;
  readonly model?: string;
}
```

#### 3. **Error Handling Patterns**
```typescript
// Custom error classes with proper inheritance
abstract class TrendditError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class APIError extends TrendditError {
  readonly code = 'API_ERROR';
  readonly category = ErrorCategory.External;
  
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly provider: string,
    cause?: Error
  ) {
    super(message, cause, { statusCode, provider });
  }
}

class StorageError extends TrendditError {
  readonly code = 'STORAGE_ERROR';
  readonly category = ErrorCategory.Internal;
  
  constructor(message: string, public readonly operation: string, cause?: Error) {
    super(message, cause, { operation });
  }
}

// Result pattern for error handling
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

async function safeApiCall<T>(
  operation: () => Promise<T>
): Promise<Result<T, APIError>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error };
    }
    
    return {
      success: false,
      error: new APIError('Unknown API error', 500, 'unknown', error as Error)
    };
  }
}
```

#### 4. **Async/Await Best Practices**
```typescript
// Prefer async/await over Promises
class ContentProcessor {
  async processContent(content: string): Promise<ProcessedContent> {
    try {
      const cleaned = await this.cleanContent(content);
      const analyzed = await this.analyzeContent(cleaned);
      const structured = await this.extractStructuredData(analyzed);
      
      return {
        content: cleaned,
        analysis: analyzed,
        structuredData: structured,
        processedAt: Date.now()
      };
    } catch (error) {
      throw new ProcessingError(
        'Failed to process content',
        error as Error
      );
    }
  }
  
  // Parallel processing when operations are independent
  async processMultiple(contents: string[]): Promise<ProcessedContent[]> {
    const results = await Promise.allSettled(
      contents.map(content => this.processContent(content))
    );
    
    return results
      .filter((result): result is PromiseFulfilledResult<ProcessedContent> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }
  
  // Sequential processing with progress tracking
  async processWithProgress(
    contents: string[],
    onProgress: (completed: number, total: number) => void
  ): Promise<ProcessedContent[]> {
    const results: ProcessedContent[] = [];
    
    for (let i = 0; i < contents.length; i++) {
      try {
        const processed = await this.processContent(contents[i]);
        results.push(processed);
        onProgress(i + 1, contents.length);
      } catch (error) {
        console.error(`Failed to process content ${i + 1}:`, error);
      }
    }
    
    return results;
  }
}
```

### Component Architecture Standards

#### 1. **React/Preact Component Patterns**
```typescript
// Component interface definition
interface MemoListProps {
  memos: Memo[];
  selectedTags: string[];
  onMemoSelect: (memo: Memo) => void;
  onTagFilter: (tags: string[]) => void;
  className?: string;
}

// Functional component with proper typing
export const MemoList: FunctionComponent<MemoListProps> = ({
  memos,
  selectedTags,
  onMemoSelect,
  onTagFilter,
  className = ''
}) => {
  // Custom hooks for complex logic
  const filteredMemos = useFilteredMemos(memos, selectedTags);
  const { searchQuery, setSearchQuery } = useSearch();
  
  // Event handlers with proper typing
  const handleMemoClick = useCallback((memo: Memo) => {
    onMemoSelect(memo);
  }, [onMemoSelect]);
  
  // Render with proper JSX typing
  return (
    <div className={`memo-list ${className}`}>
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search memos..."
      />
      
      {filteredMemos.map(memo => (
        <MemoCard
          key={memo.id}
          memo={memo}
          onClick={handleMemoClick}
        />
      ))}
    </div>
  );
};

// Custom hooks with proper typing
function useFilteredMemos(memos: Memo[], selectedTags: string[]): Memo[] {
  return useMemo(() => {
    if (selectedTags.length === 0) return memos;
    
    return memos.filter(memo =>
      selectedTags.every(tag => memo.tags.includes(tag))
    );
  }, [memos, selectedTags]);
}

function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const debouncedQuery = useMemo(
    () => debounce(setSearchQuery, 300),
    []
  );
  
  return {
    searchQuery,
    setSearchQuery: debouncedQuery
  };
}
```

#### 2. **State Management Patterns**
```typescript
// Zustand store with TypeScript
interface MemoStore {
  // State
  memos: Memo[];
  selectedMemo: Memo | null;
  filters: MemoFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadMemos: () => Promise<void>;
  addMemo: (memo: Memo) => Promise<void>;
  updateMemo: (id: string, updates: Partial<Memo>) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  selectMemo: (memo: Memo | null) => void;
  setFilters: (filters: Partial<MemoFilters>) => void;
  clearError: () => void;
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  // Initial state
  memos: [],
  selectedMemo: null,
  filters: { tags: [], searchQuery: '' },
  isLoading: false,
  error: null,
  
  // Actions
  loadMemos: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const storageManager = new StorageManager();
      const memos = await storageManager.getMemos();
      set({ memos, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load memos',
        isLoading: false 
      });
    }
  },
  
  addMemo: async (memo: Memo) => {
    try {
      const storageManager = new StorageManager();
      await storageManager.saveMemo(memo);
      
      set(state => ({
        memos: [memo, ...state.memos]
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add memo'
      });
    }
  },
  
  // ... other actions
}));

// Store selectors for performance
export const useMemos = () => useMemoStore(state => state.memos);
export const useSelectedMemo = () => useMemoStore(state => state.selectedMemo);
export const useMemoActions = () => useMemoStore(state => ({
  loadMemos: state.loadMemos,
  addMemo: state.addMemo,
  updateMemo: state.updateMemo,
  deleteMemo: state.deleteMemo,
  selectMemo: state.selectMemo,
}));
```

### Testing Standards

#### 1. **Unit Test Patterns**
```typescript
// Test utilities and setup
const mockStorageManager = vi.mocked(StorageManager);
const mockLLMProvider = vi.mocked(LLMProvider);

describe('MemoProcessor', () => {
  let processor: MemoProcessor;
  
  beforeEach(() => {
    vi.clearAllMocks();
    processor = new MemoProcessor(mockStorageManager, mockLLMProvider);
  });
  
  describe('processContent', () => {
    it('should process valid HTML content successfully', async () => {
      // Arrange
      const htmlContent = '<div><h1>Test Title</h1><p>Test content</p></div>';
      const expectedProcessed = {
        title: 'Test Title',
        content: htmlContent,
        summary: 'Test summary',
        structuredData: { headings: ['Test Title'] }
      };
      
      mockLLMProvider.processContent.mockResolvedValue(expectedProcessed);
      
      // Act
      const result = await processor.processContent(htmlContent);
      
      // Assert
      expect(result).toEqual(expectedProcessed);
      expect(mockLLMProvider.processContent).toHaveBeenCalledWith(
        htmlContent,
        expect.objectContaining({ contentType: 'html' })
      );
    });
    
    it('should handle processing errors gracefully', async () => {
      // Arrange
      const invalidContent = '';
      mockLLMProvider.processContent.mockRejectedValue(
        new Error('Content too short')
      );
      
      // Act & Assert
      await expect(processor.processContent(invalidContent)).rejects.toThrow(
        ProcessingError
      );
    });
    
    it('should compress large content automatically', async () => {
      // Arrange
      const largeContent = 'x'.repeat(50000);
      const processedContent = { title: 'Large', content: largeContent };
      
      mockLLMProvider.processContent.mockResolvedValue(processedContent);
      
      // Act
      await processor.processContent(largeContent);
      
      // Assert - verify compression was called
      expect(mockStorageManager.saveMemo).toHaveBeenCalledWith(
        expect.objectContaining({
          isCompressed: true,
          content: expect.not.stringMatching(/x{50000}/)
        })
      );
    });
  });
});

// Integration test example
describe('MemoStore Integration', () => {
  let store: typeof useMemoStore;
  
  beforeEach(() => {
    // Reset store state
    store = create<MemoStore>(() => initialState);
  });
  
  it('should handle complete memo lifecycle', async () => {
    const { loadMemos, addMemo, updateMemo, deleteMemo } = store.getState();
    
    // Load initial memos
    await loadMemos();
    expect(store.getState().memos).toHaveLength(0);
    
    // Add memo
    const newMemo = createTestMemo();
    await addMemo(newMemo);
    expect(store.getState().memos).toHaveLength(1);
    
    // Update memo
    await updateMemo(newMemo.id, { title: 'Updated Title' });
    expect(store.getState().memos[0].title).toBe('Updated Title');
    
    // Delete memo
    await deleteMemo(newMemo.id);
    expect(store.getState().memos).toHaveLength(0);
  });
});
```

#### 2. **E2E Test Patterns**
```typescript
// Page Object Model for E2E tests
class TrendditMemoPage {
  constructor(private page: Page) {}
  
  // Locators
  get captureButton() { return this.page.locator('#capture-button'); }
  get memoList() { return this.page.locator('.memo-list'); }
  get chatButton() { return this.page.locator('#chat-button'); }
  get settingsButton() { return this.page.locator('#settings-button'); }
  
  // Actions
  async openSidePanel(): Promise<void> {
    await this.page.click('[data-testid="extension-icon"]');
    await this.page.waitForSelector('#side-panel', { state: 'visible' });
  }
  
  async captureContent(selector: string): Promise<void> {
    await this.captureButton.click();
    await this.page.waitForSelector('.highlight-mode');
    await this.page.click(selector);
    await this.page.waitForSelector('.processing-indicator');
    await this.page.waitForSelector('.success-indicator');
  }
  
  async searchMemos(query: string): Promise<void> {
    await this.page.fill('#search-input', query);
    await this.page.waitForSelector('.search-results');
  }
  
  // Assertions
  async expectMemoCount(count: number): Promise<void> {
    await expect(this.memoList.locator('.memo-item')).toHaveCount(count);
  }
  
  async expectChatResponse(): Promise<void> {
    await expect(this.page.locator('.chat-response')).toBeVisible();
    await expect(this.page.locator('.memo-citation')).toHaveCount.toBeGreaterThan(0);
  }
}

// E2E test implementation
test.describe('Trenddit Memo E2E', () => {
  let trendditPage: TrendditMemoPage;
  
  test.beforeEach(async ({ page }) => {
    trendditPage = new TrendditMemoPage(page);
    await page.goto('https://example.com');
  });
  
  test('complete user workflow', async ({ page }) => {
    // Open extension
    await trendditPage.openSidePanel();
    
    // Capture content
    await trendditPage.captureContent('.article-content');
    await trendditPage.expectMemoCount(1);
    
    // Search memos
    await trendditPage.searchMemos('example');
    await trendditPage.expectMemoCount(1);
    
    // Chat with memos
    await trendditPage.chatButton.click();
    await page.click('[data-tag="article"]');
    await page.fill('#chat-input', 'Summarize this content');
    await page.press('#chat-input', 'Enter');
    await trendditPage.expectChatResponse();
  });
});
```

---

## Conclusion

This comprehensive technical specification provides a complete blueprint for rewriting WebMemo into Trenddit Memo, a modern, extensible, and robust browser extension. The documentation covers every aspect from architecture design to implementation details, ensuring that the rewritten product will address all current limitations while building on the strong foundation of the original project.

### Key Improvements Summary

1. **Multi-LLM Provider Support**: Extensible architecture supporting OpenAI, Anthropic, Google, and local models
2. **Enhanced Content Processing**: Support for PDFs, images, videos, and other rich media formats
3. **Modern TypeScript Architecture**: Type-safe, maintainable, and scalable codebase
4. **Comprehensive Testing**: Unit, integration, and E2E testing with high coverage
5. **Performance Optimization**: Efficient storage, memory management, and async operations
6. **Robust Error Handling**: Graceful degradation, retry mechanisms, and user-friendly error messages
7. **Security & Privacy**: Enhanced encryption, secure API handling, and privacy-first design
8. **Developer Experience**: Modern build system, hot reload, and excellent tooling

### Next Steps

1. **Phase 1**: Establish development environment and core architecture
2. **Phase 2**: Implement LLM provider system and content processing
3. **Phase 3**: Build modern UI and enhance user experience
4. **Phase 4**: Comprehensive testing and quality assurance
5. **Phase 5**: Migration strategy and production deployment

This specification serves as a complete guide for implementing Trenddit Memo while maintaining the user-friendly experience that made WebMemo successful, but with significantly enhanced capabilities and modern development practices.

---

**Document Version**: 1.0 