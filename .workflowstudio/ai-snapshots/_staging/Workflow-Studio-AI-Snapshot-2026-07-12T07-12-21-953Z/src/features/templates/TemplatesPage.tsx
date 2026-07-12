import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import {
  listWorkspaceTemplates,
  type WorkspaceTemplateEntry,
} from "../../services/TemplateLibraryService";
import { openWorkspacePath } from "../../services/WorkspaceOpenService";

type TemplatesPageProps = {
  activePage: NavigationItem;
  rootPath?: string;
};

function formatKind(kind: WorkspaceTemplateEntry["kind"]) {
  return kind === "prompt" ? "Prompt" : "Template";
}

export function TemplatesPage({ activePage, rootPath }: TemplatesPageProps) {
  const [entries, setEntries] = useState<WorkspaceTemplateEntry[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    listWorkspaceTemplates(rootPath).then((nextEntries) => {
      if (isMounted) {
        setEntries(nextEntries);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rootPath]);

  async function handleOpenPath(relativePath: string) {
    const result = await openWorkspacePath(rootPath, relativePath);
    setStatus(result.message);
  }

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Templates</h2>
        <p>
          <strong>Template and prompt discovery is active.</strong> This page lists reusable
          files from templates and prompts so they are easy to find while building packages.
        </p>
      </section>

      <section className="detail-panel library-panel">
        <div className="library-panel-header">
          <h3>Reusable Project Starters</h3>
          {status && <span>{status}</span>}
        </div>

        {entries === null ? (
          <p className="empty-state">Scanning reusable files.</p>
        ) : entries.length > 0 ? (
          <div className="library-list">
            {entries.map((entry) => (
              <article className="library-card" key={`${entry.kind}-${entry.path}-${entry.name}`}>
                <div>
                  <strong>{entry.name}</strong>
                  <span>{entry.path}</span>
                  <p>{entry.detail}</p>
                </div>
                <div className="library-card-actions">
                  <mark>{formatKind(entry.kind)}</mark>
                  <button className="secondary-button" onClick={() => handleOpenPath(entry.path)}>
                    Open
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No reusable templates or prompts were detected yet. Add files under templates or
            prompts to populate this page.
          </p>
        )}
      </section>
    </>
  );
}
