import { showStatus } from './status.js';

// Load recovery function on initialization
export async function initializeStorageRecovery() {
    try {
        // Attempt to recover provider config if missing
        await recoverProviderConfig();
    } catch (error) {
        console.error('Storage recovery initialization failed:', error);
    }
}

// Save to storage and backup if needed
export async function saveToStorage(key, data) {
    try {
        await chrome.storage.local.set({ [key]: data });
        
        // Create backup for important data
        if (['memos', 'tags', 'savedChats', 'llmConfig'].includes(key)) {
            await backupData();
        }
    } catch (error) {
        console.error('Failed to save to storage:', error);
        showStatus('error', 'Failed to save to storage');
        throw error;
    }
}

// Show delete confirmation dialog
export function showDeleteConfirmation(message) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
                <div class="flex justify-center mb-4">
                    <img src="icons/logo-128.png" alt="Trenddit Memo Logo" class="w-32 h-32">
                </div>
                <h3 class="text-lg font-semibold text-gray-900 text-center">Delete Confirmation</h3>
                <p class="text-sm text-gray-600 text-center">${message}</p>
                <div class="flex justify-center space-x-3 mt-4">
                    <button class="cancel-delete px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                        Cancel
                    </button>
                    <button class="confirm-delete px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200">
                        Delete
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelector('.cancel-delete').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(false);
        });
        
        dialog.querySelector('.confirm-delete').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(true);
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
                resolve(false);
            }
        });
    });
}

// Create minimal backup to sync storage
export async function backupData() {
    try {
        const result = await chrome.storage.local.get(['memos', 'tags', 'savedChats', 'llmConfig']);
        const memos = result.memos || [];
        const tags = result.tags || [];
        const savedChats = result.savedChats || [];
        const llmConfig = result.llmConfig || null;
        
        // Create minimal backup of memos (just essential fields)
        const memosMeta = memos.map(memo => ({
            id: memo.id,
            title: memo.title,
            tag: memo.tag,
            timestamp: memo.timestamp
        }));
        
        // Create minimal backup of chats
        const chatsMeta = savedChats.map(chat => ({
            id: chat.id,
            title: chat.title,
            tag: chat.tag,
            timestamp: chat.timestamp
        }));
        
        // Create minimal backup of provider config (without API keys for security)
        const providerMeta = llmConfig ? {
            type: llmConfig.type,
            model: llmConfig.model,
            host: llmConfig.host, // for Ollama
            port: llmConfig.port, // for Ollama
            lastUpdated: llmConfig.lastUpdated
        } : null;
        
        try {
            // Try to backup everything
            const backupData = {
                memos_meta: memosMeta,
                chats_meta: chatsMeta,
                tags
            };
            
            // Add provider config if it exists
            if (providerMeta) {
                backupData.provider_meta = providerMeta;
            }
            
            await chrome.storage.sync.set(backupData);
        } catch (error) {
            console.warn('Failed to backup all data, trying just tags:', error);
            // If quota exceeded, just backup tags
            await chrome.storage.sync.set({ tags });
        }
    } catch (error) {
        console.error('Failed to create backup:', error);
        showStatus('error', 'Failed to create backup');
    }
}

// Recover provider configuration from sync storage backup
export async function recoverProviderConfig() {
    try {
        const syncResult = await chrome.storage.sync.get(['provider_meta']);
        const localResult = await chrome.storage.local.get(['llmConfig']);
        
        // If local config exists or no backup available, nothing to recover
        if (localResult.llmConfig || !syncResult.provider_meta) {
            return false;
        }
        
        // Restore provider configuration (user will need to re-enter API key)
        const restoredConfig = {
            ...syncResult.provider_meta,
            // Note: API key not restored for security - user must re-enter
            apiKey: null,
            restored: true,
            lastUpdated: Date.now()
        };
        
        await saveToStorage('llmConfig', restoredConfig);
        console.log('Provider configuration recovered from backup');
        showStatus('success', 'Provider settings recovered - please re-enter API key');
        return true;
    } catch (error) {
        console.error('Failed to recover provider config:', error);
        return false;
    }
} 