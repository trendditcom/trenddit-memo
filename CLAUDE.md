# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trenddit Memo is a Chrome extension that enables users to capture, organize, and chat with web content using AI. The extension supports multiple LLM providers (Anthropic Claude, OpenAI GPT, Google Gemini, and Ollama for local processing) for content processing and natural language interactions.

## Common Development Commands

### Build Commands
- `npm run build` - Bundle the extension using esbuild (only bundles background.js currently)
- `npm install` - Install dependencies (@anthropic-ai/sdk and esbuild)

### Testing the Extension
1. Run `npm run build` to create the bundled files
2. Load extension in Chrome:
   - Navigate to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory
3. The extension uses Chrome's side panel interface

### Development Notes
- Only background.js is currently bundled; other files are loaded as ES modules
- The extension requires an API key from cloud providers (Anthropic, OpenAI, or Google) or a running Ollama service for local processing
- Uses Chrome Manifest V3 with service worker architecture
- Multi-provider architecture allows switching between different AI models and local/cloud processing

## Architecture Overview

### Core Components

**Background Service Worker** (`background.js`)
- Handles memo processing and API communication
- Manages storage operations and message routing
- Processes content through Claude API with 4096 token limit
- Implements JSON sanitization and error handling

**Content Scripts** (`content.js`)
- Injected into web pages for content capture
- Manages visual highlighting and element selection
- Handles cross-origin content extraction
- Communicates with background script via message passing

**Side Panel Interface** (`sidepanel.js`, `sidepanel.html`)
- Primary user interface for memo management
- Handles chat functionality and tag-based filtering
- Manages view states (list/detail/chat/settings)
- Implements real-time status updates

**Storage System** (`storage.js`)
- Chrome storage.local for primary data persistence
- Chrome storage.sync for backup and cross-device sync
- Handles memo, tag, and chat data management
- Implements data validation and cleanup

### Key Modules

**Multi-LLM Provider Integration** (`providers/`, `llm-provider-factory.js`)
- Browser-compatible API clients for multiple providers (Anthropic, OpenAI, Gemini)
- Unified provider interface with standardized request/response handling
- Content processing with structured data extraction across all providers
- Chat message handling and context management
- Provider-specific token counting and cost estimation
- Configuration management and provider switching

**Content Processing** (`memos.js`)
- Memo loading and filtering functionality
- Tag-based organization system
- Content metadata extraction

**UI Management** (`ui.js`)
- Memo list and detail view rendering
- Dynamic UI updates and status feedback
- Export functionality and user interactions

**Tag System** (`tags.js`)
- Hierarchical tag organization
- Visual customization (colors, icons)
- Predefined tag categories with 70+ icons
- Real-time count updates

### Data Models

**Memo Structure**
```javascript
{
  id: string,
  url: string,
  favicon: string,
  timestamp: number,
  sourceHtml: string,
  title: string,
  summary: string,
  narrative: string,
  structuredData: object,
  tag: string
}
```

**Tag Structure**
```javascript
{
  name: string,
  color: string,
  icon: string,
  count: number
}
```

## Content Security Policy

The extension uses strict CSP settings defined in manifest.json:
- `script-src 'self'` - Only allows scripts from extension
- `object-src 'self'` - Restricts object sources
- Connects to multiple AI provider endpoints:
  - `https://api.anthropic.com/*` for Anthropic Claude
  - `https://api.openai.com/*` for OpenAI GPT
  - `https://generativelanguage.googleapis.com/*` for Google Gemini
- Supports `<all_urls>` for content capture

## File Organization

### Core Files
- `manifest.json` - Extension configuration and permissions
- `background.js` - Service worker (bundled by esbuild)
- `sidepanel.html/js` - Main user interface
- `content.js` - Web page content injection

### Feature Modules
- `providers/` - Multi-LLM provider implementations
  - `anthropic-provider.js` - Anthropic Claude integration
  - `openai-provider.js` - OpenAI GPT integration  
  - `gemini-provider.js` - Google Gemini integration
