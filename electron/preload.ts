import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("workflowStudio", {
  version: "1.2.7",
  platform: process.platform,
  workspace: {
    scan: (rootPath?: string) => ipcRenderer.invoke("workspace:scan", rootPath),
    openFolder: () => ipcRenderer.invoke("workspace:openFolder"),
    gitStatus: (rootPath?: string) => ipcRenderer.invoke("workspace:gitStatus", rootPath),
    listDocumentation: (rootPath?: string) =>
      ipcRenderer.invoke("workspace:listDocumentation", rootPath),
  },
  scanWorkspace: (rootPath?: string) => ipcRenderer.invoke("workspace:scan", rootPath),
  openWorkspaceFolder: () => ipcRenderer.invoke("workspace:openFolder"),
});
