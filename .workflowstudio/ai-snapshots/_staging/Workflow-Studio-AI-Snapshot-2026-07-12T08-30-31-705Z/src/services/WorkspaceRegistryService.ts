import type { WorkspaceAnalysis } from "../types/workspaceAnalysis";
import type { WorkspaceRecord, WorkspaceRegistryState } from "../types/workspaceRegistry";
import { scanWorkspace } from "./WorkspaceScanner";

const STORAGE_KEY = "workflowstudio.recentWorkspaces";
const ACTIVE_KEY = "workflowstudio.activeWorkspaceId";

export type WorkspaceRegistryBridge = {
  workspace?: {
    openFolder?: () => Promise<WorkspaceAnalysis | null>;
  };
  openWorkspaceFolder?: () => Promise<WorkspaceAnalysis | null>;
};

function createWorkspaceId(rootPath: string): string {
  return rootPath.trim().toLowerCase();
}

function workspaceFromAnalysis(analysis: WorkspaceAnalysis): WorkspaceRecord {
  return {
    id: createWorkspaceId(analysis.rootPath),
    name: analysis.projectName,
    rootPath: analysis.rootPath,
    projectType: analysis.projectType,
    lastOpenedAt: new Date().toISOString(),
    isManaged: analysis.hasWorkflowMetadata,
  };
}

function readStoredWorkspaces(): WorkspaceRecord[] {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((workspace): workspace is WorkspaceRecord => {
      return (
        typeof workspace?.id === "string" &&
        typeof workspace?.name === "string" &&
        typeof workspace?.rootPath === "string" &&
        typeof workspace?.projectType === "string" &&
        typeof workspace?.lastOpenedAt === "string" &&
        typeof workspace?.isManaged === "boolean"
      );
    });
  } catch (error) {
    console.warn("Unable to read recent workspaces from local storage.", error);
    return [];
  }
}

function writeStoredWorkspaces(workspaces: WorkspaceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces.slice(0, 8)));
  } catch (error) {
    console.warn("Unable to save recent workspaces to local storage.", error);
  }
}

function writeActiveWorkspaceId(workspaceId: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, workspaceId);
  } catch (error) {
    console.warn("Unable to save active workspace selection.", error);
  }
}

function readActiveWorkspaceId() {
  try {
    return localStorage.getItem(ACTIVE_KEY) ?? "";
  } catch (error) {
    console.warn("Unable to read active workspace selection.", error);
    return "";
  }
}

export function upsertRecentWorkspace(
  workspaces: WorkspaceRecord[],
  workspace: WorkspaceRecord,
): WorkspaceRecord[] {
  return [workspace, ...workspaces.filter((item) => item.id !== workspace.id)].slice(0, 8);
}

export async function loadWorkspaceRegistry(): Promise<WorkspaceRegistryState> {
  const analysis = await scanWorkspace();
  const currentWorkspace = workspaceFromAnalysis(analysis);
  const storedWorkspaces = readStoredWorkspaces();
  const recentWorkspaces = upsertRecentWorkspace(storedWorkspaces, currentWorkspace);
  const storedActiveId = readActiveWorkspaceId();
  const activeWorkspaceId = recentWorkspaces.some((workspace) => workspace.id === storedActiveId)
    ? storedActiveId
    : currentWorkspace.id;

  writeStoredWorkspaces(recentWorkspaces);
  writeActiveWorkspaceId(activeWorkspaceId);

  return {
    activeWorkspaceId,
    recentWorkspaces,
  };
}

export function selectWorkspace(
  state: WorkspaceRegistryState,
  workspaceId: string,
): WorkspaceRegistryState {
  const selectedWorkspace = state.recentWorkspaces.find((workspace) => workspace.id === workspaceId);
  if (!selectedWorkspace) return state;

  const nextWorkspace = {
    ...selectedWorkspace,
    lastOpenedAt: new Date().toISOString(),
  };

  const recentWorkspaces = upsertRecentWorkspace(state.recentWorkspaces, nextWorkspace);

  writeStoredWorkspaces(recentWorkspaces);
  writeActiveWorkspaceId(nextWorkspace.id);

  return {
    activeWorkspaceId: nextWorkspace.id,
    recentWorkspaces,
  };
}

export async function openWorkspaceFolder(
  state: WorkspaceRegistryState,
): Promise<WorkspaceRegistryState> {
  const bridge = (window as { workflowStudio?: WorkspaceRegistryBridge }).workflowStudio;

  try {
    const analysis = bridge?.workspace?.openFolder
      ? await bridge.workspace.openFolder()
      : bridge?.openWorkspaceFolder
        ? await bridge.openWorkspaceFolder()
        : null;

    if (!analysis) return state;

    const workspace = workspaceFromAnalysis(analysis);
    const recentWorkspaces = upsertRecentWorkspace(state.recentWorkspaces, workspace);

    writeStoredWorkspaces(recentWorkspaces);
    writeActiveWorkspaceId(workspace.id);

    return {
      activeWorkspaceId: workspace.id,
      recentWorkspaces,
    };
  } catch (error) {
    console.warn("Unable to open workspace folder.", error);
    return state;
  }
}
