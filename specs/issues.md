# Issues

[ ] Research online if the solution for making Ollama work with our extension only works with `ollama serve` in terminal or is there a way for it to work when Ollama is run from spotlight.

[ ] Check if despite persistance of model selection and provider keys, when switching between screens why the persisted settings not restored.

[ ] When chatting with Ollama model I can see the Ollama server logs the call correctly however I get response as "I apologize, but I encountered an error. Please try again". Ollama server logs: [GIN] 2025/07/02 - 16:14:10 | 200 |  7.014360958s |       127.0.0.1 | POST     "/api/chat"


[x] Fixed. Updated Ollama provider's `processMemo` method to match Anthropic's approach exactly - now uses the same system message format, includes available tags for better tag selection, follows the same JSON response format, and uses the same JSON parsing logic. The memo structure and quality are now consistent between providers, with differences only due to underlying LLM capabilities.

[x] Fixed. Made provider configuration manager initialization more robust by initializing it immediately on import rather than waiting for full extension initialization. Added defensive checks throughout the codebase to ensure `providerConfigManager` is always available before use. The configuration now persists properly across extension reloads using the same Chrome storage mechanism as memos, with automatic backup to sync storage and recovery capabilities.

[x] Fixed. The issue was using OLLAMA_ORIGIN instead of OLLAMA_ORIGINS (note the plural). Updated error messages in Ollama provider to clearly indicate the correct environment variable name (OLLAMA_ORIGINS), provide proper setup instructions including stopping all processes first, and reference the detailed setup documentation in docs/ollama-setup.md. Error processing memo: Error: Memo processing failed: Ollama chat error: Ollama CORS Error (403): Chrome extension requests are blocked.

[x] Setup export OLLAMA_ORIGIN="chrome-extension://*" but still getting the same error: Error processing memo: Error: Memo processing failed: Ollama chat error: Ollama CORS Error (403): Chrome extension requests are blocked... Research online for a solution.

Solution: The issue occurs because OLLAMA_ORIGIN environment variable isn't being recognized. Fixed by:
1. Creating comprehensive setup documentation in docs/ollama-setup.md
2. The correct environment variable is OLLAMA_ORIGINS (plural) not OLLAMA_ORIGIN
3. Recommended approach: `OLLAMA_ORIGINS="*" ollama serve` or `OLLAMA_ORIGINS="chrome-extension://*" ollama serve`
4. Must completely stop any running Ollama processes before setting the environment variable
5. Alternative solutions provided including launch scripts and wildcard origins

ollama serve       
time=2025-07-02T12:22:50.436-07:00 level=INFO source=routes.go:1235 msg="server config" env="map[HTTPS_PROXY: HTTP_PROXY: NO_PROXY: OLLAMA_CONTEXT_LENGTH:4096 OLLAMA_DEBUG:INFO OLLAMA_FLASH_ATTENTION:false OLLAMA_GPU_OVERHEAD:0 OLLAMA_HOST:http://127.0.0.1:11434 OLLAMA_KEEP_ALIVE:5m0s OLLAMA_KV_CACHE_TYPE: OLLAMA_LLM_LIBRARY: OLLAMA_LOAD_TIMEOUT:5m0s OLLAMA_MAX_LOADED_MODELS:0 OLLAMA_MAX_QUEUE:512 OLLAMA_MODELS:/Users/manavsehgal/.ollama/models OLLAMA_MULTIUSER_CACHE:false OLLAMA_NEW_ENGINE:false OLLAMA_NOHISTORY:false OLLAMA_NOPRUNE:false OLLAMA_NUM_PARALLEL:0 OLLAMA_ORIGINS:[http://localhost https://localhost http://localhost:* https://localhost:* http://127.0.0.1 https://127.0.0.1 http://127.0.0.1:* https://127.0.0.1:* http://0.0.0.0 https://0.0.0.0 http://0.0.0.0:* https://0.0.0.0:* app://* file://* tauri://* vscode-webview://* vscode-file://*] OLLAMA_SCHED_SPREAD:false http_proxy: https_proxy: no_proxy:]"
time=2025-07-02T12:22:50.441-07:00 level=INFO source=images.go:476 msg="total blobs: 71"
time=2025-07-02T12:22:50.441-07:00 level=INFO source=images.go:483 msg="total unused blobs removed: 0"
time=2025-07-02T12:22:50.442-07:00 level=INFO source=routes.go:1288 msg="Listening on 127.0.0.1:11434 (version 0.9.3)"
time=2025-07-02T12:22:50.472-07:00 level=INFO source=types.go:130 msg="inference compute" id=0 library=metal variant="" compute="" driver=0.0 name="" total="27.0 GiB" available="27.0 GiB"
[GIN] 2025/07/02 - 12:23:31 | 200 |    7.817292ms |       127.0.0.1 | GET      "/api/tags"
[GIN] 2025/07/02 - 12:23:31 | 200 |    3.179583ms |       127.0.0.1 | GET      "/api/tags"
[GIN] 2025/07/02 - 12:23:35 | 200 |    6.977167ms |       127.0.0.1 | GET      "/api/tags"
[GIN] 2025/07/02 - 12:23:35 | 200 |    6.302125ms |       127.0.0.1 | GET      "/api/tags"
[GIN] 2025/07/02 - 12:23:44 | 403 |      34.167µs |       127.0.0.1 | POST     "/api/chat"


