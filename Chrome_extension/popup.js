// popup.js - Complete Chrome Extension JavaScript
// DOM Elements
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const currentUrlEl = document.getElementById('currentUrl');
const manualUrlEl = document.getElementById('manualUrl');
const scanCurrentBtn = document.getElementById('scanCurrentBtn');
const scanManualBtn = document.getElementById('scanManualBtn');
const backBtn = document.getElementById('backBtn');
const rescanBtn = document.getElementById('rescanBtn');
const recentList = document.getElementById('recentList');
const scannedUrlText = document.getElementById('scannedUrlText');

// Results elements
const statusIndicator = document.getElementById('statusIndicator');
const modelBadge = document.getElementById('modelBadge');
const googleBadge = document.getElementById('googleBadge');
const virusBadge = document.getElementById('virusBadge');
const whoisBadge = document.getElementById('whoisBadge');
const modelDetails = document.getElementById('modelDetails');
const googleDetails = document.getElementById('googleDetails');
const virusDetails = document.getElementById('virusDetails');
const whoisDetails = document.getElementById('whoisDetails');
const confidenceScore = document.getElementById('confidenceScore');
const verdictIcon = document.getElementById('verdictIcon');
const verdictTitle = document.getElementById('verdictTitle');
const verdictDesc = document.getElementById('verdictDesc');
const blockBtn = document.getElementById('blockBtn');
const reportBtn = document.getElementById('reportBtn');

// State
let currentTabUrl = '';
let recentScans = JSON.parse(localStorage.getItem('recentScans') || '[]');
let isScanning = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing extension...');
    loadCurrentTabUrl();
    loadRecentScans();
    setupEventListeners();
    testApiConnection();
});

// Test API connection
async function testApiConnection() {
    try {
        const response = await fetch('http://localhost:5000/health', {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Connected:', data);
            return true;
        }
    } catch (error) {
        console.log('⚠️ API not reachable. Make sure Flask is running: python app.py');
        // Don't show alert on startup
        return false;
    }
}

// Get current tab URL
function loadCurrentTabUrl() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            currentTabUrl = tabs[0].url;
            currentUrlEl.textContent = truncateText(currentTabUrl, 50);
            manualUrlEl.value = currentTabUrl;
        }
    });
}

