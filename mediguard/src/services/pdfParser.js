/**
 * pdfParser.js
 *
 * Two exports:
 *  1. extractTextFromPDF(file)  → raw text (existing, unchanged)
 *  2. renderPDFPageAsJpeg(file) → renders page 1 to a canvas → returns a
 *     JPEG data-URL suitable for Groq's vision model image_url blocks.
 */

import * as pdfjs from 'pdfjs-dist';

// Point to the bundled worker (avoids CDN version mismatches)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ─── Text extraction (unchanged) ─────────────────────────────────────────────
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

// ─── PDF page → JPEG data-URL (for vision AI) ────────────────────────────────
/**
 * Renders the FIRST page of a PDF as a high-resolution JPEG data-URL.
 * The image is suitable for sending to Groq's vision model.
 *
 * @param {File} file  - A PDF File object from an <input> or drag-drop
 * @param {number} [scale=2.5] - Render scale (2.5 = ~190 DPI, good for text)
 * @returns {Promise<string>} JPEG data-URL  (e.g. "data:image/jpeg;base64,...")
 */
export const renderPDFPageAsJpeg = async (file, scale = 2.5) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement('canvas');
  const ctx      = canvas.getContext('2d');

  canvas.width  = viewport.width;
  canvas.height = viewport.height;

  // White background (PDFs are transparent by default)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  // 0.92 quality JPEG – sharp enough for OCR, small enough for the API
  return canvas.toDataURL('image/jpeg', 0.92);
};
