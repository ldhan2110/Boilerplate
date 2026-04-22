import { pdfjs } from 'react-pdf';

let workerReady: Promise<void> | null = null;

/**
 * Ensures the PDF.js worker is set up. Fetches the worker from our server and
 * creates a blob URL with MIME type application/javascript so it works even
 * when the server sends wrong MIME (e.g. application/octet-stream on Linux).
 * Falls back to CDN if same-origin fetch fails.
 */
export function getPdfWorkerReady(): Promise<void> {
  if (workerReady) return workerReady;

  workerReady = (async () => {
    if (pdfjs.GlobalWorkerOptions.workerSrc?.startsWith('blob:')) {
      return;
    }
    try {
      const res = await fetch('/pdf.worker.min.mjs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ab = await res.arrayBuffer();
      const blob = new Blob([ab], { type: 'application/javascript' });
      pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
    } catch {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  })();

  return workerReady;
}
