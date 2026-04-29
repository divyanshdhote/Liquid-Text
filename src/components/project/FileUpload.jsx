import { useState, useCallback, useRef } from 'react';
import { FileUp, Upload } from 'lucide-react';

/**
 * FileUpload — Reusable drag-and-drop + file picker for PDF upload.
 *
 * @param {object}   props
 * @param {function} props.onFilesSelected — called with File[] when PDFs are chosen
 * @param {boolean}  [props.compact]       — if true, renders a small inline button instead of full drop zone
 */
export default function FileUpload({ onFilesSelected, compact = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
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
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = '';
  }, [onFilesSelected]);

  const openPicker = () => fileInputRef.current?.click();

  if (compact) {
    return (
      <>
        <button
          className="btn btn-ghost btn-sm"
          onClick={openPicker}
          id="btn-add-pdf-compact"
          title="Add PDF"
        >
          <FileUp size={15} />
          Add PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`drop-zone ${isDragOver ? 'drop-zone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        id="drop-zone"
      >
        <div className="drop-zone__icon">
          {isDragOver ? <Upload size={32} /> : <FileUp size={32} />}
        </div>
        <div className="drop-zone__text">
          <strong>Click to browse</strong> or drag &amp; drop your PDF here
        </div>
        <div className="drop-zone__hint">
          Supports .pdf files
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </>
  );
}
