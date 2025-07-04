import { showStatus } from './status.js';
import { saveToStorage, showDeleteConfirmation } from './storage.js';
import { updateTagCounts } from './tags.js';
import { LLMProviderFactory } from './llm-provider-factory.js';

// Count words in text and HTML
export function countWords(html) {
    if (!html) return 0;
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Get text content and count words
    const text = temp.textContent || temp.innerText || '';
    const words = text.trim()
        .replace(/[\r\n\t]+/g, ' ')     // Replace newlines and tabs with spaces
        .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
        .split(' ')
        .filter(word => word.length > 0);
    
    // Count HTML tags (excluding empty/self-closing tags)
    const tagMatches = html.match(/<\/?[a-z][^>]*>/gi) || [];
    const tagCount = tagMatches.filter(tag => !tag.match(/<[^>]+\/>/)).length;
    
    console.log('Word count details:', {
        text: text.substring(0, 100) + '...',  // Log first 100 chars
        wordCount: words.length,
        tagCount,
        totalCount: words.length + tagCount
    });
    
    return words.length + tagCount;
}

// Format count
export function formatCount(count, type = 'words') {
    if (type === 'keys') {
        return count === 1 ? '1 key' : `${count} keys`;
    }
    const formattedCount = count.toLocaleString();  // Add thousands separators
    return count === 1 ? '1 word' : `${formattedCount} words`;
}

// Get tag color and icon
export async function getTagStyle(tagName) {
    const defaultStyle = {
        color: 'gray',
        icon: '<path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />'
    };

    if (tagName === 'Untagged') {
        return defaultStyle;
    }

    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    const tag = tags.find(t => t.name === tagName);
    return tag || defaultStyle;
}

// Display memo list
export async function displayMemoList(memos) {
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    console.log('displayMemoList tags:', tags);
    
    const memoListView = document.getElementById('memoListView');
    
    // Keep the title and add a container for memo items
    const titleHtml = `
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-lg font-semibold text-gray-800">Memos</h2>
        </div>
    `;
    const memoItemsContainer = document.createElement('div');
    memoItemsContainer.className = 'space-y-4';
    
    memoListView.innerHTML = titleHtml;
    memoListView.appendChild(memoItemsContainer);
    
    for (const memo of memos) {
        const tagStyle = await getTagStyle(memo.tag || 'Untagged');
        console.log('displayMemoList memo.tag || Untagged:', memo.tag || 'Untagged');
        const memoItem = document.createElement('div');
        memoItem.className = 'memo-list-item bg-white rounded-lg shadow p-4 cursor-pointer relative';
        
        // Check if this is a YouTube memo with a thumbnail
        const isYouTubeMemo = memo.platform === 'youtube' || 
            (memo.structuredData && memo.structuredData.platform === 'youtube') ||
            (memo.structuredData && memo.structuredData.videoMetadata && memo.structuredData.videoMetadata.thumbnail);
        const thumbnail = memo.structuredData?.videoMetadata?.thumbnail;
        
        memoItem.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <img src="${memo.favicon}" class="w-4 h-4 mr-2" alt="">
                    <h3 class="font-semibold text-gray-800">${memo.title}</h3>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-xs px-2 py-1 rounded-full bg-${tagStyle.color}-100 text-${tagStyle.color}-700">
                        ${memo.tag || 'Untagged'}
                    </span>
                    <button class="delete-memo text-gray-400 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            ${isYouTubeMemo && thumbnail ? `
                <div class="mb-2">
                    <img src="${thumbnail}" 
                         alt="${memo.title}" 
                         class="w-full rounded-md shadow-sm"
                         onerror="this.onerror=null; this.style.display='none'">
                </div>
            ` : ''}
            ${(!isYouTubeMemo && memo.structuredData?.dominantImage) ? `
                <div class="mb-2">
                    <img src="${memo.structuredData.dominantImage.src}" 
                         alt="${memo.structuredData.dominantImage.alt}" 
                         class="w-full rounded-md shadow-sm"
                         style="max-height: 200px; object-fit: contain;"
                         onerror="this.onerror=null; this.style.display='none'">
                </div>
            ` : ''}
            <p class="text-[0.6rem] leading-[0.9rem] text-gray-600 mb-2">${memo.summary}</p>
            <div class="text-xs text-gray-500">
                ${new Date(memo.timestamp).toLocaleString()}
            </div>
        `;
        
        // Add click handler for the memo item (excluding delete button)
        memoItem.addEventListener('click', async (e) => {
            if (!e.target.closest('.delete-memo')) {
                // Use global setCurrentMemo if available
                const setCurrentMemo = window.setCurrentMemo || null;
                await displayMemoDetail(memo, tags, setCurrentMemo);
            }
        });
        
        // Add click handler for delete button
        const deleteButton = memoItem.querySelector('.delete-memo');
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = await showDeleteConfirmation('Are you sure you want to delete this memo? This action cannot be undone.');
            if (!confirmed) return;
            
            try {
                const result = await chrome.storage.local.get(['memos']);
                const memos = result.memos || [];
                const updatedMemos = memos.filter(m => m.id !== memo.id);
                
                await saveToStorage('memos', updatedMemos);
                showStatus('delete');
                
                // If in detail view, go back to list
                const memoDetailView = document.getElementById('memoDetailView');
                const memoListView = document.getElementById('memoListView');
                if (memoDetailView.classList.contains('hidden')) {
                    displayMemoList(updatedMemos);
                } else {
                    memoDetailView.classList.add('hidden');
                    memoListView.classList.remove('hidden');
                    displayMemoList(updatedMemos);
                }
            } catch (error) {
                console.error('Failed to delete memo:', error);
                showStatus('error', 'Could not delete memo');
            }
        });
        
        memoItemsContainer.appendChild(memoItem);
    }
}

