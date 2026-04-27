# LiquidText MVP — Architecture & Context

> **Purpose**: This file gives any AI agent or developer enough context to continue building this project from where it left off.

## What Is This Project?

A **LiquidText-like** PDF workspace app. Think of it as a PDF reader fused with a freeform mind-mapping canvas. Users:

1. **Upload PDFs** from their file system
2. **Read & annotate** — highlight text, add notes, draw with ink
3. **Pull excerpts** from the PDF into a freeform **workspace canvas**
4. **Connect ideas** — draw labeled connections between excerpts
5. **Group excerpts** into clusters
6. **Navigate bidirectionally** — click an excerpt to jump back to its source in the PDF
7. **Deep link** to specific PDF locations (page, highlight, paragraph)

## Current State

**Phase 1 is complete.** The project has:
- A Vite + React scaffold with all dependencies installed
- A comprehensive design system (dark theme, glassmorphism, 600+ lines of CSS tokens)
- An app shell with toolbar, welcome screen, and drag-and-drop PDF upload
- Empty directory structure for all future components
- Zero build errors

**Next step: Phase 2** — Dexie database schema + Zustand state stores.

## Key Decisions

| Decision | Choice | Notes |
|---|---|---|
| Storage | IndexedDB via **Dexie.js** | Local-first. Will migrate to PostgreSQL + server later |
| Platform | **Web-only** (React + Vite) | Will add Electron for desktop later |
| PDF Rendering | **pdfjs-dist** (Mozilla pdf.js) | Renders to canvas, exposes text layer for selection |
| Workspace | **@xyflow/react** (React Flow v12) | Node/edge canvas with built-in zoom, pan, drag |
| State | **Zustand** | Lightweight, works well with React Flow |
| Styling | **Vanilla CSS** + CSS custom properties | No Tailwind. All tokens in `src/index.css` |
| Icons | **lucide-react** | Tree-shakeable, consistent |
| IDs | **nanoid** | For annotations, excerpts, links |
| Secondary features | **Document Outline/TOC** + **Global Search (Cmd+K)** | In MVP scope |

## Installed Dependencies

```json
{
  "@xyflow/react": "^12.10.2",
  "dexie": "^4.4.2",
  "lucide-react": "^1.11.0",
  "nanoid": "^5.1.9",
  "pdfjs-dist": "^5.6.205",
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "zustand": "^5.0.12"
}
```

## Design System Summary

The design system lives in `src/index.css` and uses CSS custom properties. Key tokens:

- **Dark theme**: `--bg-base: #0a0f1e` → `--bg-active: #253359` (6 elevation layers)
- **Accent**: Blue-violet (`--accent-primary: #6384ff`) + Teal (`--accent-secondary: #3dd6c8`)
- **Glass**: `--glass-bg` with `backdrop-filter: blur(16px)` for frosted panels
- **8 highlight colors**: yellow, green, blue, pink, orange, purple, red, teal (both translucent + solid)
- **Typography**: Inter font, sizes from `--text-xs` (11px) to `--text-3xl` (32px)
- **Animations**: `fadeIn`, `fadeInScale`, `slideInRight`, `pulse`, `shimmer` (skeleton loader)
- **Utility classes**: `.glass-panel`, `.btn-primary/secondary/ghost`, `.badge`, `.truncate`, `.line-clamp-*`
- **Layout classes**: `.app-container`, `.app-toolbar`, `.app-main`, `.welcome-screen`, `.drop-zone`

## File Structure (Current)

```
LiquidText/
├── docs/
│   ├── ARCHITECTURE.md          ← You are here
│   ├── IMPLEMENTATION_PLAN.md   ← Full phase-by-phase build plan
│   └── TASK_TRACKER.md          ← Checkbox task list
├── public/
│   └── favicon.svg              ← Custom gradient droplet icon
├── src/
│   ├── main.jsx                 ← React entry point
│   ├── App.jsx                  ← App shell (toolbar + welcome + upload)
│   ├── index.css                ← Design system (600+ lines)
│   ├── db/                      ← (empty, Phase 2)
│   ├── stores/                  ← (empty, Phase 2)
│   ├── hooks/                   ← (empty, Phase 2+)
│   ├── utils/                   ← (empty, Phase 6+)
│   └── components/
│       ├── layout/              ← (empty, Phase 9)
│       ├── pdf/                 ← (empty, Phase 3)
│       ├── annotations/         ← (empty, Phase 4)
│       ├── workspace/           ← (empty, Phase 5)
│       ├── project/             ← (empty, Phase 7)
│       ├── search/              ← (empty, Phase 8)
│       └── common/              ← (empty, Phase 8)
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
```

## How to Run

```bash
npm install    # Install dependencies
npm run dev    # Start dev server (http://localhost:5173)
npm run build  # Production build (verify zero errors)
```

## Data Model (Planned for Phase 2)

The Dexie database will have these tables:

| Table | Key Fields | Purpose |
|---|---|---|
| `projects` | id, name, createdAt, updatedAt | Container for documents + workspace |
| `documents` | id, projectId, fileName, fileData (Blob), pageCount | Stored PDF files |
| `annotations` | id, documentId, type, pageNumber, color, rects, noteText, tags | Highlights, notes, ink |
| `excerpts` | id, documentId, text, sourcePageNumber, sourceRects, workspaceX/Y | Pulled text in workspace |
| `connections` | id, projectId, sourceExcerptId, targetExcerptId, label | Lines between excerpts |
| `groups` | id, projectId, label, color, excerptIds, x, y | Excerpt clusters |
| `tags` | id, projectId, name, color | User-defined labels |

## Key Architectural Patterns

1. **Zustand stores** are the single source of truth. Components read from stores via hooks.
2. **Auto-save** debounces store changes and persists to Dexie every 500ms.
3. **PDF pages** render to `<canvas>` with transparent `<div>` text layers on top for selection.
4. **Annotations** are SVG overlays positioned absolutely on each PDF page.
5. **Workspace** uses React Flow — excerpts are custom nodes, connections are custom edges.
6. **Bidirectional navigation**: excerpt → PDF (scroll to source), PDF highlight → workspace (find excerpt).

## Important Notes for Continuation

- The app is **dark-theme only** for now. All colors use CSS vars, so light theme can be added later.
- The `svg` CSS rule `display: block; max-width: 100%` applies globally — keep this in mind when using inline SVG icons.
- The `body` has `overflow: hidden` — the app manages its own scrolling via containers.
- All interactive elements should have unique `id` attributes for testing.
- Follow BEM-style class naming: `.block__element--modifier`.
- Use `nanoid()` for all generated IDs (annotations, excerpts, etc.).
- Phase 2 is the critical foundation — all subsequent phases depend on the stores being correct.
