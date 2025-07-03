# Task Set 002: Local LLM Integration (Ollama)

**Priority:** High  
**Roadmap Item:** Local LLM Integration - Enable users to choose Ollama as a model provider

## Overview

Add Ollama as a local LLM provider to the existing multi-LLM architecture, enabling users to run AI models locally on their machine without relying on cloud API services.

## Context

Ollama is a local LLM runner that allows users to run large language models locally. Unlike cloud providers, it:
- Runs on localhost (typically port 11434)
- Doesn't require API keys
- Supports downloading and running various models (llama2, codellama, mistral, etc.)
- Provides privacy by keeping all data local
- May not always be running (requires user to start service)

## Current State Analysis

- ✅ Solid provider architecture exists with base `LLMProvider` class
- ✅ `LLMProviderFactory` supports adding new providers
- ✅ UI system for provider selection is implemented
- ✅ Configuration management system is in place
- ❌ No Ollama provider implementation
- ❌ No local service detection/validation
- ❌ No UI for local provider configuration

## Tasks

### Phase 1: Core Ollama Provider Implementation

- [x] **002-1:** Create Ollama provider class
  - [x] Create `providers/ollama-provider.js` extending `LLMProvider`
  - [x] Implement Ollama API client for browser environment
  - [x] Handle Ollama's REST API format (different from cloud providers)
  - [x] Implement service detection and connection testing
  - [x] Add error handling for when Ollama service is not running

- [x] **002-2:** Implement Ollama-specific methods
  - [x] `initialize()` - Connect to local Ollama service
  - [x] `chat()` - Handle Ollama chat API format
  - [x] `processMemo()` - Adapt memo processing for Ollama
  - [x] `calculateTokens()` - Implement token counting for Ollama models
  - [x] `getAvailableModels()` - Fetch installed models from Ollama

### Phase 2: Factory and Configuration Integration

- [x] **002-3:** Update LLM Provider Factory
  - [x] Add Ollama provider to factory creation method
  - [x] Update `getAvailableProviders()` to include Ollama
  - [x] Add Ollama-specific validation (service availability)
  - [x] Handle model discovery and selection

- [x] **002-4:** Configuration management updates
  - [x] Add Ollama configuration schema (host, port, model)
  - [x] Implement service discovery for Ollama
  - [x] Add configuration validation for local service
  - [x] Handle default Ollama settings (localhost:11434)

### Phase 3: User Interface Integration

- [x] **002-5:** Settings UI for Ollama
  - [x] Add Ollama option to provider selection dropdown
  - [x] Create Ollama-specific configuration panel
  - [x] Add host/port configuration fields
  - [x] Implement model selection dropdown from available models
  - [x] Add service status indicator

- [x] **002-6:** Enhanced connection testing
  - [x] Implement Ollama service connectivity check
  - [x] Add model availability verification
  - [x] Show helpful error messages for common issues
  - [x] Add guidance for installing/starting Ollama

### Phase 4: Error Handling and User Experience

- [x] **002-7:** Robust error handling
  - [x] Handle "Ollama not running" scenarios gracefully
  - [x] Provide clear guidance for setting up Ollama
  - [x] Implement retry logic for intermittent connection issues
  - [x] Add fallback suggestions when Ollama is unavailable

- [x] **002-8:** User guidance and documentation
  - [x] Add Ollama setup instructions to settings
  - [x] Create troubleshooting guide for common issues
  - [x] Add model management guidance
  - [x] Update extension documentation with Ollama setup

### Phase 5: Testing and Validation

- [x] **002-9:** Comprehensive testing
  - [x] Test with various Ollama models
  - [x] Validate memo processing consistency
  - [x] Test chat functionality with local models
  - [x] Verify error handling edge cases
  - [x] Test service discovery and model selection

- [x] **002-10:** Performance optimization
  - [x] Optimize for local model performance characteristics
  - [x] Implement appropriate timeout settings
  - [x] Add progress indicators for longer local processing
  - [x] Optimize token counting for Ollama models

## Technical Requirements

### Ollama API Integration
- Use Ollama's REST API format (different from cloud providers)
- Handle streaming responses if needed
- Support Ollama's model management API
- Implement proper error handling for local service

### Service Discovery
- Detect if Ollama is running on localhost
- Support custom host/port configuration
- Handle service availability checks
- Provide clear user feedback on connection status

### Model Management
- Fetch list of installed models from Ollama
- Handle model downloading (optional)
- Support model switching without restart
- Validate model compatibility

### Security and Privacy
- No API keys required (local service)
- Ensure all data stays local
- Handle CORS for localhost connections
- Validate local service authenticity

