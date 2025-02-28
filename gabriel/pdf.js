// pdf.js - Simplified for extracting text from PDFs

var pdfjsLib = (function() {
  'use strict';

  const GlobalWorkerOptions = {
    workerSrc: null
  };

  function getDocument(params) {
    const loadingTask = {
      promise: new Promise((resolve, reject) => {
        const pdfDocument = {
          numPages: 1,
          getPage: function(pageNum) {
            return Promise.resolve({
              getTextContent: function() {
                return Promise.resolve({
                  items: extractTextFromPDF(params.data)
                });
              }
            });
          }
        };
        
        resolve(pdfDocument);
      })
    };
    
    return loadingTask;
  }

  function extractTextFromPDF(data) {
    const textItems = [];
    const decoder = new TextDecoder('utf-8');

    try {
      const text = decoder.decode(data);
      const chunks = text.split(/[\r\n\t\f\v ]+/);

      for (const chunk of chunks) {
        const printable = chunk.replace(/[^\x20-\x7E]/g, '').trim();
        if (printable) {
          textItems.push({ str: printable });
        }
      }
    } catch (e) {
      console.error('Error extracting text:', e);
    }

    return textItems;
  }

  return {
    getDocument: getDocument,
    GlobalWorkerOptions: GlobalWorkerOptions
  };
})();
