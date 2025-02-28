// This script runs in the context of the web page

// Function to get invoice number from the page
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

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getInvoiceNumber") {
        const invoiceNumber = getInvoiceNumberFromPage();
        sendResponse({ invoiceNumber });
    }
    return true; // Indicates we'll respond asynchronously
});