function getInvoiceNumberFromCoupa() {
    const inputField = document.querySelector("input[name='invoice_number']");
    return inputField ? inputField.value.trim() : null;
}

// Listen for requests from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getInvoiceNumber") {
        const invoiceNumber = getInvoiceNumberFromCoupa();
        sendResponse({ invoiceNumber });
    }
});
