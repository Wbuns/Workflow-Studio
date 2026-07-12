import type { WorkspaceAnalysis, WorkspaceCommand } from "./workspaceAnalysis";

export type DevelopmentSessionLifecycle = "Planning" | "Implementation" | "Testing" | "Release";

export type DevelopmentSessionReadinessItem = {
  label: string;
  status: "Ready" | "In Progress" | "Not Started" | "Needs Attention";
};

export type DevelopmentSessionWorkspaceContext = {
  lifecycle: DevelopmentSessionLifecycle;
  readiness: DevelopmentSessionReadinessItem[];
  nextActions: string[];
  missingMetadata: string[];
};

export type DevelopmentSessionGitStatus = {
  isRepository: boolean;
  branch: string;
  status: "clean" | "dirty" | "not-repository";
  changedFiles: string[];
  summary: string;
};

export type DevelopmentSessionProject = {
  name: string;
  rootPath: string;
  projectType: WorkspaceAnalysis["projectType"];
  packageManager: WorkspaceAnalysis["packageManager"];
  currentMilestone?: string;
};

export type DevelopmentSessionDocumentation = {
  paths: string[];
  hardwarePaths: string[];
  specificationPaths: string[];
  packageFormatPaths: string[];
};

export type DevelopmentSessionCommands = {
  buildCommand?: string;
  testCommand?: string;
  devCommand?: string;
  workspaceCommands: WorkspaceCommand[];
};

export type DevelopmentSession = {
  id: string;
  generatedAt: string;
  project: DevelopmentSessionProject;
  workspace: WorkspaceAnalysis | null;
  workspaceContext: DevelopmentSessionWorkspaceContext;
  documentation: DevelopmentSessionDocumentation;
  commands: DevelopmentSessionCommands;
  gitStatus: DevelopmentSessionGitStatus | null;
  developerRequest: string;
  continuationPrompt: string;
  combinedPrompt: string;
  packageGenerationPrompt: string;
  warnings: string[];
  recommendations: string[];
};

export type CreateDevelopmentSessionInput = {
  analysis: WorkspaceAnalysis | null;
  gitStatus: DevelopmentSessionGitStatus | null;
  workspaceContext: DevelopmentSessionWorkspaceContext;
  developerRequest?: string;
  generatedAt?: Date;
};
