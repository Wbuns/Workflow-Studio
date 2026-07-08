import { contextBridge } from "electron";
contextBridge.exposeInMainWorld("workflowStudio", {
    version: "0.2.0"
});
