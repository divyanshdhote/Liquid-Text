import { useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useWorkspaceStore from '../../stores/workspaceStore.js';
import usePdfStore from '../../stores/pdfStore.js';
import ExcerptNode from './nodes/ExcerptNode.jsx';
import GroupNode from './nodes/GroupNode.jsx';
import ConnectionEdge from './edges/ConnectionEdge.jsx';
import WorkspaceToolbar from './WorkspaceToolbar.jsx';

const nodeTypes = {
  excerpt: ExcerptNode,
  group: GroupNode,
};

const edgeTypes = {
  'labeled-connection': ConnectionEdge,
};

/**
 * WorkspaceCanvas Component
 * The main interactive canvas where excerpts and groups are rendered.
 */
function WorkspaceCanvasContent({ projectId }) {
  const {
    nodes,
    edges,
    loadWorkspace,
    clearWorkspace,
    setNodes,
    setEdges,
    onNodesChange: storeOnNodesChange,
    addConnection,
    deleteConnection,
    deleteExcerpt,
    addExcerpt,
  } = useWorkspaceStore();

  const { documentId } = usePdfStore(); // Optional: if we need to know active doc
  const reactFlowWrapper = useRef(null);
  const { fitView } = useReactFlow();

  // Load workspace data when project changes
  useEffect(() => {
    if (projectId) {
      loadWorkspace(projectId);
    }
    return () => clearWorkspace();
  }, [projectId, loadWorkspace, clearWorkspace]);

  // Auto-pan to selected nodes (e.g. when clicking a highlight in the PDF)
  useEffect(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 1) {
      fitView({
        nodes: [{ id: selectedNodes[0].id }],
        duration: 800,
        padding: 0.5,
        maxZoom: 1,
      });
    }
  }, [nodes, fitView]);

  const onNodesChange = useCallback(
    (changes) => {
      // First, update local React Flow state for smooth UI
      setNodes((nds) => applyNodeChanges(changes, nds));
      // Then, tell the store to persist changes (like position)
      storeOnNodesChange(changes);
    },
    [setNodes, storeOnNodesChange]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (params) => {
      // Extract DB IDs from React Flow node IDs (e.g., 'excerpt-5' -> 5)
      const sourceId = parseInt(params.source.replace('excerpt-', ''), 10);
      const targetId = parseInt(params.target.replace('excerpt-', ''), 10);

      if (!isNaN(sourceId) && !isNaN(targetId) && projectId) {
        addConnection({
          projectId,
          sourceExcerptId: sourceId,
          targetExcerptId: targetId,
        });
      }
    },
    [projectId, addConnection]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete) => {
      edgesToDelete.forEach((edge) => deleteConnection(edge.id));
    },
    [deleteConnection]
  );

  const onNodesDelete = useCallback(
    (nodesToDelete) => {
      nodesToDelete.forEach((node) => {
        if (node.type === 'excerpt') {
          deleteExcerpt(node.id);
        }
      });
    },
    [deleteExcerpt]
  );

  // HTML5 Drag and Drop handler
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !projectId) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      let draggedData;
      try {
        const textData = event.dataTransfer.getData('application/json');
        if (!textData) return;
        draggedData = JSON.parse(textData);
      } catch (e) {
        return; // Not our custom JSON data
      }

      if (draggedData.type === 'excerpt-drag') {
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };

        // Note: For a perfectly accurate drop position, we would use reactFlowInstance.project(position),
        // but since we are handling this in a simple way for now, we just pass the screen coordinates.
        // Actually, let's let the store handle auto-positioning or we can pass position.
        
        addExcerpt({
          documentId: draggedData.documentId,
          projectId,
          text: draggedData.text,
          sourcePageNumber: draggedData.pageNumber,
          sourceRects: draggedData.rects,
          color: draggedData.color,
          fileName: draggedData.fileName,
        }).then((node) => {
          if (node) {
            // Manually update position since addExcerpt auto-positions
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id ? { ...n, position } : n
              )
            );
            // And persist the custom position
            storeOnNodesChange([{ id: node.id, type: 'position', position }]);
          }
        });
      }
    },
    [projectId, addExcerpt, setNodes, storeOnNodesChange]
  );

  return (
    <div className="workspace-container" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'labeled-connection' }}
        defaultViewport={{ x: 20, y: 20, zoom: 0.85 }}
        zoomOnScroll={false}
        panOnScroll={true}
        zoomOnPinch={true}
      >
        <Background color="#ccc" gap={16} size={1} />
        <Controls showInteractive={false} position="bottom-right" />
        <WorkspaceToolbar projectId={projectId} />
      </ReactFlow>
    </div>
  );
}

export default function WorkspaceCanvas(props) {
  return (
    <ReactFlowProvider>
      <WorkspaceCanvasContent {...props} />
    </ReactFlowProvider>
  );
}
