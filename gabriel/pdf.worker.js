/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * PDF.js worker v2.16.105 (build: 0f92c5c34)
 * 
 * This is a simplified version of the PDF.js worker for use in Chrome extensions.
 * It contains only the essential functionality needed for text extraction.
 */

// This is a placeholder for the PDF.js worker
// In a real implementation, this would contain the worker code
// For our extension, the main pdf.js file handles everything

self.onmessage = function(event) {
  // Process messages from the main thread
  const data = event.data;
  
  if (data && data.type === 'getTextContent') {
    // Simplified response for text content requests
    self.postMessage({
      type: 'textContent',
      items: []
    });
  }
};

console.log('PDF.js worker initialized');