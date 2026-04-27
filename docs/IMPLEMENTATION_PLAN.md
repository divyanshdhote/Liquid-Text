# LiquidText MVP — Full Implementation Plan

A local-first, web-based PDF workspace app. Users upload PDFs, annotate them, pull excerpts to a freeform canvas, and build visual connections between ideas.

## Decisions Locked In

| Decision | Choice |
|---|---|
| Storage | Local-first (IndexedDB via Dexie.js) → PostgreSQL later |
| Platform | Web-only (React + Vite) → Electron later |
| Scope | Core features + 2 secondary features (Document Outline, Global Search) |
| File Handling | Upload from file system (drag-and-drop + file picker) |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React 19 + Vite | Fast HMR, modern React features |
| PDF Engine | `pdfjs-dist` (Mozilla pdf.js) | Gold standard, renders to canvas, exposes text layer |
| Workspace Canvas | `@xyflow/react` (React Flow v12) | Mature node/edge canvas with zoom, pan, drag built-in |
| State | Zustand | Lightweight, no boilerplate, works great with React Flow |
| Local DB | Dexie.js (IndexedDB wrapper) | Promise-based, schema versioning, easy migration to server later |
| Styling | Vanilla CSS + CSS custom properties | Full control, dark-mode ready, no build deps |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| IDs | `nanoid` | Compact unique IDs for annotations, excerpts, links |
| Fonts | Inter (Google Fonts) | Clean, modern, highly readable |

---

## Project Structure

```
/src
├── main.jsx                    # Entry point
├── App.jsx                     # Root layout (split-pane: PDF viewer + workspace)
├── index.css                   # Global design tokens & reset
│
├── /db
│   └── database.js             # Dexie schema: projects, documents, annotations, excerpts, connections, tags
│
├── /stores
│   ├── projectStore.js         # Active project, doc list, save/load
│   ├── pdfStore.js             # Current PDF state (pages, zoom, scroll position)
│   ├── annotationStore.js      # Highlights, notes, ink strokes
│   ├── workspaceStore.js       # Excerpt cards, connections, groups
│   └── searchStore.js          # Global search state & results
│
├── /components
│   ├── /layout
│   │   ├── SplitPane.jsx       # Resizable split between PDF + workspace
│   │   ├── Toolbar.jsx         # Top toolbar (project actions, tools, mode switching)
│   │   └── Sidebar.jsx         # Collapsible left sidebar (outline, tags, search)
│   │
│   ├── /pdf
│   │   ├── PDFViewer.jsx       # Main PDF container (handles file loading, pdfjs doc)
│   │   ├── PDFPage.jsx         # Single page renderer (canvas + text layer + annotation layer)
│   │   ├── PDFTextLayer.jsx    # Transparent text overlay for selection
│   │   ├── PDFThumbnails.jsx   # Page thumbnail sidebar
│   │   ├── PDFSearch.jsx       # In-document search bar + result navigation
│   │   └── PDFOutline.jsx      # Table of contents / bookmark tree
│   │
│   ├── /annotations
│   │   ├── HighlightLayer.jsx  # SVG overlay for highlights on each page
│   │   ├── InkCanvas.jsx       # Canvas overlay for freehand drawing
│   │   ├── NotePopover.jsx     # Popover for editing annotation notes
│   │   └── ColorPicker.jsx     # Color selection widget
│   │
│   ├── /workspace
│   │   ├── WorkspaceCanvas.jsx # React Flow canvas container
│   │   ├── ExcerptNode.jsx     # Custom React Flow node for excerpts
│   │   ├── GroupNode.jsx       # Custom node for grouping excerpts
│   │   ├── ConnectionEdge.jsx  # Custom edge with labels
│   │   └── WorkspaceToolbar.jsx# Workspace-specific tools (add group, export, etc.)
│   │
│   ├── /project
│   │   ├── ProjectManager.jsx  # Create/open/delete projects modal
│   │   ├── DocumentTabs.jsx    # Tab bar for multi-document switching
│   │   └── FileUpload.jsx      # Drag-and-drop + file picker for PDF import
│   │
│   ├── /search
│   │   └── GlobalSearch.jsx    # Search across annotations, excerpts, notes
│   │
│   └── /common
│       ├── Modal.jsx           # Reusable modal
│       ├── TagInput.jsx        # Tag creation and assignment widget
│       └── Tooltip.jsx         # Reusable tooltip
│
├── /hooks
│   ├── usePDFDocument.js       # Load + manage pdfjs document instance
│   ├── useTextSelection.js     # Track user text selection on PDF pages
│   ├── useAnnotations.js       # CRUD for highlights, notes, ink
│   ├── useDragToWorkspace.js   # Handle dragging selected text to workspace
│   └── useAutoSave.js          # Debounced auto-save to IndexedDB
│
└── /utils
    ├── pdfTextUtils.js         # Extract text ranges, compute rects from PDF text layer
    ├── deepLinkUtils.js        # Create/parse deep links (doc + page + highlight ref)
    ├── exportUtils.js          # Export workspace as image / Markdown / JSON
    └── colorUtils.js           # Highlight color palette + utilities
```

