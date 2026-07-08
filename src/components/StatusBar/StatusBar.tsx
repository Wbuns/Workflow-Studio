import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";

type StatusBarProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

export function StatusBar({ activePage, activeWorkspace }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>Active page: {activePage.label}</span>
      <span>Workspace: {activeWorkspace?.name ?? "Scanning"}</span>
      <span>Build status: Ready</span>
      <span>Mode: Electron + React</span>
    </footer>
  );
}
