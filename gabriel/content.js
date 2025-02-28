// This script runs in the context of the web page

// Enhanced function to get invoice number from the page
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
        // Try reference fields too
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
            const invoiceMatch = extractInvoiceNumberFromText(text);
            if (invoiceMatch) return invoiceMatch;
        }
    }
    
    // If no matching elements found, try to find text patterns in the page content
    // Using the same comprehensive patterns as in the PDF extraction
    const bodyText = document.body.innerText;
    return extractInvoiceNumberFromText(bodyText);
}

// Extract invoice number from text using multiple patterns
function extractInvoiceNumberFromText(text) {
    // Common patterns for invoice numbers
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
    
    // Try each pattern
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    // If no match found with specific patterns, try a more generic approach
    const genericPattern = /\b([A-Z]{2,3}-?\d{4,})\b|\b(INV-?[0-9A-Z]{5,})\b/;
    const genericMatch = text.match(genericPattern);
    if (genericMatch && (genericMatch[1] || genericMatch[2])) {
        return (genericMatch[1] || genericMatch[2]).trim();
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