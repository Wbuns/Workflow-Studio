export type DashboardSummary = {
  projectName: string;
  tagline: string;
  description: string;
  version: string;
  currentMilestone: string;
  projectType: string;
  rootPath: string;
  gitEnabled: boolean;
  packageFolder: string;
  backupFolder: string;
  documentationCount: number;
  devCommand: string;
  buildCommand: string;
  testCommand: string;
  nextActions: string[];
};
