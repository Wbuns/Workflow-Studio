import { AIPage } from "../../features/ai/AIPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { DocumentationPage } from "../../features/documentation/DocumentationPage";
import { PackagesPage } from "../../features/packages/PackagesPage";
import { PlaceholderPage } from "../../features/placeholder/PlaceholderPage";
import { ProjectsPage } from "../../features/projects/ProjectsPage";
import type { NavigationItem } from "../../types/navigation";

type WorkspaceProps = {
  activePage: NavigationItem;
};

export function Workspace({ activePage }: WorkspaceProps) {
  return (
    <main className="workspace">
      {activePage.id === "dashboard" && (
        <DashboardPage activePage={activePage} />
      )}

      {activePage.id === "projects" && (
        <ProjectsPage activePage={activePage} />
      )}

      {activePage.id === "packages" && (
        <PackagesPage activePage={activePage} />
      )}

      {activePage.id === "documentation" && (
        <DocumentationPage activePage={activePage} />
      )}

      {activePage.id === "ai" && (
        <AIPage activePage={activePage} />
      )}

      {![
        "dashboard",
        "projects",
        "packages",
        "documentation",
        "ai",
      ].includes(activePage.id) && (
          <PlaceholderPage activePage={activePage} />
        )}
    </main>
  );
}