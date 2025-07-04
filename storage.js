import { showStatus } from './status.js';

// Load recovery function on initialization
export async function initializeStorageRecovery() {
    try {
        // Attempt to recover provider config if missing
        await recoverProviderConfig();
        // Attempt to recover tags if missing
        await recoverTagsFromBackup();
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
        
        // Create ultra-minimal backup of tags (name and color only)
        const tagsMeta = tags.map(tag => ({
            name: tag.name,
            color: tag.color
        }));
        
        // Create minimal backup of provider config (without API keys for security)
        const providerMeta = llmConfig ? {
            type: llmConfig.type,
            model: llmConfig.model,
            host: llmConfig.host, // for Ollama
            port: llmConfig.port, // for Ollama
            lastUpdated: llmConfig.lastUpdated
        } : null;
        
        let backupSuccessful = false;
        
        try {
            // Try to backup everything with minimal data
            const backupData = {
                memos_meta: memosMeta,
                chats_meta: chatsMeta,
                tags_meta: tagsMeta
            };
            
            // Add provider config if it exists
            if (providerMeta) {
                backupData.provider_meta = providerMeta;
            }
            
            await chrome.storage.sync.set(backupData);
            backupSuccessful = true;
            console.log('Backup succeeded with all minimal data');
        } catch (error) {
            console.warn('Failed to backup all data, trying progressively smaller backups:', error);
            
            // Try different fallback strategies
            const fallbackStrategies = [
                // Strategy 1: Just tags and provider config
                async () => {
                    const data = { tags_meta: tagsMeta };
                    if (providerMeta) data.provider_meta = providerMeta;
                    await chrome.storage.sync.set(data);
                    return 'tags and provider config';
                },
                // Strategy 2: Just tags
                async () => {
                    await chrome.storage.sync.set({ tags_meta: tagsMeta });
                    return 'tags only';
                },
                // Strategy 3: Just provider config
                async () => {
                    if (providerMeta) {
                        await chrome.storage.sync.set({ provider_meta: providerMeta });
                        return 'provider config only';
                    }
                    throw new Error('No provider config to backup');
                },
                // Strategy 4: Split tags into chunks
                async () => {
                    const chunkSize = 5; // Backup tags in chunks of 5
                    const chunks = [];
                    for (let i = 0; i < tagsMeta.length; i += chunkSize) {
                        chunks.push(tagsMeta.slice(i, i + chunkSize));
                    }
                    
                    const chunkData = {};
                    chunks.forEach((chunk, index) => {
                        chunkData[`tags_chunk_${index}`] = chunk;
                    });
                    chunkData.tags_chunk_count = chunks.length;
                    
                    await chrome.storage.sync.set(chunkData);
                    return `tags in ${chunks.length} chunks`;
                }
            ];
            
            for (const strategy of fallbackStrategies) {
                try {
                    const result = await strategy();
                    backupSuccessful = true;
                    console.log(`Backup succeeded with ${result} due to quota limits`);
                    break;
                } catch (fallbackError) {
                    console.warn(`Fallback strategy failed:`, fallbackError);
                    continue;
                }
            }
        }
        
        if (!backupSuccessful) {
            console.error('All backup strategies failed');
            showStatus('error', 'Failed to create backup');
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

// Recover tags from sync storage backup
export async function recoverTagsFromBackup() {
    try {
        const syncResult = await chrome.storage.sync.get(null); // Get all sync storage
        const localResult = await chrome.storage.local.get(['tags']);
        
        // If local tags exist, nothing to recover
        if (localResult.tags && localResult.tags.length > 0) {
            return false;
        }
        
        let recoveredTags = [];
        
        // Check for tags_meta format (new format)
        if (syncResult.tags_meta && Array.isArray(syncResult.tags_meta)) {
            recoveredTags = syncResult.tags_meta;
        }
        // Check for chunked tags format
        else if (syncResult.tags_chunk_count && typeof syncResult.tags_chunk_count === 'number') {
            for (let i = 0; i < syncResult.tags_chunk_count; i++) {
                const chunkKey = `tags_chunk_${i}`;
                if (syncResult[chunkKey] && Array.isArray(syncResult[chunkKey])) {
                    recoveredTags = recoveredTags.concat(syncResult[chunkKey]);
                }
            }
        }
        // Check for old tags format (legacy)
        else if (syncResult.tags && Array.isArray(syncResult.tags)) {
            recoveredTags = syncResult.tags;
        }
        
        if (recoveredTags.length > 0) {
            // Restore basic tag structure (name and color only from backup)
            // The full tag data will be restored when initializeTags() runs
            await saveToStorage('tags', recoveredTags);
            console.log(`Recovered ${recoveredTags.length} tags from backup`);
            showStatus('success', `Recovered ${recoveredTags.length} tags from backup`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Failed to recover tags from backup:', error);
        return false;
    }
} 