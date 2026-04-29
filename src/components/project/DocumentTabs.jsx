import { FileText, Plus, X } from 'lucide-react';

/**
 * DocumentTabs — Tab bar for switching between PDFs in a project.
 *
 * @param {object}   props
 * @param {Array}    props.documents       — list of document objects { id, fileName }
 * @param {number}   props.activeDocId     — currently active document ID
 * @param {function} props.onTabClick      — called with doc object when tab is clicked
 * @param {function} props.onTabClose      — called with doc id when close button is clicked
 * @param {function} props.onAddDocument   — called when "+" button is clicked
 */
export default function DocumentTabs({
  documents = [],
  activeDocId,
  onTabClick,
  onTabClose,
  onAddDocument,
}) {
  if (documents.length === 0) return null;

  return (
    <div className="doc-tabs" id="document-tabs">
      {documents.map((doc) => {
        const isActive = doc.id === activeDocId;
        return (
          <button
            key={doc.id}
            className={`doc-tabs__tab ${isActive ? 'doc-tabs__tab--active' : ''}`}
            onClick={() => onTabClick(doc)}
            title={doc.fileName}
            id={`doc-tab-${doc.id}`}
          >
            <FileText size={13} />
            <span className="doc-tabs__label">{doc.fileName.replace('.pdf', '')}</span>
            {documents.length > 1 && (
              <span
                className="doc-tabs__close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(doc.id);
                }}
                title="Close document"
              >
                <X size={12} />
              </span>
            )}
          </button>
        );
      })}

      <button
        className="doc-tabs__add"
        onClick={onAddDocument}
        title="Add PDF"
        id="btn-add-doc-tab"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