---

## Proposed Changes — Phase by Phase

### Phase 1: Project Scaffold & Design System ✅ COMPLETE

#### [DONE] `package.json` (via `npx create-vite`)
- Initialized React + Vite project
- Installed: `pdfjs-dist`, `@xyflow/react`, `zustand`, `dexie`, `lucide-react`, `nanoid`

#### [DONE] `src/index.css`
- CSS reset + design tokens (colors, typography, spacing, shadows, radii)
- Dark theme with deep navy background, blue-violet/teal accents, glassmorphism panels
- Utility classes: `.glass-panel`, `.btn-*`, `.badge`, `.fade-in`, `.skeleton`, etc.
- 600+ lines of design system CSS

#### [DONE] `index.html`
- Google Fonts (Inter), meta tags, SEO basics

#### [DONE] `src/App.jsx`
- Toolbar with logo and "Open PDF" button
- Welcome screen with drag-and-drop file upload zone
- File input wired up (accepts .pdf, multiple files)
- Currently stores files in local state (Phase 2 will persist to IndexedDB)

---

### Phase 2: Local Database & State Stores

#### [NEW] `src/db/database.js`
Dexie schema with tables:

```
projects:    ++id, name, createdAt, updatedAt
documents:   ++id, projectId, fileName, fileData (Blob), pageCount
annotations: ++id, documentId, projectId, type, pageNumber, color, rects, noteText, tags, createdAt
excerpts:    ++id, documentId, projectId, text, sourcePageNumber, sourceRects,
             workspaceX, workspaceY, width, height, tags, color, createdAt
connections: ++id, projectId, sourceExcerptId, targetExcerptId, label, color
groups:      ++id, projectId, label, color, excerptIds, x, y, width, height
tags:        ++id, projectId, name, color
```

#### [NEW] `src/stores/projectStore.js`
- `activeProjectId`, `projects[]`, `documents[]`
- Actions: `createProject`, `openProject`, `deleteProject`, `addDocument`, `removeDocument`
- Auto-persist to Dexie on every mutation via `useAutoSave`

#### [NEW] `src/stores/pdfStore.js`
- `activeDocumentId`, `currentPage`, `zoom`, `scrollPosition`, `searchQuery`, `searchResults`

#### [NEW] `src/stores/annotationStore.js`
- `annotations[]` for the active document
- Actions: `addHighlight`, `addNote`, `addInkStroke`, `updateAnnotation`, `deleteAnnotation`
- Filter helpers: `getByPage()`, `getByTag()`, `getByColor()`

#### [NEW] `src/stores/workspaceStore.js`
- `excerpts[]` (React Flow nodes), `connections[]` (React Flow edges), `groups[]`
- Actions: `addExcerpt`, `moveExcerpt`, `resizeExcerpt`, `addConnection`, `createGroup`, `addToGroup`

#### [NEW] `src/stores/searchStore.js`
- `query`, `results[]`, `activeFilters` (by doc, tag, type)

#### [NEW] `src/hooks/useAutoSave.js`
- Debounced (500ms) save of all store state to Dexie
- Undo/redo history stack (keep last 50 states)

---

### Phase 3: PDF Viewer

#### [NEW] `src/components/pdf/PDFViewer.jsx`
- Accepts a `Blob` or `ArrayBuffer` from Dexie
- Loads via `pdfjs.getDocument()`, stores `pdfDocProxy` in ref
- Renders a scrollable list of `<PDFPage>` components (virtualized for perf)
- Handles zoom controls (fit width, fit page, manual %)

#### [NEW] `src/components/pdf/PDFPage.jsx`
- Renders a single page to `<canvas>`
- Overlays `<PDFTextLayer>` for selection
- Overlays `<HighlightLayer>` for annotations
- Overlays `<InkCanvas>` when in draw mode

#### [NEW] `src/components/pdf/PDFTextLayer.jsx`
- Renders the invisible text divs from `page.getTextContent()`
- Enables native browser text selection
- Fires events on selection change (used by highlighting + excerpt pulling)

#### [NEW] `src/components/pdf/PDFThumbnails.jsx`
- Sidebar with small canvas renders of each page
- Click to jump, current page highlighted

