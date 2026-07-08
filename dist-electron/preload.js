import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("workflowStudio", {
    version: "1.1.1",
    platform: process.platform,
    workspace: {
        getActiveWorkspace: () => ipcRenderer.invoke("workspace:get-active"),
        getProjectMetadata: () => ipcRenderer.invoke("workspace:get-project-metadata"),
        generateContinuationPrompt: () => ipcRenderer.invoke("workspace:generate-continuation-prompt"),
    },
    git: {
        getStatus: () => ipcRenderer.invoke("git:get-status"),
    },
});
