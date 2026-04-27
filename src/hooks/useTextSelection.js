import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useTextSelection — Tracks user text selection within PDF text layers.
 *
 * Listens for selectionchange events and determines which text is selected,
 * the bounding rects, and which PDF page the selection is on.
 *
 * @param {React.RefObject} containerRef - Ref to the PDF viewer container
 * @returns {object} { selectedText, selectedRects, pageNumber, clearSelection }
 */
export default function useTextSelection(containerRef) {
  const [selectedText, setSelectedText] = useState('');
  const [selectedRects, setSelectedRects] = useState([]);
  const [pageNumber, setPageNumber] = useState(null);
  const selectionTimeoutRef = useRef(null);

  const handleSelectionChange = useCallback(() => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setSelectedText('');
        setSelectedRects([]);
        setPageNumber(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setSelectedText('');
        setSelectedRects([]);
        setPageNumber(null);
        return;
      }

      const container = containerRef?.current;
      if (!container) return;

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }

      let pageElement = range.commonAncestorContainer;
      while (pageElement && !pageElement.dataset?.pageNumber) {
        pageElement = pageElement.parentElement;
      }

      if (!pageElement) return;

      const pageNum = parseInt(pageElement.dataset.pageNumber, 10);
      const pageRect = pageElement.getBoundingClientRect();

      const clientRects = Array.from(range.getClientRects());
      
      const normalizedRects = clientRects
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({
          x: (r.left - pageRect.left) / pageRect.width,
          y: (r.top - pageRect.top) / pageRect.height,
          width: r.width / pageRect.width,
          height: r.height / pageRect.height,
        }));

      const mergedRects = mergeRects(normalizedRects);

      setSelectedText(text);
      setSelectedRects(mergedRects);
      setPageNumber(pageNum);
    }, 150); // Increased debounce to prevent rapid firing while dragging
  }, [containerRef]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectedRects([]);
    setPageNumber(null);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleSelectionChange]);

  return {
    selectedText,
    selectedRects,
    pageNumber,
    clearSelection,
  };
}

/**
 * Merge adjacent/overlapping rects that are on the same horizontal line.
 * This consolidates multiple small rects from individual text spans
 * into larger highlight regions.
 */
function mergeRects(rects) {
  if (rects.length === 0) return [];

  // Sort by y then x
  const sorted = [...rects].sort((a, b) => {
    const yDiff = a.y - b.y;
    return Math.abs(yDiff) < 0.005 ? a.x - b.x : yDiff;
  });

  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // If on the same line (similar y) and overlapping/adjacent
    const sameLine = Math.abs(current.y - last.y) < 0.005;
    const overlaps = current.x <= last.x + last.width + 0.002;

    if (sameLine && overlaps) {
      // Merge
      const newRight = Math.max(last.x + last.width, current.x + current.width);
      last.width = newRight - last.x;
      last.height = Math.max(last.height, current.height);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}
