export type OpenPathResult = {
  ok: boolean;
  message: string;
};

type OpenBridge = {
  workspace?: {
    openPath?: (rootPath: string | undefined, relativePath: string) => Promise<OpenPathResult>;
  };
};

export async function openWorkspacePath(
  rootPath: string | undefined,
  relativePath: string,
): Promise<OpenPathResult> {
  const bridge = (window as { workflowStudio?: OpenBridge }).workflowStudio;

  try {
    if (bridge?.workspace?.openPath) {
      return await bridge.workspace.openPath(rootPath, relativePath);
    }
  } catch (error) {
    console.warn("Unable to open workspace path.", error);
    return { ok: false, message: "Unable to open path." };
  }

  return { ok: false, message: "Open path is only available in the Electron app." };
}
