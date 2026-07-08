import { AIPage } from "../../features/ai/AIPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { PlaceholderPage } from "../../features/placeholder/PlaceholderPage";
import { ProjectsPage } from "../../features/projects/ProjectsPage";
import type { NavigationItem } from "../../types/navigation";

type WorkspaceProps = {
  activePage: NavigationItem;
};

export function Workspace({ activePage }: WorkspaceProps) {
  return (
    <main className="workspace">
      {activePage.id === "dashboard" && <DashboardPage activePage={activePage} />}
      {activePage.id === "projects" && <ProjectsPage activePage={activePage} />}
      {activePage.id === "ai" && <AIPage activePage={activePage} />}
      {activePage.id !== "dashboard" &&
        activePage.id !== "projects" &&
        activePage.id !== "ai" && <PlaceholderPage activePage={activePage} />}
    </main>
  );
}
