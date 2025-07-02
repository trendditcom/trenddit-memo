# Task Set 001: Multi-LLM Integration

**Priority:** High  
**Roadmap Item:** Multi-LLM Integration - Enable users to choose between OpenAI, Google Gemini, Anthropic as model provider

## Overview

Refactor the current Anthropic-only implementation to support multiple LLM providers, enabling users to choose between different AI models based on their preferences and requirements.

## Current State Analysis

- ✅ Foundation work exists: `LLMProvider` base class and `LLMProviderFactory`
- ❌ Implementation still hardcoded to Anthropic in `background.js` and `anthropic-api.js`
- ❌ No provider-specific implementations for other LLMs
- ❌ No UI for provider selection
- ❌ No unified configuration management

## Tasks

### Phase 1: Foundation Refactoring (Essential Prerequisites)

- [x] **001-1:** Refactor AnthropicProvider to extend LLMProvider base class
  - [x] Create `providers/anthropic-provider.js` that properly extends `LLMProvider`
  - [x] Implement all required methods: `initialize()`, `chat()`, `processMemo()`, `calculateTokens()`
  - [x] Move Anthropic-specific logic from `anthropic-api.js` to the new provider class
  - [x] Ensure browser compatibility and CSP compliance

- [x] **001-2:** Update background.js to use provider factory pattern
  - [x] Replace direct imports from `anthropic-api.js` with `LLMProviderFactory`
  - [x] Implement provider initialization logic in message handlers
  - [x] Update memo processing and chat handling to use provider interface
  - [x] Add error handling for provider initialization failures

- [x] **001-3:** Create configuration management system
  - [x] Design storage schema for multi-provider configurations
  - [x] Implement functions to get/set current provider and API keys
  - [x] Add provider validation and initialization logic
  - [x] Create migration function for existing Anthropic API keys

### Phase 2: Provider Implementations

- [x] **001-4:** Implement OpenAI Provider
  - [x] Create `providers/openai-provider.js` extending `LLMProvider`
  - [x] Implement OpenAI API calls with browser-compatible fetch
  - [x] Map OpenAI responses to unified interface format
  - [x] Add model configuration (GPT-4, GPT-3.5-turbo options)
  - [x] Implement proper error handling and rate limiting


- [x] **001-6:** Implement Google Gemini Provider  
  - [x] Create `providers/gemini-provider.js` extending `LLMProvider`
  - [x] Implement Google AI API calls for Gemini models
  - [x] Handle Gemini-specific request/response formats
  - [x] Support multiple Gemini model variants (Gemini Pro, etc.)
  - [x] Implement safety settings and configuration options

### Phase 3: User Interface Integration

- [x] **001-7:** Design provider selection UI in settings
  - [x] Add provider selection dropdown in settings panel
  - [x] Create provider-specific configuration sections (API keys, models, regions)
  - [x] Add validation and testing capabilities for each provider
  - [x] Show current provider status and model information

- [x] **001-8:** Update chat interface for multi-provider support
  - [x] Display current provider and model in chat interface
  - [x] Add provider-specific token count calculations
  - [x] Update error handling to show provider-specific messages
  - [x] Add provider switching capability from chat interface

- [x] **001-9:** Enhanced status and error handling
  - [x] Create provider-specific status messages
  - [x] Add connection testing for each provider
  - [x] Implement graceful degradation when providers fail
  - [x] Add retry logic with exponential backoff

### Phase 4: Testing and Validation

- [x] **001-10:** Provider validation and testing
  - [x] Test each provider with real API keys
  - [x] Validate memo processing consistency across providers
  - [x] Test chat functionality with different model capabilities
  - [x] Verify error handling and edge cases
  - [x] Test configuration migration from current Anthropic setup

- [x] **001-11:** Documentation and user guide updates
  - [x] Update CLAUDE.md with multi-provider setup instructions
  - [x] Document API key setup for each provider
  - [x] Add troubleshooting guide for provider-specific issues
  - [x] Create comparison guide for choosing providers

## Technical Requirements

### Browser Compatibility
- All provider implementations must work in browser environment
- No Node.js specific dependencies
- CSP compliance for all API calls
- CORS handling for different provider endpoints