[x] Review how this was handled for Anthropic Model API, this may give you ideas to solve it for Ollama Model API. Error processing memo: Error: Memo processing failed: Ollama chat error: Ollama CORS Error (403): Please configure Ollama to accept Chrome extension requests by setting: OLLAMA_ORIGIN=chrome-extension://* environment variable and restart Ollama service


[x] Fixed. Provider configuration manager now initializes properly in initializeExtension() function, ensuring keys and model selections persist on extension reload.

[x] Fixed. Added proper CORS error handling for Ollama 403 Forbidden errors with clear instructions to set OLLAMA_ORIGIN=chrome-extension://* environment variable. Updated manifest.json to remove port numbers from localhost permissions for better compatibility.

[x] Provider keys and model selections should persist in same way as memos persist between different reloads/sessions of the extension

[x] When Ollama is selected. Capture memo action leads to this error: Error processing memo: Error: Memo processing failed: Ollama chat error: Ollama chat failed: 403 Forbidden

[x] When Ollama is selected. Capture action does not start LLM processing. Get this error: Error processing memo: Error: Provider not initialized.


[x] When Ollama is selected and content is captured the memo is not saved.

[x] Repeat issue, not fixed. Research online to find a solution. Uncaught ReferenceError: initializeOllamaEventListeners is not defined. Context: sidepanel.html. Line 347: initializeOllamaEventListeners();

[x] This is still not fixed. Add browser developer console debug messages for helping fix his. Test the Ollama API connection. Research online about access localhost Ollama REST API using Chrome browser extension. Repeating Error: When Ollama provider is selected the models drop down does not list installed models. Refresh Models link does not do anything. There is a constant message belore models dropdown "Checking service..."

[x] Review the tests in the project and configure the test runner correctly

[x] When I stat Chat with Memos and enter first prompt, sometimes I get the response "I apologize, but I encountered an error. Please try again". Second turn results in response from LLM as expected.

[x] Connection test failed: Google AI API authentication failed: Gemini connection test failed: Gemini response blocked: MAX_TOKENS


[x] When loading the extension first time or clicking Capture after saving settings for any model provider I see - Error checking provider configuration: ReferenceError: providerConfigManager is not defined

[x] When I save Gemini key I get this error however the capture memo works with model provider selected as Gemini: Failed to initialize provider: Error: Google AI API authentication failed: Gemini connection test failed: No response generated by Gemini


[x] Once settings for model selection is saved for a model which is not first on the dropdown list, going back to settings screen resets the dropdown to first model on the list instead of persisting the selection saved earlier. 

[x] Anthropic key is not persisted when going to settings screen after providing it in the sidepanel loading modal.

[x] Remove the Title "Anvam AI Memo" and model provider indicator from toolbar. Instead provide only model provider just below the toolbar right aligned using text like - Using Gemini.

[x] On loading the sidepanel for first time and setting Anthropic key, the model provider shows "no provider configured"

[x] Test connection on OpenAI settings gives error - Connection test failed: OpenAI API authentication failed: OpenAI connection test failed: Provider not initialized. Call initialize() first.

[x] Update OpenAI models selection using https://platform.openai.com/docs/models and use o4-mini, gpt-4o, gpt-4.1, gpt-4.1-mini


[x] When testing Genini connection I get error - Connection test failed: Google AI API authentication failed: Gemini connection test failed: Provider not initialized. Call initialize() first.


[x] Next to the title "Trenddit Memo" provide a tiny font model provider indicator like (using Gemini)

[x] Test connection returns really fast. Are you actually testing an LLM call for testing connection?


[x] When selecting Gemini model and capturing memo I see processing notification but saved memo does not show up. I get Error processing memo: Error: Failed to parse Gemini response as JSON.

[x] When I select Settings, then select Memos, I still see settings screen below Memos screen. It hides when I click on any other menu like tags and come back to memos.

[x] Error processing memo: Error: Unrecognized request arguments supplied: tags, url



[x] For Gemini models use https://ai.google.dev/gemini-api/docs/models and provide options for Gemini 2.5 Pro and Gemini 2.5 Flash

[x] For Anthropic models use https://docs.anthropic.com/en/docs/about-claude/models/overview and provide options for Claude Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5v2, and Haiku 3.5

[x] Uncaught SyntaxError: Unexpected reserved word
Context: sidepanel.html

Partial stacktrace
```
// Initialize provider configuration manager
    const providerConfigManager = new ProviderConfigManager();

        // Initialize provider settings
257:    await initializeProviderSettings();

    async function initializeProviderSettings() {
```

[x] Service worker registration failed. Status code: 15


[x] I am not able to choose my AI provider. I only get an option to add Anthropic key like prior feature release
[x] Settings screen only shows Anthropic key

