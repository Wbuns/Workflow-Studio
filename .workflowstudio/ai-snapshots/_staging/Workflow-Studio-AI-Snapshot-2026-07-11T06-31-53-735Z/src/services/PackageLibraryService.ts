export type WorkspacePackageEntry = {
  name: string;
  path: string;
  kind: "package-folder" | "installed-history" | "backup-folder";
  detail: string;
};

export type PackageLibraryBridge = {
  workspace?: {
    listPackages?: (rootPath?: string) => Promise<WorkspacePackageEntry[]>;
  };
};

export async function listWorkspacePackages(rootPath?: string): Promise<WorkspacePackageEntry[]> {
  const bridge = (window as { workflowStudio?: PackageLibraryBridge }).workflowStudio;

  try {
    if (bridge?.workspace?.listPackages) {
      return await bridge.workspace.listPackages(rootPath);
    }
  } catch (error) {
    console.warn("Unable to list workspace packages.", error);
  }

  return [];
}
