export type WorkspaceTemplateEntry = {
  name: string;
  path: string;
  kind: "template" | "prompt";
  detail: string;
};

export type TemplateLibraryBridge = {
  workspace?: {
    listTemplates?: (rootPath?: string) => Promise<WorkspaceTemplateEntry[]>;
  };
};

export async function listWorkspaceTemplates(rootPath?: string): Promise<WorkspaceTemplateEntry[]> {
  const bridge = (window as { workflowStudio?: TemplateLibraryBridge }).workflowStudio;

  try {
    if (bridge?.workspace?.listTemplates) {
      return await bridge.workspace.listTemplates(rootPath);
    }
  } catch (error) {
    console.warn("Unable to list workspace templates.", error);
  }

  return [];
}
