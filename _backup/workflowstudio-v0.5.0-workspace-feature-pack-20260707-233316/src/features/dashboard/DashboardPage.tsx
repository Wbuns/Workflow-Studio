import type { NavigationItem } from "../../types/navigation";

type DashboardPageProps = {
  activePage: NavigationItem;
};

const dashboardCards = [
  {
    title: "Current Milestone",
    value: "v0.3 Shell Architecture",
    detail: "Split the app shell into reusable components and feature folders.",
  },
  {
    title: "Workflow Rule",
    value: "Build before commit",
    detail: "Every milestone should remain installable and reversible.",
  },
  {
    title: "Next System",
    value: "Package Manager",
    detail: "Create, install, validate, and roll back milestone packages.",
  },
];

export function DashboardPage({ activePage }: DashboardPageProps) {
  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activePage.description}</h2>
        <p>
          Workflow Studio is now organized around a stable shell, reusable
          components, and feature modules.
        </p>
      </section>

      <section className="panel-grid">
        {dashboardCards.map((card) => (
          <article className="info-panel" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.value}</p>
            <span>{card.detail}</span>
          </article>
        ))}
      </section>
    </>
  );
}
