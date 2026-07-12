import { resolveWorkspaceRoot } from "./ActiveWorkspaceService";
export type DocumentationEntry = {
  title: string;
  path: string;
  kind: "readme" | "docs" | "metadata" | "prompt" | "template";
};

export type DocumentationBridge = {
  workspace?: {
    listDocumentation?: (rootPath?: string) => Promise<DocumentationEntry[]>;
  };
};

export async function listDocumentation(rootPath?: string): Promise<DocumentationEntry[]> {
  const bridge = (window as { workflowStudio?: DocumentationBridge }).workflowStudio;

  try {
    if (bridge?.workspace?.listDocumentation) {
      return await bridge.workspace.listDocumentation(resolveWorkspaceRoot(rootPath));
    }
  } catch (error) {
    console.warn("Unable to list documentation.", error);
  }

  return [
    { title: "README", path: "README.md", kind: "readme" },
    { title: "Documentation folder", path: "docs", kind: "docs" },
  ];
}
