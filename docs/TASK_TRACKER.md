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

## Phase 3: PDF Viewer
- [ ] PDFViewer.jsx
- [ ] PDFPage.jsx
- [ ] PDFTextLayer.jsx
- [ ] PDFThumbnails.jsx
- [ ] PDFSearch.jsx
- [ ] PDFOutline.jsx
- [ ] usePDFDocument.js
- [ ] useTextSelection.js

## Phase 4: Annotations & Highlighting
- [ ] HighlightLayer.jsx
- [ ] InkCanvas.jsx
- [ ] NotePopover.jsx
- [ ] ColorPicker.jsx
- [ ] useAnnotations.js

## Phase 5: Active Workspace Canvas
- [ ] WorkspaceCanvas.jsx
- [ ] ExcerptNode.jsx
- [ ] GroupNode.jsx
- [ ] ConnectionEdge.jsx
- [ ] WorkspaceToolbar.jsx
- [ ] useDragToWorkspace.js

## Phase 6: Deep Links & Hyperlinks
- [ ] deepLinkUtils.js
- [ ] Hyperlink UI in annotations and excerpts

## Phase 7: Project Management & File Upload
- [ ] FileUpload.jsx
- [ ] ProjectManager.jsx
- [ ] DocumentTabs.jsx
- [ ] exportUtils.js

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
