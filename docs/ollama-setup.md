# Ollama Setup for Chrome Extensions

## Problem
Chrome extensions make requests with origin `chrome-extension://[extension-id]` which Ollama blocks by default with a 403 Forbidden error.

## Solution

### Option 1: Set OLLAMA_ORIGINS Environment Variable (Recommended)

1. **Stop any running Ollama instance completely**:
   ```bash
   # Find and stop all Ollama processes
   pkill ollama
   ```

2. **Set the environment variable and start Ollama**:
   
   **macOS/Linux:**
   ```bash
   # In your terminal, run this as a single command:
   OLLAMA_ORIGINS="*" ollama serve
   
   # Or to be more specific:
   OLLAMA_ORIGINS="chrome-extension://*" ollama serve
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set OLLAMA_ORIGINS=*
   ollama serve
   ```
   
   **Windows (PowerShell):**
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ollama serve
   ```

3. **Verify the configuration**:
   - Check the server logs for `OLLAMA_ORIGINS` in the config output
   - It should show `chrome-extension://*` or `*` in the allowed origins list

### Option 2: Use Ollama with Wildcard Origins

If the above doesn't work, try using a wildcard to allow all origins (less secure but works for local development):

```bash
OLLAMA_ORIGINS="*" ollama serve
```

### Option 3: Create a Launch Script

Create a script to always start Ollama with the correct configuration:

**ollama-chrome.sh** (macOS/Linux):
```bash
#!/bin/bash
export OLLAMA_ORIGINS="chrome-extension://*"
ollama serve
```

Make it executable:
```bash
chmod +x ollama-chrome.sh
./ollama-chrome.sh
```

### Troubleshooting

1. **Verify Ollama is accepting the environment variable**:
   - Look for `OLLAMA_ORIGINS` in the server startup logs
   - Should include `chrome-extension://*` in the list

2. **Common issues**:
   - Environment variable not persisting: Use the launch script approach
   - Quotes causing issues: Try without quotes or with single quotes
   - Previous Ollama instance still running: Kill all processes first

3. **Alternative ports**:
   If port 11434 is blocked, you can change it:
   ```bash
   OLLAMA_HOST="127.0.0.1:11435" OLLAMA_ORIGINS="*" ollama serve
   ```

### Testing the Connection

1. Install the Chrome extension
2. Go to Settings and select Ollama as the provider
3. Click "Test Connection"
4. If successful, you should see available models

## macOS App (Spotlight) vs Terminal Launch

### Important: No Functional Difference
The Ollama binary behaves identically whether launched from Spotlight or terminal - only the configuration method differs.

### For macOS App Users (Launched from Spotlight)

When using the Ollama macOS app, you need to configure environment variables differently:

1. **Set environment variable using launchctl**:
   ```bash
   launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"
   ```

2. **Restart the Ollama app**:
   - Quit Ollama from the menu bar
   - Relaunch from Spotlight or Applications

3. **Verify the setting**:
   ```bash
   launchctl getenv OLLAMA_ORIGINS
   ```

**Note:** These settings persist across sessions but may be reset after macOS updates.

### Permanent Configuration for macOS App

Create a LaunchAgent for persistent configuration:

1. **Create plist file**:
   ```bash
   cat > ~/Library/LaunchAgents/com.ollama.environment.plist << EOF
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>Label</key>
     <string>com.ollama.environment</string>
     <key>ProgramArguments</key>
     <array>
       <string>launchctl</string>
       <string>setenv</string>
       <string>OLLAMA_ORIGINS</string>
       <string>chrome-extension://*</string>
     </array>
     <key>RunAtLoad</key>
     <true/>
   </dict>
   </plist>
   EOF
   ```

2. **Load the LaunchAgent**:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.ollama.environment.plist
   ```

3. **Restart Ollama app**

### Terminal vs App Comparison

| Feature | Terminal (`ollama serve`) | macOS App (Spotlight) |
|---------|---------------------------|----------------------|
| CORS Behavior | Same defaults | Same defaults |
| Environment Variables | Inline or shell profile | launchctl or LaunchAgent |
| Configuration Persistence | Session only (unless in profile) | Persists (until updates) |
| Logs Location | Terminal output | Console.app |
| Best For | Development | Production use |

### Security Note

Using `OLLAMA_ORIGINS="*"` allows requests from any origin. For production use, consider:
- Getting your extension's specific ID and using: `OLLAMA_ORIGINS="chrome-extension://your-extension-id"`
- Running Ollama behind a reverse proxy with proper CORS headers