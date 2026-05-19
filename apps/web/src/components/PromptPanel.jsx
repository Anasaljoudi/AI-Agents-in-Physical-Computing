export function PromptPanel({
  prompt,
  onChange,
  onSubmit,
  loading,
  disabled,
  status
}) {
  const isWorking = status === "generating" || status === "uploading";

  return (
    <div className="prompt-panel">
      <textarea
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what you want your Arduino to do"
        disabled={loading || disabled}
      />

      <button
        type="button"
        className="submit-intent"
        onClick={onSubmit}
        disabled={loading || disabled}
      >
        {isWorking ? "Running..." : "Run"}
      </button>

      {/* STATUS BOX */}
      {status && status !== "idle" && (
        <div className={`prompt-status ${status}`}>
          {status === "generating" && "Generating..."}
          {status === "uploading" && "Uploading..."}
          {status === "done" && "Done"}
        </div>
      )}
    </div>
  );
}