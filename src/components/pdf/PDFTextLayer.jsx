import { useEffect, useRef } from 'react';
import { TextLayer } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

/**
 * PDFTextLayer — Renders transparent text divs on top of a PDF page canvas.
 * 
 * This enables native browser text selection on the PDF. The text is
 * invisible but selectable, positioned to exactly overlay the rendered
 * glyphs on the canvas below.
 *
 * @param {object} props
 * @param {object} props.page - pdf.js page proxy
 * @param {object} props.viewport - pdf.js viewport
 */
export default function PDFTextLayer({ page, viewport }) {
  const containerRef = useRef(null);
  const textLayerRef = useRef(null);

  useEffect(() => {
    if (!page || !viewport || !containerRef.current) return;

    const container = containerRef.current;

    // Clean up previous text layer
    if (textLayerRef.current) {
      textLayerRef.current.cancel();
      textLayerRef.current = null;
    }
    container.innerHTML = '';

    let cancelled = false;

    const renderTextLayer = async () => {
      try {
        const textContent = await page.getTextContent();
        if (cancelled) return;

        const textLayer = new TextLayer({
          textContentSource: textContent,
          container,
          viewport,
        });
        textLayerRef.current = textLayer;

        await textLayer.render();
      } catch (err) {
        if (!cancelled && err.name !== 'RenderingCancelledException') {
          console.error('Text layer render failed:', err);
        }
      }
    };

    renderTextLayer();

    return () => {
      cancelled = true;
      if (textLayerRef.current) {
        textLayerRef.current.cancel();
        textLayerRef.current = null;
      }
    };
  }, [page, viewport]);

  return (
    <div
      ref={containerRef}
      className="pdf-text-layer textLayer"
      style={{
        width: `${viewport?.width || 0}px`,
        height: `${viewport?.height || 0}px`,
      }}
    />
  );
}
