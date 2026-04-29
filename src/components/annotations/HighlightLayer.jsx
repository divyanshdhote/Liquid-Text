import { memo } from 'react';
import { COLORS } from './ColorPicker.jsx';

/**
 * HighlightLayer — SVG overlay that renders highlight rectangles on a PDF page.
 *
 * Positioned absolutely on top of the PDF page canvas. Each annotation's
 * rects are drawn as colored rectangles. Click a highlight to select it.
 *
 * @param {object} props
 * @param {Array} props.annotations - annotations for this page
 * @param {number} props.pageWidth - rendered page width in px
 * @param {number} props.pageHeight - rendered page height in px
 * @param {function} props.onHighlightClick - callback when a highlight is clicked
 * @param {string|null} props.selectedAnnotationId - currently selected annotation ID
 */
const HighlightLayer = memo(function HighlightLayer({
  annotations = [],
  pageWidth,
  pageHeight,
  onHighlightClick,
  selectedAnnotationId,
}) {
  if (!annotations.length || !pageWidth || !pageHeight) return null;

  const getColorHex = (colorName) => {
    const color = COLORS.find((c) => c.name === colorName);
    return color ? color.hex : '#facc15';
  };

  return (
    <svg
      className="highlight-layer"
      width={pageWidth}
      height={pageHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      {annotations.map((annotation) => {
        if (annotation.type === 'ink') return null; // Ink is handled by InkCanvas

        const isSelected = annotation.id === selectedAnnotationId;
        const colorHex = getColorHex(annotation.color);

        return annotation.rects?.map((rect, i) => {
          const x = rect.x * pageWidth;
          const y = rect.y * pageHeight;
          const w = rect.width * pageWidth;
          const h = rect.height * pageHeight;

          if (annotation.type === 'highlight') {
            return (
              <rect
                key={`${annotation.id}-${i}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={colorHex}
                fillOpacity={isSelected ? 0.5 : 0.3}
                rx={2}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onHighlightClick?.(annotation);
                }}
              />
            );
          }

          if (annotation.type === 'underline') {
            return (
              <line
                key={`${annotation.id}-${i}`}
                x1={x}
                y1={y + h}
                x2={x + w}
                y2={y + h}
                stroke={colorHex}
                strokeWidth={2}
                strokeOpacity={0.8}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onHighlightClick?.(annotation);
                }}
              />
            );
          }

          if (annotation.type === 'strikethrough') {
            return (
              <line
                key={`${annotation.id}-${i}`}
                x1={x}
                y1={y + h / 2}
                x2={x + w}
                y2={y + h / 2}
                stroke={colorHex}
                strokeWidth={1.5}
                strokeOpacity={0.7}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onHighlightClick?.(annotation);
                }}
              />
            );
          }

          return null;
        });
      })}

      {/* Selection ring around selected annotation */}
      {selectedAnnotationId && annotations
        .filter((a) => a.id === selectedAnnotationId)
        .map((a) =>
          a.rects?.map((rect, i) => (
            <rect
              key={`sel-${a.id}-${i}`}
              x={rect.x * pageWidth - 2}
              y={rect.y * pageHeight - 2}
              width={rect.width * pageWidth + 4}
              height={rect.height * pageHeight + 4}
              fill="none"
              stroke={getColorHex(a.color)}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              rx={3}
            />
          ))
        )}
    </svg>
  );
});

export default HighlightLayer;
