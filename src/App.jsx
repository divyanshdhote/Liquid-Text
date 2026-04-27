import { useState, useCallback, useRef, useEffect } from 'react';
import { FileUp, Upload, FolderOpen, Droplets, ArrowLeft, X } from 'lucide-react';
import PDFViewer from './components/pdf/PDFViewer.jsx';
import WorkspaceCanvas from './components/workspace/WorkspaceCanvas.jsx';
import SplitPane from './components/layout/SplitPane.jsx';
import useProjectStore from './stores/projectStore.js';

export default function App() {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Project store
  const {
    projects,
    activeProjectId,
    documents,
    isLoading,
    loadProjects,
    createProject,
    openProject,
    closeProject,
    addDocument,
    getDocumentFileData,
    deleteProject,
  } = useProjectStore();

  // Active document state (which PDF is being viewed)
  const [activeDocId, setActiveDocId] = useState(null);
  const [activeFileData, setActiveFileData] = useState(null);
  const [activeFileName, setActiveFileName] = useState('');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // When documents change and we don't have an active doc, open the first one
  useEffect(() => {
    if (documents.length > 0 && !activeDocId) {
      loadDocument(documents[0]);
    }
  }, [documents]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocument = async (doc) => {
    setActiveDocId(doc.id);
    setActiveFileName(doc.fileName);
    const data = await getDocumentFileData(doc.id);
    setActiveFileData(data);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [activeProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await handleFiles(files);
    }
    e.target.value = '';
  }, [activeProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = async (files) => {
    let projectId = activeProjectId;

    // If no project is active, create one named after the first file
    if (!projectId) {
      const name = files[0].name.replace('.pdf', '');
      projectId = await createProject(name);
      if (!projectId) return;
    }

    // Add each file to the project
    for (const file of files) {
      const docId = await addDocument(file);
      // Open the first uploaded document
      if (docId && !activeDocId) {
        const data = await file.arrayBuffer();
        setActiveDocId(docId);
        setActiveFileName(file.name);
        setActiveFileData(data);
      }
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleBackToHome = () => {
    closeProject();
    setActiveDocId(null);
    setActiveFileData(null);
    setActiveFileName('');
  };

  const isViewingPDF = activeProjectId && activeDocId && activeFileData;

  return (
    <div className="app-container">
      {/* ---- Top Toolbar ---- */}
      <header className="app-toolbar" id="main-toolbar">
        <div className="app-toolbar__logo">
          <div className="app-toolbar__logo-icon">
            <Droplets size={14} color="#0a0f1e" strokeWidth={2.5} />
          </div>
          <span>LiquidText</span>
        </div>

        {/* Show active project name */}
        {activeProjectId && (
          <>
            <div className="app-toolbar__divider" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {activeFileName}
            </span>
          </>
        )}

        <div className="app-toolbar__spacer" />

        <div className="app-toolbar__group">
          {activeProjectId && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={openFilePicker}
              id="btn-add-pdf"
              title="Add another PDF"
            >
              <FileUp size={15} />
              Add PDF
            </button>
          )}
          {!activeProjectId && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={openFilePicker}
              id="btn-open-pdf"
            >
              <FolderOpen size={15} />
              Open PDF
            </button>
          )}
          {activeProjectId && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleBackToHome}
              id="btn-close-project"
              data-tooltip="Close project"
              data-tooltip-pos="bottom"
            >
              <X size={15} />
              Close
            </button>
          )}
        </div>
      </header>

      {/* ---- Main Content ---- */}
      <main className="app-main" id="main-content">
        {isViewingPDF ? (
          /* Main Workspace View */
          <SplitPane
            initialLeftWidth={50}
            left={
              <PDFViewer
                fileData={activeFileData}
                fileName={activeFileName}
                documentId={activeDocId}
                projectId={activeProjectId}
              />
            }
            right={
              <WorkspaceCanvas projectId={activeProjectId} />
            }
          />
        ) : (
          /* Welcome / Empty State */
          <div className="welcome-screen fade-in">
            <div className="welcome-screen__icon">
              <Droplets size={36} color="#0a0f1e" strokeWidth={2} />
            </div>

            <h1 className="welcome-screen__title">
              Welcome to LiquidText
            </h1>

            <p className="welcome-screen__subtitle">
              Upload a PDF to start reading, highlighting, and building
              visual connections between your ideas.
            </p>

            <div
              className={`drop-zone ${isDragOver ? 'drop-zone--active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFilePicker}
              id="drop-zone"
            >
              <div className="drop-zone__icon">
                {isDragOver ? (
                  <Upload size={32} />
                ) : (
                  <FileUp size={32} />
                )}
              </div>
              <div className="drop-zone__text">
                <strong>Click to browse</strong> or drag &amp; drop your PDF here
              </div>
              <div className="drop-zone__hint">
                Supports .pdf files
              </div>
            </div>

            <div className="welcome-screen__actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={openFilePicker}
                id="btn-upload-pdf"
              >
                <FileUp size={18} />
                Upload PDF
              </button>
            </div>

            {/* Recent projects */}
            {projects.length > 0 && (
              <div className="recent-projects fade-in" id="recent-projects">
                <h2 style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-tertiary)',
                  fontWeight: 'var(--weight-medium)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-3)',
                }}>
                  Recent Projects
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {projects.slice(0, 5).map((project) => (
                    <button
                      key={project.id}
                      className="btn btn-secondary"
                      onClick={() => openProject(project.id)}
                      style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                      id={`project-${project.id}`}
                    >
                      <FolderOpen size={14} />
                      <span className="truncate" style={{ flex: 1 }}>{project.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="hidden-file-input"
      />
    </div>
  );
}
