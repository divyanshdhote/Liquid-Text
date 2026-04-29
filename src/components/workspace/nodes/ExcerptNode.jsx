import { memo, useState, useRef, useCallback } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import usePdfStore from '../../../stores/pdfStore.js';
import useWorkspaceStore from '../../../stores/workspaceStore.js';

/**
 * ExcerptNode — Clean, resizable, editable excerpt card.
 *
 * Inspired by LiquidText: white card with left-pointing arrow to
 * jump to PDF source. Text is editable on double-click.
 */
const ExcerptNode = memo(function ExcerptNode({ data, selected }) {
  const { text, sourcePageNumber, sourceRects, dbId } = data;
  const { jumpToSource } = usePdfStore();
  const { updateExcerptText } = useWorkspaceStore();
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef(null);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    // Focus the editable area after render
    setTimeout(() => {
      if (textRef.current) {
        textRef.current.focus();
        // Place cursor at end
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 0);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (textRef.current && dbId) {
      const newText = textRef.current.innerText.trim();
      if (newText && newText !== text) {
        updateExcerptText(dbId, newText);
      }
    }
  }, [dbId, text, updateExcerptText]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      textRef.current?.blur();
    }
    // Prevent React Flow from capturing keys while editing
    e.stopPropagation();
  }, []);

  return (
    <>
      <NodeResizer
        minWidth={160}
        minHeight={40}
        isVisible={selected}
        lineClassName="excerpt-resizer-line"
        handleClassName="excerpt-resizer-handle"
      />

      <div className={`excerpt-card ${selected ? 'excerpt-card--selected' : ''}`}>
        {/* Left arrow — jump to PDF source */}
        <button
          className="excerpt-card__arrow"
          onClick={() => jumpToSource(sourcePageNumber, sourceRects)}
          data-tooltip="Jump to source"
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
            <path d="M10 0 L0 8 L10 16 Z" />
          </svg>
        </button>

        {/* Text content — editable on double-click */}
        <div
          ref={textRef}
          className={`excerpt-card__text ${isEditing ? 'excerpt-card__text--editing' : ''}`}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
          onKeyDown={isEditing ? handleKeyDown : undefined}
        >
          {text}
        </div>

        {/* Hidden handles for connections */}
        <Handle
          type="target"
          position={Position.Left}
          className="excerpt-card__handle"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="excerpt-card__handle"
        />
      </div>
    </>
  );
});

export default ExcerptNode;
