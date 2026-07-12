import type { WorkspaceProjectType } from "./workspaceAnalysis";

export const WORKSPACE_REGISTRY_SCHEMA_VERSION = 1;

export type WorkspaceRegistryHealth = {
  score: number;
  status: "healthy" | "attention" | "unknown";
  warnings: string[];
  checkedAt: string;
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  rootPath: string;
  projectType: WorkspaceProjectType;
  isManaged: boolean;
  isFavorite: boolean;
  registeredAt: string;
  lastOpenedAt: string;
  health: WorkspaceRegistryHealth;
};

export type WorkspaceRegistryState = {
  schemaVersion: number;
  projects: WorkspaceRecord[];
  activeProjectId: string;
  recentProjectIds: string[];
  updatedAt: string;
};
