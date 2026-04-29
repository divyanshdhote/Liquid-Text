import Dexie from 'dexie';

/**
 * LiquidText — Local Database (Dexie / IndexedDB)
 * 
 * Schema notes:
 * - `++id` = auto-incrementing primary key
 * - Indexed fields listed after the primary key enable fast queries
 * - Blob data (fileData) is NOT indexed but IS stored
 * - Complex objects (rects, tags, excerptIds) are stored as JSON-serializable values
 */

const db = new Dexie('LiquidTextDB');

db.version(1).stores({
  // Projects — top-level container
  projects: '++id, name, createdAt, updatedAt',

  // Documents — PDF files belonging to a project
  // fileData is stored as a Blob (not indexed)
  documents: '++id, projectId, fileName, createdAt',

  // Annotations — highlights, notes, ink strokes on PDF pages
  // type: 'highlight' | 'underline' | 'strikethrough' | 'ink' | 'note'
  annotations: '++id, documentId, projectId, type, pageNumber, color, createdAt, *tags',

  // Excerpts — text pulled from PDF into the workspace canvas
  excerpts: '++id, documentId, projectId, createdAt, *tags',

  // Connections — edges between excerpt nodes in the workspace
  connections: '++id, projectId, sourceExcerptId, targetExcerptId',

  // Groups — clusters of excerpts in the workspace
  groups: '++id, projectId',

  // Tags — user-defined labels for organizing annotations/excerpts
  tags: '++id, projectId, name',
});

// Version 2: Add linkedExcerptId index to annotations for excerpt-highlight linking
db.version(2).stores({
  annotations: '++id, documentId, projectId, type, pageNumber, color, createdAt, *tags, linkedExcerptId',
});

// Version 3: Add parentId index to projects for nested folders
db.version(3).stores({
  projects: '++id, name, parentId, createdAt, updatedAt',
});

export default db;
