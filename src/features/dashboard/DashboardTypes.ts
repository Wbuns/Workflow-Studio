import type { DevelopmentSession } from "../../services/SessionService";

export type WorkspaceProjectMetadata = {
  schemaVersion?: string;
  name: string;
  description?: string;
  version: string;
  currentMilestone: string;
  projectType: string;
  rootPath?: string;
  gitEnabled: boolean;
  devCommand?: string;
  buildCommand?: string;
  testCommand?: string;
  packageFolder: string;
  backupFolder: string;
  documentationPaths?: string[];
  tagline?: string;
};

export type DashboardSummary = {
  projectName: string;
  tagline: string;
  description: string;
  version: string;
  currentMilestone: string;
  projectType: string;
  gitEnabled: boolean;
  packageFolder: string;
  backupFolder: string;
  documentationCount: number;
  devCommand: string;
  buildCommand: string;
  testCommand: string;
  nextActions: string[];
  session: DevelopmentSession;
};