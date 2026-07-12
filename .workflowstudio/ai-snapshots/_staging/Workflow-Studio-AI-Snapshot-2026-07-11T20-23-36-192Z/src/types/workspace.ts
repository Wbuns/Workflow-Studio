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
  targetPlatform?: string;
  boardIdentifier?: string;
  framework?: string;
  firmwareSourcePath?: string;
  uploadCommand?: string;
  serialMonitorCommand?: string;
  cleanCommand?: string;
  deviceProfile?: string;
  hardwareConstraints?: string[];
};

export type WorkspaceAiContext = {
  schemaVersion?: string;
  purpose?: string;
  activeGoal?: string;
  currentFocus?: string;
  importantRules?: string[];
  nextLikelyMilestone?: string;
  recentlyCompleted?: string[];
  knownIssues?: string[];
};

export type WorkspaceMilestone = {
  id?: string;
  name?: string;
  status?: string;
  description?: string;
  startedDate?: string;
  completedDate?: string;
  relatedPackage?: string;
  suggestedCommitMessage?: string;
  notes?: string;
};

export type ActiveWorkspace = {
  id: string;
  name: string;
  rootPath: string;
  metadataPath: string;
  metadata: WorkspaceProjectMetadata;
  aiContext?: WorkspaceAiContext;
  milestones: WorkspaceMilestone[];
  loadedAt: string;
};

export type WorkspaceHealthItem = {
  label: string;
  value: string;
  detail: string;
};

export type AiContinuationPrompt = {
  title: string;
  prompt: string;
  generatedAt: string;
  workspaceName: string;
  milestone: string;
};
