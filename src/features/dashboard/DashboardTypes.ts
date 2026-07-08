import type { WorkspaceAnalysis, WorkspaceCapability } from "../../types/workspaceAnalysis";

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
  packageManager: string;
  rootPath: string;
  healthScore: number;
  healthStatus: "Excellent" | "Good" | "Needs Attention";
  healthWarnings: string[];
  healthSuccesses: string[];
  capabilities: WorkspaceCapability[];
  workspaceAnalysis: WorkspaceAnalysis;
  nextActions: string[];
};
