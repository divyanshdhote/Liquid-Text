import { useState, useRef, useEffect, useCallback } from 'react';
import { Droplets, X } from 'lucide-react';
import PDFViewer from './components/pdf/PDFViewer.jsx';
import WorkspaceCanvas from './components/workspace/WorkspaceCanvas.jsx';
import SplitPane from './components/layout/SplitPane.jsx';
import ViewerToolbar from './components/layout/ViewerToolbar.jsx';
import ProjectManager from './components/project/ProjectManager.jsx';
import useProjectStore from './stores/projectStore.js';
import db from './db/database.js';

export default function App() {
  const fileInputRef = useRef(null);

  const {
    projects,
    activeProjectId,
    documents,
    loadProjects,
    createProject,
    openProject,
    closeProject,
    addDocument,
    addRootDocument,
    getDocumentFileData,
    deleteProject,
    removeDocument,
  } = useProjectStore();

  // Active document state
  const [activeDocId, setActiveDocId] = useState(null);
  const [activeFileData, setActiveFileData] = useState(null);
  const [activeFileName, setActiveFileName] = useState('');

  // Navigation stack: [{id, name}] — empty = root
  const [folderPath, setFolderPath] = useState([]);
  // Items in the current folder
  const [currentFolders, setCurrentFolders] = useState([]);
  const [currentDocs, setCurrentDocs] = useState([]);

  const currentFolderId = folderPath.length > 0 ? folderPath[folderPath.length - 1].id : null;

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load current folder contents whenever path changes
  const refreshCurrentFolder = useCallback(async () => {
    const parentId = currentFolderId || 0;
    // Load sub-folders
    const subFolders = await db.projects.where('parentId').equals(parentId).toArray();
    // Also include folders with no parentId field (legacy) at root
    if (parentId === 0) {
      const legacyFolders = await db.projects.filter((p) => p.parentId === undefined || p.parentId === null).toArray();
      const allIds = new Set(subFolders.map((f) => f.id));
      legacyFolders.forEach((f) => { if (!allIds.has(f.id)) subFolders.push(f); });
    }
    setCurrentFolders(subFolders);
    // Load docs in this folder (use projectId = parentId, where 0 = root)
    const docs = await db.documents.where('projectId').equals(parentId).toArray();
    setCurrentDocs(docs);
  }, [currentFolderId]);

  useEffect(() => {
    refreshCurrentFolder();
  }, [refreshCurrentFolder]);

  // Auto-open first doc when project documents change
  useEffect(() => {
    if (activeProjectId && documents.length > 0 && !activeDocId) {
      loadDocument(documents[0]);
    }
  }, [documents]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocument = async (doc) => {
    setActiveDocId(doc.id);
    setActiveFileName(doc.fileName);
    const data = await getDocumentFileData(doc.id);
    setActiveFileData(data);
  };

  // Navigate into a folder
  const handleEnterFolder = async (folderId) => {
    const folder = await db.projects.get(folderId);
    setFolderPath((prev) => [...prev, { id: folderId, name: folder?.name || 'Folder' }]);
  };

  // Navigate back one level
  const handleNavigateBack = () => {
    setFolderPath((prev) => prev.slice(0, -1));
  };

  const handleNavigateToRoot = () => {
    setFolderPath([]);
  };

  const handleNavigateToPath = (index) => {
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  // Open a document from the file browser
  const handleOpenDocFromBrowser = async (doc) => {
    const folderId = currentFolderId || 0;
    if (folderId !== 0) {
      await openProject(folderId);
    }
    setActiveDocId(doc.id);
    setActiveFileName(doc.fileName);
    const data = await getDocumentFileData(doc.id);
    setActiveFileData(data);
  };

  // Create a folder at the current level
  const handleCreateFolder = async (name) => {
    const parentId = currentFolderId || 0;
    await createProject(name, parentId);
    closeProject(); // don't auto-activate
    await refreshCurrentFolder();
    await loadProjects(); // refresh global list
  };

  // File handling
  const handleFiles = async (files) => {
    const folderId = activeProjectId || currentFolderId;

    if (!folderId) {
      // Root level upload
      for (const file of files) {
        await addRootDocument(file);
      }
      await refreshCurrentFolder();
      return;
    }

    // Inside a folder
    if (currentFolderId && !activeProjectId) {
      await openProject(currentFolderId);
    }

    for (const file of files) {
      const docId = await addDocument(file);
      if (docId && !activeDocId) {
        const data = await file.arrayBuffer();
        setActiveDocId(docId);
        setActiveFileName(file.name);
        setActiveFileData(data);
      }
    }
  };

  const handleTabClick = (doc) => {
    if (doc.id !== activeDocId) loadDocument(doc);
  };

  const handleTabClose = async (docId) => {
    await removeDocument(docId);
    if (docId === activeDocId) {
      const remaining = documents.filter((d) => d.id !== docId);
      if (remaining.length > 0) {
        loadDocument(remaining[0]);
      } else {
        setActiveDocId(null);
        setActiveFileData(null);
        setActiveFileName('');
      }
    }
  };

  const handleBackToHome = () => {
    closeProject();
    setFolderPath([]);
    setActiveDocId(null);
    setActiveFileData(null);
    setActiveFileName('');
  };

  const isViewingPDF = activeDocId && activeFileData;

  return (
    <div className="app-container">
      {/* Toolbar — only when viewing a PDF */}
      {isViewingPDF && (
        <ViewerToolbar
          fileName={activeFileName}
          onHome={handleBackToHome}
        />
      )}

      <main className="app-main" id="main-content">
        {isViewingPDF ? (
          <SplitPane
            initialLeftWidth={50}
            left={
              <PDFViewer
                fileData={activeFileData}
                fileName={activeFileName}
                documentId={activeDocId}
                projectId={activeProjectId || 0}
              />
            }
            right={
              <WorkspaceCanvas projectId={activeProjectId || 0} />
            }
          />
        ) : (
          <ProjectManager
            folders={currentFolders}
            documents={currentDocs}
            folderPath={folderPath}
            onEnterFolder={handleEnterFolder}
            onNavigateBack={handleNavigateBack}
            onDeleteFolder={async (id) => {
              await deleteProject(id);
              await refreshCurrentFolder();
            }}
            onCreateFolder={handleCreateFolder}
            onOpenFile={() => fileInputRef.current?.click()}
            onOpenDocument={handleOpenDocFromBrowser}
            onDeleteDocument={async (docId) => {
              await removeDocument(docId);
              await refreshCurrentFolder();
            }}
          />
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={async (e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) await handleFiles(files);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
        id="hidden-file-input"
      />
    </div>
  );
}
