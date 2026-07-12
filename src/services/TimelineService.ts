import { resolveWorkspaceRoot } from "./ActiveWorkspaceService";
import type { ProjectTimelineResult } from "../types/timeline";

type TimelineBridge = {
  workspace?: {
    listProjectTimeline?: (rootPath?: string) => Promise<ProjectTimelineResult>;
  };
};

function bridge() {
  return (window as unknown as { workflowStudio?: TimelineBridge }).workflowStudio;
}

export async function getProjectTimeline(rootPath?: string): Promise<ProjectTimelineResult> {
  const loadTimeline = bridge()?.workspace?.listProjectTimeline;
  if (!loadTimeline) {
    return {
      generatedAt: new Date().toISOString(),
      events: [],
      warnings: ["Project timeline backend is not available. Restart Workflow Studio after installing the package."],
    };
  }
  return loadTimeline(resolveWorkspaceRoot(rootPath));
}
