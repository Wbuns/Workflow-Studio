import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import { getDashboardSummary } from "./DashboardService";
import type { DashboardSummary } from "./DashboardTypes";
import { DashboardWidgets } from "./DashboardWidgets";

type DashboardPageProps = {
  activePage: NavigationItem;
  rootPath?: string;
  onNavigate: (pageId: string) => void;
};

export function DashboardPage({ activePage, rootPath, onNavigate }: DashboardPageProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    getDashboardSummary(rootPath).then((nextSummary) => {
      if (isMounted) {
        setSummary(nextSummary);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rootPath]);

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{summary?.projectName ?? "Workflow Studio"}</h2>
        <p>
          <strong>{summary?.tagline ?? "Scanning workspace."}</strong>{" "}
          {summary?.description ??
            "Loading workspace intelligence and dashboard health."}
        </p>
      </section>

      {summary ? (
        <DashboardWidgets summary={summary} onNavigate={onNavigate} />
      ) : (
        <section className="module-panel">
          <h3>Loading Workspace</h3>
          <p>Scanning project files and preparing workspace health.</p>
        </section>
      )}
    </>
  );
}
