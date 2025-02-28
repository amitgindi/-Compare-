// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "compareInvoice") {
        const extractedInvoice = message.extractedInvoice;
        
        // Query for the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Execute script to get invoice number from the page
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: getInvoiceNumberFromPage
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    return;
                }
                
                if (results && results[0] && results[0].result) {
                    const portalInvoice = results[0].result;
                    
                    // Compare the invoice numbers
                    if (extractedInvoice === portalInvoice) {
                        // Show success notification
                        chrome.notifications.create({
                            type: "basic",
                            iconUrl: "icon48.png",
                            title: "Invoice Match",
                            message: "✅ The invoice numbers match!"
                        });
                    } else {
                        // Show error notification
                        chrome.notifications.create({
                            type: "basic",
                            iconUrl: "icon48.png",
                            title: "Mismatch Detected!",
                            message: `❌ Mismatch! Portal: ${portalInvoice}, PDF: ${extractedInvoice}`
                        });
                    }
                } else {
                    // Could not find invoice number in the page
                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: "icon48.png",
                        title: "Error",
                        message: "Could not find invoice number in the portal page."
                    });
                }
            });
        });
        
        // Return true to indicate we'll respond asynchronously
        return true;
    }
});

// Function to extract invoice number from the page
function getInvoiceNumberFromPage() {
    // Try different selectors that might contain the invoice number
    const selectors = [
        "input[name='invoice_number']",
        "input[id*='invoice']",
        "input[name*='invoice']",
        "input[placeholder*='invoice']",
        "input[aria-label*='invoice']"
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.value) {
            return element.value.trim();
        }
    }
    
    // If no input field is found, try to find text that looks like an invoice number
    const invoiceRegex = /Invoice\s*#?\s*(\w+[-\w]*)/i;
    const bodyText = document.body.innerText;
    const match = bodyText.match(invoiceRegex);
    
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return null;
}