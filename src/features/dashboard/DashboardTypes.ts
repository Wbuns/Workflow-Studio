import type { SmartRecommendation } from "../../types/recommendation";
import type { WorkspaceAnalysis, WorkspaceCapability } from "../../types/workspaceAnalysis";

export type ProjectLifecyclePhase = "Planning" | "Implementation" | "Testing" | "Release";
export type ReadinessStatus = "Ready" | "In Progress" | "Not Started" | "Needs Attention";

export type ReadinessCategory = {
  id: "foundation" | "documentation" | "implementation" | "delivery";
  label: string;
  score?: number;
  status: ReadinessStatus;
  detail: string;
};

export type GuidanceItem = {
  label: string;
  kind: "next" | "warning" | "planned";
};

export type DashboardSummary = {
  projectName: string;
  tagline: string;
  description: string;
  version: string;
  currentMilestone: string;
  projectType: string;
  lifecyclePhase: ProjectLifecyclePhase;
  readinessScore: number;
  readinessStatus: "Excellent" | "Good" | "Developing";
  readinessCategories: ReadinessCategory[];
  guidance: GuidanceItem[];
  recommendations: SmartRecommendation[];
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
