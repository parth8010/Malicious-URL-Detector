// Background service worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('URL Guardian extension installed');
    
    // Initialize storage
    chrome.storage.local.set({
        stats: { safe: 0, threats: 0, scans: 0 },
        history: []
    });
});

// Listen for tab updates to auto-scan (optional)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Optional: Auto-scan for high-risk domains
        // You can implement this later
    }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getStats') {
        chrome.storage.local.get('stats', (data) => {
            sendResponse(data.stats);
        });
        return true; // Keep message channel open for async response
    }
});