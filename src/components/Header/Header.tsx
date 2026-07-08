import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";

type HeaderProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
  recentWorkspaces: WorkspaceRecord[];
  onOpenWorkspace: () => void;
  onSelectWorkspace: (workspaceId: string) => void;
};

export function Header({
  activePage,
  activeWorkspace,
  recentWorkspaces,
  onOpenWorkspace,
  onSelectWorkspace,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Workflow Studio</p>
        <h1>{activePage.title}</h1>
      </div>

      <div className="workspace-switcher">
        <label htmlFor="workspace-select">Workspace</label>
        <div className="workspace-switcher-controls">
          <select
            id="workspace-select"
            value={activeWorkspace?.id ?? ""}
            onChange={(event) => onSelectWorkspace(event.target.value)}
          >
            {recentWorkspaces.length === 0 && <option value="">Loading workspace…</option>}
            {recentWorkspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="button" onClick={onOpenWorkspace}>
            Open Folder
          </button>
        </div>
        <span>{activeWorkspace?.rootPath ?? "Scanning current workspace"}</span>
      </div>
    </header>
  );
}
