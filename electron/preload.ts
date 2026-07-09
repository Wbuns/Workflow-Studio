import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("workflowStudio", {
  version: "1.3.0",
  platform: process.platform,
  workspace: {
    scan: (rootPath?: string) => ipcRenderer.invoke("workspace:scan", rootPath),
    openFolder: () => ipcRenderer.invoke("workspace:openFolder"),
    gitStatus: (rootPath?: string) => ipcRenderer.invoke("workspace:gitStatus", rootPath),
    listDocumentation: (rootPath?: string) =>
      ipcRenderer.invoke("workspace:listDocumentation", rootPath),
    listPackages: (rootPath?: string) => ipcRenderer.invoke("workspace:listPackages", rootPath),
    listTemplates: (rootPath?: string) => ipcRenderer.invoke("workspace:listTemplates", rootPath),
    openPath: (rootPath: string | undefined, relativePath: string) =>
      ipcRenderer.invoke("workspace:openPath", rootPath, relativePath),
    createAISnapshot: (rootPath?: string) =>
      ipcRenderer.invoke("workspace:createAISnapshot", rootPath),
    listAISnapshots: (rootPath?: string) =>
      ipcRenderer.invoke("workspace:listAISnapshots", rootPath),
    openAISnapshotFolder: (rootPath?: string) =>
      ipcRenderer.invoke("workspace:openAISnapshotFolder", rootPath),
    createAIPackage: (input: { rootPath?: string; developerRequest: string; packageId?: string }) =>
      ipcRenderer.invoke("workspace:createAIPackage", input),
  },
  scanWorkspace: (rootPath?: string) => ipcRenderer.invoke("workspace:scan", rootPath),
  openWorkspaceFolder: () => ipcRenderer.invoke("workspace:openFolder"),
});
