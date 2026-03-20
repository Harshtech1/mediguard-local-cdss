import * as pdfjs from 'pdfjs-dist';

// Use the locally-bundled worker so there is no CDN version mismatch
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();


/**
 * Extracts raw text from a PDF file using PDF.js
 * @param {File} file - The PDF file from an input or drop event
 * @returns {Promise<string>} - The extracted text
 */
export const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
};
