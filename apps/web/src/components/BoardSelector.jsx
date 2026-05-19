export function BoardSelector({ boards, value, onChange, disabled }) {
  return (
    <div className="panel">
      <h3>Board type</h3>
      <p className="muted">Choose the board target used for code generation and upload.</p>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {boards.map((board) => (
          <option key={board.value} value={board.value}>
            {board.label}
          </option>
        ))}
      </select>
    </div>
  );
}
