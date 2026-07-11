export type WorkspacePackageEntry = {
  name: string;
  path: string;
  kind: "package-folder" | "installed-history" | "backup-folder";
  detail: string;
};

export type WorkspacePackageTreeNode = {
  name: string;
  path: string;
  kind: "folder" | "file";
  children?: WorkspacePackageTreeNode[];
};

export type PackageLibraryBridge = {
  workspace?: {
    listPackages?: (rootPath?: string) => Promise<WorkspacePackageEntry[]>;
    getPackageTree?: (rootPath?: string) => Promise<WorkspacePackageTreeNode[]>;
  };
};

function bridge() {
  return (window as { workflowStudio?: PackageLibraryBridge }).workflowStudio;
}

export async function listWorkspacePackages(rootPath?: string): Promise<WorkspacePackageEntry[]> {
  try { return (await bridge()?.workspace?.listPackages?.(rootPath)) ?? []; }
  catch (error) { console.warn("Unable to list workspace packages.", error); return []; }
}

export async function getWorkspacePackageTree(rootPath?: string): Promise<WorkspacePackageTreeNode[]> {
  try { return (await bridge()?.workspace?.getPackageTree?.(rootPath)) ?? []; }
  catch (error) { console.warn("Unable to read package tree.", error); return []; }
}
