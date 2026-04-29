import { create } from 'zustand';
import db from '../db/database.js';

/**
 * Project Store — manages projects and their documents.
 * 
 * State:
 *   - projects: all projects in the database
 *   - activeProjectId: currently open project
 *   - documents: documents belonging to the active project
 *   - isLoading: loading state for async operations
 * 
 * All mutations persist to Dexie immediately.
 */
const useProjectStore = create((set, get) => ({
  // ---- State ----
  projects: [],
  activeProjectId: null,
  documents: [],
  isLoading: false,
  error: null,

  // ---- Actions ----

  /**
   * Load all projects from IndexedDB.
   */
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await db.projects.orderBy('updatedAt').reverse().toArray();
      set({ projects, isLoading: false });
    } catch (err) {
      console.error('Failed to load projects:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Create a new project/folder.
   * @param {string} name - Project name
   * @param {number} [parentId=0] - Parent folder ID (0 = root)
   * @returns {number} The new project ID
   */
  createProject: async (name, parentId = 0) => {
    const now = new Date().toISOString();
    try {
      const id = await db.projects.add({
        name,
        parentId,
        createdAt: now,
        updatedAt: now,
      });
      const project = await db.projects.get(id);
      set((state) => ({
        projects: [project, ...state.projects],
        activeProjectId: id,
        documents: [],
      }));
      return id;
    } catch (err) {
      console.error('Failed to create project:', err);
      set({ error: err.message });
      return null;
    }
  },

  /**
   * Open an existing project and load its documents.
   * @param {number} projectId
   */
  openProject: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const docs = await db.documents
        .where('projectId')
        .equals(projectId)
        .toArray();
      set({
        activeProjectId: projectId,
        documents: docs,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to open project:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Close the active project (return to welcome screen).
   */
  closeProject: () => {
    set({
      activeProjectId: null,
      documents: [],
    });
  },

  /**
   * Delete a project and all its associated data.
   * @param {number} projectId
   */
  deleteProject: async (projectId) => {
    try {
      // Delete all associated data in parallel
      await Promise.all([
        db.documents.where('projectId').equals(projectId).delete(),
        db.annotations.where('projectId').equals(projectId).delete(),
        db.excerpts.where('projectId').equals(projectId).delete(),
        db.connections.where('projectId').equals(projectId).delete(),
        db.groups.where('projectId').equals(projectId).delete(),
        db.tags.where('projectId').equals(projectId).delete(),
        db.projects.delete(projectId),
      ]);

      const { activeProjectId } = get();
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        activeProjectId: activeProjectId === projectId ? null : activeProjectId,
        documents: activeProjectId === projectId ? [] : state.documents,
      }));
    } catch (err) {
      console.error('Failed to delete project:', err);
      set({ error: err.message });
    }
  },

  /**
   * Rename a project.
   * @param {number} projectId
   * @param {string} newName
   */
  renameProject: async (projectId, newName) => {
    const now = new Date().toISOString();
    try {
      await db.projects.update(projectId, { name: newName, updatedAt: now });
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, name: newName, updatedAt: now } : p
        ),
      }));
    } catch (err) {
      console.error('Failed to rename project:', err);
      set({ error: err.message });
    }
  },

  /**
   * Add a PDF document to the active project.
   * @param {File} file - The PDF File object from file input
   * @returns {number} The new document ID
   */
  addDocument: async (file) => {
    const { activeProjectId } = get();
    if (!activeProjectId) {
      console.error('No active project');
      return null;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const now = new Date().toISOString();

      const id = await db.documents.add({
        projectId: activeProjectId,
        fileName: file.name,
        fileData: arrayBuffer,
        pageCount: 0, // Will be updated after PDF is loaded
        createdAt: now,
      });

      // Update project's updatedAt
      await db.projects.update(activeProjectId, { updatedAt: now });

      const doc = await db.documents.get(id);
      set((state) => ({
        documents: [...state.documents, doc],
        projects: state.projects.map((p) =>
          p.id === activeProjectId ? { ...p, updatedAt: now } : p
        ),
      }));
      return id;
    } catch (err) {
      console.error('Failed to add document:', err);
      set({ error: err.message });
      return null;
    }
  },

  /**
   * Add a PDF document at the root/home level (no project).
   * Uses projectId=0 as a sentinel for "root level".
   * @param {File} file - The PDF File object
   * @returns {number} The new document ID
   */
  addRootDocument: async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const now = new Date().toISOString();

      const id = await db.documents.add({
        projectId: 0,
        fileName: file.name,
        fileData: arrayBuffer,
        pageCount: 0,
        createdAt: now,
      });

      return id;
    } catch (err) {
      console.error('Failed to add root document:', err);
      return null;
    }
  },

  /**
   * Load root-level documents (projectId = 0).
   * @returns {Array}
   */
  loadRootDocuments: async () => {
    try {
      return await db.documents.where('projectId').equals(0).toArray();
    } catch (err) {
      console.error('Failed to load root docs:', err);
      return [];
    }
  },

  /**
   * Update a document's page count (called after PDF loads).
   * @param {number} documentId
   * @param {number} pageCount
   */
  updateDocumentPageCount: async (documentId, pageCount) => {
    try {
      await db.documents.update(documentId, { pageCount });
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId ? { ...d, pageCount } : d
        ),
      }));
    } catch (err) {
      console.error('Failed to update page count:', err);
    }
  },

  /**
   * Remove a document from the active project.
   * @param {number} documentId
   */
  removeDocument: async (documentId) => {
    try {
      // Delete document and its annotations/excerpts
      await Promise.all([
        db.annotations.where('documentId').equals(documentId).delete(),
        db.excerpts.where('documentId').equals(documentId).delete(),
        db.documents.delete(documentId),
      ]);

      set((state) => ({
        documents: state.documents.filter((d) => d.id !== documentId),
      }));
    } catch (err) {
      console.error('Failed to remove document:', err);
      set({ error: err.message });
    }
  },

  /**
   * Get a document's file data (ArrayBuffer) from IndexedDB.
   * @param {number} documentId
   * @returns {ArrayBuffer|null}
   */
  getDocumentFileData: async (documentId) => {
    try {
      const doc = await db.documents.get(documentId);
      return doc?.fileData || null;
    } catch (err) {
      console.error('Failed to get document data:', err);
      return null;
    }
  },

  // ---- Computed ----

  /**
   * Get the active project object.
   */
  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    return projects.find((p) => p.id === activeProjectId) || null;
  },
}));

export default useProjectStore;
