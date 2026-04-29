import { useState, useRef, useEffect } from 'react';
import { X, Trash2, MessageSquare } from 'lucide-react';
import ColorPicker from './ColorPicker.jsx';
import useAnnotationStore from '../../stores/annotationStore.js';
import useAutoSave from '../../hooks/useAutoSave.js';

/**
 * NotePopover — Popover anchored to a highlight for editing notes and color.
 *
 * @param {object} props
 * @param {object} props.annotation - the annotation to edit
 * @param {object} props.anchorRect - { top, left } positioning for the popover
 * @param {function} props.onClose - close the popover
 */
export default function NotePopover({ annotation, anchorRect, onClose }) {
  const [noteText, setNoteText] = useState(annotation?.noteText || '');
  const popoverRef = useRef(null);
  const textareaRef = useRef(null);

  const { updateNote, updateColor, deleteAnnotation } = useAnnotationStore();

  // Auto-save note text with debounce
  useAutoSave(
    noteText,
    (text) => {
      if (annotation?.id) {
        updateNote(annotation.id, text);
      }
    },
    500,
    !!annotation?.id
  );

  // Focus textarea on mount
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay to avoid immediately closing on the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!annotation) return null;

  const handleDelete = () => {
    deleteAnnotation(annotation.id);
    onClose();
  };

  const handleColorChange = (colorName) => {
    updateColor(annotation.id, colorName);
  };

  // Compute position — place below the anchor, clamped to viewport
  const style = {};
  if (anchorRect) {
    style.position = 'fixed';
    style.top = `${Math.min(anchorRect.top + 10, window.innerHeight - 280)}px`;
    style.left = `${Math.min(anchorRect.left, window.innerWidth - 280)}px`;
  }

  return (
    <div
      ref={popoverRef}
      className="note-popover glass-panel fade-in-scale"
      style={style}
      id="note-popover"
    >
      {/* Header */}
      <div className="note-popover__header">
        <div className="note-popover__title">
          <MessageSquare size={14} />
          <span>Note</span>
        </div>
        <div className="note-popover__actions">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleDelete}
            title="Delete annotation"
            id="btn-delete-annotation"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            title="Close"
            id="btn-close-popover"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Color picker */}
      <div className="note-popover__colors">
        <ColorPicker
          activeColor={annotation.color}
          onColorSelect={handleColorChange}
          compact
        />
      </div>

      {/* Selected text preview */}
      {annotation.selectedText && (
        <div className="note-popover__excerpt">
          "{annotation.selectedText.substring(0, 120)}
          {annotation.selectedText.length > 120 ? '...' : ''}"
        </div>
      )}

      {/* Note textarea */}
      <textarea
        ref={textareaRef}
        className="note-popover__textarea"
        placeholder="Add a note..."
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        rows={3}
        id="textarea-note"
      />
    </div>
  );
}