## Success Criteria

- [x] Users can select Ollama as a provider from settings
- [x] Extension can detect and connect to local Ollama service
- [x] All core functionality (memo processing, chat) works with Ollama
- [x] Model selection works with user's installed Ollama models
- [x] Clear error messages and guidance when Ollama is not available
- [x] Performance is acceptable for local model processing
- [x] Seamless switching between local and cloud providers

## Files to Create/Modify

### New Files
- `providers/ollama-provider.js`

### Modified Files
- `llm-provider-factory.js` (add Ollama provider)
- `sidepanel.js` (Ollama UI integration)
- `sidepanel.html` (Ollama settings UI)
- `config/provider-config.js` (Ollama configuration)
- `CLAUDE.md` (documentation update)

## Dependencies

- No new external dependencies required
- Leverage existing provider architecture
- Use native fetch API for Ollama communication
- Maintain current extension permissions structure

## Ollama API Reference

### Key Endpoints
- `GET /api/tags` - List installed models
- `POST /api/generate` - Generate response
- `POST /api/chat` - Chat completion
- `GET /api/show` - Show model information

### Default Configuration
- Host: `localhost`
- Port: `11434`
- Base URL: `http://localhost:11434`

## Common Use Cases

### Local Privacy-Focused Usage
- Users who want to keep all data local
- Sensitive content that shouldn't go to cloud APIs
- Offline or air-gapped environments
- Cost-conscious users avoiding API fees

### Development and Testing
- Testing without API usage limits
- Experimenting with different model types
- Custom model fine-tuning
- Development environments

---

# Development Instructions

## Implementation Guidelines

### 1. Ollama Provider Structure

