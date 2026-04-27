import { create } from 'zustand';
import { nanoid } from 'nanoid';
import db from '../db/database.js';

/**
 * Annotation Store — manages highlights, notes, ink strokes on PDF pages.
 * 
 * Annotation types:
 *   - 'highlight': colored rectangles over text
 *   - 'underline': colored lines under text
 *   - 'strikethrough': colored lines through text
 *   - 'ink': freehand drawing strokes
 *   - 'note': standalone note (not tied to a highlight)
 * 
 * Each annotation has:
 *   - id: unique string (nanoid)
 *   - documentId: FK to documents table
 *   - projectId: FK to projects table
 *   - type: annotation type
 *   - pageNumber: which PDF page
 *   - color: highlight color name ('yellow', 'green', etc.)
 *   - rects: array of { x, y, width, height } normalized to page dimensions
 *   - noteText: optional note content
 *   - tags: array of tag names
 *   - points: array of {x, y} for ink strokes
 *   - strokeWidth: line width for ink
 *   - createdAt: ISO timestamp
 */
const useAnnotationStore = create((set, get) => ({
  // ---- State ----
  annotations: [], // Annotations for the currently active document
  isLoading: false,

  // ---- Actions ----

  /**
   * Load all annotations for a specific document.
   * @param {number} documentId
   */
  loadAnnotations: async (documentId) => {
    set({ isLoading: true });
    try {
      const annotations = await db.annotations
        .where('documentId')
        .equals(documentId)
        .toArray();
      set({ annotations, isLoading: false });
    } catch (err) {
      console.error('Failed to load annotations:', err);
      set({ isLoading: false });
    }
  },

  /**
   * Clear annotations (when switching documents).
   */
  clearAnnotations: () => {
    set({ annotations: [] });
  },

  /**
   * Add a highlight annotation.
   * @param {object} params
   * @param {number} params.documentId
   * @param {number} params.projectId
   * @param {string} params.type - 'highlight' | 'underline' | 'strikethrough'
   * @param {number} params.pageNumber
   * @param {string} params.color - color name
   * @param {Array} params.rects - [{x, y, width, height}]
   * @param {string} params.selectedText - the highlighted text content
   * @returns {object} The created annotation
   */
  addHighlight: async ({ documentId, projectId, type = 'highlight', pageNumber, color, rects, selectedText = '' }) => {
    const now = new Date().toISOString();
    const annotation = {
      uid: nanoid(),
      documentId,
      projectId,
      type,
      pageNumber,
      color,
      rects,
      selectedText,
      noteText: '',
      tags: [],
      createdAt: now,
    };

    try {
      const id = await db.annotations.add(annotation);
      const saved = { ...annotation, id };
      set((state) => ({
        annotations: [...state.annotations, saved],
      }));
      return saved;
    } catch (err) {
      console.error('Failed to add highlight:', err);
      return null;
    }
  },

  /**
   * Add an ink stroke annotation.
   * @param {object} params
   * @param {number} params.documentId
   * @param {number} params.projectId
   * @param {number} params.pageNumber
   * @param {string} params.color
   * @param {Array} params.points - [{x, y}]
   * @param {number} params.strokeWidth
   * @returns {object} The created annotation
   */
  addInkStroke: async ({ documentId, projectId, pageNumber, color, points, strokeWidth = 2 }) => {
    const now = new Date().toISOString();
    const annotation = {
      uid: nanoid(),
      documentId,
      projectId,
      type: 'ink',
      pageNumber,
      color,
      rects: [],
      points,
      strokeWidth,
      noteText: '',
      tags: [],
      createdAt: now,
    };

    try {
      const id = await db.annotations.add(annotation);
      const saved = { ...annotation, id };
      set((state) => ({
        annotations: [...state.annotations, saved],
      }));
      return saved;
    } catch (err) {
      console.error('Failed to add ink stroke:', err);
      return null;
    }
  },

  /**
   * Update an annotation's note text.
   * @param {number} annotationId
   * @param {string} noteText
   */
  updateNote: async (annotationId, noteText) => {
    try {
      await db.annotations.update(annotationId, { noteText });
      set((state) => ({
        annotations: state.annotations.map((a) =>
          a.id === annotationId ? { ...a, noteText } : a
        ),
      }));
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  },

  /**
   * Update an annotation's color.
   * @param {number} annotationId
   * @param {string} color
   */
  updateColor: async (annotationId, color) => {
    try {
      await db.annotations.update(annotationId, { color });
      set((state) => ({
        annotations: state.annotations.map((a) =>
          a.id === annotationId ? { ...a, color } : a
        ),
      }));
    } catch (err) {
      console.error('Failed to update color:', err);
    }
  },

  /**
   * Update an annotation's tags.
   * @param {number} annotationId
   * @param {string[]} tags
   */
  updateTags: async (annotationId, tags) => {
    try {
      await db.annotations.update(annotationId, { tags });
      set((state) => ({
        annotations: state.annotations.map((a) =>
          a.id === annotationId ? { ...a, tags } : a
        ),
      }));
    } catch (err) {
      console.error('Failed to update tags:', err);
    }
  },

  /**
   * Delete an annotation.
   * @param {number} annotationId
   */
  deleteAnnotation: async (annotationId) => {
    try {
      await db.annotations.delete(annotationId);
      set((state) => ({
        annotations: state.annotations.filter((a) => a.id !== annotationId),
      }));
    } catch (err) {
      console.error('Failed to delete annotation:', err);
    }
  },

  // ---- Computed / Helpers ----

  /**
   * Get annotations for a specific page.
   * @param {number} pageNumber
   * @returns {Array}
   */
  getByPage: (pageNumber) => {
    return get().annotations.filter((a) => a.pageNumber === pageNumber);
  },

  /**
   * Get annotations matching a tag.
   * @param {string} tag
   * @returns {Array}
   */
  getByTag: (tag) => {
    return get().annotations.filter((a) => a.tags.includes(tag));
  },

  /**
   * Get annotations by color.
   * @param {string} color
   * @returns {Array}
   */
  getByColor: (color) => {
    return get().annotations.filter((a) => a.color === color);
  },

  /**
   * Get all unique tags used in current annotations.
   * @returns {string[]}
   */
  getAllTags: () => {
    const allTags = new Set();
    get().annotations.forEach((a) => {
      a.tags?.forEach((t) => allTags.add(t));
    });
    return Array.from(allTags);
  },
}));

export default useAnnotationStore;
