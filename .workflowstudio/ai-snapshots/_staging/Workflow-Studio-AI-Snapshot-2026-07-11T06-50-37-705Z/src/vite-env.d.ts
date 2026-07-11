/// <reference types="vite/client" />

import type { WorkflowStudioBridge } from "./types/workflowstudioApi";

declare global {
    interface Window {
        workflowStudio?: WorkflowStudioBridge;
    }
}

export {};
