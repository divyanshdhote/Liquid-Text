import { useRef, useCallback, useEffect, useState } from 'react';
import {
  ZoomIn, ZoomOut, ChevronUp, ChevronDown, Search,
  PanelLeftClose, PanelLeft, Highlighter, PenLine, MousePointer2,
} from 'lucide-react';
import PDFPage from './PDFPage.jsx';
import PDFThumbnails from './PDFThumbnails.jsx';
import PDFSearch from './PDFSearch.jsx';
import PDFOutline from './PDFOutline.jsx';
import ColorPicker from '../annotations/ColorPicker.jsx';
import SelectionActionBar from '../annotations/SelectionActionBar.jsx';
import NotePopover from '../annotations/NotePopover.jsx';
import usePDFDocument from '../../hooks/usePDFDocument.js';
import useTextSelection from '../../hooks/useTextSelection.js';
import useAnnotations from '../../hooks/useAnnotations.js';
import usePdfStore from '../../stores/pdfStore.js';
import useAnnotationStore from '../../stores/annotationStore.js';
import useWorkspaceStore from '../../stores/workspaceStore.js';
import useDragToWorkspace from '../../hooks/useDragToWorkspace.js';

/**
 * PDFViewer — Main PDF viewing container with annotation support.
 *
 * @param {object} props
 * @param {ArrayBuffer|null} props.fileData - PDF file data
 * @param {string} props.fileName - Display name
 * @param {number} props.documentId - Database document ID
 * @param {number} props.projectId - Database project ID
 */
