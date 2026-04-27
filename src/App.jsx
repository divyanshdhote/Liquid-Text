import { useState, useCallback, useRef } from 'react';
import { FileUp, Upload, FolderOpen, Droplets } from 'lucide-react';

export default function App() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [project, setProject] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }, []);

  const handleFiles = (files) => {
    // Phase 2+ will store in IndexedDB and open the PDF viewer
    console.log('PDF files received:', files.map((f) => f.name));
    setProject({ name: files[0].name, files });
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

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

        <div className="app-toolbar__spacer" />

        <div className="app-toolbar__group">
          <button
            className="btn btn-ghost btn-sm"
            onClick={openFilePicker}
            id="btn-open-pdf"
          >
            <FolderOpen size={15} />
            Open PDF
          </button>
        </div>
      </header>

      {/* ---- Main Content ---- */}
      <main className="app-main" id="main-content">
        {!project ? (
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
          </div>
        ) : (
          /* Placeholder for Phase 3+ — PDF Viewer & Workspace */
          <div className="welcome-screen fade-in">
            <div className="welcome-screen__icon">
              <Droplets size={36} color="#0a0f1e" strokeWidth={2} />
            </div>
            <h1 className="welcome-screen__title">
              {project.name}
            </h1>
            <p className="welcome-screen__subtitle">
              PDF loaded successfully. The viewer will be built in Phase 3.
            </p>
            <div className="welcome-screen__actions">
              <button
                className="btn btn-secondary"
                onClick={() => setProject(null)}
                id="btn-back-home"
              >
                ← Back
              </button>
            </div>
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
