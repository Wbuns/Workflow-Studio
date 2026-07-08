import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("workflowStudio", {
    version: "1.0.0-core",
    platform: process.platform,
    git: {
        getStatus: () => ipcRenderer.invoke("git:get-status"),
    },
});
