import { create } from 'zustand';

/**
 * PDF Store — manages the current PDF viewing state.
 * 
 * This store is ephemeral (not persisted to Dexie). It tracks the
 * runtime state of the PDF viewer: which document is active, current
 * page, zoom level, scroll position, and in-document search.
 */
const usePdfStore = create((set, get) => ({
  // ---- State ----
  activeDocumentId: null,
  currentPage: 1,
  totalPages: 0,
  zoom: 1.0,           // 1.0 = 100%
  scrollPosition: 0,   // Vertical scroll offset in pixels
  
  // In-document search
  searchQuery: '',
  searchResults: [],    // Array of { pageNumber, matchIndex }
  activeSearchIndex: -1,
  isSearchOpen: false,

  // Deep linking
  jumpTarget: null,    // { pageNumber, rects, timestamp }

  // View mode
  viewMode: 'scroll',  // 'scroll' | 'single-page'
  
  // Tool mode
  toolMode: 'select',  // 'select' | 'highlight' | 'underline' | 'strikethrough' | 'ink' | 'eraser'
  
  // Active highlight color (used when toolMode is highlight/underline/strikethrough)
  activeColor: 'yellow',

  // ---- Actions ----

  /**
   * Set the active document to view.
   */
  setActiveDocument: (documentId, totalPages = 0) => {
    set({
      activeDocumentId: documentId,
      totalPages,
      currentPage: 1,
      zoom: 1.0,
      scrollPosition: 0,
      searchQuery: '',
      searchResults: [],
      activeSearchIndex: -1,
    });
  },

  /**
   * Close the active document.
   */
  closeDocument: () => {
    set({
      activeDocumentId: null,
      currentPage: 1,
      totalPages: 0,
      zoom: 1.0,
      scrollPosition: 0,
    });
  },

  /**
   * Navigate to a specific page.
   */
  goToPage: (pageNumber) => {
    const { totalPages } = get();
    const clamped = Math.max(1, Math.min(pageNumber, totalPages));
    set({ currentPage: clamped });
  },

  /**
   * Go to the next page.
   */
  nextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 });
    }
  },

  /**
   * Go to the previous page.
   */
  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    }
  },

  /**
   * Set the zoom level.
   * @param {number} zoom - Zoom factor (0.25 to 5.0)
   */
  setZoom: (zoom) => {
    const clamped = Math.max(0.25, Math.min(5.0, zoom));
    set({ zoom: clamped });
  },

  /**
   * Zoom in by a step.
   */
  zoomIn: () => {
    const { zoom } = get();
    const steps = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
    const nextStep = steps.find((s) => s > zoom) || 5.0;
    set({ zoom: nextStep });
  },

  /**
   * Zoom out by a step.
   */
  zoomOut: () => {
    const { zoom } = get();
    const steps = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
    const prevStep = [...steps].reverse().find((s) => s < zoom) || 0.25;
    set({ zoom: prevStep });
  },

  /**
   * Update the scroll position.
   */
  setScrollPosition: (position) => {
    set({ scrollPosition: position });
  },

  /**
   * Set the tool mode.
   */
  setToolMode: (mode) => {
    set({ toolMode: mode });
  },

  /**
   * Set the active highlight color.
   */
  setActiveColor: (color) => {
    set({ activeColor: color });
  },

  /**
   * Set the in-document search query and results.
   */
  setSearchQuery: (query) => {
    set({ searchQuery: query, activeSearchIndex: query ? 0 : -1 });
  },

  setSearchResults: (results) => {
    set({ searchResults: results, activeSearchIndex: results.length > 0 ? 0 : -1 });
  },

  /**
   * Navigate to the next search result.
   */
  nextSearchResult: () => {
    const { searchResults, activeSearchIndex } = get();
    if (searchResults.length === 0) return;
    const next = (activeSearchIndex + 1) % searchResults.length;
    set({ activeSearchIndex: next, currentPage: searchResults[next].pageNumber });
  },

  /**
   * Navigate to the previous search result.
   */
  prevSearchResult: () => {
    const { searchResults, activeSearchIndex } = get();
    if (searchResults.length === 0) return;
    const prev = (activeSearchIndex - 1 + searchResults.length) % searchResults.length;
    set({ activeSearchIndex: prev, currentPage: searchResults[prev].pageNumber });
  },

  /**
   * Set total pages (called when PDF loads).
   */
  setTotalPages: (totalPages) => {
    set({ totalPages });
  },

  setSearchState: (state) => set(state),

  /**
   * Toggle search UI
   */
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),

  /**
   * Deep link to a specific source in the PDF.
   */
  jumpToSource: (pageNumber, rects) => {
    set({
      jumpTarget: {
        pageNumber,
        rects,
        timestamp: Date.now(),
      },
    });
  },
}));

export default usePdfStore;
