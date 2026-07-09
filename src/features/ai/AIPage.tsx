import { useMemo, useState } from "react";
import type { NavigationItem } from "../../types/navigation";

type AIPageProps = {
  activePage: NavigationItem;
  rootPath?: string;
};

const continuationPrompt = `Workflow Studio v1.2 — Workspace Intelligence

We are continuing development of Workflow Studio.

Current status:
- v1.0 Core complete
- Electron application complete
- Responsive desktop UI complete
- Dashboard, Projects, Packages, Documentation, AI, Git pages complete
- Package system complete
- Workspace metadata system complete
- Real Workspace Integration complete
- Shared Electron bridge architecture complete
- Shared Git type architecture complete
- Build passes
- Git committed

Current architecture goals:
- Feature-based React architecture
- Services contain business logic
- Electron handles native integration only
- Strong shared TypeScript models
- Package-based development workflow
- Build before every commit
- Never commit broken builds
- Prefer complete replacement files

Next goal:
Continue the next small Workflow Studio milestone.`;

const promptDivider = "--- Developer Request ---";

function createCombinedPrompt(generatedPrompt: string, developerRequest: string) {
  const trimmedRequest = developerRequest.trim();

  if (!trimmedRequest) {
    return generatedPrompt;
  }

  return `${generatedPrompt.trim()}\n\n${promptDivider}\n\n${trimmedRequest}`;
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function AIPage({ activePage, rootPath }: AIPageProps) {
  const [developerRequest, setDeveloperRequest] = useState("");
  const [copyStatus, setCopyStatus] = useState("Ready to copy");

  const combinedPrompt = useMemo(
    () => createCombinedPrompt(continuationPrompt, developerRequest),
    [developerRequest],
  );

  const handleCopyContinuationPrompt = async () => {
    await copyTextToClipboard(continuationPrompt);
    setCopyStatus("Continuation prompt copied");
  };

  const handleCopyCombinedPrompt = async () => {
    await copyTextToClipboard(combinedPrompt);
    setCopyStatus(
      developerRequest.trim()
        ? "Combined prompt copied"
        : "Continuation prompt copied",
    );
  };

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>AI Development</h2>
        <p>
          Generate continuation context, add the next development request, and
          copy a paste-ready prompt for the next AI session.
        </p>
        {rootPath && <p className="hero-meta">Workspace: {rootPath}</p>}
      </section>

      <section className="module-panel">
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "12px",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3>Continuation Prompt Preview</h3>
            <p>
              This generated prompt stays read-only so project context remains
              stable and predictable.
            </p>
          </div>

          <button className="primary-button" onClick={handleCopyContinuationPrompt}>
            Copy Continuation Prompt
          </button>
        </div>

        <textarea
          readOnly
          value={continuationPrompt}
          aria-label="Continuation Prompt Preview"
          style={{
            background: "rgba(2, 6, 23, 0.48)",
            border: "1px solid rgba(148, 163, 184, 0.22)",
            borderRadius: "14px",
            color: "#cbd5e1",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: "13px",
            lineHeight: 1.6,
            marginTop: "18px",
            minHeight: "300px",
            padding: "16px",
            resize: "vertical",
            width: "100%",
          }}
        />
      </section>

      <section className="module-panel">
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "12px",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3>Developer Request</h3>
            <p>
              Type the next milestone, bug fix, or development task. It will be
              appended after the generated continuation prompt when copied.
            </p>
          </div>

          <button className="primary-button" onClick={handleCopyCombinedPrompt}>
            Copy Combined Prompt
          </button>
        </div>

        <textarea
          value={developerRequest}
          onChange={(event) => {
            setDeveloperRequest(event.target.value);
            setCopyStatus("Ready to copy");
          }}
          placeholder="Describe the next milestone or task here..."
          aria-label="Developer Request"
          style={{
            background: "rgba(2, 6, 23, 0.48)",
            border: "1px solid rgba(96, 165, 250, 0.32)",
            borderRadius: "14px",
            color: "#f8fafc",
            fontFamily: "inherit",
            fontSize: "15px",
            lineHeight: 1.6,
            marginTop: "18px",
            minHeight: "180px",
            padding: "16px",
            resize: "vertical",
            width: "100%",
          }}
        />

        <div className="module-checklist">
          <span>{copyStatus}</span>
          <span>Generated prompt remains read-only</span>
          <span>
            {developerRequest.trim()
              ? "Developer request will be appended"
              : "Empty request copies prompt only"}
          </span>
        </div>
      </section>
    </>
  );
}
