// Content script to warn users on dangerous pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'warnUser') {
        showWarning(request.data);
    }
});

function showWarning(data) {
    // Only show warning if page is detected as malicious
    if (data.final_decision === 'malicious') {
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #FF0000, #FF6B6B);
            color: white;
            padding: 15px;
            text-align: center;
            font-family: Arial, sans-serif;
            font-weight: bold;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        warningDiv.innerHTML = `
            <div style="flex: 1; text-align: left;">
                ⚠️ <strong>SECURITY WARNING:</strong> This site has been flagged as potentially dangerous.
            </div>
            <button id="close-warning" style="
                background: white;
                color: #FF0000;
                border: none;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                margin-left: 10px;
            ">Proceed Anyway</button>
        `;
        
        document.body.prepend(warningDiv);
        
        document.getElementById('close-warning').addEventListener('click', () => {
            warningDiv.remove();
        });
    }
}