#### [NEW] `src/components/pdf/PDFSearch.jsx`
- Search bar with prev/next navigation
- Highlights matches in the text layer

#### [NEW] `src/components/pdf/PDFOutline.jsx`
- Reads `pdfDocProxy.getOutline()` for bookmarks/TOC
- Renders as collapsible tree; click navigates to page

#### [NEW] `src/hooks/usePDFDocument.js`
- Manages the lifecycle of a `pdfjs` document proxy
- Handles loading, error, page count, metadata extraction

#### [NEW] `src/hooks/useTextSelection.js`
- Listens for `selectionchange` events within the PDF text layer
- Returns `{ selectedText, selectedRects, pageNumber }` for annotation/excerpt creation

---

### Phase 4: Annotations & Highlighting

#### [NEW] `src/components/annotations/HighlightLayer.jsx`
- SVG overlay positioned on each PDF page
- Renders colored rectangles from `annotation.rects`
- Click a highlight to open `NotePopover`
- Supports highlight, underline, and strikethrough styles

#### [NEW] `src/components/annotations/InkCanvas.jsx`
- HTML Canvas overlay for freehand drawing
- Configurable stroke color, width, opacity
- Strokes serialized as point arrays, stored as annotations

#### [NEW] `src/components/annotations/NotePopover.jsx`
- Appears anchored to a highlight
- Rich text input for notes
- Tag assignment via `<TagInput>`
- Delete annotation button

#### [NEW] `src/components/annotations/ColorPicker.jsx`
- Curated palette: 8 colors (yellow, green, blue, pink, orange, purple, red, teal)
- Used by highlights, excerpt cards, groups, and tags

#### [NEW] `src/hooks/useAnnotations.js`
- Bridges `useTextSelection` → `annotationStore`
- `createHighlightFromSelection()`, `addNoteToHighlight()`, `deleteAnnotation()`

---

### Phase 5: Active Workspace Canvas

#### [NEW] `src/components/workspace/WorkspaceCanvas.jsx`
- `<ReactFlow>` container with minimap, controls, background grid
- Custom node types: `excerpt`, `group`
- Custom edge type: `labeled-connection`
- Drop zone for dragged excerpts from PDF
- Glassmorphic styling on nodes

#### [NEW] `src/components/workspace/ExcerptNode.jsx`
- Custom React Flow node displaying:
  - Excerpt text (truncated with expand)
  - Source doc name + page number
  - Color-coded border (matches highlight color)
  - Tag badges
  - "Navigate to source" button → scrolls PDF to source location
- Resizable, with drag handle

#### [NEW] `src/components/workspace/GroupNode.jsx`
- A larger container node that can hold multiple excerpt nodes
- Label, color, collapsible
- Excerpt nodes can be dragged in/out

#### [NEW] `src/components/workspace/ConnectionEdge.jsx`
- Custom edge with optional label
- Animated dash pattern
- Click to edit label or delete

#### [NEW] `src/components/workspace/WorkspaceToolbar.jsx`
- Tools: add group, auto-layout, export workspace, clear canvas
- Zoom controls

#### [NEW] `src/hooks/useDragToWorkspace.js`
- On text selection in PDF, show a "Send to Workspace" button
- Creates an excerpt node at a default position in the workspace
- Alternative: actual drag-and-drop from PDF to workspace panel

---

### Phase 6: Deep Links & Hyperlinks

#### [NEW] `src/utils/deepLinkUtils.js`
- `createDeepLink(documentId, pageNumber, annotationId?)` → URL hash format
- `parseDeepLink(hash)` → `{ documentId, pageNumber, annotationId }`
- Internal navigation: clicking a deep link scrolls PDF to exact location
- Format: `#/doc/<docId>/page/<pageNum>/highlight/<annotationId>`

Hyperlink UI:
- Right-click a highlight or excerpt → "Copy Link to This Location"
- Paste a link in a note → clickable, navigates to source
- Excerpt cards show source link; clicking navigates back to PDF

---

### Phase 7: Project Management & File Upload

#### [NEW] `src/components/project/FileUpload.jsx`
- Drag-and-drop zone + `<input type="file" accept=".pdf">`
- Validates file type, reads as `ArrayBuffer`, stores in Dexie
- Shows upload progress for large files
- Multiple file upload support

#### [NEW] `src/components/project/ProjectManager.jsx`
- Modal/screen for creating, opening, renaming, deleting projects
- Shows project list with last-modified timestamps
- Each project card shows doc count and excerpt count

