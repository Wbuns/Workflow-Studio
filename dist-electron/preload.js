import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("workflowStudio", {
    version: "1.2.1",
    platform: process.platform,
    workspace: {
        scan: () => ipcRenderer.invoke("workspace:scan"),
    },
    scanWorkspace: () => ipcRenderer.invoke("workspace:scan"),
});
