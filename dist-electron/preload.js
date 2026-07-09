import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("workflowStudio", {
    version: "1.3.0",
    platform: process.platform,
    workspace: {
        scan: (rootPath) => ipcRenderer.invoke("workspace:scan", rootPath),
        openFolder: () => ipcRenderer.invoke("workspace:openFolder"),
        gitStatus: (rootPath) => ipcRenderer.invoke("workspace:gitStatus", rootPath),
        listDocumentation: (rootPath) => ipcRenderer.invoke("workspace:listDocumentation", rootPath),
        listPackages: (rootPath) => ipcRenderer.invoke("workspace:listPackages", rootPath),
        listTemplates: (rootPath) => ipcRenderer.invoke("workspace:listTemplates", rootPath),
        openPath: (rootPath, relativePath) => ipcRenderer.invoke("workspace:openPath", rootPath, relativePath),
        createAISnapshot: (rootPath) => ipcRenderer.invoke("workspace:createAISnapshot", rootPath),
        listAISnapshots: (rootPath) => ipcRenderer.invoke("workspace:listAISnapshots", rootPath),
        openAISnapshotFolder: (rootPath) => ipcRenderer.invoke("workspace:openAISnapshotFolder", rootPath),
        createAIPackage: (input) => ipcRenderer.invoke("workspace:createAIPackage", input),
    },
    scanWorkspace: (rootPath) => ipcRenderer.invoke("workspace:scan", rootPath),
    openWorkspaceFolder: () => ipcRenderer.invoke("workspace:openFolder"),
});
