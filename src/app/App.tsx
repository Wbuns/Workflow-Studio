import { useEffect, useMemo, useState } from "react";
import { CommandPalette } from "../components/CommandPalette/CommandPalette";
import { Header } from "../components/Header/Header";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { StatusBar } from "../components/StatusBar/StatusBar";
import { Workspace } from "../components/Workspace/Workspace";
import { WorkspaceSearch } from "../components/WorkspaceSearch/WorkspaceSearch";
import { navigationItems } from "../data/navigation";
import {
  loadWorkspaceRegistry,
  getActiveProject,
  getRecentProjects,
  openWorkspaceFolder,
  selectWorkspace,
} from "../services/WorkspaceRegistryService";
import type { WorkspaceRegistryState } from "../types/workspaceRegistry";
import { loadWorkspacePreferences, updateWorkspacePreferences } from "../services/WorkspacePreferencesService";
import "./App.css";

function getInitialPageId() {
  const saved = loadWorkspacePreferences().activePageId;
  return navigationItems.some((item) => item.id === saved) ? saved! : "dashboard";
}

function App() {
  const [activePageId, setActivePageId] = useState(getInitialPageId);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => Boolean(loadWorkspacePreferences().sidebarCollapsed),
  );
  const [workspaceRegistry, setWorkspaceRegistry] = useState<WorkspaceRegistryState>({
    schemaVersion: 1,
    projects: [],
    activeProjectId: "",
    recentProjectIds: [],
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    let isMounted = true;

    loadWorkspaceRegistry().then((registry) => {
      if (isMounted) {
        setWorkspaceRegistry(registry);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const activePage =
    navigationItems.find((item) => item.id === activePageId) ??
    navigationItems[0];

  const activeWorkspace = useMemo(
    () => getActiveProject(workspaceRegistry),
    [workspaceRegistry],
  );

  const recentWorkspaces = useMemo(
    () => getRecentProjects(workspaceRegistry),
    [workspaceRegistry],
  );

  useEffect(() => {
    updateWorkspacePreferences({ activePageId });
  }, [activePageId]);

  useEffect(() => {
    updateWorkspacePreferences({ sidebarCollapsed });
  }, [sidebarCollapsed]);

  function handleNavigate(pageId: string) {
    setActivePageId(pageId);
  }

  function handleSelectWorkspace(workspaceId: string) {
    setWorkspaceRegistry((currentRegistry) => selectWorkspace(currentRegistry, workspaceId));
  }

  async function handleOpenWorkspace() {
    const nextRegistry = await openWorkspaceFolder(workspaceRegistry);
    setWorkspaceRegistry(nextRegistry);
  }

  return (
    <div className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <Header
        activePage={activePage}
        activeWorkspace={activeWorkspace}
        recentWorkspaces={recentWorkspaces}
        onOpenWorkspace={handleOpenWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
      />
      <Sidebar
        activePageId={activePageId}
        navigationItems={navigationItems}
        collapsed={sidebarCollapsed}
        onNavigate={handleNavigate}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />
      <Workspace activePage={activePage} activeWorkspace={activeWorkspace} onNavigate={handleNavigate} />
      <StatusBar activePage={activePage} activeWorkspace={activeWorkspace} />
      <CommandPalette navigationItems={navigationItems} onNavigate={handleNavigate} />
      <WorkspaceSearch rootPath={activeWorkspace?.rootPath} navigationItems={navigationItems} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
