# Anvam AI Memo

<div align="center">
  
  *Transform your browsing into intelligent knowledge with AI-powered content capture and conversation*
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
  [![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
  
  **Powered by Multiple AI Providers**  
  Anthropic Claude • OpenAI GPT • Google Gemini • Ollama (Local)
  
  [Quick Start](#-quick-start) • [Features](#-features) • [User Guide](#-user-guide) • [Roadmap](#-roadmap)
  
</div>

---

## 🎯 What is Anvam AI Memo?

Anvam AI Memo is a powerful Chrome extension that revolutionizes how you interact with web content. Capture any content from websites, automatically organize it with AI, and have intelligent conversations with your saved knowledge base.

**Key Benefits:**
- 🧠 **AI-Powered Processing**: Multiple LLM providers extract key insights automatically
- 🏷️ **Smart Organization**: AI suggests tags and categories for effortless organization  
- 💬 **Conversational Interface**: Chat with your saved content using natural language
- 🔒 **Privacy-First**: Local storage with optional sync, your data stays under your control
- 🌍 **Multi-Provider Support**: Choose from 4 AI providers including local options

---

## 🚀 Quick Start

### 1️⃣ Install the Extension

```bash
# Clone the repository
git clone https://github.com/yourusername/anvam-ai-memo.git
cd anvam-ai-memo

# Install dependencies and build
npm install
npm run build
```

### 2️⃣ Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select the project directory
4. Pin the extension to your toolbar

### 3️⃣ Choose Your AI Provider

Select from 4 powerful AI providers:

| Provider | Best For | Privacy | Cost | Setup |
|----------|----------|---------|------|-------|
| **🤖 Anthropic Claude** | Complex analysis, reasoning | Cloud | Paid API | [Get API Key](https://console.anthropic.com/) |
| **🧠 OpenAI GPT** | Creative tasks, general use | Cloud | Paid API | [Get API Key](https://platform.openai.com/api-keys) |
| **🎯 Google Gemini** | Fast responses, multimodal | Cloud | Paid API | [Get API Key](https://aistudio.google.com/app/apikey) |
| **🏠 Ollama (Local)** | Privacy, offline use | Local | Free | [Install Ollama](https://ollama.ai) |

### 4️⃣ Start Capturing!

1. Click the Anvam AI Memo icon to open the side panel
2. Navigate to any webpage
3. Click "Capture Content" and select what to save
4. Watch AI automatically process and organize your content
5. Start chatting with your knowledge base!

---

## ✨ Features

### 🎯 Intelligent Content Capture
- **Visual Selection**: Click any element on a webpage to capture it
- **Smart Processing**: AI extracts titles, summaries, and key insights
- **Metadata Preservation**: Saves source URLs, timestamps, and favicons
- **Cross-Site Compatibility**: Works across all websites

### 🏷️ AI-Powered Organization  
- **Smart Tagging**: AI suggests relevant tags automatically
- **70+ Icons**: Extensive icon library for visual organization
- **Custom Categories**: Create your own tags with colors and icons
- **Hierarchical Structure**: Organize content into projects and themes

### 💬 Conversational AI Interface
- **Context-Aware Chat**: Ask questions about your saved content
- **Multi-Provider Support**: Choose the best AI for each task
- **Source Citations**: Responses include links to original content
- **Saved Conversations**: Keep important discussions for later

### 🛡️ Privacy & Security
- **Local-First Storage**: All content stored on your device
- **Optional Sync**: Chrome's secure sync for backup only
- **API Key Security**: Encrypted storage, never transmitted
- **No Tracking**: Zero analytics or data collection

### 🔧 Advanced Capabilities
- **Multi-LLM Support**: Switch between 4 AI providers seamlessly
- **Token Optimization**: Smart processing to stay within limits
- **Export Functionality**: Copy or download your content
- **Offline Support**: Local AI option with Ollama

---

## 📖 User Guide

### Getting Started

#### Initial Setup
1. **Install** the extension following the [Quick Start](#-quick-start) guide
2. **Configure** your preferred AI provider in Settings
3. **Test Connection** to ensure everything works
4. **Start Capturing** content from any website

#### Choosing an AI Provider

**For Privacy & Cost Control:**
- Choose **Ollama** for completely local processing
- No API costs, data never leaves your machine
- Requires installing Ollama locally

**For Best Performance:**
- **Anthropic Claude** for complex analysis and reasoning
- **OpenAI GPT** for creative tasks and general use  
- **Google Gemini** for fast responses and multimodal content

### Content Capture Workflow

<div align="center">

**1. Capture** → **2. Process** → **3. Organize** → **4. Chat**

</div>

#### Step 1: Capture Content
1. Click the extension icon to open the side panel
2. Navigate to any webpage with interesting content
3. Click "Capture Content" button
4. Visual highlighting will activate - click any element to capture
5. Content is immediately saved and queued for processing

#### Step 2: AI Processing  
1. AI automatically analyzes your captured content
2. Extracts title, summary, and key insights
3. Suggests relevant tags for organization
4. Processes structured data (prices, ratings, etc.)

#### Step 3: Organization
1. Review AI-suggested tags or create custom ones
2. Assign colors and icons to tags for visual organization
3. Use the tag system to group related content
4. Filter and browse content by tags

#### Step 4: Conversational Chat
1. Select tags to define conversation context
2. Ask questions about your saved content
3. AI provides answers with source citations
4. Save important conversations for future reference

### Advanced Features

<details>
<summary><b>🔧 Provider Configuration</b></summary>

**Anthropic Claude**
- **Models**: Claude Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5v2, Haiku 3.5
- **Best for**: Deep analysis, technical content, complex reasoning
- **API Key**: Starts with `sk-ant-`

**OpenAI GPT**  
- **Models**: GPT-4o-mini, GPT-4o, GPT-4.1, GPT-4.1-mini
- **Best for**: Creative tasks, code generation, general productivity
- **API Key**: Starts with `sk-`

**Google Gemini**
- **Models**: Gemini 2.5 Pro, Gemini 2.5 Flash  
- **Best for**: Multimodal content, fast responses, Google ecosystem
- **API Key**: Starts with `AIza`

**Ollama (Local)**
- **Models**: Llama 2, Mistral, CodeLlama, and more
- **Best for**: Privacy, offline use, no API costs
- **Setup**: Install from [ollama.ai](https://ollama.ai)

</details>

<details>
<summary><b>🏷️ Tag Management</b></summary>

**Predefined Categories:**
- 📚 Learning & Education  
- 💼 Work & Productivity
- 🛒 Shopping & Reviews
- 📈 Finance & Investment
- 🎮 Entertainment & Gaming
- 🍳 Food & Recipes  
- ✈️ Travel & Places
- And 60+ more categories...

**Custom Tags:**
1. Click "Manage Tags" in settings
2. Create new tag with name, color, and icon
3. Tags automatically appear in capture workflow
4. Organize tags hierarchically

</details>

<details>
<summary><b>💬 Chat Tips</b></summary>

**Effective Queries:**
- "Summarize all my research on [topic]"
- "What are the pros and cons mentioned in my saved reviews?"
- "Find information about [specific detail] in my memos"
- "Compare the different solutions I've saved"

**Using Tag Filters:**
1. Select relevant tags before starting a chat
2. AI will only reference filtered content
3. More focused context = better responses
4. Switch contexts by changing tag selection

**Advanced Features:**
- Toggle between original source and processed content
- Save important conversations
- Export chat history
- View token usage and costs

</details>

### Real-World Use Cases

| Use Case | Workflow | Benefits |
|----------|----------|----------|
| **📈 Investment Research** | Capture earnings reports → Tag by company → Chat for insights | AI synthesizes data across multiple sources |
| **🛒 Smart Shopping** | Save product reviews → Tag by category → Ask for recommendations | Compare products intelligently |
| **📚 Learning & Development** | Capture tutorials → Tag by skill → Chat for explanations | Personal AI tutor with your curated content |
| **📰 News & Content Curation** | Save articles → Tag by topic → Get trend summaries | Stay informed with AI analysis |

---

## 🏗️ Technical Architecture

### Modern Chrome Extension
- **Manifest V3**: Latest Chrome extension architecture
- **Service Worker**: Efficient background processing
- **ES Modules**: Clean, maintainable code structure
- **CSP Compliant**: Secure content handling

### AI Provider Architecture
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Browser UI     │────▶│ Provider     │────▶│ AI Provider │
│  (Side Panel)   │     │ Factory      │     │ (Claude/etc)│  
└─────────────────┘     └──────────────┘     └─────────────┘
         │                      │                     │
         ▼                      ▼                     ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Local Storage  │     │  Config      │     │   Chat &    │
│  (Memos/Tags)   │     │ Management   │     │ Processing  │
└─────────────────┘     └──────────────┘     └─────────────┘
```

### Key Technologies
- **Multi-LLM Integration**: Unified interface for 4 AI providers
- **Browser-Compatible APIs**: Native fetch for all providers  
- **Repository Pattern**: Abstracted data access layer
- **Provider Factory**: Extensible architecture for adding new AI providers
- **Local-First Storage**: Chrome storage APIs with sync backup

---

## 🛣️ Roadmap

### ✅ Recently Completed

**Multi-LLM Integration (2024)**
- ✅ Anthropic Claude provider with latest models
- ✅ OpenAI GPT integration with GPT-4 family
- ✅ Google Gemini support with Pro and Flash models
- ✅ Unified provider interface with seamless switching
- ✅ Provider-specific model selection and configuration

**Local AI Integration (2024)**  
- ✅ Ollama provider for local LLM processing
- ✅ Privacy-focused local AI without cloud dependencies
- ✅ Model discovery and management
- ✅ Offline processing capabilities

**Core Platform (2024)**
- ✅ Chrome Manifest V3 architecture
- ✅ Visual content capture system
- ✅ Tag-based organization with 70+ icons
- ✅ Conversational chat interface
- ✅ Local-first storage with backup

### 🚧 In Development (2025 Q1)

**Enhanced Content Analysis**
- 🔄 Sentiment analysis for captured content
- 🔄 Topic modeling and content clustering  
- 🔄 Smart content summarization and digests
- 🔄 Semantic search within saved content

**Rich Media Support**
- 🔄 PDF processing and analysis
- 🔄 Image content extraction and description
- 🔄 Video transcript capture and processing
- 🔄 Audio content analysis and summarization

### 🎯 Coming Soon (2025 Q2-Q3)

**Extended Content Sources**
- 📋 YouTube video and podcast transcript capture
- 📋 Twitter/X thread processing and organization
- 📋 Social media content aggregation
- 📋 Email and document import capabilities

**Advanced Workflow Automation**  
- 📋 AI agents for task execution based on content
- 📋 Automated content categorization and filing
- 📋 Smart notifications and content recommendations
- 📋 Workflow templates for common use cases

**Collaboration & Sharing**
- 📋 Team workspaces for shared knowledge bases
- 📋 Content sharing and collaboration features
- 📋 Real-time sync across team members
- 📋 Permission management and access control

### 🌟 Future Horizons (2025 Q4+)

**System Integration**
- 📋 Calendar integration for content-based scheduling
- 📋 Task management system integration
- 📋 CRM and productivity tool connections
- 📋 API for third-party integrations

**Advanced AI Capabilities**
- 📋 Multi-modal AI processing (text, image, audio)
- 📋 Advanced reasoning and decision support
- 📋 Predictive content recommendations
- 📋 Custom AI model fine-tuning

**Enterprise Features**
- 📋 SSO and enterprise authentication
- 📋 Advanced security and compliance features
- 📋 Team analytics and usage insights
- 📋 Custom deployment options

---

## 🔧 Development

### Prerequisites
- Node.js 16+
- Chrome Browser (for testing)
- AI Provider API Keys (optional, for testing)

### Local Development
```bash
# Clone and setup
git clone https://github.com/yourusername/anvam-ai-memo.git
cd anvam-ai-memo
npm install

# Build the extension  
npm run build

# Run tests
npm test

# Development build with watch
npm run build --watch
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:syntax      # Syntax validation
npm run test:simple     # Core functionality tests  
npm run test:browser    # Browser-based tests
```

### Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

**Development Process:**
1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Ensure all tests pass
5. Submit a pull request

---

## 📊 Performance & Privacy

### Performance Metrics
- ⚡ **Content Capture**: <2 seconds average processing time
- 📦 **Extension Size**: <2MB with all providers included
- 🔋 **Memory Usage**: Minimal background impact (~10MB)
- 🚀 **AI Response Time**: 2-10 seconds (provider dependent)
- 📊 **Token Optimization**: 4096 tokens max per memo for efficiency

### Privacy & Security
- 🔒 **Local-First**: All content stored on your device by default
- 🔐 **API Key Security**: Encrypted storage, never transmitted or logged
- 📵 **Zero Tracking**: No analytics, telemetry, or user behavior tracking
- 🛡️ **CSP Protection**: Content Security Policy prevents malicious scripts
- 🔄 **Optional Sync**: Chrome's encrypted sync for metadata backup only
- 🏠 **Local AI Option**: Ollama keeps everything on your machine

---

## 🤝 Support & Community

### Getting Help
- 📖 **Documentation**: Comprehensive guides in this README
- 🐛 **Issues**: [Report bugs or request features](https://github.com/yourusername/anvam-ai-memo/issues)
- 💬 **Discussions**: [Community discussions and questions](https://github.com/yourusername/anvam-ai-memo/discussions)
- 📧 **Direct Support**: [Contact us directly](mailto:support@anvam.ai)

### Community
- ⭐ **Star** this repository if you find it useful
- 🍴 **Fork** to contribute or customize for your needs
- 📢 **Share** with others who might benefit
- 🤝 **Contribute** to make it even better

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

This project builds upon the incredible work of:
- **Chrome Extensions Platform** - For providing the foundation
- **AI Provider Teams** - Anthropic, OpenAI, Google, and Ollama for their APIs
- **Open Source Community** - For inspiration and best practices
- **Early Users** - For feedback that shapes our direction

---

<div align="center">
  
  **Ready to transform your browsing experience?**
  
  [Get Started](#-quick-start) • [View Features](#-features) • [See Roadmap](#-roadmap)
  
  *Your intelligent web companion powered by AI*
  
</div>