// Display memo detail
export async function displayMemoDetail(memo, tags, setCurrentMemo) {
    let currentMemo = memo;
    
    // If callback provided, update global currentMemo
    if (setCurrentMemo && typeof setCurrentMemo === 'function') {
        setCurrentMemo(memo);
    }
    const tagStyle = await getTagStyle(memo.tag || 'Untagged');
    const memoDetailView = document.getElementById('memoDetailView');
    const memoListView = document.getElementById('memoListView');

    // If tags not provided, fetch them
    if (!tags) {
        const result = await chrome.storage.local.get(['tags']);
        tags = result.tags || [];
    }

    document.getElementById('memoTitle').textContent = memo.title;
    document.getElementById('memoTimestamp').textContent = new Date(memo.timestamp).toLocaleString();
    document.getElementById('memoSource').href = memo.url;
    document.getElementById('memoFavicon').src = memo.favicon;
    
    // Check if this is a YouTube memo and add thumbnail if available
    const memoSummaryElement = document.getElementById('memoSummary');
    
    // Remove any existing thumbnail container first
    const existingThumbnail = document.querySelector('.youtube-thumbnail-container');
    if (existingThumbnail) {
        existingThumbnail.remove();
    }
    
    // Remove any existing dominant image container
    const existingImageContainer = document.querySelector('.dominant-image-container');
    if (existingImageContainer) {
        existingImageContainer.remove();
    }
    
    // Remove any existing transcript button first
    const existingTranscriptBtn = document.querySelector('.youtube-transcript-button');
    if (existingTranscriptBtn) {
        existingTranscriptBtn.remove();
    }
    
    // Remove any existing transcript help text
    const existingHelpText = document.querySelector('.youtube-transcript-help');
    if (existingHelpText) {
        existingHelpText.remove();
    }
    
    if (memo.platform === 'youtube' || 
        (memo.structuredData && memo.structuredData.platform === 'youtube') ||
        (memo.structuredData && memo.structuredData.videoMetadata && memo.structuredData.videoMetadata.thumbnail)) {
        
        const thumbnail = memo.structuredData?.videoMetadata?.thumbnail;
        
        if (thumbnail) {
            // Create thumbnail image element
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'mb-4 youtube-thumbnail-container';
            thumbnailContainer.innerHTML = `
                <img src="${thumbnail}" 
                     alt="${memo.title}" 
                     class="w-full rounded-lg shadow-md"
                     onerror="this.onerror=null; this.src='${memo.structuredData?.videoMetadata?.thumbnailFallbacks?.[0] || memo.favicon}'">
            `;
            
            // Insert thumbnail before summary
            memoSummaryElement.parentNode.insertBefore(thumbnailContainer, memoSummaryElement);
        }
        
        // Add transcript capture button for YouTube memos only if transcript hasn't been added yet
        const hasTranscript = memo.structuredData?.transcriptAdded === true;
        
        if (!hasTranscript) {
            const transcriptButton = document.createElement('button');
            transcriptButton.className = 'youtube-transcript-button mb-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200';
            transcriptButton.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z"/>
                </svg>
                <span>Capture Transcript</span>
            `;
            
            transcriptButton.addEventListener('click', () => {
                captureYouTubeTranscript(memo);
            });
            
            // Create help text for transcript capture
            const helpText = document.createElement('div');
            helpText.className = 'youtube-transcript-help mb-4 text-xs text-gray-600';
            helpText.textContent = 'Expand description. Click Show Transcript. Toggle timestamps off. Select transcript container.';
            
            // Insert transcript button before summary
            memoSummaryElement.parentNode.insertBefore(transcriptButton, memoSummaryElement);
            
            // Insert help text after the button
            memoSummaryElement.parentNode.insertBefore(helpText, memoSummaryElement);
        }
    }
    
    // Check if memo has a dominant image (non-YouTube) and display it
    if (memo.structuredData?.dominantImage && memo.platform !== 'youtube') {
        const dominantImage = memo.structuredData.dominantImage;
        
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'mb-4 dominant-image-container';
        imageContainer.innerHTML = `
            <img src="${dominantImage.src}" 
                 alt="${dominantImage.alt}" 
                 class="w-full max-w-md rounded-lg shadow-md"
                 style="max-height: 400px; object-fit: contain;"
                 onerror="this.style.display='none'">
            ${dominantImage.alt ? `<p class="text-xs text-gray-600 mt-2">${dominantImage.alt}</p>` : ''}
        `;
        
        // Insert image before summary
        memoSummaryElement.parentNode.insertBefore(imageContainer, memoSummaryElement);
        
    }
    
    memoSummaryElement.textContent = memo.summary;

    // Add tag display to metadata section
    const tagDisplay = document.createElement('div');
    tagDisplay.className = 'flex items-center space-x-2 mb-4';
    
    // Create tag selector dropdown styled as a button
    const tagSelector = document.createElement('select');
    tagSelector.className = 'appearance-none bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer text-sm';
    tagSelector.innerHTML = `
        <option value="Untagged" ${memo.tag === 'Untagged' ? 'selected' : ''}>Untagged</option>
        ${tags.map(tag => `
            <option value="${tag.name}" ${memo.tag === tag.name ? 'selected' : ''}>
                ${tag.name}
            </option>
        `).join('')}
    `;

    // Create a styled wrapper for the select
    const selectWrapper = document.createElement('div');
    const wrapperColor = tagStyle.color;
    selectWrapper.className = `relative flex items-center px-3 py-1.5 rounded-full bg-${wrapperColor}-100 text-${wrapperColor}-700 hover:bg-${wrapperColor}-200 transition-colors duration-200`;
    
    // Add icon based on current tag
    selectWrapper.innerHTML = `
        <svg class="w-4 h-4 mr-2 text-${wrapperColor}-500" viewBox="0 0 20 20" fill="currentColor">
            ${tagStyle.icon}
        </svg>
    `;
    
    // Add dropdown icon
    const dropdownIcon = document.createElement('div');
    dropdownIcon.className = `ml-2 text-${wrapperColor}-500`;
    dropdownIcon.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
    `;

    selectWrapper.appendChild(tagSelector);
    selectWrapper.appendChild(dropdownIcon);

    tagDisplay.appendChild(selectWrapper);

    // Handle tag changes
    tagSelector.addEventListener('change', async (e) => {
        const newTag = e.target.value;
        const result = await chrome.storage.local.get(['memos']);
        const memos = result.memos || [];
        const updatedMemos = memos.map(m => {
            if (m.id === memo.id) {
                return { ...m, tag: newTag };
            }
            return m;
        });
        await saveToStorage('memos', updatedMemos);
        currentMemo.tag = newTag;
        
        // Update the wrapper styling
        const newTagStyle = await getTagStyle(newTag);
        const newColor = newTagStyle.color;
        selectWrapper.className = `relative flex items-center px-3 py-1.5 rounded-full bg-${newColor}-100 text-${newColor}-700 hover:bg-${newColor}-200 transition-colors duration-200`;
        selectWrapper.querySelector('svg').setAttribute('class', `w-4 h-4 mr-2 text-${newColor}-500`);
        dropdownIcon.className = `ml-2 text-${newColor}-500`;
        
        // Update UI
        showStatus('success', 'Tag updated');
        updateTagCounts();
        
        // Refresh memo list in background
        displayMemoList(updatedMemos);
    });

    // Remove any existing tag display and add the new one
    const existingTagDisplay = document.querySelector('.memo-tag-display');
    if (existingTagDisplay) {
        existingTagDisplay.remove();
    }
    tagDisplay.classList.add('memo-tag-display');
    const metadataSection = document.querySelector('.bg-gray-50.p-3.rounded-lg.mb-4');
    metadataSection.parentNode.insertBefore(tagDisplay, metadataSection);
    
    // Calculate and display metadata stats
    const sourceWords = countWords(memo.sourceHtml);
    document.getElementById('memoSourceSize').textContent = formatCount(sourceWords);
    
    const narrativeWords = countWords(memo.narrative);
    document.getElementById('memoNarrativeSize').textContent = formatCount(narrativeWords);
    
    let structuredData;
    try {
        structuredData = typeof memo.structuredData === 'string' 
            ? JSON.parse(memo.structuredData) 
            : memo.structuredData;
    } catch (e) {
        structuredData = null;
    }
    
    const keyCount = countJsonKeys(structuredData);
    document.getElementById('memoDataFields').textContent = formatCount(keyCount, 'keys');
    
    const narrativeDiv = document.getElementById('memoNarrative');
    const jsonDiv = document.getElementById('memoJson');
    
    if (memo.narrative) {
        narrativeDiv.innerHTML = memo.narrative;
        narrativeDiv.classList.remove('hidden');
    } else {
        narrativeDiv.classList.add('hidden');
    }
    
    if (memo.structuredData) {
        // Ensure we're working with an object
        const dataToDisplay = typeof memo.structuredData === 'string' 
            ? JSON.parse(memo.structuredData) 
            : memo.structuredData;
        jsonDiv.textContent = JSON.stringify(dataToDisplay, null, 2);
        jsonDiv.classList.remove('hidden');
    } else {
        jsonDiv.classList.add('hidden');
    }
    
    memoListView.classList.add('hidden');
    memoDetailView.classList.remove('hidden');
}

// Delete memo
export async function deleteMemo(memoId) {
    try {
        const confirmed = await showDeleteConfirmation('Are you sure you want to delete this memo? This action cannot be undone.');
        if (!confirmed) return;

        const result = await chrome.storage.local.get(['memos']);
        const memos = result.memos || [];
        const updatedMemos = memos.filter(m => m.id !== memoId);
        
        await saveToStorage('memos', updatedMemos);
        showStatus('delete');
        
        // If in detail view, go back to list
        const memoDetailView = document.getElementById('memoDetailView');
        const memoListView = document.getElementById('memoListView');
        if (memoDetailView.classList.contains('hidden')) {
            displayMemoList(updatedMemos);
        } else {
            memoDetailView.classList.add('hidden');
            memoListView.classList.remove('hidden');
            displayMemoList(updatedMemos);
        }
        
        // Update tag counts
        updateTagCounts();
    } catch (error) {
        console.error('Failed to delete memo:', error);
        showStatus('error', 'Could not delete memo');
    }
}

// Count unique keys in JSON object recursively
export function countJsonKeys(obj) {
    if (!obj) return 0;
    
    const uniqueKeys = new Set();
    
    function traverse(o) {
        if (Array.isArray(o)) {
            o.forEach(item => {
                if (item && typeof item === 'object') {
                    traverse(item);
                }
            });
        } else if (typeof o === 'object') {
            Object.keys(o).forEach(key => {
                uniqueKeys.add(key);
                if (o[key] && typeof o[key] === 'object') {
                    traverse(o[key]);
                }
            });
        }
    }
    
    traverse(obj);
    return uniqueKeys.size;
}

// Capture YouTube transcript for existing memo
async function captureYouTubeTranscript(memo) {
    try {
        // Get the current active tab
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs.length === 0) {
            showStatus('error', 'No active tab found');
            return;
        }
        
        const tab = tabs[0];
        
        // Check if the tab is a YouTube page
        if (!tab.url.includes('youtube.com') && !tab.url.includes('youtu.be')) {
            showStatus('error', 'Please navigate to YouTube to capture transcript');
            return;
        }
        
        showStatus('info', 'Activating transcript capture mode...');
        
        // Send message to content script to initiate transcript capture
        chrome.tabs.sendMessage(tab.id, {
            action: 'captureTranscript',
            memoId: memo.id
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error communicating with content script:', chrome.runtime.lastError);
                showStatus('error', 'Failed to communicate with page');
                return;
            }
            
            if (response && response.success) {
                showStatus('success', 'Transcript capture mode activated');
            } else {
                showStatus('error', response?.error || 'Failed to activate transcript capture');
            }
        });
        
    } catch (error) {
        console.error('Error capturing transcript:', error);
        showStatus('error', 'Failed to capture transcript');
    }
}

 