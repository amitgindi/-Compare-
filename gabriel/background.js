// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "compareInvoice") {
        const extractedInvoice = message.extractedInvoice;
        const portalInvoice = message.portalInvoice;
        
        // If we already have the portal invoice from popup.js
        if (portalInvoice) {
            showNotification(extractedInvoice, portalInvoice);
            return true;
        }
        
        // Otherwise, query for the active tab and get the invoice number directly
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
                    showNotification(extractedInvoice, portalInvoice);
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

// Function to show notification with comparison results
function showNotification(extractedInvoice, portalInvoice) {
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
}

// Function to extract invoice number from the page
function getInvoiceNumberFromPage() {
    // First, try input fields that might contain the invoice number
    const inputSelectors = [
        "input[name='invoice_number']",
        "input[id*='invoice']",
        "input[name*='invoice']",
        "input[placeholder*='invoice']",
        "input[aria-label*='invoice']",
        "input[id*='bill']",
        "input[name*='bill']",
        "input[id*='document']",
        "input[name*='document']",
        "input[id*='reference']",
        "input[name*='reference']"
    ];
    
    for (const selector of inputSelectors) {
        const element = document.querySelector(selector);
        if (element && element.value) {
            return element.value.trim();
        }
    }
    
    // Next, try span, div, p elements that might contain invoice text
    const textSelectors = [
        "span[id*='invoice']", 
        "div[id*='invoice']", 
        "p[id*='invoice']",
        "label[for*='invoice']",
        "span[id*='bill']", 
        "div[id*='bill']", 
        "p[id*='bill']",
        "span[id*='document']", 
        "div[id*='document']", 
        "p[id*='document']",
        "span[id*='reference']", 
        "div[id*='reference']", 
        "p[id*='reference']"
    ];
    
    for (const selector of textSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
            const text = element.textContent.trim();
            // Try to extract invoice number from this text
            const patterns = [
                /Invoice\s*#?\s*[:\-]?\s*(\w+[-\w]*)/i,
                /Invoice\s*Number\s*[:\-]?\s*(\w+[-\w]*)/i,
                /Invoice\s*No\.?\s*[:\-]?\s*(\w+[-\w]*)/i,
                /Invoice\s*ID\s*[:\-]?\s*(\w+[-\w]*)/i,
                /INV\s*#?\s*[:\-]?\s*(\w+[-\w]*)/i,
                /Bill\s*Number\s*[:\-]?\s*(\w+[-\w]*)/i,
                /Document\s*Number\s*[:\-]?\s*(\w+[-\w]*)/i,
                /Reference\s*Number\s*[:\-]?\s*(\w+[-\w]*)/i
            ];
            
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }
        }
    }
    
    // If no matching elements found, try to find text patterns in the page content
    const bodyText = document.body.innerText;
    const patterns = [
        /Invoice\s*#?\s*[:\-]?\s*(\w+[-\w]*)/i,
        /Invoice\s*Number\s*[:\-]?\s*(\w+[-\w]*)/i,
        /Invoice\s*No\.?\s*[:\-]?\s*(\w+[-\w]*)/i,
        /Invoice\s*ID\s*[:\-]?\s*(\w+[-\w]*)/i,
        /INV\s*#?\s*[:\-]?\s*(\w+[-\w]*)/i,
        /Bill\s*Number\s*[:\-]?\s*(\w+[-\w]*)/i,
        /Document\s*Number\s*[:\-]?\s*(\w+[-\w]*)/i,
        /Reference\s*Number\s*[:\-]?\s*(\w+[-\w]*)/i,
        /INV[0-9]{5,}/i,
        /[A-Z]{2,3}-\d{4,}/
    ];
    
    for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    // Try generic pattern if nothing specific was found
    const genericPattern = /\b([A-Z]{2,3}-?\d{4,})\b|\b(INV-?[0-9A-Z]{5,})\b/;
    const genericMatch = bodyText.match(genericPattern);
    if (genericMatch && (genericMatch[1] || genericMatch[2])) {
        return (genericMatch[1] || genericMatch[2]).trim();
    }
    
    return null;
}