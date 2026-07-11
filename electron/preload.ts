import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("workflowStudio", {
  version: "1.4.3",
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
    runCommand: (rootPath: string | undefined, commandId: string, approvedPermission?: "interactive" | "device-changing") =>
      ipcRenderer.invoke("workspace:runCommand", rootPath, commandId, approvedPermission),
    cancelCommand: (executionId: string) =>
      ipcRenderer.invoke("workspace:cancelCommand", executionId),
    onCommandOutput: (listener: (output: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, output: unknown) => listener(output);
      ipcRenderer.on("workspace:commandOutput", handler);
      return () => ipcRenderer.removeListener("workspace:commandOutput", handler);
    },
  },
  scanWorkspace: (rootPath?: string) => ipcRenderer.invoke("workspace:scan", rootPath),
  openWorkspaceFolder: () => ipcRenderer.invoke("workspace:openFolder"),
});
