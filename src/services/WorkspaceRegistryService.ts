import type { WorkspaceAnalysis } from "../types/workspaceAnalysis";
import {
  WORKSPACE_REGISTRY_SCHEMA_VERSION,
  type WorkspaceRecord,
  type WorkspaceRegistryHealth,
  type WorkspaceRegistryState,
} from "../types/workspaceRegistry";
import { scanWorkspace } from "./WorkspaceScanner";

const REGISTRY_STORAGE_KEY = "workflowstudio.workspaceRegistry";
const LEGACY_WORKSPACES_KEY = "workflowstudio.recentWorkspaces";
const LEGACY_ACTIVE_KEY = "workflowstudio.activeWorkspaceId";
const MAX_RECENT_PROJECTS = 8;

export type WorkspaceRegistryBridge = {
  workspace?: {
    openFolder?: () => Promise<WorkspaceAnalysis | null>;
  };
  openWorkspaceFolder?: () => Promise<WorkspaceAnalysis | null>;
};

function now(): string {
  return new Date().toISOString();
}

function createWorkspaceId(rootPath: string): string {
  return rootPath.trim().replace(/[\\/]+$/, "").toLowerCase();
}

function createHealth(analysis: WorkspaceAnalysis): WorkspaceRegistryHealth {
  const checkedAt = now();
  const warnings = [...analysis.health.warnings];

  return {
    score: analysis.health.score,
    status: warnings.length > 0 || analysis.health.score < 100 ? "attention" : "healthy",
    warnings,
    checkedAt,
  };
}

function workspaceFromAnalysis(
  analysis: WorkspaceAnalysis,
  existing?: WorkspaceRecord,
): WorkspaceRecord {
  const timestamp = now();

  return {
    id: createWorkspaceId(analysis.rootPath),
    name: analysis.projectName,
    rootPath: analysis.rootPath,
    projectType: analysis.projectType,
    isManaged: analysis.hasWorkflowMetadata,
    isFavorite: existing?.isFavorite ?? false,
    registeredAt: existing?.registeredAt ?? timestamp,
    lastOpenedAt: timestamp,
    health: createHealth(analysis),
  };
}

function emptyRegistry(): WorkspaceRegistryState {
  return {
    schemaVersion: WORKSPACE_REGISTRY_SCHEMA_VERSION,
    projects: [],
    activeProjectId: "",
    recentProjectIds: [],
    updatedAt: now(),
  };
}

function isWorkspaceRecord(value: unknown): value is WorkspaceRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<WorkspaceRecord>;

  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.rootPath === "string" &&
    typeof record.projectType === "string" &&
    typeof record.isManaged === "boolean" &&
    typeof record.isFavorite === "boolean" &&
    typeof record.registeredAt === "string" &&
    typeof record.lastOpenedAt === "string" &&
    Boolean(record.health) &&
    typeof record.health?.score === "number" &&
    typeof record.health?.status === "string" &&
    Array.isArray(record.health?.warnings) &&
    typeof record.health?.checkedAt === "string"
  );
}

function normalizeRegistry(value: unknown): WorkspaceRegistryState | null {
  if (!value || typeof value !== "object") return null;
  const registry = value as Partial<WorkspaceRegistryState>;
  if (!Array.isArray(registry.projects)) return null;

  const projects = registry.projects.filter(isWorkspaceRecord);
  const projectIds = new Set(projects.map((project) => project.id));
  const activeProjectId =
    typeof registry.activeProjectId === "string" && projectIds.has(registry.activeProjectId)
      ? registry.activeProjectId
      : projects[0]?.id ?? "";
  const recentProjectIds = Array.isArray(registry.recentProjectIds)
    ? registry.recentProjectIds.filter(
        (id): id is string => typeof id === "string" && projectIds.has(id),
      )
    : [];

  return {
    schemaVersion: WORKSPACE_REGISTRY_SCHEMA_VERSION,
    projects,
    activeProjectId,
    recentProjectIds: [...new Set(recentProjectIds)].slice(0, MAX_RECENT_PROJECTS),
    updatedAt: typeof registry.updatedAt === "string" ? registry.updatedAt : now(),
  };
}

