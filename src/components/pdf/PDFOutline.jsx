import { useState, memo } from 'react';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';

/**
 * PDFOutline — Table of contents / bookmarks tree from PDF metadata.
 *
 * @param {object} props
 * @param {Array} props.outline - pdf.js outline array
 * @param {function} props.onItemClick - callback with destination when an item is clicked
 */
const PDFOutline = memo(function PDFOutline({ outline, onItemClick }) {
  if (!outline || outline.length === 0) {
    return (
      <div className="pdf-outline__empty">
        <FileText size={20} />
        <span>No outline available</span>
      </div>
    );
  }

  return (
    <div className="pdf-outline" id="pdf-outline">
      <ul className="pdf-outline__list">
        {outline.map((item, index) => (
          <OutlineItem
            key={index}
            item={item}
            onItemClick={onItemClick}
            depth={0}
          />
        ))}
      </ul>
    </div>
  );
});

/**
 * Recursive outline tree item.
 */
function OutlineItem({ item, onItemClick, depth }) {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = item.items && item.items.length > 0;

  const handleClick = () => {
    if (item.dest) {
      onItemClick(item.dest);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <li className="pdf-outline__item">
      <button
        className="pdf-outline__button"
        onClick={handleClick}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        title={item.title}
      >
        {hasChildren && (
          <span className="pdf-outline__toggle" onClick={handleToggle}>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
        <span className="pdf-outline__title truncate">{item.title}</span>
      </button>

      {hasChildren && expanded && (
        <ul className="pdf-outline__list">
          {item.items.map((child, index) => (
            <OutlineItem
              key={index}
              item={child}
              onItemClick={onItemClick}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default PDFOutline;
