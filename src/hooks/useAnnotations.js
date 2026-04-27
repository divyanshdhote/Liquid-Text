import { useCallback } from 'react';
import useAnnotationStore from '../stores/annotationStore.js';
import usePdfStore from '../stores/pdfStore.js';

/**
 * useAnnotations — Bridges text selection and tool mode to annotation creation.
 *
 * Provides convenient methods to create annotations from the current
 * text selection, respecting the active tool mode and color.
 *
 * @param {number} documentId - active document ID
 * @param {number} projectId - active project ID
 * @returns {object} annotation action methods
 */
export default function useAnnotations(documentId, projectId) {
  const { addHighlight, addInkStroke } = useAnnotationStore();
  const { activeColor, toolMode } = usePdfStore();

  /**
   * Create a highlight/underline/strikethrough from a text selection.
   * @param {object} params
   * @param {string} params.selectedText
   * @param {Array} params.selectedRects - normalized rects [{x, y, width, height}]
   * @param {number} params.pageNumber
   * @param {string} [params.type] - override type, defaults to toolMode
   * @param {string} [params.color] - override color, defaults to activeColor
   */
  const createHighlightFromSelection = useCallback(async ({
    selectedText,
    selectedRects,
    pageNumber,
    type,
    color,
  }) => {
    if (!selectedText || !selectedRects.length || !pageNumber) return null;
    if (!documentId || !projectId) return null;

    const annotation = await addHighlight({
      documentId,
      projectId,
      type: type || toolMode || 'highlight',
      pageNumber,
      color: color || activeColor || 'yellow',
      rects: selectedRects,
      selectedText,
    });

    // Clear the browser selection after highlighting
    window.getSelection()?.removeAllRanges();

    return annotation;
  }, [documentId, projectId, toolMode, activeColor, addHighlight]);

  /**
   * Save an ink stroke as an annotation.
   * @param {object} params
   * @param {number} params.pageNumber
   * @param {Array} params.points - [{x, y}] normalized
   * @param {string} params.color
   * @param {number} params.strokeWidth
   */
  const saveInkStroke = useCallback(async ({
    pageNumber,
    points,
    color,
    strokeWidth,
  }) => {
    if (!points || points.length < 2) return null;
    if (!documentId || !projectId) return null;

    return await addInkStroke({
      documentId,
      projectId,
      pageNumber,
      color: color || activeColor || 'red',
      points,
      strokeWidth: strokeWidth || 2,
    });
  }, [documentId, projectId, activeColor, addInkStroke]);

  return {
    createHighlightFromSelection,
    saveInkStroke,
  };
}