```javascript
// providers/ollama-provider.js
import { LLMProvider } from '../llm-provider-api.js';

export class OllamaProvider extends LLMProvider {
    constructor(config = {}) {
        super(config);
        this.host = config.host || 'localhost';
        this.port = config.port || 11434;
        this.baseUrl = `http://${this.host}:${this.port}`;
        this.model = config.model || 'llama2';
        this.availableModels = [];
    }

    async initialize() {
        // Test connection to Ollama service
        try {
            await this.testConnection();
            await this.loadAvailableModels();
            this.initialized = true;
            return true;
        } catch (error) {
            throw new Error(`Failed to connect to Ollama: ${error.message}`);
        }
    }

    async testConnection() {
        const response = await fetch(`${this.baseUrl}/api/tags`);
        if (!response.ok) {
            throw new Error('Ollama service not available');
        }
        return true;
    }

    async loadAvailableModels() {
        const response = await fetch(`${this.baseUrl}/api/tags`);
        const data = await response.json();
        this.availableModels = data.models || [];
    }

    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }

        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama chat failed: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.message.content,
            usage: {
                prompt_tokens: data.prompt_eval_count || 0,
                completion_tokens: data.eval_count || 0,
                total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
            }
        };
    }

    async processMemo(content, options = {}) {
        const systemPrompt = `You are a helpful AI assistant. Process the following webpage content and extract:
1. A concise title
2. A brief summary
3. A narrative description
4. Any structured data (if applicable)
5. Suggested tags

Please respond in JSON format with these fields: title, summary, narrative, structured_data, suggested_tags.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: content }
        ];

        return await this.chat(messages, options);
    }

    calculateTokens(text) {
        // Rough token estimate for Ollama models
        return Math.ceil(text.length / 4);
    }

    getAvailableModels() {
        return this.availableModels;
    }
}
```

### 2. Factory Integration

```javascript
// Update llm-provider-factory.js
import { OllamaProvider } from './providers/ollama-provider.js';

export class LLMProviderFactory {
    static createProvider(type, config) {
        switch (type) {
            case 'anthropic':
                return new AnthropicProvider(config);
            case 'openai':
                return new OpenAIProvider(config);
            case 'gemini':
                return new GeminiProvider(config);
            case 'ollama':
                return new OllamaProvider(config);
            default:
                throw new Error(`Provider type '${type}' not implemented yet`);
        }
    }

    static getAvailableProviders() {
        return [
            // ... existing providers ...
            {
                id: 'ollama',
                name: 'Ollama (Local)',
                description: 'Local LLM runner - privacy-focused',
                requiresApiKey: false,
                requiresService: true,
                models: [], // Will be populated dynamically
                isLocal: true
            }
        ];
    }

    static validateConfig(type, config) {
        switch (type) {
            // ... existing cases ...
            case 'ollama':
                // Validate host/port configuration
                if (config.host && !this.isValidHost(config.host)) {
                    throw new Error('Invalid host configuration');
                }
                if (config.port && (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)) {
                    throw new Error('Invalid port configuration');
                }
                break;
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }

    static isValidHost(host) {
        // Simple validation for localhost, IP addresses, or hostnames
        return /^(localhost|127\.0\.0\.1|::1|[\w.-]+)$/.test(host);
    }
}
```

### 3. UI Integration

```html
<!-- Add to sidepanel.html -->
<div id="ollama-config" class="provider-config hidden">
    <div class="provider-info">
        <h4>Ollama (Local LLM)</h4>
        <p>Run AI models locally on your machine for privacy and offline use.</p>
    </div>
    
    <div class="setting-group">
        <label for="ollama-host">Host:</label>
        <input type="text" id="ollama-host" placeholder="localhost" value="localhost">
    </div>
    
    <div class="setting-group">
        <label for="ollama-port">Port:</label>
        <input type="number" id="ollama-port" placeholder="11434" value="11434">
    </div>
    
    <div class="setting-group">
        <label for="ollama-model">Model:</label>
        <select id="ollama-model">
            <option value="">Select model...</option>
        </select>
        <button id="refresh-ollama-models" type="button">Refresh Models</button>
    </div>
    
    <div class="ollama-status">
        <div id="ollama-service-status" class="status-indicator">
            <span class="status-dot"></span>
            <span class="status-text">Checking service...</span>
        </div>
    </div>
    
    <div class="ollama-help">
        <details>
            <summary>Need help setting up Ollama?</summary>
            <div class="help-content">
                <p>1. Install Ollama from <a href="https://ollama.ai" target="_blank">https://ollama.ai</a></p>
                <p>2. Start the Ollama service</p>
                <p>3. Download a model: <code>ollama pull llama2</code></p>
                <p>4. Refresh models in this settings panel</p>
            </div>
        </details>
    </div>
</div>
```

### 4. Configuration Management

```javascript
// Add to config/provider-config.js
export class ProviderConfigManager {
    // ... existing methods ...

    async getOllamaConfig() {
        const result = await chrome.storage.local.get(['ollamaConfig']);
        return result.ollamaConfig || {
            host: 'localhost',
            port: 11434,
            model: '',
            enabled: false
        };
    }

    async saveOllamaConfig(config) {
        await chrome.storage.local.set({
            ollamaConfig: {
                host: config.host || 'localhost',
                port: config.port || 11434,
                model: config.model || '',
                enabled: config.enabled || false,
                lastUpdated: Date.now()
            }
        });
    }

    async testOllamaConnection(config) {
        try {
            const baseUrl = `http://${config.host}:${config.port}`;
            const response = await fetch(`${baseUrl}/api/tags`);
            
            if (!response.ok) {
                throw new Error('Service not available');
            }
            
            const data = await response.json();
            return {
                success: true,
                models: data.models || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
```

## Development Workflow

### Phase 1 Priority (Most Important First)

1. **Start with 002-1**: Create Ollama provider class
   - Implement basic connection and service detection
   - Test with a simple Ollama installation

2. **Then 002-2**: Implement core methods
   - Focus on chat functionality first
   - Ensure memo processing works consistently

3. **Then 002-3**: Factory integration
   - Add Ollama to the provider factory
   - Test provider switching

### Key Implementation Notes

#### Error Handling Strategy
- Clear messaging when Ollama is not running
- Helpful guidance for setting up Ollama
- Graceful degradation when service is unavailable

#### Local Service Considerations
- Handle localhost CORS issues
- Implement service discovery
- Support custom host/port configurations
- Provide clear status indicators

#### Model Management
- Dynamic model loading from Ollama
- Handle model availability changes
- Support for different model types

## Common Pitfalls to Avoid

1. **CORS Issues**: Ensure localhost requests work properly
2. **Service Discovery**: Don't assume Ollama is always running
3. **Model Availability**: Handle cases where models aren't installed
4. **Performance**: Local models may be slower than cloud APIs
5. **User Guidance**: Provide clear setup instructions

## Testing Checklist

- [ ] Provider can detect Ollama service
- [ ] Model selection works with installed models
- [ ] Memo processing works with local models
- [ ] Chat functionality works consistently
- [ ] Error handling is user-friendly
- [ ] Configuration persists correctly
- [ ] Service status updates properly
- [ ] Performance is acceptable

## Integration with Existing Architecture

This task leverages the existing provider architecture without requiring changes to:
- Core memo processing logic
- Chat interface components
- Storage management
- Tag system
- UI routing

The Ollama provider should integrate seamlessly with the existing multi-provider system, allowing users to switch between cloud and local providers as needed.