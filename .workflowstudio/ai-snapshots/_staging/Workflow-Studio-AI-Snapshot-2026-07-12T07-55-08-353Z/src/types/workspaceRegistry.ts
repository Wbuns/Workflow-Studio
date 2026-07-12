export type WorkspaceRecord = {
  id: string;
  name: string;
  rootPath: string;
  projectType: string;
  lastOpenedAt: string;
  isManaged: boolean;
};

export type WorkspaceRegistryState = {
  activeWorkspaceId: string;
  recentWorkspaces: WorkspaceRecord[];
};
