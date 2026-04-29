import { MessageSquare, TextSelect, Send, Copy, Bookmark, Highlighter, Underline, Strikethrough } from 'lucide-react';
import { COLORS } from './ColorPicker.jsx';

/**
 * SelectionActionBar — Two-row floating toolbar inspired by LiquidText.
 *
 * Row 1: Action buttons — Comment, Select More, AutoExcerpt, Copy, Bookmark
 * Row 2: Color swatches + annotation type toggles (Highlight, Underline, Strikethrough)
 *
 * @param {object}   props
 * @param {object}   props.position         — { top, left } screen coords
 * @param {boolean}  props.visible
 * @param {function} props.onHighlight
 * @param {function} props.onUnderline
 * @param {function} props.onStrikethrough
 * @param {function} props.onSendToWorkspace
 * @param {function} props.onCopyText       — copy selected text
 * @param {function} props.onAddNote        — open a note/comment
 * @param {string}   props.activeColor      — current highlight color name
 * @param {function} props.onColorSelect    — color picker callback
 */
export default function SelectionActionBar({
  position,
  onHighlight,
  onUnderline,
  onStrikethrough,
  onSendToWorkspace,
  onCopyText,
  onAddNote,
  activeColor = 'yellow',
  onColorSelect,
  visible,
}) {
  if (!visible || !position) return null;

  // Top 6 most-used colors for the bar
  const barColors = COLORS.slice(0, 6);

  return (
    <div
      className="selection-action-bar glass-panel fade-in-scale"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
      }}
      onMouseDown={(e) => e.preventDefault()}
      id="selection-action-bar"
    >
      {/* Row 1 — Action buttons */}
      <div className="selection-action-bar__row">
        <button
          className="selection-action-bar__action"
          onClick={onAddNote}
          id="btn-action-comment"
        >
          <MessageSquare size={14} />
          <span>Comment</span>
        </button>

        <button
          className="selection-action-bar__action selection-action-bar__action--primary"
          onClick={onSendToWorkspace}
          id="btn-action-autoexcerpt"
        >
          <Send size={14} />
          <span>AutoExcerpt</span>
        </button>

        <button
          className="selection-action-bar__action"
          onClick={onCopyText}
          id="btn-action-copy"
        >
          <Copy size={14} />
          <span>Copy</span>
        </button>

        <button
          className="selection-action-bar__action"
          onClick={onHighlight}
          id="btn-action-bookmark"
        >
          <Bookmark size={14} />
          <span>Bookmark</span>
        </button>
      </div>

      {/* Row 2 — Color swatches + annotation type */}
      <div className="selection-action-bar__row selection-action-bar__row--colors">
        <div className="selection-action-bar__colors">
          {barColors.map((color) => (
            <button
              key={color.name}
              className={`selection-action-bar__swatch ${
                activeColor === color.name ? 'selection-action-bar__swatch--active' : ''
              }`}
              style={{ '--swatch-color': color.hex }}
              onClick={() => onColorSelect?.(color.name)}
              data-tooltip={color.label}
              id={`swatch-${color.name}`}
            />
          ))}
        </div>

        <div className="selection-action-bar__divider" />

        <div className="selection-action-bar__types">
          <button
            className="selection-action-bar__type-btn"
            onClick={onHighlight}
            data-tooltip="Highlight"
            id="btn-action-highlight"
          >
            <Highlighter size={15} />
          </button>
          <button
            className="selection-action-bar__type-btn"
            onClick={onUnderline}
            data-tooltip="Underline"
            id="btn-action-underline"
          >
            <Underline size={15} />
          </button>
          <button
            className="selection-action-bar__type-btn"
            onClick={onStrikethrough}
            data-tooltip="Strikethrough"
            id="btn-action-strikethrough"
          >
            <Strikethrough size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
