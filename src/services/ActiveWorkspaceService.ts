import type { WorkspaceRecord, WorkspaceRegistryState } from "../types/workspaceRegistry";

const REGISTRY_STORAGE_KEY = "workflowstudio.workspaceRegistry";

function readRegistry(): WorkspaceRegistryState | null {
  try {
    const rawValue = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<WorkspaceRegistryState>;
    if (!Array.isArray(parsed.projects) || typeof parsed.activeProjectId !== "string") {
      return null;
    }

    return parsed as WorkspaceRegistryState;
  } catch (error) {
    console.warn("Unable to read the active workspace registry.", error);
    return null;
  }
}

export function getActiveWorkspace(): WorkspaceRecord | undefined {
  const registry = readRegistry();
  return registry?.projects.find((project) => project.id === registry.activeProjectId);
}

export function getActiveWorkspaceRoot(): string | undefined {
  return getActiveWorkspace()?.rootPath;
}

export function resolveWorkspaceRoot(rootPath?: string): string | undefined {
  return rootPath ?? getActiveWorkspaceRoot();
}

export const ACTIVE_WORKSPACE_CHANGED_EVENT = "workflowstudio:active-workspace-changed";

export type ActiveWorkspaceChangedDetail = {
  previousWorkspace?: WorkspaceRecord;
  activeWorkspace?: WorkspaceRecord;
};

export function notifyActiveWorkspaceChanged(
  detail: ActiveWorkspaceChangedDetail,
): void {
  window.dispatchEvent(
    new CustomEvent<ActiveWorkspaceChangedDetail>(
      ACTIVE_WORKSPACE_CHANGED_EVENT,
      { detail },
    ),
  );
}

export function subscribeToActiveWorkspaceChanges(
  listener: (detail: ActiveWorkspaceChangedDetail) => void,
): () => void {
  const handleChange = (event: Event) => {
    listener((event as CustomEvent<ActiveWorkspaceChangedDetail>).detail);
  };

  window.addEventListener(ACTIVE_WORKSPACE_CHANGED_EVENT, handleChange);

  return () => {
    window.removeEventListener(ACTIVE_WORKSPACE_CHANGED_EVENT, handleChange);
  };
}
