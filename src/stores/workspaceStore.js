import { create } from 'zustand';
import { nanoid } from 'nanoid';
import db from '../db/database.js';

/**
 * Workspace Store — manages the freeform canvas state.
 * 
 * Excerpts become React Flow nodes, connections become edges.
 * Groups are special container nodes.
 * 
 * Node structure (for React Flow):
 *   { id, type, position: {x, y}, data: { ...excerpt fields } }
 * 
 * Edge structure (for React Flow):
 *   { id, source, target, data: { label, color } }
 */
const useWorkspaceStore = create((set, get) => ({
  // ---- State ----
  nodes: [],       // React Flow nodes (excerpts + groups)
  edges: [],       // React Flow edges (connections)
  isLoading: false,

  // ---- Actions ----

  /**
   * Load workspace data (excerpts, connections, groups) for a project.
   * @param {number} projectId
   */
  loadWorkspace: async (projectId) => {
    set({ isLoading: true });
    try {
      const [excerpts, connections, groups] = await Promise.all([
        db.excerpts.where('projectId').equals(projectId).toArray(),
        db.connections.where('projectId').equals(projectId).toArray(),
        db.groups.where('projectId').equals(projectId).toArray(),
      ]);

      // Convert excerpts to React Flow nodes
      const excerptNodes = excerpts.map((e) => ({
        id: `excerpt-${e.id}`,
        type: 'excerpt',
        position: { x: e.workspaceX || 0, y: e.workspaceY || 0 },
        data: {
          dbId: e.id,
          text: e.text,
          documentId: e.documentId,
          sourcePageNumber: e.sourcePageNumber,
          sourceRects: e.sourceRects,
          tags: e.tags || [],
          color: e.color || 'yellow',
          fileName: e.fileName || '',
        },
        style: {
          width: e.width || 220,
          ...(e.height ? { height: e.height } : {}),
        },
      }));

      // Convert groups to React Flow nodes
      const groupNodes = groups.map((g) => ({
        id: `group-${g.id}`,
        type: 'group',
        position: { x: g.x || 0, y: g.y || 0 },
        data: {
          dbId: g.id,
          label: g.label || 'Group',
          color: g.color || 'blue',
          excerptIds: g.excerptIds || [],
        },
        style: {
          width: g.width || 300,
          height: g.height || 200,
        },
      }));

      // Convert connections to React Flow edges
      const edgeList = connections.map((c) => ({
        id: `connection-${c.id}`,
        source: `excerpt-${c.sourceExcerptId}`,
        target: `excerpt-${c.targetExcerptId}`,
        type: 'labeled-connection',
        data: {
          dbId: c.id,
          label: c.label || '',
          color: c.color || '',
        },
      }));

      set({
        nodes: [...groupNodes, ...excerptNodes],
        edges: edgeList,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load workspace:', err);
      set({ isLoading: false });
    }
  },

  /**
   * Clear workspace (when closing project).
   */
  clearWorkspace: () => {
    set({ nodes: [], edges: [] });
  },

  /**
   * Add an excerpt to the workspace.
   * @param {object} params
   * @param {number} params.documentId
   * @param {number} params.projectId
   * @param {string} params.text
   * @param {number} params.sourcePageNumber
   * @param {Array} params.sourceRects
   * @param {string} params.color
   * @param {string} params.fileName
   * @returns {object} The created node
   */
  addExcerpt: async ({ documentId, projectId, text, sourcePageNumber, sourceRects, color = 'yellow', fileName = '' }) => {
    const now = new Date().toISOString();
    
    // Position excerpts sequentially on the left side of the canvas.
    // Each new excerpt appears directly below the last one.
    const existingNodes = get().nodes;
    const excerptNodes = existingNodes.filter(n => n.type === 'excerpt');
    
    const offsetX = 50;
    const offsetY = excerptNodes.length * 80;

    const excerpt = {
      documentId,
      projectId,
      text,
      sourcePageNumber,
      sourceRects,
      workspaceX: offsetX,
      workspaceY: offsetY,
      width: 220,
      height: null, // auto
      tags: [],
      color,
      fileName,
      createdAt: now,
    };

    try {
      const id = await db.excerpts.add(excerpt);
      const node = {
        id: `excerpt-${id}`,
        type: 'excerpt',
        position: { x: offsetX, y: offsetY },
        data: {
          dbId: id,
          text,
          documentId,
          sourcePageNumber,
          sourceRects,
          tags: [],
          color,
          fileName,
        },
        style: { width: 220 },
      };

      set((state) => ({
        nodes: [...state.nodes, node],
      }));
      return node;
    } catch (err) {
      console.error('Failed to add excerpt:', err);
      return null;
    }
  },

  /**
   * Update an excerpt's text content (for inline editing).
   * @param {number} dbId - Dexie database ID of the excerpt
   * @param {string} newText - Updated text content
   */
  updateExcerptText: async (dbId, newText) => {
    try {
      await db.excerpts.update(dbId, { text: newText });

      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.data?.dbId === dbId
            ? { ...n, data: { ...n.data, text: newText } }
            : n
        ),
      }));
    } catch (err) {
      console.error('Failed to update excerpt text:', err);
    }
  },

  /**
   * Update node positions (called by React Flow on drag).
   * Also persists to Dexie.
   * @param {Array} changes - React Flow node changes
   */
  onNodesChange: (changes) => {
    // Apply changes to local state using React Flow's applyNodeChanges
    // This is imported and called by the component, so we just handle persistence here
    set((state) => {
      const updatedNodes = applyChangesLocally(state.nodes, changes);
      
      // Persist position and dimension changes to Dexie
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          const node = updatedNodes.find((n) => n.id === change.id);
          if (node?.data?.dbId) {
            if (node.type === 'excerpt') {
              db.excerpts.update(node.data.dbId, {
                workspaceX: change.position.x,
                workspaceY: change.position.y,
              }).catch(console.error);
            } else if (node.type === 'group') {
              db.groups.update(node.data.dbId, {
                x: change.position.x,
                y: change.position.y,
              }).catch(console.error);
            }
          }
        }
        if (change.type === 'dimensions' && change.dimensions) {
          const node = updatedNodes.find((n) => n.id === change.id);
          if (node?.data?.dbId && node.type === 'excerpt') {
            db.excerpts.update(node.data.dbId, {
              width: change.dimensions.width,
              height: change.dimensions.height,
            }).catch(console.error);
          }
        }
      });

      return { nodes: updatedNodes };
    });
  },

  /**
   * Set nodes directly (used by React Flow callbacks).
   */
  setNodes: (nodesOrUpdater) => {
    set((state) => ({
      nodes: typeof nodesOrUpdater === 'function'
        ? nodesOrUpdater(state.nodes)
        : nodesOrUpdater,
    }));
  },

  /**
   * Set edges directly (used by React Flow callbacks).
   */
  setEdges: (edgesOrUpdater) => {
    set((state) => ({
      edges: typeof edgesOrUpdater === 'function'
        ? edgesOrUpdater(state.edges)
        : edgesOrUpdater,
    }));
  },

  /**
   * Add a connection between two excerpts.
   * @param {object} params
   * @param {number} params.projectId
   * @param {number} params.sourceExcerptId - DB ID of source excerpt
   * @param {number} params.targetExcerptId - DB ID of target excerpt
   * @param {string} params.label
   * @returns {object} The created edge
   */
  addConnection: async ({ projectId, sourceExcerptId, targetExcerptId, label = '' }) => {
    const connection = {
      projectId,
      sourceExcerptId,
      targetExcerptId,
      label,
      color: '',
    };

    try {
      const id = await db.connections.add(connection);
      const edge = {
        id: `connection-${id}`,
        source: `excerpt-${sourceExcerptId}`,
        target: `excerpt-${targetExcerptId}`,
        type: 'labeled-connection',
        data: {
          dbId: id,
          label,
          color: '',
        },
      };

      set((state) => ({
        edges: [...state.edges, edge],
      }));
      return edge;
    } catch (err) {
      console.error('Failed to add connection:', err);
      return null;
    }
  },

  /**
   * Update a connection's label.
   * @param {number} connectionDbId
   * @param {string} label
   */
  updateConnectionLabel: async (connectionDbId, label) => {
    try {
      await db.connections.update(connectionDbId, { label });
      set((state) => ({
        edges: state.edges.map((e) =>
          e.data?.dbId === connectionDbId
            ? { ...e, data: { ...e.data, label } }
            : e
        ),
      }));
    } catch (err) {
      console.error('Failed to update connection:', err);
    }
  },

  /**
   * Delete a connection.
   * @param {string} edgeId - React Flow edge ID
   */
  deleteConnection: async (edgeId) => {
    const edge = get().edges.find((e) => e.id === edgeId);
    if (edge?.data?.dbId) {
      try {
        await db.connections.delete(edge.data.dbId);
      } catch (err) {
        console.error('Failed to delete connection from DB:', err);
      }
    }
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }));
  },

  /**
   * Delete an excerpt node and its linked annotation.
   * @param {string} nodeId - React Flow node ID
   */
  deleteExcerpt: async (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (node?.data?.dbId && node.type === 'excerpt') {
      try {
        const dbId = node.data.dbId;

        // Delete excerpt from DB
        await db.excerpts.delete(dbId);

        // Delete connections involving this excerpt
        const connToDelete = await db.connections
          .where('sourceExcerptId').equals(dbId)
          .or('targetExcerptId').equals(dbId)
          .toArray();
        await Promise.all(connToDelete.map((c) => db.connections.delete(c.id)));

        // Delete linked annotations (gray highlights created by AutoExcerpt)
        const linkedAnnotations = await db.annotations
          .where('linkedExcerptId').equals(dbId)
          .toArray();
        await Promise.all(linkedAnnotations.map((a) => db.annotations.delete(a.id)));

        // Also remove them from the annotation store's in-memory state
        const { default: useAnnotationStore } = await import('../stores/annotationStore.js');
        const annotationStore = useAnnotationStore.getState();
        const linkedIds = new Set(linkedAnnotations.map((a) => a.id));
        useAnnotationStore.setState({
          annotations: annotationStore.annotations.filter((a) => !linkedIds.has(a.id)),
        });
      } catch (err) {
        console.error('Failed to delete excerpt from DB:', err);
      }
    }
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    }));
  },

  /**
   * Create a group in the workspace.
   * @param {object} params
   * @param {number} params.projectId
   * @param {string} params.label
   * @param {string} params.color
   * @returns {object} The created group node
   */
  createGroup: async ({ projectId, label = 'New Group', color = 'blue' }) => {
    const group = {
      projectId,
      label,
      color,
      excerptIds: [],
      x: 100,
      y: 100,
      width: 300,
      height: 200,
    };

    try {
      const id = await db.groups.add(group);
      const node = {
        id: `group-${id}`,
        type: 'group',
        position: { x: 100, y: 100 },
        data: {
          dbId: id,
          label,
          color,
          excerptIds: [],
        },
        style: { width: 300, height: 200 },
      };

      set((state) => ({
        nodes: [node, ...state.nodes], // Groups go first (behind excerpts)
      }));
      return node;
    } catch (err) {
      console.error('Failed to create group:', err);
      return null;
    }
  },

  /**
   * Update an excerpt's tags.
   * @param {number} excerptDbId
   * @param {string[]} tags
   */
  updateExcerptTags: async (excerptDbId, tags) => {
    try {
      await db.excerpts.update(excerptDbId, { tags });
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.data?.dbId === excerptDbId && n.type === 'excerpt'
            ? { ...n, data: { ...n.data, tags } }
            : n
        ),
      }));
    } catch (err) {
      console.error('Failed to update excerpt tags:', err);
    }
  },
}));

/**
 * Apply React Flow node changes locally (minimal implementation).
 * The real applyNodeChanges from @xyflow/react is used in the component.
 * This is a fallback for the store-level handler.
 */
function applyChangesLocally(nodes, changes) {
  let result = [...nodes];
  for (const change of changes) {
    if (change.type === 'position' && change.position) {
      result = result.map((n) =>
        n.id === change.id
          ? { ...n, position: change.position }
          : n
      );
    } else if (change.type === 'remove') {
      result = result.filter((n) => n.id !== change.id);
    } else if (change.type === 'dimensions' && change.dimensions) {
      result = result.map((n) =>
        n.id === change.id
          ? { ...n, measured: { ...n.measured, ...change.dimensions } }
          : n
      );
    }
  }
  return result;
}

export default useWorkspaceStore;
