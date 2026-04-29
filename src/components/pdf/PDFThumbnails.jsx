import { useEffect, useRef, useState, memo } from 'react';

/**
 * PDFThumbnails — Sidebar with small canvas renders of each page.
 *
 * @param {object} props
 * @param {object} props.pdfDoc - pdf.js document proxy
 * @param {number} props.pageCount - total number of pages
 * @param {number} props.currentPage - currently viewed page
 * @param {function} props.onPageClick - callback when a thumbnail is clicked
 */
const PDFThumbnails = memo(function PDFThumbnails({ pdfDoc, pageCount, currentPage, onPageClick }) {
  const containerRef = useRef(null);

  // Scroll the active thumbnail into view
  useEffect(() => {
    if (!containerRef.current) return;
    const activeThumb = containerRef.current.querySelector('.pdf-thumbnail--active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage]);

  return (
    <div className="pdf-thumbnails" ref={containerRef} id="pdf-thumbnails">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
        <Thumbnail
          key={pageNum}
          pdfDoc={pdfDoc}
          pageNumber={pageNum}
          isActive={pageNum === currentPage}
          onClick={() => onPageClick(pageNum)}
        />
      ))}
    </div>
  );
});

/**
 * Individual thumbnail renderer.
 */
const Thumbnail = memo(function Thumbnail({ pdfDoc, pageNumber, isActive, onClick }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || rendered) return;
    let cancelled = false;

    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled) return;

      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      page.render({ canvasContext: context, viewport }).promise.then(() => {
        if (!cancelled) setRendered(true);
      }).catch(() => {});
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber, rendered]);

  return (
    <button
      className={`pdf-thumbnail ${isActive ? 'pdf-thumbnail--active' : ''}`}
      onClick={onClick}
      title={`Page ${pageNumber}`}
      id={`thumbnail-${pageNumber}`}
    >
      <canvas ref={canvasRef} className="pdf-thumbnail__canvas" />
      <span className="pdf-thumbnail__label">{pageNumber}</span>
    </button>
  );
});

export default PDFThumbnails;
