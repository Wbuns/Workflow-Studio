export type WorkspacePreferences = { activePageId?: string; sidebarCollapsed?: boolean; timelineFilter?: string; aiWorkspaceTab?: string; };
const KEY = "workflowstudio.preferences";
export function loadWorkspacePreferences(): WorkspacePreferences { try { const value = JSON.parse(window.localStorage.getItem(KEY) ?? "{}"); return value && typeof value === "object" ? value : {}; } catch { return {}; } }
export function updateWorkspacePreferences(patch: Partial<WorkspacePreferences>) { const next = { ...loadWorkspacePreferences(), ...patch }; window.localStorage.setItem(KEY, JSON.stringify(next)); return next; }
