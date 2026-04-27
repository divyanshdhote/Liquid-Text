import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';

/**
 * GroupNode — React Flow custom node representing a visual grouping of excerpts.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {string} props.data.label - group name
 * @param {string} props.data.color - group background tint
 * @param {boolean} props.selected
 */
const GroupNode = memo(function GroupNode({ data, selected }) {
  const { label, color } = data;

  const colorMap = {
    blue: 'rgba(59, 130, 246, 0.05)',
    green: 'rgba(34, 197, 94, 0.05)',
    purple: 'rgba(168, 85, 247, 0.05)',
    orange: 'rgba(249, 115, 22, 0.05)',
    red: 'rgba(239, 68, 68, 0.05)',
  };

  const borderMap = {
    blue: 'var(--accent-blue)',
    green: 'var(--accent-green)',
    purple: 'var(--accent-purple)',
    orange: 'var(--accent-yellow)',
    red: 'var(--accent-red)',
  };

  const bgColor = colorMap[color] || colorMap.blue;
  const borderColor = borderMap[color] || borderMap.blue;

  return (
    <>
      <NodeResizer
        color={borderColor}
        isVisible={selected}
        minWidth={200}
        minHeight={100}
      />
      <div
        className={`workspace-node--group ${selected ? 'selected' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: bgColor,
          borderColor: borderColor,
        }}
      >
        <div className="workspace-node--group__label">{label}</div>
      </div>
    </>
  );
});

export default GroupNode;
