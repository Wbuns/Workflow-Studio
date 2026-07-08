import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import { getDashboardSummary } from "./DashboardService";
import type { DashboardSummary } from "./DashboardTypes";
import { DashboardWidgets } from "./DashboardWidgets";

type DashboardPageProps = {
  activePage: NavigationItem;
};

export function DashboardPage({ activePage }: DashboardPageProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    getDashboardSummary().then((nextSummary) => {
      if (isMounted) {
        setSummary(nextSummary);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{summary?.projectName ?? "Workflow Studio"}</h2>
        <p>
          <strong>{summary?.tagline ?? "Build software. Not setup."}</strong>{" "}
          {summary?.description ??
            "Loading workspace metadata and dashboard summary."}
        </p>
      </section>

      {summary ? (
        <DashboardWidgets summary={summary} />
      ) : (
        <section className="module-panel">
          <h3>Loading Workspace</h3>
          <p>Reading workspace metadata and preparing the dashboard.</p>
        </section>
      )}
    </>
  );
}