### Security
- Secure API key storage for multiple providers
- Provider isolation (failures in one don't affect others)
- Input validation and sanitization for all providers
- Rate limiting and abuse prevention

### Performance
- Lazy loading of provider implementations
- Efficient token counting for different providers
- Response caching where appropriate
- Minimal bundle size impact

## Success Criteria

- [x] Users can select from at least 3 LLM providers (Anthropic, OpenAI, Gemini)
- [x] All core functionality (memo processing, chat) works with each provider
- [x] Clean migration path from current Anthropic-only setup
- [x] Provider failures are handled gracefully
- [x] UI clearly shows current provider status
- [x] Performance is maintained or improved
- [x] Code is more modular and maintainable

## Files to Create/Modify

### New Files
- `providers/anthropic-provider.js`
- `providers/openai-provider.js`
- `providers/gemini-provider.js`
- `config/provider-config.js`

### Modified Files
- `background.js` (use factory pattern)
- `llm-provider-factory.js` (add new providers)
- `sidepanel.js` (provider selection UI)
- `sidepanel.html` (settings UI)
- `storage.js` (multi-provider storage)
- `anthropic-api.js` (possibly deprecate/refactor)

## Dependencies

- No new external dependencies required
- Leverage existing build system and bundling
- Use native fetch API for all provider implementations
- Maintain current extension permissions structure

## Future Compatibility

This implementation should enable:
- Easy addition of new providers (Ollama, local models)
- A/B testing between providers
- Advanced features like provider failover
- Model-specific optimizations and configurations

---

# Development Instructions

## Implementation Guidelines

### 1. Provider Implementation Pattern

Each provider should follow this structure:

```javascript
// providers/example-provider.js
import { LLMProvider } from '../llm-provider-api.js';

export class ExampleProvider extends LLMProvider {
    constructor(config = {}) {
        super(config);
        this.apiKey = null;
        this.baseUrl = 'https://api.example.com/v1';
    }

    async initialize(apiKey) {
        this.apiKey = apiKey;
        this.initialized = true;
        // Test connection here
        return this.testConnection();
    }

    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }
        
        // Transform to provider format
        const providerMessages = this.transformMessages(messages);
        
        // Make API call
        const response = await this.makeApiCall('/chat', {
            messages: providerMessages,
            ...options
        });
        
        // Transform response to standard format
        return this.transformResponse(response);
    }

    async processMemo(content, options = {}) {
        const messages = [{
            role: 'user',
            content: `Process this content: ${content}`
        }];
        
        return await this.chat(messages, options);
    }

    calculateTokens(text) {
        // Provider-specific token calculation
        return Math.ceil(text.length / 4); // Rough estimate
    }
}
```

### 2. Factory Pattern Updates

Update `llm-provider-factory.js`:

```javascript
import { AnthropicProvider } from './providers/anthropic-provider.js';
import { OpenAIProvider } from './providers/openai-provider.js';
import { GeminiProvider } from './providers/gemini-provider.js';

export class LLMProviderFactory {
    static createProvider(type, config) {
        switch (type) {
            case 'anthropic':
                return new AnthropicProvider(config);
            case 'openai':
                return new OpenAIProvider(config);
            case 'gemini':
                return new GeminiProvider(config);
            default:
                throw new Error(`Provider type '${type}' not implemented`);
        }
    }

    static getAvailableProviders() {
        return [
            {
                id: 'anthropic',
                name: 'Anthropic Claude',
                description: 'Claude AI by Anthropic',
                requiresApiKey: true,
                models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
            },
            {
                id: 'openai',
                name: 'OpenAI',
                description: 'GPT models by OpenAI',
                requiresApiKey: true,
                models: ['gpt-4', 'gpt-3.5-turbo']
            },
            {
                id: 'gemini',
                name: 'Google Gemini',
                description: 'Gemini AI by Google',
                requiresApiKey: true,
                models: ['gemini-pro', 'gemini-pro-vision']
            }
        ];
    }
}
```

### 3. Background Script Refactoring

Key changes to `background.js`:

```javascript
import { LLMProviderFactory } from './llm-provider-factory.js';

let currentProvider = null;

// Initialize provider from storage
async function initializeProvider() {
    const result = await chrome.storage.local.get(['llmConfig']);
    const config = result.llmConfig || { type: 'anthropic' };
    
    try {
        currentProvider = LLMProviderFactory.createProvider(config.type, config);
        if (config.apiKey) {
            await currentProvider.initialize(config.apiKey);
        }
    } catch (error) {
        console.error('Failed to initialize LLM provider:', error);
    }
}

// Update message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setLLMConfig') {
        initializeProvider(request.config)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    
    if (request.action === 'chatMessage') {
        if (!currentProvider || !currentProvider.initialized) {
            sendResponse({ success: false, error: 'LLM provider not configured' });
            return;
        }
        
        currentProvider.chat(request.messages)
            .then(response => sendResponse({ success: true, response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    
    // Handle other actions...
});

// Initialize on startup
initializeProvider();
```

### 4. UI Implementation Guidelines

Settings panel HTML structure:

```html
<div id="llm-provider-settings">
    <h3>AI Provider Settings</h3>
    
    <div class="setting-group">
        <label for="provider-select">LLM Provider:</label>
        <select id="provider-select">
            <option value="anthropic">Anthropic Claude</option>
            <option value="openai">OpenAI GPT</option>
            <option value="gemini">Google Gemini</option>
        </select>
    </div>

    <div id="provider-configs">
        <div id="anthropic-config" class="provider-config">
            <label for="anthropic-api-key">Anthropic API Key:</label>
            <input type="password" id="anthropic-api-key" placeholder="sk-ant-...">
            
            <label for="anthropic-model">Model:</label>
            <select id="anthropic-model">
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            </select>
        </div>
        
        <div id="openai-config" class="provider-config hidden">
            <label for="openai-api-key">OpenAI API Key:</label>
            <input type="password" id="openai-api-key" placeholder="sk-...">
            
            <label for="openai-model">Model:</label>
            <select id="openai-model">
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
        </div>
        
        <!-- Similar structure for other providers -->
    </div>

    <div class="provider-status">
        <span id="provider-status-text">Not configured</span>
        <button id="test-connection">Test Connection</button>
    </div>
    
    <button id="save-llm-config">Save Configuration</button>
</div>
```

### 5. Storage Schema Design

```javascript
// storage structure for multi-provider config
const llmConfig = {
    type: 'anthropic', // Current provider type
    providers: {
        anthropic: {
            apiKey: 'sk-ant-...',
            model: 'claude-3-5-sonnet-20241022',
            enabled: true
        },
        openai: {
            apiKey: 'sk-...',
            model: 'gpt-4',
            enabled: false
        },
        gemini: {
            apiKey: 'AIza...',
            model: 'gemini-pro',
            enabled: false
        }
    },
    lastUpdated: Date.now()
};
```

## Development Workflow

### Phase 1 Order (Most Important First)

1. **Start with 001-1**: Refactor AnthropicProvider
   - This gives you a working example and validates the base class interface
   - Test thoroughly to ensure no regression in functionality

2. **Then 001-2**: Update background.js
   - This establishes the factory pattern usage
   - Critical for all subsequent provider implementations

3. **Then 001-3**: Configuration management
   - Required before implementing additional providers
   - Sets up the storage and migration logic

### Key Implementation Notes

#### Error Handling Strategy
- Each provider should have consistent error message formats
- Implement circuit breaker pattern for repeated failures
- Graceful degradation when provider is unavailable

#### Testing Approach
- Create mock providers for unit testing
- Test with real API keys in development
- Implement connection testing utilities

#### Migration Strategy
- Detect existing Anthropic API key in storage
- Automatically migrate to new configuration format
- Preserve user settings during migration

#### Performance Considerations
- Lazy load provider implementations
- Cache provider instances
- Implement request queuing for rate limiting

## Common Pitfalls to Avoid

1. **CORS Issues**: Ensure all provider APIs support browser-based calls
2. **API Key Security**: Store encrypted, never log in console
3. **Response Format Inconsistencies**: Standardize response mapping
4. **Bundle Size**: Don't import all providers by default
5. **Error Propagation**: Don't expose API keys in error messages

## Testing Checklist

- [ ] All existing functionality works with Anthropic provider
- [ ] Provider switching works without extension reload
- [ ] Error messages are user-friendly
- [ ] API keys are stored securely
- [ ] Migration from old config works
- [ ] UI reflects current provider status
- [ ] Token counting is accurate per provider
- [ ] Rate limiting is respected

## Code Review Focus Areas

- Provider interface consistency
- Error handling completeness
- Security of API key management
- Performance impact measurement
- UI/UX quality
- Migration logic correctness