import { SquareDashedBottomCode, Focus, Download } from 'lucide-react';
import useWorkspaceStore from '../../stores/workspaceStore.js';
import { useReactFlow } from '@xyflow/react';
import { exportProjectAsJSON, exportWorkspaceAsMarkdown } from '../../utils/exportUtils.js';
import { useState } from 'react';

/**
 * WorkspaceToolbar — Floating toolbar for the canvas.
 * @param {object} props
 * @param {number} props.projectId
 */
export default function WorkspaceToolbar({ projectId }) {
  const { createGroup } = useWorkspaceStore();
  const { setViewport } = useReactFlow();
  const [exportOpen, setExportOpen] = useState(false);

  const handleAddGroup = () => {
    if (projectId) {
      createGroup({ projectId, label: 'New Group', color: 'blue' });
    }
  };

  const handleCenter = () => {
    setViewport({ x: 20, y: 20, zoom: 0.85 }, { duration: 600 });
  };

  return (
    <div className="workspace-toolbar glass-panel">
      <button
        className="btn btn-ghost btn-icon"
        onClick={handleAddGroup}
        data-tooltip="Add Group"
      >
        <SquareDashedBottomCode size={16} />
      </button>
      <div className="selection-action-bar__divider" />
      <button
        className="btn btn-ghost btn-icon"
        onClick={handleCenter}
        data-tooltip="Center View"
      >
        <Focus size={16} />
      </button>
      <div className="selection-action-bar__divider" />

      {/* Export dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setExportOpen(!exportOpen)}
          data-tooltip="Export"
        >
          <Download size={16} />
        </button>

        {exportOpen && (
          <div className="export-menu glass-panel fade-in-scale" id="export-menu">
            <button
              className="export-menu__item"
              onClick={() => {
                exportProjectAsJSON(projectId);
                setExportOpen(false);
              }}
            >
              Export as JSON
            </button>
            <button
              className="export-menu__item"
              onClick={() => {
                exportWorkspaceAsMarkdown(projectId);
                setExportOpen(false);
              }}
            >
              Export as Markdown
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