function migrateLegacyRegistry(): WorkspaceRegistryState | null {
  try {
    const rawProjects = localStorage.getItem(LEGACY_WORKSPACES_KEY);
    if (!rawProjects) return null;

    const parsed = JSON.parse(rawProjects);
    if (!Array.isArray(parsed)) return null;

    const timestamp = now();
    const projects: WorkspaceRecord[] = parsed.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const legacy = value as Record<string, unknown>;
      if (
        typeof legacy.id !== "string" ||
        typeof legacy.name !== "string" ||
        typeof legacy.rootPath !== "string" ||
        typeof legacy.projectType !== "string"
      ) {
        return [];
      }

      return [{
        id: legacy.id,
        name: legacy.name,
        rootPath: legacy.rootPath,
        projectType: legacy.projectType as WorkspaceRecord["projectType"],
        isManaged: Boolean(legacy.isManaged),
        isFavorite: false,
        registeredAt: typeof legacy.lastOpenedAt === "string" ? legacy.lastOpenedAt : timestamp,
        lastOpenedAt: typeof legacy.lastOpenedAt === "string" ? legacy.lastOpenedAt : timestamp,
        health: {
          score: 0,
          status: "unknown",
          warnings: [],
          checkedAt: timestamp,
        },
      }];
    });

    if (!projects.length) return null;
    const storedActiveId = localStorage.getItem(LEGACY_ACTIVE_KEY) ?? "";

    return {
      schemaVersion: WORKSPACE_REGISTRY_SCHEMA_VERSION,
      projects,
      activeProjectId: projects.some((project) => project.id === storedActiveId)
        ? storedActiveId
        : projects[0].id,
      recentProjectIds: projects.map((project) => project.id).slice(0, MAX_RECENT_PROJECTS),
      updatedAt: timestamp,
    };
  } catch (error) {
    console.warn("Unable to migrate the legacy workspace registry.", error);
    return null;
  }
}

function readRegistry(): WorkspaceRegistryState {
  try {
    const rawValue = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (rawValue) {
      const normalized = normalizeRegistry(JSON.parse(rawValue));
      if (normalized) return normalized;
    }
  } catch (error) {
    console.warn("Unable to read the workspace registry.", error);
  }

  return migrateLegacyRegistry() ?? emptyRegistry();
}

function writeRegistry(registry: WorkspaceRegistryState): WorkspaceRegistryState {
  const normalized = normalizeRegistry({ ...registry, updatedAt: now() }) ?? emptyRegistry();

  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn("Unable to save the workspace registry.", error);
  }

  return normalized;
}

function markRecent(ids: string[], projectId: string): string[] {
  return [projectId, ...ids.filter((id) => id !== projectId)].slice(0, MAX_RECENT_PROJECTS);
}

export function getActiveProject(state: WorkspaceRegistryState): WorkspaceRecord | undefined {
  return state.projects.find((project) => project.id === state.activeProjectId);
}

export function getRecentProjects(state: WorkspaceRegistryState): WorkspaceRecord[] {
  const projectsById = new Map(state.projects.map((project) => [project.id, project]));
  return state.recentProjectIds.flatMap((id) => {
    const project = projectsById.get(id);
    return project ? [project] : [];
  });
}

export function getFavoriteProjects(state: WorkspaceRegistryState): WorkspaceRecord[] {
  return state.projects.filter((project) => project.isFavorite);
}

export function registerProject(
  state: WorkspaceRegistryState,
  analysis: WorkspaceAnalysis,
): WorkspaceRegistryState {
  const id = createWorkspaceId(analysis.rootPath);
  const existing = state.projects.find((project) => project.id === id);
  const project = workspaceFromAnalysis(analysis, existing);

  return writeRegistry({
    ...state,
    projects: [project, ...state.projects.filter((item) => item.id !== id)],
    activeProjectId: project.id,
    recentProjectIds: markRecent(state.recentProjectIds, project.id),
  });
}

export function removeProject(
  state: WorkspaceRegistryState,
  projectId: string,
): WorkspaceRegistryState {
  const projects = state.projects.filter((project) => project.id !== projectId);
  const recentProjectIds = state.recentProjectIds.filter((id) => id !== projectId);
  const activeProjectId =
    state.activeProjectId === projectId
      ? recentProjectIds[0] ?? projects[0]?.id ?? ""
      : state.activeProjectId;

  return writeRegistry({ ...state, projects, recentProjectIds, activeProjectId });
}

export function setProjectFavorite(
  state: WorkspaceRegistryState,
  projectId: string,
  isFavorite: boolean,
): WorkspaceRegistryState {
  return writeRegistry({
    ...state,
    projects: state.projects.map((project) =>
      project.id === projectId ? { ...project, isFavorite } : project,
    ),
  });
}

export async function loadWorkspaceRegistry(): Promise<WorkspaceRegistryState> {
  const registry = readRegistry();
  const analysis = await scanWorkspace();
  return registerProject(registry, analysis);
}

export function selectWorkspace(
  state: WorkspaceRegistryState,
  projectId: string,
): WorkspaceRegistryState {
  const selectedProject = state.projects.find((project) => project.id === projectId);
  if (!selectedProject) return state;

  return writeRegistry({
    ...state,
    projects: state.projects.map((project) =>
      project.id === projectId ? { ...project, lastOpenedAt: now() } : project,
    ),
    activeProjectId: projectId,
    recentProjectIds: markRecent(state.recentProjectIds, projectId),
  });
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

    return analysis ? registerProject(state, analysis) : state;
  } catch (error) {
    console.warn("Unable to open and register a workspace folder.", error);
    return state;
  }
}