#### [NEW] `src/components/project/DocumentTabs.jsx`
- Tab bar above PDF viewer for switching between documents in a project
- Close button per tab, reorder by drag
- Active tab highlighted

#### [NEW] `src/utils/exportUtils.js`
- **Image export**: `html-to-image` to capture workspace canvas
- **Markdown export**: Serialize all excerpts + connections as structured Markdown
- **JSON export**: Full project dump for backup/restore

---

### Phase 8: Global Search (Secondary Feature)

#### [NEW] `src/components/common/TagInput.jsx`
- Autocomplete from existing tags in project
- Create new tags inline with color picker
- Used in: NotePopover, ExcerptNode, GlobalSearch filters

#### [NEW] `src/components/search/GlobalSearch.jsx`
- Command-palette style (Cmd+K) search overlay
- Searches across: annotation notes, excerpt text, tag names, document names
- Results grouped by type with icons
- Click result → navigates to source (PDF or workspace)

#### Workspace filtering
- Filter excerpt cards in workspace by tag, color, or source document
- Dim non-matching cards (don't hide — maintain spatial context)

---

### Phase 9: Layout & Polish

#### [NEW] `src/components/layout/SplitPane.jsx`
- Horizontal resizable split: left = PDF viewer, right = workspace
- Drag handle with snap points (50/50, 70/30, 30/70)
- Collapse either panel to full-screen the other

#### [NEW] `src/components/layout/Toolbar.jsx`
- Top bar with: project name, document tabs, tool mode selector, zoom, undo/redo, export, settings
- Glassmorphic design with backdrop blur

#### [NEW] `src/components/layout/Sidebar.jsx`
- Collapsible left sidebar (inside PDF panel) with tabs:
  - 📄 Thumbnails
  - 📑 Outline / TOC (Secondary Feature)
  - 🏷️ Tags
  - 🔍 Search
- Smooth slide animation

#### [MODIFY] `src/App.jsx`
- Root layout: `Toolbar` → `SplitPane(Sidebar + PDFViewer, WorkspaceCanvas)`
- Project manager as welcome screen when no project is active
- Global keyboard shortcuts (Cmd+Z undo, Cmd+K search, etc.)

---

## Data Flow

```
PDF Panel                          Workspace Panel
┌──────────────────────┐          ┌──────────────────────┐
│  PDFViewer            │          │  WorkspaceCanvas      │
│  ├── PDFPage          │          │  ├── ExcerptNode      │
│  │   ├── TextLayer   ─┼── Text ──┼──│   (click → PDF)    │
│  │   ├── HighlightLayer│ Select  │  ├── GroupNode        │
│  │   └── InkCanvas    │          │  └── ConnectionEdge   │
│  ├── PDFThumbnails    │          └──────────┬─────────────┘
│  ├── PDFSearch        │                     │
│  └── PDFOutline       │                     │
└──────────┬─────────────┘                     │
           │                                   │
           └──── Zustand Stores ───────────────┘
                     │
              Dexie (IndexedDB)
                Auto-save
```

---

## Build Order & Estimates

| Phase | Description | Est. Time | Status |
|---|---|---|---|
| 1 | Scaffold + Design System | 1 day | ✅ DONE |
| 2 | Database + State Stores | 1 day | ⬜ TODO |
| 3 | PDF Viewer (render, zoom, scroll, text layer) | 2-3 days | ⬜ TODO |
| 4 | Annotations (highlight, notes, ink) | 2 days | ⬜ TODO |
| 5 | Workspace Canvas (excerpts, connections, groups) | 2-3 days | ⬜ TODO |
| 6 | Deep Links & Hyperlinks | 1 day | ⬜ TODO |
| 7 | Project Management & File Upload | 1 day | ⬜ TODO |
| 8 | Global Search | 1-2 days | ⬜ TODO |
| 9 | Layout, Polish & Keyboard Shortcuts | 1-2 days | ⬜ TODO |
| — | **Total** | **~12-16 days** | |

---

## Verification Plan

### Automated Testing
- Run `npm run build` to ensure zero compilation errors
- Basic smoke test: upload a PDF → highlight text → send excerpt to workspace → save project → reload → verify persistence

### Browser Testing
- Upload a multi-page PDF and verify rendering at different zoom levels
- Create highlights in 3+ colors and verify they persist across page navigation
- Drag 5+ excerpts to workspace, create connections, verify bidirectional navigation
- Test project create/open/delete cycle
- Test global search across annotations and excerpts
- Test multi-document switching
- Test deep link copy/paste navigation
- Verify responsive split-pane behavior

### Manual Verification
- Visual review of design aesthetics (glassmorphism, animations, typography)
- Performance check with a large PDF (100+ pages)