- `llm-provider-factory.js` - Provider factory and management
- `config/provider-config.js` - Provider configuration management
- `memos.js` - Content management
- `tags.js` - Organization system
- `ui.js` - Interface components
- `storage.js` - Data persistence
- `status.js` - User feedback

### Assets
- `icons/` - Extension icons (16px, 48px, 128px)
- `styles.css` - UI styling
- `dist/` - Build output directory

## Development Workflow

### Content Capture Flow
1. User clicks capture button to enter highlight mode
2. Content script highlights selectable elements
3. User clicks element to capture content
4. Background script processes content through Claude API
5. Processed memo is stored and displayed in side panel

### Chat Interaction Flow
1. User selects tag filter for chat context
2. System assembles context from tagged memos
3. User message is sent to Claude API with context
4. Response includes memo citations and structured data
5. Chat history is saved and can be exported

### Storage Strategy
- **Local Storage**: Complete memo content, chat history, user settings
- **Sync Storage**: Lightweight backup of tags and metadata
- **Data Validation**: JSON sanitization and integrity checks
- **Backup System**: Automatic backup to sync storage with recovery options

## Important Implementation Details

### API Integration
- Uses custom browser-compatible clients for multiple providers (not official SDKs in browser context)
- Unified provider interface with factory pattern for easy provider switching
- Implements retry logic and rate limiting across all providers
- Handles provider-specific token counting and content truncation
- Supports both memo processing and chat interactions with all providers
- Provider-specific error handling and authentication validation

### Security Considerations
- API keys stored securely in Chrome storage
- Content sanitization to prevent XSS
- JSON validation for all stored data
- CSP compliance for all scripts and resources

### Performance Optimizations
- Content processing limited to 4096 tokens
- Efficient storage with compression for large content
- Lazy loading of UI components
- Background processing to avoid blocking UI

## Extension Permissions

- `storage` - Local data persistence
- `sidePanel` - Chrome side panel integration
- `scripting` - Content script injection
- `activeTab` - Current tab access
- `tabs` - Tab management
- Host permissions for `api.anthropic.com` and `<all_urls>`

## Multi-LLM Provider Setup

### Supported Providers

**Anthropic Claude**
- API Key Format: `sk-ant-...`
- Supported Models: Claude Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5v2, Haiku 3.5
- Get API Key: https://console.anthropic.com/

**OpenAI GPT**
- API Key Format: `sk-...`
- Supported Models: GPT-4o-mini, GPT-4o, GPT-4.1, GPT-4.1-mini
- Get API Key: https://platform.openai.com/api-keys

**Google Gemini**
- API Key Format: `AIza...`
- Supported Models: Gemini 2.5 Pro, Gemini 2.5 Flash
- Get API Key: https://aistudio.google.com/app/apikey

**Ollama (Local LLM)**
- API Key: Not required (local service)
- Default Configuration: localhost:11434
- Supported Models: Dynamic (based on installed models)
- Setup: https://ollama.ai
- Privacy: All processing stays local on your machine

### Configuration
1. Open the extension side panel
2. Click the Settings button
3. Select your preferred AI provider from the dropdown
4. Enter your API key for the selected provider
5. Choose your preferred model
6. Click "Test Connection" to verify setup
7. Click "Save Settings"

### Provider Switching
- Users can switch between providers at any time from Settings
- Existing memos work with any provider
- Chat conversations maintain context when switching providers
- Each provider has optimized token counting and processing

## Dependencies

### Production
- `@anthropic-ai/sdk` (v0.18.0) - AI integration (used for reference, not in browser)

### Development  
- `esbuild` (v0.20.1) - JavaScript bundling

The extension is designed to be lightweight with minimal external dependencies and browser-compatible ES modules. All provider integrations use native fetch API for maximum compatibility.