# 🧠 Trenddit Memo

<div align="center">
  
  **Transform your browser into an AI-powered knowledge base**
  
  [![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
  [![Multi-LLM Support](https://img.shields.io/badge/Multi--LLM-Support-7C3AED?style=for-the-badge)](https://github.com/anthropics/claude-code)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
  
  **Choose Your AI**: Claude 🤖 | GPT 🧠 | Gemini 🎯
  
  [🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [📖 User Guide](#-user-guide) • [🗺️ Roadmap](#️-roadmap) • [🤝 Contributing](#-contributing)
  
</div>

---

## 🎯 What is Trenddit Memo?

**Trenddit Memo** is a Chrome extension that transforms how you capture and interact with web content. Unlike traditional bookmarks or note-taking tools, Trenddit uses AI to intelligently process, organize, and make your saved content conversational.

### 🌟 Key Differentiators

- **🚀 Industry-First Multi-LLM Support**: Choose between 3 major AI providers with 12+ models
- **💬 Chat with Your Content**: Have conversations with your saved web pages
- **🏷️ AI-Powered Organization**: Automatic tagging with 70+ predefined categories
- **🔍 Intelligent Citations**: AI responses link back to source content
- **🔒 Privacy-First**: All data stored locally with optional sync

---

## 📸 See It In Action

<div align="center">
  
  ### Capture → Process → Chat
  
  ![Trenddit Memo Demo](images/web-memo-workflow.png)
  
</div>

### Real-World Use Cases

<table>
<tr>
<td width="50%">

**📈 Investment Research**
- Capture earnings reports and analysis
- Chat with your research: "What were the key risks mentioned?"
- AI cites specific memos in responses

</td>
<td width="50%">

**🛒 Smart Shopping**
- Save product reviews and comparisons
- Ask: "Which laptop had the best battery life?"
- Get AI-powered purchase recommendations

</td>
</tr>
<tr>
<td width="50%">

**📚 Learning & Development**
- Capture tutorials and documentation
- Query: "How do I implement authentication?"
- AI synthesizes information from multiple sources

</td>
<td width="50%">

**📰 News & Content Curation**
- Save articles across different topics
- Ask: "What are the main themes this week?"
- Get intelligent summaries with citations

</td>
</tr>
</table>

---

## 🚀 Quick Start

### 1️⃣ Install the Extension

```bash
# Clone the repository
git clone https://github.com/yourusername/trenddit-memo.git
cd trenddit-memo

# Install dependencies
npm install

# Build the extension
npm run build
```

### 2️⃣ Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `trenddit-memo` directory

### 3️⃣ Choose Your AI Provider

<table>
<tr>
<th>Provider</th>
<th>Models Available</th>
<th>Best For</th>
<th>Get API Key</th>
</tr>
<tr>
<td>🤖 <b>Anthropic Claude</b></td>
<td>Claude Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5v2, Haiku 3.5</td>
<td>Complex analysis, reasoning, coding</td>
<td><a href="https://console.anthropic.com/">console.anthropic.com</a></td>
</tr>
<tr>
<td>🧠 <b>OpenAI GPT</b></td>
<td>GPT-4o-mini, GPT-4o, GPT-4.1, GPT-4.1-mini</td>
<td>Creative writing, general tasks</td>
<td><a href="https://platform.openai.com/api-keys">platform.openai.com</a></td>
</tr>
<tr>
<td>🎯 <b>Google Gemini</b></td>
<td>Gemini 2.5 Pro, Gemini 2.5 Flash</td>
<td>Multimodal content, Google ecosystem</td>
<td><a href="https://aistudio.google.com/app/apikey">aistudio.google.com</a></td>
</tr>
</table>

### 4️⃣ Start Capturing!

1. Click the Trenddit icon to open the side panel
2. Navigate to any webpage
3. Click "Capture Content" and select what to save
4. Watch as AI processes and organizes your content

---

## ✨ Features

### 🎨 Intelligent Content Capture
- **Visual Selection**: Highlight any element on a webpage
- **Smart Extraction**: AI extracts titles, summaries, and structured data
- **Rich Media Support**: Capture text, images, and mixed content
- **Cross-Site Compatible**: Works on any website

### 🏷️ AI-Powered Organization
- **70+ Predefined Tags**: From "Research" to "Shopping" to "Learning"
- **Auto-Categorization**: AI suggests the most relevant tags
- **Custom Tags**: Create your own categories with colors and icons
- **Hierarchical Organization**: Nested tags for complex projects

### 💬 Conversational AI Interface
- **Context-Aware Chat**: Filter by tags to focus conversations
- **Source Citations**: Every AI response links to original memos
- **Multi-Turn Conversations**: Build on previous questions
- **Export Chat History**: Save insights for later reference

### 🔄 Sync & Data Management
- **Local-First Storage**: Lightning fast with Chrome storage
- **Optional Cloud Sync**: Access memos across devices
- **Data Export**: Download all content as JSON
- **Backup & Restore**: Never lose your knowledge base

---

## 📖 User Guide

### Basic Workflow

<table>
<tr>
<td width="25%" align="center">
  
  **1. Capture**
  
  Click any element on a webpage to save it
  
</td>
<td width="25%" align="center">
  
  **2. Process**
  
  AI extracts key information and suggests tags
  
</td>
<td width="25%" align="center">
  
  **3. Organize**
  
  Review and adjust tags as needed
  
</td>
<td width="25%" align="center">
  
  **4. Chat**
  
  Have conversations with your saved content
  
</td>
</tr>
</table>

### Advanced Features

<details>
<summary><b>🔧 Provider Configuration</b></summary>

Each AI provider has specific settings you can customize:

**Anthropic Claude**
- Models: Claude Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5v2, Haiku 3.5
- Best for: Deep analysis, technical content, complex reasoning

**OpenAI GPT**
- Models: GPT-4o-mini, GPT-4o, GPT-4.1, GPT-4.1-mini
- Best for: Creative tasks, code generation, general productivity

**Google Gemini**
- Models: Gemini 2.5 Pro, Gemini 2.5 Flash
- Best for: Multimodal content, fast responses, Google ecosystem integration

</details>

<details>
<summary><b>🏷️ Tag Management</b></summary>

**Predefined Categories Include:**
- 📚 Learning & Education
- 💼 Work & Productivity
- 🛒 Shopping & Reviews
- 📈 Finance & Investment
- 🎮 Entertainment & Gaming
- 🍳 Food & Recipes
- ✈️ Travel & Places
- And 60+ more...

**Custom Tags:**
1. Click "Manage Tags" in settings
2. Create new tag with name, color, and icon
3. Tags automatically appear in capture workflow

</details>

<details>
<summary><b>💬 Chat Tips</b></summary>

**Effective Queries:**
- "Summarize all my research on [topic]"
- "What are the pros and cons mentioned in my saved reviews?"
- "Find information about [specific detail] in my memos"

**Using Tag Filters:**
1. Select relevant tags before chatting
2. AI will only reference filtered memos
3. More focused context = better responses

</details>

---

## 🛠️ Technical Details

### Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Content Script │────▶│  Background  │────▶│ AI Provider │
│  (Capture UI)   │     │   Service    │     │   (4 LLMs)  │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                      │                     │
         ▼                      ▼                     ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Side Panel    │     │   Storage    │     │   API Keys  │
│  (Main UI)      │     │ (Local/Sync) │     │  (Secure)   │
└─────────────────┘     └──────────────┘     └─────────────┘
```

### Key Technologies
- **Chrome Manifest V3**: Modern service worker architecture
- **ES Modules**: Clean, maintainable code structure
- **Provider Factory Pattern**: Extensible multi-LLM integration
- **Repository Pattern**: Abstracted data access layer
- **Browser-Compatible APIs**: Native fetch for all providers
- **CSP Compliance**: Secure content handling

---

## 🗺️ Roadmap

### ✅ v1.0 - Multi-LLM Foundation (Complete)
- [x] **Multi-Provider Support**: Anthropic Claude, OpenAI GPT, Google Gemini
- [x] **12+ AI Models**: Full model selection across all providers
- [x] **Intelligent Content Capture**: Visual selection and smart processing
- [x] **70+ Category Tag System**: AI-powered automatic categorization
- [x] **Context-Aware Chat**: Citations and source linking
- [x] **Local-First Storage**: Privacy-focused with optional sync
- [x] **Provider Factory Pattern**: Extensible architecture for new providers
- [x] **Unified Configuration**: Seamless provider switching
- [x] **Connection Testing**: Built-in provider validation

### 🎯 v1.1 - Enhanced Intelligence (Q1 2025)
- [ ] **Ollama Integration**: Local LLM support for maximum privacy
- [ ] **Semantic Search**: Find content by meaning, not just keywords
- [ ] **Smart Summaries**: Daily/weekly digests of captured content
- [ ] **Auto-Linking**: Discover connections between related memos
- [ ] **Bulk Operations**: Process multiple pages simultaneously
- [ ] **Enhanced Content Analysis**: Sentiment analysis and topic modeling

### 🎯 v1.2 - Rich Media & Extended Sources (Q2 2025)
- [ ] **YouTube Integration**: Capture and chat with video transcripts
- [ ] **PDF Import**: Add existing documents to your knowledge base
- [ ] **Image Analysis**: Extract text and understand visual content
- [ ] **Social Media Capture**: Twitter threads, Reddit posts, LinkedIn articles
- [ ] **Advanced Format Support**: Markdown files, code repositories
- [ ] **Rich Media Processing**: Audio, video, and multimedia content

### 🎯 v1.3 - Collaboration & Workflows (Q3 2025)
- [ ] **Shared Collections**: Collaborate on research projects
- [ ] **Team Workspaces**: Multi-user knowledge bases
- [ ] **Task Management**: Convert memos to actionable items
- [ ] **Calendar Integration**: Schedule and set reminders
- [ ] **Data Visualization**: Interactive charts and insights
- [ ] **Content Distribution**: Share via email, SMS, and other channels

### 🔮 Future Vision (2026+)
- **AI Agents**: Automated research and workflow execution
- **Knowledge Graphs**: Visualize content relationships
- **System Integration**: Spreadsheet creation, file management
- **API Access**: Third-party integrations and plugins
- **Mobile Companions**: iOS and Android applications

---

## 🏗️ Architecture & Implementation

### Multi-LLM Provider Architecture

Trenddit Memo implements a sophisticated **Provider Factory Pattern** that enables seamless switching between different AI services:

```javascript
// Unified provider interface
export class LLMProvider {
    async initialize(apiKey) { /* Provider initialization */ }
    async chat(messages, options) { /* Chat implementation */ }
    async processMemo(content, options) { /* Content processing */ }
    calculateTokens(text) { /* Token calculation */ }
}

// Factory for provider creation
const provider = LLMProviderFactory.createProvider('anthropic', config);
await provider.initialize(apiKey);
const response = await provider.chat(messages);
```

### Content Processing Pipeline

1. **Visual Selection**: Interactive element highlighting with real-time feedback
2. **Content Extraction**: Safe DOM traversal and HTML sanitization
3. **AI Processing**: Structured data extraction with provider-specific optimization
4. **Storage & Indexing**: Local-first storage with optional cloud sync
5. **Context Assembly**: Smart context building for chat interactions

### Security-First Design

- **Browser-Compatible Implementation**: No Node.js dependencies, pure browser APIs
- **CSP Compliance**: All scripts and resources follow Content Security Policy
- **API Key Isolation**: Provider-specific secure storage with encryption
- **Input Sanitization**: Comprehensive validation for all user inputs
- **Cross-Origin Safety**: Secure handling of content from any website

### Performance Optimizations

- **Lazy Loading**: Providers loaded on-demand to minimize startup time
- **Service Worker Architecture**: Efficient background processing
- **Token-Aware Processing**: Intelligent content truncation for optimal performance
- **Caching Strategy**: Smart response caching where appropriate
- **Bundle Optimization**: ESBuild with tree-shaking for minimal footprint

---

## 🤝 Contributing

We love contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Guide

```bash
# Fork and clone
git clone https://github.com/yourusername/trenddit-memo.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm install
npm run build

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

### Development Tips
- Follow existing code patterns
- Add tests for new features
- Update documentation
- Check `specs/` folder for detailed requirements

---

## 📊 Performance & Privacy

### Performance Metrics
- ⚡ **Content Capture**: <2 seconds average processing time
- 📦 **Extension Size**: <2MB with all providers
- 🔋 **Memory Usage**: Minimal background impact (~10MB)
- 🚀 **AI Response Time**: 2-10 seconds (provider dependent)
- 🏗️ **Build Time**: <5 seconds with ESBuild
- 📊 **Token Limit**: 4096 tokens per memo for optimal processing

### Privacy & Security
- 🔒 **API Keys**: Encrypted local storage, never transmitted
- 📵 **No Tracking**: Zero analytics or data collection
- 💾 **Local-First**: All content stored on your device
- 🔐 **Optional Sync**: Chrome's secure sync for metadata only
- 🛡️ **CSP Protection**: Content Security Policy enforcement
- 🚫 **No External Dependencies**: All providers use native browser APIs

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Chrome Extensions team for the excellent platform
- All AI provider teams for their powerful APIs
- Open source community for inspiration
- Our users for valuable feedback

---

<div align="center">
  
  **⭐ Star this repo to support the project!**
  
  [Report Bug](https://github.com/yourusername/trenddit-memo/issues) • [Request Feature](https://github.com/yourusername/trenddit-memo/issues) • [Join Discussion](https://github.com/yourusername/trenddit-memo/discussions)
  
  Made with ❤️ by the Trenddit team
  
</div>