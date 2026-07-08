import { useEffect, useState } from "react";
import { generateContinuationPrompt } from "../../services/WorkspaceService";
import type { NavigationItem } from "../../types/navigation";
import type { AiContinuationPrompt } from "../../types/workspace";

type AIPageProps = {
  activePage: NavigationItem;
};

export function AIPage({ activePage }: AIPageProps) {
  const [continuation, setContinuation] = useState<AiContinuationPrompt | null>(null);
  const [copyStatus, setCopyStatus] = useState("Ready to generate");

  useEffect(() => {
    let isMounted = true;

    generateContinuationPrompt().then((nextPrompt) => {
      if (isMounted) {
        setContinuation(nextPrompt);
        setCopyStatus("Continuation prompt generated from workspace metadata");
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCopyPrompt() {
    if (!continuation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(continuation.prompt);
      setCopyStatus("Copied to clipboard");
    } catch (error) {
      console.warn("Unable to copy continuation prompt.", error);
      setCopyStatus("Copy failed — select and copy the prompt manually");
    }
  }

  return (
    <>
      <section className="hero-panel project-hero">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activePage.title}</h2>
        <p>
          Generate paste-ready continuation prompts from the active workspace
          metadata instead of rebuilding project context manually.
        </p>
      </section>

      <section className="module-panel ai-generator-panel">
        <div className="panel-title-row">
          <div>
            <h3>Continuation Prompt Generator</h3>
            <p>{copyStatus}</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={handleCopyPrompt}
            disabled={!continuation}
          >
            Copy Prompt
          </button>
        </div>

        {continuation ? (
          <>
            <div className="project-summary ai-summary">
              <div>
                <span>Workspace</span>
                <strong>{continuation.workspaceName}</strong>
              </div>
              <div>
                <span>Milestone</span>
                <strong>{continuation.milestone}</strong>
              </div>
              <div className="wide-row">
                <span>Generated</span>
                <strong>{new Date(continuation.generatedAt).toLocaleString()}</strong>
              </div>
            </div>
            <textarea
              className="prompt-output"
              value={continuation.prompt}
              readOnly
              aria-label="Generated continuation prompt"
            />
          </>
        ) : (
          <p>Reading workspace metadata and generating continuation prompt.</p>
        )}
      </section>
    </>
  );
}
