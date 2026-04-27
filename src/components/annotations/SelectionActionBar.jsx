import { Highlighter, Underline, Strikethrough, Send } from 'lucide-react';

/**
 * SelectionActionBar — Floating toolbar near text selection.
 *
 * Appears when the user selects text in the PDF, offering quick actions:
 * Highlight, Underline, Strikethrough, Send to Workspace.
 *
 * @param {object} props
 * @param {object} props.position - { top, left } screen coordinates
 * @param {function} props.onHighlight - create a highlight
 * @param {function} props.onUnderline - create an underline
 * @param {function} props.onStrikethrough - create a strikethrough
 * @param {function} props.onSendToWorkspace - send text to workspace
 * @param {boolean} props.visible
 */
export default function SelectionActionBar({
  position,
  onHighlight,
  onUnderline,
  onStrikethrough,
  onSendToWorkspace,
  visible,
}) {
  if (!visible || !position) return null;

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
      <button
        className="selection-action-bar__btn"
        onClick={onHighlight}
        data-tooltip="Highlight"
        id="btn-action-highlight"
      >
        <Highlighter size={16} />
      </button>
      <button
        className="selection-action-bar__btn"
        onClick={onUnderline}
        data-tooltip="Underline"
        id="btn-action-underline"
      >
        <Underline size={16} />
      </button>
      <button
        className="selection-action-bar__btn"
        onClick={onStrikethrough}
        data-tooltip="Strikethrough"
        id="btn-action-strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <div className="selection-action-bar__divider" />
      <button
        className="selection-action-bar__btn selection-action-bar__btn--accent"
        onClick={onSendToWorkspace}
        data-tooltip="Send to Workspace"
        id="btn-action-workspace"
      >
        <Send size={15} />
      </button>
    </div>
  );
}
