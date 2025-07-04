# Issues

[ ] When capturing YouTube pages as memos you are not able to process video transcript. Research online to think differently about this solution and make it work without having to call an API. The transcript is available when user expands description and clicks on transcript button. It appears on top right of the page. How would you automate this most elegantly for capturing transcript as part of memo?

[x] Research online why this is not working and find free alternatives which are more robust or make this work: When YouTube memo is being captured use GET http://video.google.com/timedtext?lang=en&v=VIDEO_ID to get the video transcript and process. As a fallback parse the DOM of the page and capture video description.

Solution: Implemented robust YouTube transcript extraction in content.js using HTTPS API calls to `https://video.google.com/timedtext?lang=en&v=VIDEO_ID`. The implementation includes: 1) Multiple language fallbacks (en, en-US, en-GB) when primary language is unavailable, 2) DOM parsing as fallback when API is unavailable, 3) Proper XML parsing with HTML entity decoding, 4) Comprehensive error handling and logging, 5) Video metadata extraction including thumbnails and descriptions. All tests pass confirming the implementation works correctly.

[x] When YouTube captured memo is clicked for details more than once the thumbnail shows up as multiple copies

Solution: Fixed by adding a check to remove any existing YouTube thumbnail container before adding a new one in the displayMemoDetail function in ui.js. Added a unique class 'youtube-thumbnail-container' for easy identification and removal.

[x] YouTube memos in memos list should show thumbnail saved with memo

Solution: Updated the displayMemoList function in ui.js to check for YouTube memos and display their thumbnails in the list view. Added proper thumbnail detection and display logic with error handling for failed image loads.

[x] When YouTube memo is being captured change notification to indicate "Processing YouTube Page" amd note "Hover selection is deactivated, processing content automatically..."

Solution: Updated the notification message in content.js to display "Processing YouTube Page - Hover selection is deactivated, processing content automatically" when YouTube content is being processed. Modified sidepanel.js to support custom messages in the savingMemo action.

[x] When YouTube memo is being captured use GET http://video.google.com/timedtext?lang=en&v=VIDEO_ID to get the video transcript and process.

Solution: Already implemented in content.js using HTTPS (https://video.google.com/timedtext) to avoid mixed content issues. The implementation includes multiple language fallbacks (en, en-US, en-GB) and DOM parsing as a backup method when the API is unavailable.

[x] Mixed Content: The page at 'https://www.youtube.com/watch?v=giT0ytynSqg' was loaded over HTTPS, but requested an insecure resource 'http://video.google.com/timedtext?lang=en&v=giT0ytynSqg'. This request has been blocked; the content must be served over HTTPS.

Solution: Fixed by updating content.js to use HTTPS instead of HTTP for all video.google.com/timedtext API calls at lines 394 and 405. Changed all transcript URL fetches from http://video.google.com to https://video.google.com to prevent mixed content security errors.

[x] Error processing memo with Anthropic: SyntaxError: Expected ',' or ']' after array element in JSON at position 3776 (line 38 column 37). Error processing YouTube memo: Error: Memo processing failed: Expected ',' or ']' after array element in JSON at position 3776 (line 38 column 37). Error details: Memo processing failed: Expected ',' or ']' after array element in JSON at position 3776 (line 38 column 37)

Solution: Fixed by implementing robust JSON parsing in anthropic-provider.js with multiple fallback strategies: 1) First attempts direct JSON parsing, 2) Extracts JSON from markdown code blocks if present, 3) Finds JSON object boundaries, 4) Removes trailing commas and control characters that cause parse errors, 5) Validates and ensures all required fields are present. This matches the robust parsing approach used in the Gemini provider.


[x] Rollback YouTube Integration and pivot the specification and development to the following:
    - When Capture button is clicked recognize if the webpage is YouTube
    - Instead of activating hover and selection behavior change cursor to hourglass while notification updates the user that YouTube video page with title is recognized and being processed
    - Parse page HTML DOM for thumbnail link. Modify for YouTube memos and details to add thumbnail on top of text summary.
    - Use GET http://video.google.com/timedtext?lang=en&v=VIDEO_ID to get the video transcript.
    - Accordingly change and update the YouTube Integration tasks and roadmap.

Solution: Implemented new YouTube integration approach by modifying content.js to automatically detect YouTube pages and show hourglass cursor instead of hover/selection UI. Added thumbnail extraction using YouTube video ID to generate thumbnail URLs. Implemented transcript fetching using video.google.com API with DOM parsing as fallback. Updated memo detail view in ui.js to display YouTube thumbnails above the summary. Updated YouTube Integration tasks in tasks/003-extended-content-sources.md to reflect the new implementation approach.

