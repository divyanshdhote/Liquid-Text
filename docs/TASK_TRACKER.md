# LiquidText MVP — Task Tracker

## Phase 1: Project Scaffold & Design System ✅
- [x] Initialize Vite + React project
- [x] Install dependencies (pdfjs-dist, @xyflow/react, zustand, dexie, lucide-react, nanoid)
- [x] Create design system (index.css) — tokens, reset, premium aesthetics
- [x] Set up index.html with Google Fonts (Inter), meta tags, SEO
- [x] Create shell App.jsx with placeholder layout
- [x] Verify dev server runs cleanly

## Phase 2: Local Database & State Stores ✅
- [x] Dexie schema (src/db/database.js)
- [x] projectStore.js (Zustand)
- [x] pdfStore.js
- [x] annotationStore.js
- [x] workspaceStore.js
- [x] searchStore.js
- [x] useAutoSave.js hook

## Phase 3: PDF Viewer ✅
- [x] PDFViewer.jsx — main container, loads pdfjs document
- [x] PDFPage.jsx — renders single page to canvas + overlays
- [x] PDFTextLayer.jsx — transparent text divs for selection
- [x] PDFThumbnails.jsx — page thumbnail sidebar
- [x] PDFSearch.jsx — in-document search with match highlighting
- [x] PDFOutline.jsx — TOC/bookmark tree from PDF metadata
- [x] usePDFDocument.js — pdfjs document lifecycle hook
- [x] useTextSelection.js — tracks text selection in PDF pageshlighting

## Phase 4: Annotations & Highlighting ✅
- [x] HighlightLayer.jsx
- [x] InkCanvas.jsx
- [x] NotePopover.jsx
- [x] ColorPicker.jsx
- [x] useAnnotations.js
- [x] SelectionActionBar.jsx

## Phase 5: Active Workspace Canvas ✅
- [x] WorkspaceCanvas.jsx
- [x] ExcerptNode.jsx
- [x] GroupNode.jsx
- [x] ConnectionEdge.jsx
- [x] WorkspaceToolbar.jsx
- [x] useDragToWorkspace.js

## Phase 6: Deep Links & Hyperlinks ✅
- [x] deepLinkUtils.js (logic handled within pdfStore instead)
- [x] Hyperlink UI in annotations and excerpts

## Phase 7: Project Management & File Upload ✅
- [x] FileUpload.jsx
- [x] ProjectManager.jsx
- [x] DocumentTabs.jsx
- [x] exportUtils.js

## Phase 8: Global Search (Secondary Feature)
- [ ] GlobalSearch.jsx (Cmd+K)
- [ ] searchStore integration
- [ ] TagInput.jsx

## Phase 9: Layout & Polish
- [ ] SplitPane.jsx
- [ ] Toolbar.jsx
- [ ] Sidebar.jsx (with Outline tab)
- [ ] Keyboard shortcuts
- [ ] Final visual polish
