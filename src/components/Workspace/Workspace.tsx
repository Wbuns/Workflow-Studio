import { AIWorkspacePage } from "../../features/ai-development/AIDevelopmentPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { DeveloperToolsPage } from "../../features/developer-tools/DeveloperToolsPage";
import { DocumentationPage } from "../../features/documentation/DocumentationPage";
import { GitPage } from "../../features/git/GitPage";
import { PackagesPage } from "../../features/packages/PackagesPage";
import { ProjectsPage } from "../../features/projects/ProjectsPage";
import { TemplatesPage } from "../../features/templates/TemplatesPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { TimelinePage } from "../../features/timeline/TimelinePage";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord, WorkspaceRegistryState } from "../../types/workspaceRegistry";

type WorkspaceProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
  workspaceRegistry: WorkspaceRegistryState;
  onNavigate: (pageId: string) => void;
  onOpenWorkspace: () => Promise<void>;
  onSelectWorkspace: (projectId: string) => void;
  onToggleFavorite: (projectId: string, isFavorite: boolean) => void;
  onRemoveProject: (projectId: string) => void;
  onRefreshProject: (projectId: string) => Promise<void>;
};

export function Workspace({
  activePage, activeWorkspace, workspaceRegistry, onNavigate, onOpenWorkspace,
  onSelectWorkspace, onToggleFavorite, onRemoveProject, onRefreshProject,
}: WorkspaceProps) {
  const rootPath = activeWorkspace?.rootPath;

  return (
    <main className="workspace">
      {activePage.id === "dashboard" && <DashboardPage activePage={activePage} rootPath={rootPath} onNavigate={onNavigate} />}
      {activePage.id === "projects" && (
        <ProjectsPage
          activePage={activePage}
          activeWorkspace={activeWorkspace}
          registry={workspaceRegistry}
          onAddProject={onOpenWorkspace}
          onSelectProject={onSelectWorkspace}
          onToggleFavorite={onToggleFavorite}
          onRemoveProject={onRemoveProject}
          onRefreshProject={onRefreshProject}
        />
      )}
      {activePage.id === "timeline" && <TimelinePage activePage={activePage} rootPath={rootPath} />}
      {activePage.id === "packages" && (
        <PackagesPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "documentation" && (
        <DocumentationPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "ai-workspace" && (
        <AIWorkspacePage activePage={activePage} activeWorkspace={activeWorkspace} />
      )}
      {activePage.id === "git" && <GitPage activePage={activePage} rootPath={rootPath} />}
      {activePage.id === "templates" && (
        <TemplatesPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "developer-tools" && <DeveloperToolsPage activePage={activePage} activeWorkspace={activeWorkspace} />}
      {activePage.id === "settings" && <SettingsPage activePage={activePage} />}
    </main>
  );
}
