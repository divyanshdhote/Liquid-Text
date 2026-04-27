import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * PDFSearch — Inline search controls rendered inside the PDF toolbar.
 *
 * All search state is LOCAL to avoid re-rendering the parent.
 * Highlighting is done via direct DOM manipulation (no React re-renders).
 *
 * @param {object} props
 * @param {object} props.pdfDoc - pdf.js document proxy
 * @param {number} props.pageCount - total pages
 * @param {function} props.onClose - close the search bar
 * @param {function} props.onNavigateToPage - navigate to a specific page
 */
const PDFSearch = memo(function PDFSearch({ pdfDoc, pageCount, onClose, onNavigateToPage }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  // Track the latest search to discard stale results
  const searchIdRef = useRef(0);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Clear highlights on unmount
  useEffect(() => {
    return () => clearAllHighlights();
  }, []);

  /**
   * Clear all search highlights from the DOM.
   */
  const clearAllHighlights = () => {
    document.querySelectorAll('.pdf-text-layer .search-highlight').forEach((el) => {
      el.classList.remove('search-highlight');
    });
    document.querySelectorAll('.pdf-text-layer .search-highlight--active').forEach((el) => {
      el.classList.remove('search-highlight--active');
    });
  };

  /**
   * Highlight matching text spans on a specific page using direct DOM manipulation.
   * Returns the matching spans so we can scroll to the active one.
   */
  const highlightOnPage = useCallback((pageNum, searchQuery, matchIndexOnPage) => {
    clearAllHighlights();

    if (!searchQuery || searchQuery.trim().length < 2) return;

    const pageEl = document.getElementById(`pdf-page-${pageNum}`);
    if (!pageEl) return;

    const textLayer = pageEl.querySelector('.pdf-text-layer');
    if (!textLayer) return;

    const lowerQuery = searchQuery.toLowerCase();
    const spans = textLayer.querySelectorAll('span');
    let matchCount = 0;

    spans.forEach((span) => {
      const text = span.textContent.toLowerCase();
      if (text.includes(lowerQuery)) {
        span.classList.add('search-highlight');
        if (matchCount === matchIndexOnPage) {
          span.classList.add('search-highlight--active');
          // Scroll the highlighted span into view within the PDF container
          span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        matchCount++;
      }
    });
  }, []);

  /**
   * Perform search across all pages — fully local, no store updates.
   * Does NOT auto-navigate to avoid layout shift while typing.
   */
  const performSearch = useCallback(async (searchQuery) => {
    const currentSearchId = ++searchIdRef.current;

    if (!searchQuery || searchQuery.trim().length < 2 || !pdfDoc) {
      setResults([]);
      setActiveIndex(-1);
      setIsSearching(false);
      clearAllHighlights();
      return;
    }

    setIsSearching(true);
    const lowerQuery = searchQuery.toLowerCase();
    const allResults = [];

    for (let i = 1; i <= pageCount; i++) {
      if (searchIdRef.current !== currentSearchId) return;

      try {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        const lowerPageText = pageText.toLowerCase();

        let startIndex = 0;
        let matchIndexOnPage = 0;
        while ((startIndex = lowerPageText.indexOf(lowerQuery, startIndex)) !== -1) {
          allResults.push({
            pageNumber: i,
            matchIndexOnPage,
          });
          startIndex += searchQuery.length;
          matchIndexOnPage++;
        }
      } catch {
        // Skip pages that fail to load
      }
    }

    if (searchIdRef.current !== currentSearchId) return;

    setResults(allResults);
    setActiveIndex(allResults.length > 0 ? 0 : -1);
    setIsSearching(false);

    // Don't auto-navigate — wait for user to press Enter or click arrows
  }, [pdfDoc, pageCount]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Navigate to a specific result: scroll to page + highlight text.
   */
  const goToResult = useCallback((index) => {
    if (index < 0 || index >= results.length) return;
    setActiveIndex(index);

    const result = results[index];
    onNavigateToPage(result.pageNumber);

    // Highlight after a short delay to let the page scroll into view & render
    setTimeout(() => {
      highlightOnPage(result.pageNumber, query, result.matchIndexOnPage);
    }, 300);
  }, [results, onNavigateToPage, highlightOnPage, query]);

  const nextResult = useCallback(() => {
    if (results.length === 0) return;
    goToResult((activeIndex + 1) % results.length);
  }, [results, activeIndex, goToResult]);

  const prevResult = useCallback(() => {
    if (results.length === 0) return;
    goToResult((activeIndex - 1 + results.length) % results.length);
  }, [results, activeIndex, goToResult]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && activeIndex === -1) {
        // First Enter press after search completes — go to first result
        goToResult(0);
      } else {
        e.shiftKey ? prevResult() : nextResult();
      }
    }
    if (e.key === 'Escape') {
      clearAllHighlights();
      onClose();
    }
  };

  const handleClose = () => {
    clearAllHighlights();
    onClose();
  };

  return (
    <>
      <div className="pdf-toolbar__divider" />

      <div className="pdf-search-inline" id="pdf-search">
        <input
          ref={inputRef}
          type="text"
          className="pdf-search-inline__input"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          id="input-pdf-search"
        />

        {query && (
          <span className="pdf-search-inline__count">
            {isSearching
              ? '...'
              : results.length > 0
                ? `${activeIndex + 1}/${results.length}`
                : '0'}
          </span>
        )}

        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={prevResult}
          disabled={results.length === 0}
          title="Previous (Shift+Enter)"
          id="btn-search-prev"
        >
          <ChevronUp size={14} />
        </button>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={nextResult}
          disabled={results.length === 0}
          title="Next (Enter)"
          id="btn-search-next"
        >
          <ChevronDown size={14} />
        </button>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={handleClose}
          title="Close (Esc)"
          id="btn-search-close"
        >
          <X size={14} />
        </button>
      </div>
    </>
  );
});

export default PDFSearch;
