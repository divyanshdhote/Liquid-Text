import { useEffect, useRef, useState, memo } from 'react';
import PDFTextLayer from './PDFTextLayer.jsx';
import HighlightLayer from '../annotations/HighlightLayer.jsx';
import InkCanvas from '../annotations/InkCanvas.jsx';
import usePdfStore from '../../stores/pdfStore.js';

/**
 * PDFPage — Renders a single PDF page.
 * 
 * Layers (bottom to top):
 *   1. Canvas — the rendered PDF page bitmap
 *   2. HighlightLayer — SVG overlay for highlights/underlines/strikethroughs
 *   3. InkCanvas — freehand drawing canvas
 *   4. TextLayer — invisible selectable text overlay
 *
 * @param {object} props
 * @param {object} props.pdfDoc - pdf.js document proxy
 * @param {number} props.pageNumber - 1-indexed page number
 * @param {number} props.zoom - zoom factor (1.0 = 100%)
 * @param {boolean} props.isVisible - whether this page is in the viewport
 * @param {Array} props.annotations - annotations for this page
 * @param {string|null} props.selectedAnnotationId - currently selected annotation
 * @param {function} props.onHighlightClick - callback when a highlight is clicked
 * @param {boolean} props.inkActive - whether ink drawing mode is active
 * @param {string} props.inkColor - ink stroke color name
 * @param {number} props.inkStrokeWidth - ink stroke width
 * @param {function} props.onInkStrokeComplete - callback when ink stroke finishes
 */
const PDFPage = memo(function PDFPage({
  pdfDoc,
  pageNumber,
  zoom = 1.0,
  isVisible = true,
  annotations = [],
  selectedAnnotationId,
  onHighlightClick,
  inkActive = false,
  inkColor = 'red',
  inkStrokeWidth = 2,
  onInkStrokeComplete,
}) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [page, setPage] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { jumpTarget } = usePdfStore();

  // Load the page proxy
  useEffect(() => {
    if (!pdfDoc || !pageNumber) return;
    let cancelled = false;

    pdfDoc.getPage(pageNumber).then((p) => {
      if (!cancelled) {
        setPage(p);
      }
    }).catch((err) => {
      if (!cancelled) {
        console.error(`Failed to load page ${pageNumber}:`, err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  // Compute viewport and set dimensions whenever page or zoom changes
  useEffect(() => {
    if (!page) return;

    const displayVp = page.getViewport({ scale: zoom });
    
    setViewport(displayVp);
    setDimensions({
      width: displayVp.width,
      height: displayVp.height,
    });
  }, [page, zoom]);

  // Render the page to canvas
  useEffect(() => {
    if (!page || !viewport || !canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const scale = zoom * window.devicePixelRatio;
    const scaledViewport = page.getViewport({ scale });

    // Set canvas size at device pixel ratio for sharp rendering
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Cancel previous render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    setIsRendering(true);

    const renderTask = page.render({
      canvasContext: context,
      viewport: scaledViewport,
    });
    renderTaskRef.current = renderTask;

    renderTask.promise
      .then(() => {
        setIsRendering(false);
      })
      .catch((err) => {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render failed:`, err);
        }
        setIsRendering(false);
      });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [page, viewport, isVisible, zoom, pageNumber]);

  // Filter annotations by type for each layer
  const highlightAnnotations = annotations.filter((a) => a.type !== 'ink');
  const inkAnnotations = annotations.filter((a) => a.type === 'ink');

  return (
    <div
      className="pdf-page"
      data-page-number={pageNumber}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
      id={`pdf-page-${pageNumber}`}
    >
      {/* Layer 1: Canvas (rendered PDF) */}
      <canvas
        ref={canvasRef}
        className="pdf-page__canvas"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      />

      {/* Layer 2: Highlight overlay (SVG) */}
      {highlightAnnotations.length > 0 && (
        <HighlightLayer
          annotations={highlightAnnotations}
          pageWidth={dimensions.width}
          pageHeight={dimensions.height}
          onHighlightClick={onHighlightClick}
          selectedAnnotationId={selectedAnnotationId}
        />
      )}

      {/* Layer 3: Ink canvas */}
      <InkCanvas
        isActive={inkActive}
        pageWidth={dimensions.width}
        pageHeight={dimensions.height}
        color={inkColor}
        strokeWidth={inkStrokeWidth}
        existingStrokes={inkAnnotations}
        onStrokeComplete={(stroke) => {
          onInkStrokeComplete?.({
            ...stroke,
            pageNumber,
          });
        }}
      />

      {/* Layer 4: Text layer (selectable text) */}
      {page && viewport && (
        <PDFTextLayer page={page} viewport={viewport} />
      )}

      {/* Loading indicator */}
      {isRendering && (
        <div className="pdf-page__loading">
          <div className="skeleton" style={{ width: '60%', height: 12, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '80%', height: 12, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '45%', height: 12 }} />
        </div>
      )}

      {/* Jump Target Flash Overlay */}
      {jumpTarget?.pageNumber === pageNumber && jumpTarget.rects?.length > 0 && (
        <div className="jump-flash-layer" key={jumpTarget.timestamp}>
          {jumpTarget.rects.map((r, i) => (
             <div 
               key={i} 
               className="jump-flash-rect" 
               style={{
                 left: `${r.x * 100}%`,
                 top: `${r.y * 100}%`,
                 width: `${r.width * 100}%`,
                 height: `${r.height * 100}%`
               }} 
             />
          ))}
        </div>
      )}

      {/* Page number label */}
      <div className="pdf-page__number">{pageNumber}</div>
    </div>
  );
});

export default PDFPage;