export default function PDFViewer({ fileData, fileName, documentId, projectId }) {
  const scrollContainerRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('thumbnails');
  const [searchOpen, setSearchOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Annotation UI state
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [selectionBarPosition, setSelectionBarPosition] = useState(null);

  // PDF document
  const { pdfDoc, isLoading, error, pageCount, outline } = usePDFDocument(fileData);

  // PDF view state
  const {
    currentPage, zoom, toolMode, activeColor,
    setActiveDocument, goToPage, nextPage, prevPage,
    zoomIn, zoomOut, setTotalPages, setToolMode, setActiveColor,
  } = usePdfStore();

  // Annotations & Workspace
  const { annotations, loadAnnotations, clearAnnotations } = useAnnotationStore();
  const { addExcerpt } = useWorkspaceStore();
  const { createHighlightFromSelection, saveInkStroke } = useAnnotations(documentId, projectId);

  // Text selection tracking
  const { selectedText, selectedRects, pageNumber: selectionPageNumber, clearSelection } = useTextSelection(scrollContainerRef);

  // Enable dragging selected text to workspace
  useDragToWorkspace({
    documentId,
    selectedText,
    selectedRects,
    selectionPageNumber,
    fileName,
  });

  // Set active document when PDF loads
  useEffect(() => {
    if (pdfDoc && pageCount > 0) {
      setActiveDocument(documentId, pageCount);
      setTotalPages(pageCount);
    }
  }, [pdfDoc, pageCount, documentId, setActiveDocument, setTotalPages]);

  // Load annotations when document changes
  useEffect(() => {
    if (documentId) {
      loadAnnotations(documentId);
    }
    return () => clearAnnotations();
  }, [documentId, loadAnnotations, clearAnnotations]);

  // Handle text selection: auto-highlight or show action bar
  useEffect(() => {
    if (selectedText && selectedRects.length > 0 && selectionPageNumber) {
      if (toolMode === 'highlight') {
        // Auto-highlight immediately in highlight mode
        createHighlightFromSelection({
          selectedText,
          selectedRects,
          pageNumber: selectionPageNumber,
          type: 'highlight',
        }).then(() => {
          clearSelection();
          setSelectionBarPosition(null);
        });
      } else {
        // Show selection action bar in select mode
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionBarPosition({
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
          });
        }
      }
    } else {
      setSelectionBarPosition(null);
    }
  }, [selectedText, selectedRects, selectionPageNumber, toolMode, createHighlightFromSelection, clearSelection]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const pages = container.querySelectorAll('.pdf-page');

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageTop = page.offsetTop - container.offsetTop;
      const pageBottom = pageTop + page.offsetHeight;

      if (scrollTop >= pageTop - 50 && scrollTop < pageBottom - 50) {
        const pageNum = parseInt(page.dataset.pageNumber, 10);
        if (pageNum !== currentPage) {
          goToPage(pageNum);
        }
        break;
      }
    }
  }, [currentPage, goToPage]);

  const scrollToPage = useCallback((pageNum) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const pageElement = container.querySelector(`#pdf-page-${pageNum}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleThumbnailClick = useCallback((pageNum) => {
    goToPage(pageNum);
    scrollToPage(pageNum);
  }, [goToPage, scrollToPage]);

  const handleOutlineClick = useCallback((dest) => {
    if (!pdfDoc || !dest) return;
    const navigateToPage = (pageNum) => {
      goToPage(pageNum);
      scrollToPage(pageNum);
    };

    if (typeof dest === 'string') {
      pdfDoc.getDestination(dest).then((resolved) => {
        if (resolved) {
          pdfDoc.getPageIndex(resolved[0]).then((pageIndex) => {
            navigateToPage(pageIndex + 1);
          });
        }
      });
    } else if (Array.isArray(dest)) {
      pdfDoc.getPageIndex(dest[0]).then((pageIndex) => {
        navigateToPage(pageIndex + 1);
      }).catch(() => {
        if (typeof dest[0] === 'number') {
          navigateToPage(dest[0] + 1);
        }
      });
    }
  }, [pdfDoc, goToPage, scrollToPage]);

  // --- Annotation action handlers ---

  const handleCreateAnnotation = useCallback(async (type) => {
    if (!selectedText || !selectedRects.length || !selectionPageNumber) return;
    const annotation = await createHighlightFromSelection({
      selectedText,
      selectedRects,
      pageNumber: selectionPageNumber,
      type,
    });
    clearSelection();
    setSelectionBarPosition(null);
    return annotation;
  }, [selectedText, selectedRects, selectionPageNumber, createHighlightFromSelection, clearSelection]);

  const handleHighlightClick = useCallback((annotation) => {
    setSelectedAnnotation(annotation);

    // Find the annotation's position on screen for the popover
    const pageEl = document.getElementById(`pdf-page-${annotation.pageNumber}`);
    if (pageEl && annotation.rects?.[0]) {
      const pageRect = pageEl.getBoundingClientRect();
      const firstRect = annotation.rects[0];
      setPopoverAnchor({
        top: pageRect.top + firstRect.y * pageRect.height + firstRect.height * pageRect.height + 8,
        left: pageRect.left + firstRect.x * pageRect.width,
      });
    }
  }, []);

  const handleInkStrokeComplete = useCallback(async (stroke) => {
    await saveInkStroke({
      pageNumber: stroke.pageNumber,
      points: stroke.points,
      color: stroke.color,
      strokeWidth: stroke.strokeWidth,
    });
  }, [saveInkStroke]);

  const handleClosePopover = useCallback(() => {
    setSelectedAnnotation(null);
    setPopoverAnchor(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === '+' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zoomOut();
      }
      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') setToolMode('select');
      if (e.key === 'h' || e.key === 'H') setToolMode('highlight');
      if (e.key === 'p' || e.key === 'P') setToolMode('ink');
      // Escape closes popover
      if (e.key === 'Escape') handleClosePopover();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, setToolMode, handleClosePopover]);

  // Loading state
  if (isLoading) {
    return (
      <div className="pdf-viewer" id="pdf-viewer">
        <div className="pdf-viewer__loading">
          <div className="pdf-viewer__loading-spinner" />
          <span>Loading PDF...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pdf-viewer" id="pdf-viewer">
        <div className="pdf-viewer__error">
          <span>Failed to load PDF: {error}</span>
        </div>
      </div>
    );
  }

  if (!pdfDoc) return null;

  const zoomPercent = Math.round(zoom * 100);
  const isInkMode = toolMode === 'ink';

  return (
    <div className="pdf-viewer" id="pdf-viewer">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="pdf-sidebar slide-in-right" id="pdf-sidebar">
          <div className="pdf-sidebar__tabs">
            <button
              className={`pdf-sidebar__tab ${sidebarTab === 'thumbnails' ? 'pdf-sidebar__tab--active' : ''}`}
              onClick={() => setSidebarTab('thumbnails')}
              title="Page Thumbnails"
              id="tab-thumbnails"
            >
              Pages
            </button>
            {outline && outline.length > 0 && (
              <button
                className={`pdf-sidebar__tab ${sidebarTab === 'outline' ? 'pdf-sidebar__tab--active' : ''}`}
                onClick={() => setSidebarTab('outline')}
                title="Table of Contents"
                id="tab-outline"
              >
                Outline
              </button>
            )}
          </div>

          <div className="pdf-sidebar__content">
            {sidebarTab === 'thumbnails' && (
              <PDFThumbnails
                pdfDoc={pdfDoc}
                pageCount={pageCount}
                currentPage={currentPage}
                onPageClick={handleThumbnailClick}
              />
            )}
            {sidebarTab === 'outline' && outline && (
              <PDFOutline
                outline={outline}
                onItemClick={handleOutlineClick}
              />
            )}
          </div>
        </div>
      )}

      {/* Main viewing area */}
      <div className="pdf-viewer__main">
        {/* Toolbar */}
        <div className="pdf-toolbar" id="pdf-toolbar">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            id="btn-toggle-sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>

          <div className="pdf-toolbar__divider" />

          {/* Tool mode controls */}
          <div className="pdf-toolbar__tools">
            <button
              className={`btn btn-ghost btn-icon ${toolMode === 'select' ? 'btn--active' : ''}`}
              onClick={() => setToolMode('select')}
              title="Select (V)"
              data-tooltip="Select (V)"
              data-tooltip-pos="bottom"
              id="btn-tool-select"
            >
              <MousePointer2 size={16} />
            </button>
            <button
              className={`btn btn-ghost btn-icon ${toolMode === 'highlight' ? 'btn--active' : ''}`}
              onClick={() => setToolMode('highlight')}
              data-tooltip="Highlight (H)"
              data-tooltip-pos="bottom"
              id="btn-tool-highlight"
            >
              <Highlighter size={16} />
            </button>
            <button
              className={`btn btn-ghost btn-icon ${toolMode === 'ink' ? 'btn--active' : ''}`}
              onClick={() => setToolMode('ink')}
              data-tooltip="Draw (P)"
              data-tooltip-pos="bottom"
              id="btn-tool-ink"
            >
              <PenLine size={16} />
            </button>

            {/* Color swatch — click to toggle color picker */}
            <button
              className="btn btn-ghost btn-icon color-swatch-btn"
              onClick={() => setColorPickerOpen((prev) => !prev)}
              title="Color"
              id="btn-color-swatch"
            >
              <div
                className="color-swatch-preview"
                style={{ '--swatch-color': getColorHex(activeColor) }}
              />
            </button>
          </div>

          {/* Color picker dropdown */}
          {colorPickerOpen && (
            <div className="color-picker-dropdown fade-in-scale" id="color-picker-dropdown">
              <ColorPicker
                activeColor={activeColor}
                onColorSelect={(color) => {
                  setActiveColor(color);
                  setColorPickerOpen(false);
                }}
                compact
              />
            </div>
          )}

          <div className="pdf-toolbar__divider" />

          {/* Page navigation */}
          <div className="pdf-toolbar__page-nav">
            <button
              className="btn btn-ghost btn-icon"
              onClick={prevPage}
              disabled={currentPage <= 1}
              title="Previous page"
              id="btn-prev-page"
            >
              <ChevronUp size={16} />
            </button>
            <span className="pdf-toolbar__page-info">
              <input
                type="number"
                className="pdf-toolbar__page-input"
                value={currentPage}
                min={1}
                max={pageCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= pageCount) {
                    goToPage(val);
                    scrollToPage(val);
                  }
                }}
                id="input-page-number"
              />
              <span className="pdf-toolbar__page-total">/ {pageCount}</span>
            </span>
            <button
              className="btn btn-ghost btn-icon"
              onClick={nextPage}
              disabled={currentPage >= pageCount}
              title="Next page"
              id="btn-next-page"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="pdf-toolbar__divider" />

          {/* Zoom controls */}
          <div className="pdf-toolbar__zoom">
            <button
              className="btn btn-ghost btn-icon"
              onClick={zoomOut}
              disabled={zoom <= 0.25}
              data-tooltip="Zoom out"
              data-tooltip-pos="bottom"
              id="btn-zoom-out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="pdf-toolbar__zoom-value">{zoomPercent}%</span>
            <button
              className="btn btn-ghost btn-icon"
              onClick={zoomIn}
              disabled={zoom >= 5.0}
              data-tooltip="Zoom in"
              data-tooltip-pos="bottom"
              id="btn-zoom-in"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <div className="pdf-toolbar__spacer" />

          {/* Search — inline in toolbar */}
          {searchOpen ? (
            <PDFSearch
              pdfDoc={pdfDoc}
              pageCount={pageCount}
              onClose={() => setSearchOpen(false)}
              onNavigateToPage={(pageNum) => {
                goToPage(pageNum);
                scrollToPage(pageNum);
              }}
            />
          ) : (
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSearchOpen(true)}
              data-tooltip="Search (Ctrl+F)"
              data-tooltip-pos="bottom"
              id="btn-search-toggle"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        {/* Scrollable pages container */}
        <div
          ref={scrollContainerRef}
          className="pdf-pages-container"
          onScroll={handleScroll}
          id="pdf-pages-container"
        >
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
            <PDFPage
              key={pageNum}
              pdfDoc={pdfDoc}
              pageNumber={pageNum}
              zoom={zoom}
              isVisible={Math.abs(pageNum - currentPage) <= 2}
              annotations={annotations.filter((a) => a.pageNumber === pageNum)}
              selectedAnnotationId={selectedAnnotation?.id}
              onHighlightClick={handleHighlightClick}
              inkActive={isInkMode && Math.abs(pageNum - currentPage) <= 1}
              inkColor={activeColor}
              inkStrokeWidth={2}
              onInkStrokeComplete={handleInkStrokeComplete}
            />
          ))}
        </div>
      </div>

      {/* Selection action bar (floating near text selection) */}
      <SelectionActionBar
        position={selectionBarPosition}
        visible={!!selectionBarPosition && toolMode !== 'ink'}
        onHighlight={() => handleCreateAnnotation('highlight')}
        onUnderline={() => handleCreateAnnotation('underline')}
        onStrikethrough={() => handleCreateAnnotation('strikethrough')}
        onSendToWorkspace={() => {
          if (documentId && projectId && selectedText && selectedRects && selectionPageNumber) {
            addExcerpt({
              documentId,
              projectId,
              text: selectedText,
              sourcePageNumber: selectionPageNumber,
              sourceRects: selectedRects,
              color: activeColor || 'yellow',
              fileName,
            });
          }
          clearSelection();
          setSelectionBarPosition(null);
        }}
      />

      {/* Note popover (anchored to selected highlight) */}
      {selectedAnnotation && popoverAnchor && (
        <NotePopover
          annotation={selectedAnnotation}
          anchorRect={popoverAnchor}
          onClose={handleClosePopover}
        />
      )}
    </div>
  );
}

/** Helper: resolve color name to hex */
function getColorHex(name) {
  const map = {
    yellow: '#facc15', green: '#34d399', blue: '#60a5fa', pink: '#f472b6',
    orange: '#fb923c', purple: '#a78bfa', red: '#f87171', teal: '#2dd4bf',
  };
  return map[name] || '#facc15';
}
