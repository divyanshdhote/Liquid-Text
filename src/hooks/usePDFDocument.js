import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href;

/**
 * usePDFDocument — Manages the lifecycle of a pdf.js document proxy.
 *
 * Key design: We NEVER call loadingTask.destroy() during effect cleanup,
 * because that kills the global pdf.js worker and breaks subsequent loads
 * (especially in React StrictMode which double-mounts). Instead, we use
 * a `cancelled` flag and discard stale results.
 *
 * @param {ArrayBuffer|null} fileData - PDF file data from Dexie
 * @returns {object} { pdfDoc, isLoading, error, pageCount, metadata, outline }
 */
export default function usePDFDocument(fileData) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [outline, setOutline] = useState(null);

  // Keep a ref to the current doc so we can clean it up when a new one loads
  const currentDocRef = useRef(null);

  useEffect(() => {
    // No data — reset everything
    if (!fileData) {
      if (currentDocRef.current) {
        currentDocRef.current.destroy().catch(() => {});
        currentDocRef.current = null;
      }
      setPdfDoc(null);
      setPageCount(0);
      setMetadata(null);
      setOutline(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Copy the ArrayBuffer to avoid detachment issues
        const dataCopy = fileData instanceof ArrayBuffer
          ? fileData.slice(0)
          : fileData;

        const loadingTask = pdfjsLib.getDocument({
          data: dataCopy,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;

        // If this effect was cancelled (StrictMode unmount), destroy the doc
        // we just loaded and bail out
        if (cancelled) {
          doc.destroy().catch(() => {});
          return;
        }

        // Destroy the previous document before setting the new one
        if (currentDocRef.current) {
          currentDocRef.current.destroy().catch(() => {});
        }
        currentDocRef.current = doc;

        // Extract metadata and outline
        const meta = await doc.getMetadata().catch(() => null);
        const docOutline = await doc.getOutline().catch(() => null);

        if (cancelled) return;

        setPdfDoc(doc);
        setPageCount(doc.numPages);
        setMetadata(meta?.info || null);
        setOutline(docOutline);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;

        console.error('Failed to load PDF:', err);
        setError(err.message || 'Failed to load PDF');
        setPdfDoc(null);
        setPageCount(0);
        setIsLoading(false);
      }
    };

    loadDocument();

    // Cleanup: just set the cancelled flag. Do NOT call loadingTask.destroy()
    // because that kills the pdf.js web worker globally.
    return () => {
      cancelled = true;
    };
  }, [fileData]);

  // Cleanup on final unmount (component removed from tree entirely)
  useEffect(() => {
    return () => {
      if (currentDocRef.current) {
        currentDocRef.current.destroy().catch(() => {});
        currentDocRef.current = null;
      }
    };
  }, []);

  return {
    pdfDoc,
    isLoading,
    error,
    pageCount,
    metadata,
    outline,
  };
}
