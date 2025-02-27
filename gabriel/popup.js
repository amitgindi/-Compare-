document.addEventListener("DOMContentLoaded", function () {
    const dropZone = document.getElementById("drop-zone");
    const status = document.getElementById("status");

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = "#f0f0f0";
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.style.backgroundColor = "white";
    });

    dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = "white";

        const file = e.dataTransfer.files[0];
        if (file && file.type === "application/pdf") {
            status.textContent = "Extracting invoice number...";
            extractInvoiceNumber(file);
        } else {
            status.textContent = "Please drop a valid PDF file.";
        }
    });

    async function extractInvoiceNumber(file) {
        const reader = new FileReader();
        reader.onload = async function () {
            const pdfData = new Uint8Array(reader.result);
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            let textContent = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                text.items.forEach((item) => {
                    textContent += item.str + " ";
                });
            }

            const invoiceMatch = textContent.match(/\b\d{6,10}\b/);
            if (invoiceMatch) {
                const extractedInvoice = invoiceMatch[0];
                status.textContent = `Extracted Invoice Number: ${extractedInvoice}`;

                // Send to background script
                chrome.runtime.sendMessage({ action: "compareInvoice", extractedInvoice });
            } else {
                status.textContent = "Invoice number not found!";
            }
        };
        reader.readAsArrayBuffer(file);
    }
});
