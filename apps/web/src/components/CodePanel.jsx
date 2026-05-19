export function CodePanel({ code, source, warning }) {
  return (
    <div className="panel">
      <div className="panel-title-row">
        <h3>Generated sketch</h3>
        <div className="status-pill">{source === "openai" ? "OpenAI" : "Fallback"}</div>
      </div>
      {warning ? <p className="warning-text">{warning}</p> : null}
      <pre>{code || "// No sketch generated yet."}</pre>
    </div>
  );
}
