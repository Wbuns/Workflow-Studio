import type { WorkspaceProjectMetadata } from "../features/dashboard/DashboardTypes";
import type { GitStatus } from "./git";

export type WorkflowStudioBridge = {
    version: string;
    platform: string;
    git?: {
        getStatus: () => Promise<GitStatus>;
    };
    workspace?: {
        getProjectMetadata?: () => Promise<WorkspaceProjectMetadata>;
        getProject?: () => Promise<WorkspaceProjectMetadata>;
    };
    getProjectMetadata?: () => Promise<WorkspaceProjectMetadata>;
};
