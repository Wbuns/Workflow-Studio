import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("workflowStudio", {
  version: "1.2.8",
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
  },
  scanWorkspace: (rootPath?: string) => ipcRenderer.invoke("workspace:scan", rootPath),
  openWorkspaceFolder: () => ipcRenderer.invoke("workspace:openFolder"),
});
