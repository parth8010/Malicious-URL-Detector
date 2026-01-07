document.addEventListener("DOMContentLoaded", async () => {
    const urlElement = document.getElementById("currentUrl");
    const resultElement = document.getElementById("result");
    const checkBtn = document.getElementById("checkBtn");
  
    // Get the current tab's URL
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab.url;
    urlElement.textContent = currentUrl;
  
    checkBtn.addEventListener("click", async () => {
      resultElement.textContent = "Checking...";
  
      try {
        const response = await fetch("http://127.0.0.1:5000/check-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentUrl })
        });
  
        const data = await response.json();
        resultElement.innerHTML = `
          <strong>Prediction:</strong> ${data.final_classification}<br>
          <strong>Model:</strong> ${data.model_prediction}<br>
          <strong>VirusTotal:</strong> ${data.virustotal_result}<br>
          <strong>SafeBrowsing:</strong> ${data.google_safe_browsing_result}<br>
          <strong>WHOIS:</strong> ${data.whois_prediction}
        `;
      } catch (error) {
        resultElement.textContent = "Error contacting API!";
        console.error(error);
      }
    });
  });
  