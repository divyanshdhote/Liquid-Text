import { SquareDashedBottomCode, Focus } from 'lucide-react';
import useWorkspaceStore from '../../stores/workspaceStore.js';
import { useReactFlow } from '@xyflow/react';

/**
 * WorkspaceToolbar — Floating toolbar for the canvas.
 * @param {object} props
 * @param {number} props.projectId
 */
export default function WorkspaceToolbar({ projectId }) {
  const { createGroup } = useWorkspaceStore();
  const { fitView } = useReactFlow();

  const handleAddGroup = () => {
    if (projectId) {
      createGroup({ projectId, label: 'New Group', color: 'blue' });
    }
  };

  const handleCenter = () => {
    fitView({ duration: 800, padding: 0.2 });
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
    </div>
  );
}
