import { ViewportPortal } from '@xyflow/react';
import usePdfStore from '../../stores/pdfStore.js';

/**
 * SourceRegionOverlay — Renders colored horizontal bands in the workspace
 * background that correspond to PDF pages. Each band is 400px tall (matching
 * the PAGE_ZONE_HEIGHT in the workspace store positioning logic).
 *
 * This creates a visual bridge between the PDF viewer and the workspace:
 * excerpts from page 1 float over the first band, page 2 over the second, etc.
 */
const PAGE_ZONE_HEIGHT = 400;
const BAND_WIDTH = 400; // how wide the colored band extends

const PAGE_COLORS = [
  'rgba(147, 178, 220, 0.18)',  // soft blue
  'rgba(147, 196, 178, 0.14)',  // soft teal
  'rgba(178, 162, 210, 0.14)',  // soft purple
  'rgba(210, 178, 147, 0.14)',  // soft amber
  'rgba(178, 210, 147, 0.14)',  // soft green
  'rgba(210, 147, 178, 0.14)',  // soft pink
];

export default function SourceRegionOverlay() {
  const { totalPages } = usePdfStore();

  if (!totalPages || totalPages === 0) return null;

  const bands = Array.from({ length: totalPages }, (_, i) => {
    const color = PAGE_COLORS[i % PAGE_COLORS.length];
    return (
      <div
        key={i}
        className="source-region-band"
        style={{
          position: 'absolute',
          top: `${i * PAGE_ZONE_HEIGHT}px`,
          left: '-20px',
          width: `${BAND_WIDTH}px`,
          height: `${PAGE_ZONE_HEIGHT}px`,
          background: `linear-gradient(90deg, ${color}, transparent)`,
          borderBottom: '1px solid rgba(150, 160, 180, 0.1)',
        }}
      >
        <span className="source-region-label">
          Page {i + 1}
        </span>
      </div>
    );
  });

  return (
    <ViewportPortal>
      <div
        className="source-region-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        {bands}
      </div>
    </ViewportPortal>
  );
}