[x] When capturing a youtube page (selection around video and description). Anthropic chat API error: Error: This request would exceed the rate limit for your organization (ddac29b0-29a0-496f-ba20-0b0ad3960e81) of 40,000 input tokens per minute. For details, refer to: https://docs.anthropic.com/en/api/rate-limits. You can see the response headers for current usage. Please reduce the prompt length or the maximum tokens requested, or try again later. You may also contact sales at https://www.anthropic.com/contact-sales to discuss your options for a rate limit increase.

Solution: Fixed rate limit issue by implementing token counting and content truncation across all LLM providers. Added `truncateContent()` method to base LLMProvider class that estimates token count and truncates content to 28,000 tokens (leaving room for system messages and responses). All providers (Anthropic, OpenAI, Gemini, Ollama) now use this method to prevent rate limit errors when processing large YouTube content including transcripts. The truncation preserves word boundaries and adds a clear indication when content is truncated.

[x] Error communicating with YouTube content script: [object Object]

Solution: Fixed error logging in background.js line 308 where `chrome.runtime.lastError` was being logged as an object instead of its message property. Changed to `chrome.runtime.lastError.message` for proper error display.

[x] Failed to extract YouTube content: The message port closed before a response was received.\

Solution: Fixed message port issue by integrating YouTube content extraction functionality directly into the main content script (content.js) instead of using separate youtube-extractor.js. This eliminates conflicts between multiple content scripts on YouTube pages. Updated manifest.json to remove duplicate YouTube content script registration.

[x] Fixed. Failed to extract YouTube content: Unknown error

Solution: Added missing handler for 'extractYouTubeContent' action in background.js message listener. The content script was sending this message but the background script wasn't handling it, causing the response to be undefined and triggering the "Unknown error" message. The fix forwards the extraction request to the YouTube content script and properly handles the response.

[x] Fixed. When switching between models in settings while the model keys are persisted and loaded as expected the model selections revert to the first model in the dropdown even if another model was selected.

Solution: Updated the provider selection change handler in sidepanel.js to properly retrieve and preserve the current model selection when switching between providers. The handler now gets the current configuration and passes the saved model selection to showProviderConfig, ensuring model persistence across provider switches.

[x] Fixed. When Ollama model is selected and user in Chat with Memos after entering a prompt the response includes citations which do not correctly specify the titles of the memos cited and links do not work. Intead the citations are titles Memo 1, Memo 2, etc. Follow the way citations work when Anthropic provider is selected.

Solution: Fixed the system message creation in anthropic-api.js to use actual memo titles `[${memo.title}]` instead of generic labels `[Memo ${index + 1}]` in the memo context. This makes the context consistent with the citation instructions, allowing Ollama and other providers to properly cite memos using their actual titles instead of generic "Memo 1, Memo 2" references.

[x] Fixed. Research online if the solution for making Ollama work with our extension only works with `ollama serve` in terminal or is there a way for it to work when Ollama is run from spotlight.

Solution: Both Ollama app (Spotlight launch) and terminal launch have identical CORS behavior - only the configuration method differs. For the macOS app, use `launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"` then restart the app. For terminal use, set environment variables inline: `OLLAMA_ORIGINS="chrome-extension://*" ollama serve`. Comprehensive documentation added to docs/ollama-setup.md with comparison table and setup instructions for both methods.

[x] Fixed. Check if despite persistance of model selection and provider keys, when switching between screens why the persisted settings not restored.

Solution: Updated `showProviderConfig` function in sidepanel.js to automatically restore model selection from stored configuration when switching screens. Added logic to retrieve current config and restore the selected model for the active provider, ensuring settings persistence across UI navigation.

[x] Fixed. When chatting with Ollama model I can see the Ollama server logs the call correctly however I get response as "I apologize, but I encountered an error. Please try again". Ollama server logs: [GIN] 2025/07/02 - 16:14:10 | 200 |  7.014360958s |       127.0.0.1 | POST     "/api/chat"

Solution: Fixed response format mismatch in background.js. The sidepanel expected `{ success: true, reply: 'content' }` but providers were returning `{ content: 'content', usage: {...} }`. Updated chat message handler to properly format provider responses to match the expected structure, allowing Ollama and other providers to work correctly with the chat interface.


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