// Load recent scans from localStorage
function loadRecentScans() {
    recentList.innerHTML = '';
    
    if (recentScans.length === 0) {
        recentList.innerHTML = '<div class="empty-state">No recent scans</div>';
        return;
    }
    
    recentScans.slice(0, 5).forEach(scan => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <span class="recent-url" title="${scan.url}">${truncateText(scan.url, 40)}</span>
            <span class="recent-status status-${scan.result || 'pending'}">
                ${(scan.result || 'pending').toUpperCase()}
            </span>
        `;
        item.addEventListener('click', () => {
            manualUrlEl.value = scan.url;
            scanUrl(scan.url);
        });
        recentList.appendChild(item);
    });
}

// Event Listeners
function setupEventListeners() {
    // Scan current page
    scanCurrentBtn.addEventListener('click', () => {
        if (currentTabUrl) {
            scanUrl(currentTabUrl);
        } else {
            alert('Unable to get current page URL');
        }
    });
    
    // Scan manual URL
    scanManualBtn.addEventListener('click', () => {
        const url = manualUrlEl.value.trim();
        if (url && isValidUrl(url)) {
            scanUrl(url);
        } else {
            alert('Please enter a valid URL (e.g., https://example.com)');
            manualUrlEl.focus();
        }
    });
    
    // Back button
    backBtn.addEventListener('click', () => {
        page1.classList.add('active');
        page2.classList.remove('active');
    });
    
    // Rescan button
    rescanBtn.addEventListener('click', () => {
        if (scannedUrlText.textContent) {
            scanUrl(scannedUrlText.textContent);
        }
    });
    
    // Enter key in manual URL input
    manualUrlEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            scanManualBtn.click();
        }
    });
    
    // Block site button
    blockBtn.addEventListener('click', () => {
        if (currentTabUrl) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (confirm('Block this site and navigate away?')) {
                    chrome.tabs.update(tabs[0].id, {url: 'chrome://newtab/'});
                }
            });
        }
    });
    
    // Report button
    reportBtn.addEventListener('click', () => {
        alert('False positive reported. Thank you for your feedback!');
    });
}

// URL validation
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Text truncation
function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
}

// Main scan function
async function scanUrl(url) {
    if (isScanning) return;
    
    isScanning = true;
    
    // Switch to results page
    page1.classList.remove('active');
    page2.classList.add('active');
    
    // Reset UI
    scannedUrlText.textContent = url;
    resetResultsUI();
    
    // Show loading
    statusIndicator.style.display = 'flex';
    
    try {
        console.log(`📡 Scanning URL: ${url}`);
        
        const apiUrl = `http://localhost:5000/analyze?url=${encodeURIComponent(url)}`;
        console.log(`🔗 API Call: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Response Status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response:', data);
        
        // Check if response has error
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Update UI with results
        updateResultsUI(data);
        
        // Save to recent scans
        saveToRecentScans(url, data.final_verdict);
        
    } catch (error) {
        console.error('❌ Scan Error:', error);
        
        // Show error in UI
        showErrorState(error.message || 'Unknown error');
        
        // Show error details in console
        if (error.message.includes('Failed to fetch')) {
            alert('⚠️ Cannot connect to Flask API.\n\nMake sure:\n1. Flask server is running (python app.py)\n2. Server is on http://localhost:5000\n3. No firewall blocking port 5000');
        }
        
    } finally {
        // Hide loading
        statusIndicator.style.display = 'none';
        isScanning = false;
    }
}

// Reset results UI
function resetResultsUI() {
    console.log('🔄 Resetting UI...');
    
    const badges = [modelBadge, googleBadge, virusBadge, whoisBadge];
    badges.forEach(badge => {
        badge.className = 'result-badge pending';
        badge.textContent = badge === modelBadge ? 'Analyzing' :
                          badge === googleBadge ? 'Checking' :
                          badge === virusBadge ? 'Scanning' : 'Looking up';
    });
    
    // Reset details
    modelDetails.innerHTML = '<div class="detail-item"><span>Pattern Analysis:</span><span class="detail-value">Processing...</span></div>';
    googleDetails.innerHTML = '<div class="detail-item"><span>Database Status:</span><span class="detail-value">Querying...</span></div>';
    virusDetails.innerHTML = '<div class="detail-item"><span>Engines:</span><span class="detail-value">Loading...</span></div>';
    whoisDetails.innerHTML = '<div class="detail-item"><span>Domain Age:</span><span class="detail-value">Checking...</span></div>';
    
    // Reset verdict
    confidenceScore.textContent = 'Confidence: --%';
    verdictIcon.className = 'verdict-icon';
    verdictIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
    verdictTitle.textContent = 'Scanning...';
    verdictDesc.textContent = 'Analysis in progress';
    
    // Disable buttons
    blockBtn.disabled = true;
    reportBtn.disabled = true;
}

// Update results UI with data
function updateResultsUI(data) {
    console.log('🎨 Updating UI with data...');
    
    // Update model prediction
    updateBadgeAndDetails(modelBadge, data.model.prediction, 'Model', {
        'Confidence': `${data.model.confidence.toFixed(1)}%`,
        'Accuracy': `${data.model.accuracy.toFixed(1)}%`,
        'Type': data.model.prediction
    });
    
    // Update Google Safe Browsing
    updateBadgeAndDetails(googleBadge, data.external_checks.google_safe_browsing, 'Google Safe Browsing', {
        'Status': data.external_checks.google_safe_browsing,
        'Check': 'Google Database'
    });
    
    // Update VirusTotal
    updateBadgeAndDetails(virusBadge, data.external_checks.virus_total, 'VirusTotal', {
        'Status': data.external_checks.virus_total,
        'Engines': '70+ antivirus'
    });
    
    // Update WHOIS
    const whoisResult = getWhoisVerdict(data.whois_details);
    updateBadgeAndDetails(whoisBadge, whoisResult, 'WHOIS', {
        'Domain Age': data.whois_details.domain_age > 0 ? `${data.whois_details.domain_age} days` : 'Unknown',
        'Expires In': data.whois_details.days_until_expiry > 0 ? `${data.whois_details.days_until_expiry} days` : 'Unknown',
        'Privacy': data.whois_details.privacy_protection
    });
    
    // Update final verdict
    updateFinalVerdict(data.final_verdict, data.model.confidence);
    
    // Enable action buttons
    blockBtn.disabled = false;
    reportBtn.disabled = false;
    
    console.log('✅ UI update complete');
}

// Update badge and details
function updateBadgeAndDetails(badge, result, type, details) {
    console.log(`📊 Updating ${type}: ${result}`);
    
    // Determine status
    let status = 'pending';
    if (result === 'error') {
        status = 'error';
    } else if (result === 'benign' || result === 'safe') {
        status = 'safe';
    } else if (result === 'malicious' || result === 'phishing' || result === 'defacement' || result === 'malware') {
        status = 'malicious';
    } else if (result === 'suspicious') {
        status = 'pending';
    }
    
    // Update badge
    badge.className = `result-badge ${status}`;
    badge.textContent = result === 'error' ? 'Error' : result.toUpperCase();
    
    // Update details section
    const detailsEl = type === 'Model' ? modelDetails :
                     type === 'Google Safe Browsing' ? googleDetails :
                     type === 'VirusTotal' ? virusDetails : whoisDetails;
    
    let html = '';
    for (const [key, value] of Object.entries(details)) {
        html += `<div class="detail-item"><span>${key}:</span><span class="detail-value">${value}</span></div>`;
    }
    detailsEl.innerHTML = html;
    
    // Update icon color
    const card = badge.closest('.result-card');
    const icon = card.querySelector('.result-title i');
    if (icon) {
        if (status === 'safe') {
            icon.style.color = '#38a169'; // Green
        } else if (status === 'malicious') {
            icon.style.color = '#e53e3e'; // Red
        } else if (status === 'error') {
            icon.style.color = '#a0aec0'; // Gray
        } else {
            icon.style.color = '#d69e2e'; // Yellow
        }
    }
}

// Get WHOIS verdict
function getWhoisVerdict(whoisData) {
    if (whoisData.domain_age === -1) return 'error';
    
    const isSuspicious = whoisData.domain_age < 30 || 
                        whoisData.days_until_expiry < 10 ||
                        whoisData.privacy_protection === 'Enabled';
    
    return isSuspicious ? 'malicious' : 'benign';
}

// Update final verdict
function updateFinalVerdict(finalDecision, confidence = 0) {
    console.log(`🎯 Final Verdict: ${finalDecision}`);
    
    let verdictColor = '';
    let verdictIconClass = '';
    let verdictIconHtml = '';
    let verdictText = '';
    let verdictDescription = '';
    
    if (finalDecision === 'benign') {
        verdictColor = 'safe';
        verdictIconClass = 'fas fa-check-circle';
        verdictIconHtml = '<i class="fas fa-check-circle"></i>';
        verdictText = 'SAFE';
        verdictDescription = 'This URL appears to be safe';
    } else if (finalDecision === 'malicious') {
        verdictColor = 'malicious';
        verdictIconClass = 'fas fa-exclamation-triangle';
        verdictIconHtml = '<i class="fas fa-exclamation-triangle"></i>';
        verdictText = 'MALICIOUS';
        verdictDescription = 'Warning: Potential threat detected';
    } else if (finalDecision === 'suspicious') {
        verdictColor = 'pending';
        verdictIconClass = 'fas fa-exclamation-circle';
        verdictIconHtml = '<i class="fas fa-exclamation-circle"></i>';
        verdictText = 'SUSPICIOUS';
        verdictDescription = 'Exercise caution with this URL';
    } else {
        verdictColor = 'error';
        verdictIconClass = 'fas fa-times-circle';
        verdictIconHtml = '<i class="fas fa-times-circle"></i>';
        verdictText = 'ERROR';
        verdictDescription = 'Unable to determine safety';
    }
    
    // Update confidence
    confidenceScore.textContent = `Confidence: ${confidence.toFixed(1)}%`;
    
    // Update verdict display
    verdictIcon.className = `verdict-icon ${verdictColor}`;
    verdictIcon.innerHTML = verdictIconHtml;
    verdictTitle.textContent = verdictText;
    verdictDesc.textContent = verdictDescription;
}

// Show error state
function showErrorState(errorMessage = '') {
    console.log('❌ Showing error state:', errorMessage);
    
    const badges = [modelBadge, googleBadge, virusBadge, whoisBadge];
    badges.forEach(badge => {
        badge.className = 'result-badge error';
        badge.textContent = 'Error';
    });
    
    // Show error in details
    modelDetails.innerHTML = `<div class="detail-item"><span>Error:</span><span class="detail-value">${errorMessage || 'API Connection Failed'}</span></div>`;
    googleDetails.innerHTML = '<div class="detail-item"><span>Status:</span><span class="detail-value">Connection Error</span></div>';
    virusDetails.innerHTML = '<div class="detail-item"><span>Status:</span><span class="detail-value">Connection Error</span></div>';
    whoisDetails.innerHTML = '<div class="detail-item"><span>Status:</span><span class="detail-value">Connection Error</span></div>';
    
    // Update final verdict
    confidenceScore.textContent = 'Confidence: --%';
    verdictIcon.className = 'verdict-icon error';
    verdictIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
    verdictTitle.textContent = 'SCAN FAILED';
    verdictDesc.textContent = errorMessage || 'Unable to scan URL';
    
    // Disable action buttons
    blockBtn.disabled = true;
    reportBtn.disabled = false; // Allow reporting the error
}

// Save to recent scans
function saveToRecentScans(url, result) {
    const scan = {
        url: url,
        result: result,
        timestamp: new Date().toISOString()
    };
    
    // Remove duplicates
    recentScans = recentScans.filter(s => s.url !== url);
    
    // Add to beginning
    recentScans.unshift(scan);
    
    // Keep only last 10
    recentScans = recentScans.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('recentScans', JSON.stringify(recentScans));
    
    // Update UI
    loadRecentScans();
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to scan
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (page1.classList.contains('active')) {
            scanCurrentBtn.click();
        } else {
            rescanBtn.click();
        }
    }
    
    // Escape to go back
    if (e.key === 'Escape' && page2.classList.contains('active')) {
        backBtn.click();
    }
});

// Add this to help debug
window.debugState = function() {
    console.log('🔍 Debug State:');
    console.log('- Current Tab URL:', currentTabUrl);
    console.log('- Recent Scans:', recentScans);
    console.log('- Is Scanning:', isScanning);
    console.log('- LocalStorage:', localStorage.getItem('recentScans'));
    
    // Test API connection
    testApiConnection().then(connected => {
        console.log('- API Connected:', connected);
    });
};

console.log('✅ popup.js loaded successfully');