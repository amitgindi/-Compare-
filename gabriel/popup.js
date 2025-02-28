document.addEventListener("DOMContentLoaded", function () {
    const dropZone = document.getElementById("drop-zone");
    const status = document.getElementById("status");
    const extractedInvoiceElement = document.getElementById("extracted-invoice");
    const pdfInvoiceElement = document.getElementById("pdf-invoice");
    const portalInvoiceElement = document.getElementById("portal-invoice");
    const pageInvoiceElement = document.getElementById("page-invoice");
    const comparisonResultElement = document.getElementById("comparison-result");

    // Set up drag and drop handlers
    dropZone.addEventListener("dragover", function (event) {
        event.preventDefault();
        dropZone.classList.add("active");
    });

    dropZone.addEventListener("dragleave", function () {
        dropZone.classList.remove("active");
    });

    dropZone.addEventListener("drop", function (event) {
        event.preventDefault();
        dropZone.classList.remove("active");
        
        // Reset UI
        status.textContent = "Processing PDF...";
        status.className = "";
        extractedInvoiceElement.classList.add("hidden");
        portalInvoiceElement.classList.add("hidden");
        comparisonResultElement.classList.add("hidden");

        const file = event.dataTransfer.files[0];
        if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
            status.textContent = "Please drop a valid PDF file.";
            status.className = "error";
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            const typedArray = new Uint8Array(reader.result);
            extractInvoiceFromPDF(typedArray);
        };
        reader.readAsArrayBuffer(file);
    });

    // Also allow clicking to select a file
    dropZone.addEventListener("click", function() {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".pdf";
        fileInput.style.display = "none";
        
        fileInput.addEventListener("change", function() {
            if (this.files && this.files[0]) {
                // Reset UI
                status.textContent = "Processing PDF...";
                status.className = "";
                extractedInvoiceElement.classList.add("hidden");
                portalInvoiceElement.classList.add("hidden");
                comparisonResultElement.classList.add("hidden");
                
                const file = this.files[0];
                const reader = new FileReader();
                reader.onload = function () {
                    const typedArray = new Uint8Array(reader.result);
                    extractInvoiceFromPDF(typedArray);
                };
                reader.readAsArrayBuffer(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    });

    function extractInvoiceFromPDF(pdfData) {
        // Set workerSrc explicitly
        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("pdf.worker.js");

        pdfjsLib.getDocument({ data: pdfData }).promise
            .then(pdf => {
                let fullText = "";
                const promises = [];

                // Extract text from all pages
                for (let i = 1; i <= pdf.numPages; i++) {
                    promises.push(
                        pdf.getPage(i).then(page => {
                            return page.getTextContent().then(content => {
                                const pageText = content.items.map(item => item.str).join(" ");
                                fullText += pageText + " ";
                            });
                        })
                    );
                }

                return Promise.all(promises).then(() => {
                    // Try to find invoice number in the extracted text
                    const invoiceNumber = findInvoiceNumber(fullText);
                    
                    if (invoiceNumber) {
                        // Show the extracted invoice number
                        extractedInvoiceElement.classList.remove("hidden");
                        pdfInvoiceElement.textContent = invoiceNumber;
                        
                        // Compare with the invoice number in the portal
                        compareWithPortalInvoice(invoiceNumber);
                    } else {
                        status.textContent = "Could not find an invoice number in the PDF.";
                        status.className = "error";
                    }
                });
            })
            .catch(error => {
                console.error("Error extracting text:", error);
                status.textContent = "Error processing PDF!";
                status.className = "error";
            });
    }

    function findInvoiceNumber(text) {
        // Common patterns for invoice numbers
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
        
        // Try each pattern
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        // If no match found with specific patterns, try a more generic approach
        // Look for alphanumeric strings that might be invoice numbers
        const genericPattern = /\b([A-Z]{2,3}-?\d{4,})\b|\b(INV-?[0-9A-Z]{5,})\b/;
        const genericMatch = text.match(genericPattern);
        if (genericMatch && (genericMatch[1] || genericMatch[2])) {
            return (genericMatch[1] || genericMatch[2]).trim();
        }
        
        return null;
    }

    function compareWithPortalInvoice(extractedInvoice) {
        status.textContent = "Comparing invoice numbers...";
        
        // Query for the active tab and get the invoice number from the page
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: () => {
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
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    status.textContent = "Error accessing page content.";
                    status.className = "error";
                    return;
                }
                
                if (results && results[0] && results[0].result) {
                    const portalInvoice = results[0].result;
                    
                    // Show the portal invoice number
                    portalInvoiceElement.classList.remove("hidden");
                    pageInvoiceElement.textContent = portalInvoice;
                    
                    // Compare the invoice numbers
                    comparisonResultElement.classList.remove("hidden");
                    
                    if (extractedInvoice === portalInvoice) {
                        // Match
                        comparisonResultElement.textContent = "✅ The invoice numbers match!";
                        comparisonResultElement.className = "match";
                        status.textContent = "Verification complete.";
                        status.className = "success";
                    } else {
                        // Mismatch
                        comparisonResultElement.textContent = "❌ The invoice numbers do not match!";
                        comparisonResultElement.className = "mismatch";
                        status.textContent = "Verification complete.";
                        status.className = "warning";
                        
                        // Send message to background script to show notification
                        chrome.runtime.sendMessage({
                            action: "compareInvoice",
                            extractedInvoice: extractedInvoice
                        });
                    }
                } else {
                    // Could not find invoice number in the page
                    status.textContent = "Could not find invoice number in the portal page.";
                    status.className = "error";
                }
            });
        });
    }
});