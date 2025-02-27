chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "compareInvoice") {
        const extractedInvoice = message.extractedInvoice;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: () => {
                        const inputField = document.querySelector("input[name='invoice_number']");
                        return inputField ? inputField.value.trim() : null;
                    }
                },
                (results) => {
                    if (results && results[0] && results[0].result) {
                        const portalInvoice = results[0].result;
                        if (extractedInvoice === portalInvoice) {
                            chrome.notifications.create({
                                type: "basic",
                                iconUrl: "icon.png",
                                title: "Invoice Match",
                                message: "✅ The invoice numbers match!"
                            });
                        } else {
                            chrome.notifications.create({
                                type: "basic",
                                iconUrl: "icon.png",
                                title: "Mismatch Detected!",
                                message: `❌ Mismatch! Portal: ${portalInvoice}, PDF: ${extractedInvoice}`
                            });
                        }
                    }
                }
            );
        });
    }
});
