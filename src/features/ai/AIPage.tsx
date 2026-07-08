import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import { generateAIContext, type AIContextSummary } from "../../services/AIContextService";

type AIPageProps = {
  activePage: NavigationItem;
  rootPath?: string;
};

export function AIPage({ activePage, rootPath }: AIPageProps) {
  const [context, setContext] = useState<AIContextSummary | null>(null);
  const [copyStatus, setCopyStatus] = useState("Ready to copy");

  useEffect(() => {
    let isMounted = true;

    generateAIContext(rootPath).then((nextContext) => {
      if (isMounted) {
        setContext(nextContext);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rootPath]);

  async function copyContinuationPrompt() {
    if (!context) return;

    try {
      await navigator.clipboard.writeText(context.continuationPrompt);
      setCopyStatus("Copied continuation prompt");
    } catch (error) {
      console.warn("Unable to copy continuation prompt.", error);
      setCopyStatus("Copy failed — select and copy manually");
    }
  }

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activePage.title}</h2>
        <p>
          <strong>AI Context Engine is active.</strong> Generate a continuation prompt
          directly from the current workspace scan instead of rebuilding project context manually.
        </p>
      </section>

      {context ? (
        <section className="ai-context-layout">
          <article className="detail-panel ai-context-summary">
            <h3>Generated Context</h3>
            <dl>
              <div>
                <dt>Project</dt>
                <dd>{context.projectName}</dd>
              </div>
              <div>
                <dt>Milestone</dt>
                <dd>{context.currentMilestone}</dd>
              </div>
              <div>
                <dt>Generated</dt>
                <dd>{context.generatedAt}</dd>
              </div>
            </dl>
          </article>

          <article className="detail-panel ai-context-summary">
            <h3>Workspace Summary</h3>
            <p>{context.workspaceSummary}</p>
          </article>

          <article className="detail-panel ai-context-summary">
            <h3>Architecture Summary</h3>
            <p>{context.architectureSummary}</p>
          </article>

          <article className="detail-panel ai-context-summary">
            <h3>Recommended Next Step</h3>
            <p>{context.recommendedNextStep}</p>
          </article>

          <article className="detail-panel ai-prompt-panel">
            <div className="ai-prompt-header">
              <h3>Continue Development Prompt</h3>
              <button className="primary-button" type="button" onClick={copyContinuationPrompt}>
                Copy Prompt
              </button>
            </div>
            <p className="copy-status">{copyStatus}</p>
            <textarea readOnly value={context.continuationPrompt} />
          </article>
        </section>
      ) : (
        <section className="module-panel">
          <h3>Generating AI Context</h3>
          <p>Scanning workspace metadata and preparing a continuation prompt.</p>
        </section>
      )}
    </>
  );
}
