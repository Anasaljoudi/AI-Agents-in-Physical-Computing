export function StepShell({
  number,
  title,
  description,
  active,
  children,
  aside
}) {
  return (
    <section className={`step-shell ${active ? "active" : ""}`}>
      <div className="step-main">
        <div className="step-kicker">Step {number}</div>

        <div className="step-header">
          <div className="step-header-text">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        {/* IMPORTANT: constrain content */}
        <div className="step-content">
          <div className="step-inner">
            {children}
          </div>
        </div>
      </div>

      {aside ? (
        <aside className="step-aside">
          <div className="step-inner">
            {aside}
          </div>
        </aside>
      ) : null}
    </section>
  );
}