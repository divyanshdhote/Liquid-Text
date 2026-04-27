import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MoreHorizontal, FileText } from 'lucide-react';

/**
 * ExcerptNode — React Flow custom node representing a text excerpt from the PDF.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {string} props.data.text - extracted text
 * @param {string} props.data.color - highlight color
 * @param {string} props.data.fileName - source document name
 * @param {boolean} props.selected
 */
const ExcerptNode = memo(function ExcerptNode({ data, selected }) {
  const { text, color, fileName } = data;

  // Map color names to CSS variables
  const colorMap = {
    yellow: 'var(--accent-yellow)',
    green: 'var(--accent-green)',
    blue: 'var(--accent-blue)',
    red: 'var(--accent-red)',
    purple: 'var(--accent-purple)',
  };

  const cssColor = colorMap[color] || colorMap.yellow;

  return (
    <div
      className={`workspace-node workspace-node--excerpt ${
        selected ? 'workspace-node--selected' : ''
      }`}
      style={{
        borderTopColor: cssColor,
      }}
    >
      {/* Target handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="workspace-node__handle"
      />

      <div className="workspace-node__header">
        <div className="workspace-node__source">
          <FileText size={12} />
          <span className="truncate">{fileName || 'Document'}</span>
        </div>
        <button className="workspace-node__menu-btn">
          <MoreHorizontal size={14} />
        </button>
      </div>

      <div className="workspace-node__content">
        <p className="workspace-node__text">{text}</p>
      </div>

      {/* Source handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        className="workspace-node__handle"
      />
    </div>
  );
});

export default ExcerptNode;
