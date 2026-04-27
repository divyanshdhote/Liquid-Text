import { useEffect } from 'react';
import usePdfStore from '../stores/pdfStore.js';

/**
 * useDragToWorkspace — Hook to enable dragging text selections to the workspace.
 * Attaches a dragstart listener to the document to intercept when text is dragged.
 *
 * @param {object} params
 * @param {number} params.documentId
 * @param {string} params.selectedText
 * @param {Array} params.selectedRects
 * @param {number} params.selectionPageNumber
 * @param {string} params.fileName
 */
export default function useDragToWorkspace({
  documentId,
  selectedText,
  selectedRects,
  selectionPageNumber,
  fileName,
}) {
  const { activeColor } = usePdfStore();

  useEffect(() => {
    const handleDragStart = (e) => {
      // Check if we have an active text selection
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const draggedText = selection.toString().trim();
      if (!draggedText || draggedText !== selectedText) return;

      // Ensure we have the required metadata
      if (!documentId || !selectedRects?.length || !selectionPageNumber) return;

      // Add our custom payload to the drag event
      const payload = {
        type: 'excerpt-drag',
        documentId,
        text: selectedText,
        rects: selectedRects,
        pageNumber: selectionPageNumber,
        color: activeColor || 'yellow',
        fileName: fileName || '',
      };

      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      // Standard text fallback
      e.dataTransfer.setData('text/plain', selectedText);
      e.dataTransfer.effectAllowed = 'copyMove';
    };

    document.addEventListener('dragstart', handleDragStart);
    return () => document.removeEventListener('dragstart', handleDragStart);
  }, [
    documentId,
    selectedText,
    selectedRects,
    selectionPageNumber,
    activeColor,
    fileName,
  ]);
}
