function connectionClass({ connected }, loading) {
  if (loading) return "attempting";
  return connected ? "connected" : "disconnected";
}

export function ConnectionPanel({
  connection,
  onConnect,
  onDisconnect,
  loading
}) {
  const stateClass = connectionClass(connection, loading);

  const statusLabel = loading
    ? "Connecting"
    : connection.connected
    ? "Connected"
    : "Disconnected";

  const buttonLabel = loading
    ? "Checking"
    : connection.connected
    ? "Connected"
    : "Connect";

  return (
    <div className="connection-layout">
      <button
        type="button"
        className={`connect-button ${stateClass}`}
        onClick={onConnect}
        disabled={loading}
      >
        <span>{buttonLabel}</span>
      </button>

      <div className="connection-status">
        <div className={`status-band ${stateClass}`}>
          <span className="status-text">{statusLabel}</span>
        </div>

        <div className="meta-stack">
          <div>
            <span>Board</span>
            <strong>
              {connection.connected
                ? connection.boardName
                : "No Arduino detected"}
            </strong>
          </div>

          <div>
            <span>Port</span>
            <strong>
              {connection.connected ? connection.port : "No port"}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {connection.connected ? "Ready" : "Not connected"}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="ghost-button compact"
          onClick={onDisconnect}
          disabled={!connection.connected}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}