import { create } from 'zustand';
import db from '../db/database.js';

/**
 * Search Store — manages global search state (Cmd+K).
 * 
 * Searches across: annotations, excerpts, tags, document names.
 * Results are grouped by type with source references.
 */
const useSearchStore = create((set, get) => ({
  // ---- State ----
  isOpen: false,          // Whether the search overlay is visible
  query: '',
  results: [],            // Array of { type, id, text, meta }
  isSearching: false,
  activeFilters: {
    types: [],            // 'annotation' | 'excerpt' | 'document' | 'tag'
    documentId: null,     // Filter to a specific document
    tags: [],             // Filter by tags
  },

  // ---- Actions ----

  /**
   * Toggle search overlay visibility.
   */
  toggleSearch: () => {
    set((state) => ({
      isOpen: !state.isOpen,
      query: state.isOpen ? '' : state.query,
      results: state.isOpen ? [] : state.results,
    }));
  },

  /**
   * Open search overlay.
   */
  openSearch: () => {
    set({ isOpen: true, query: '', results: [] });
  },

  /**
   * Close search overlay.
   */
  closeSearch: () => {
    set({ isOpen: false, query: '', results: [] });
  },

  /**
   * Perform a global search across all data in a project.
   * @param {string} query
   * @param {number} projectId
   */
  search: async (query, projectId) => {
    if (!query || query.trim().length === 0) {
      set({ query, results: [] });
      return;
    }

    set({ query, isSearching: true });
    const lowerQuery = query.toLowerCase();
    const results = [];

    try {
      const { activeFilters } = get();
      const filterTypes = activeFilters.types;
      const shouldSearch = (type) =>
        filterTypes.length === 0 || filterTypes.includes(type);

      // Search annotations
      if (shouldSearch('annotation')) {
        const annotations = await db.annotations
          .where('projectId')
          .equals(projectId)
          .toArray();

        annotations.forEach((a) => {
          const matchNote = a.noteText?.toLowerCase().includes(lowerQuery);
          const matchText = a.selectedText?.toLowerCase().includes(lowerQuery);
          const matchTag = a.tags?.some((t) => t.toLowerCase().includes(lowerQuery));

          if (matchNote || matchText || matchTag) {
            results.push({
              type: 'annotation',
              id: a.id,
              text: matchNote ? a.noteText : (a.selectedText || ''),
              meta: {
                documentId: a.documentId,
                pageNumber: a.pageNumber,
                color: a.color,
                annotationType: a.type,
              },
            });
          }
        });
      }

      // Search excerpts
      if (shouldSearch('excerpt')) {
        const excerpts = await db.excerpts
          .where('projectId')
          .equals(projectId)
          .toArray();

        excerpts.forEach((e) => {
          const matchText = e.text?.toLowerCase().includes(lowerQuery);
          const matchTag = e.tags?.some((t) => t.toLowerCase().includes(lowerQuery));

          if (matchText || matchTag) {
            results.push({
              type: 'excerpt',
              id: e.id,
              text: e.text,
              meta: {
                documentId: e.documentId,
                sourcePageNumber: e.sourcePageNumber,
                color: e.color,
              },
            });
          }
        });
      }

      // Search documents
      if (shouldSearch('document')) {
        const documents = await db.documents
          .where('projectId')
          .equals(projectId)
          .toArray();

        documents.forEach((d) => {
          if (d.fileName?.toLowerCase().includes(lowerQuery)) {
            results.push({
              type: 'document',
              id: d.id,
              text: d.fileName,
              meta: {
                pageCount: d.pageCount,
              },
            });
          }
        });
      }

      // Search tags
      if (shouldSearch('tag')) {
        const tags = await db.tags
          .where('projectId')
          .equals(projectId)
          .toArray();

        tags.forEach((t) => {
          if (t.name?.toLowerCase().includes(lowerQuery)) {
            results.push({
              type: 'tag',
              id: t.id,
              text: t.name,
              meta: {
                color: t.color,
              },
            });
          }
        });
      }

      // Apply document filter if set
      let filteredResults = results;
      if (activeFilters.documentId) {
        filteredResults = results.filter(
          (r) => !r.meta.documentId || r.meta.documentId === activeFilters.documentId
        );
      }

      set({ results: filteredResults, isSearching: false });
    } catch (err) {
      console.error('Search failed:', err);
      set({ results: [], isSearching: false });
    }
  },

  /**
   * Set active filters.
   */
  setFilters: (filters) => {
    set((state) => ({
      activeFilters: { ...state.activeFilters, ...filters },
    }));
  },

  /**
   * Clear all filters.
   */
  clearFilters: () => {
    set({
      activeFilters: {
        types: [],
        documentId: null,
        tags: [],
      },
    });
  },
}));

export default useSearchStore;
