import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("workflowStudio", {
    version: "1.2.8",
    platform: process.platform,
    workspace: {
        scan: (rootPath) => ipcRenderer.invoke("workspace:scan", rootPath),
        openFolder: () => ipcRenderer.invoke("workspace:openFolder"),
        gitStatus: (rootPath) => ipcRenderer.invoke("workspace:gitStatus", rootPath),
        listDocumentation: (rootPath) => ipcRenderer.invoke("workspace:listDocumentation", rootPath),
        listPackages: (rootPath) => ipcRenderer.invoke("workspace:listPackages", rootPath),
        listTemplates: (rootPath) => ipcRenderer.invoke("workspace:listTemplates", rootPath),
        openPath: (rootPath, relativePath) => ipcRenderer.invoke("workspace:openPath", rootPath, relativePath),
    },
    scanWorkspace: (rootPath) => ipcRenderer.invoke("workspace:scan", rootPath),
    openWorkspaceFolder: () => ipcRenderer.invoke("workspace:openFolder"),
});
