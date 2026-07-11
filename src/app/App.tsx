import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header/Header";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { StatusBar } from "../components/StatusBar/StatusBar";
import { Workspace } from "../components/Workspace/Workspace";
import { navigationItems } from "../data/navigation";
import {
  loadWorkspaceRegistry,
  openWorkspaceFolder,
  selectWorkspace,
} from "../services/WorkspaceRegistryService";
import type { WorkspaceRegistryState } from "../types/workspaceRegistry";
import "./App.css";

const ACTIVE_PAGE_KEY = "workflowstudio.activePage";

function getInitialPageId() {
  const saved = window.sessionStorage.getItem(ACTIVE_PAGE_KEY);
  return navigationItems.some((item) => item.id === saved) ? saved! : "dashboard";
}

function App() {
  const [activePageId, setActivePageId] = useState(getInitialPageId);
  const [workspaceRegistry, setWorkspaceRegistry] = useState<WorkspaceRegistryState>({
    activeWorkspaceId: "",
    recentWorkspaces: [],
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

  const activeWorkspace = useMemo(() => {
    return (
      workspaceRegistry.recentWorkspaces.find(
        (workspace) => workspace.id === workspaceRegistry.activeWorkspaceId,
      ) ?? workspaceRegistry.recentWorkspaces[0]
    );
  }, [workspaceRegistry]);

  useEffect(() => {
    window.sessionStorage.setItem(ACTIVE_PAGE_KEY, activePageId);
  }, [activePageId]);

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
    <div className="app-shell">
      <Header
        activePage={activePage}
        activeWorkspace={activeWorkspace}
        recentWorkspaces={workspaceRegistry.recentWorkspaces}
        onOpenWorkspace={handleOpenWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
      />
      <Sidebar
        activePageId={activePageId}
        navigationItems={navigationItems}
        onNavigate={handleNavigate}
      />
      <Workspace activePage={activePage} activeWorkspace={activeWorkspace} onNavigate={handleNavigate} />
      <StatusBar activePage={activePage} activeWorkspace={activeWorkspace} />
    </div>
  );
}

export default App;
