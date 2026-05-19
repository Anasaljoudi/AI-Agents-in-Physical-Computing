import { useEffect, useRef, useState } from "react";
import { API_BASE_URL, api } from "../lib/api";

const baudRates = [
  9600,
  19200,
  38400,
  57600,
  115200
];

const maxLines = 500;

export function SerialMonitor({
  open,
  connection,
  onClose
}) {

  const [baudRate, setBaudRate] =
    useState(9600);

  const [running, setRunning] =
    useState(false);

  const [lines, setLines] =
    useState([]);

  const [message, setMessage] =
    useState("");

  const streamRef = useRef(null);

  const outputRef = useRef(null);

  function appendLine(line) {
    setLines((previous) =>
      [...previous, line].slice(-maxLines)
    );
  }

  function stopStream() {
    streamRef.current?.close();

    streamRef.current = null;

    setRunning(false);

    api.stopSerial().catch(() => {});
  }

  function startStream() {

    if (
      !connection.connected ||
      running
    ) {
      return;
    }

    setMessage("");

    const stream = new EventSource(
      `${API_BASE_URL}/serial-stream?baudRate=${baudRate}`
    );

    streamRef.current = stream;

    setRunning(true);

    stream.addEventListener(
      "status",
      (event) => {

        const payload =
          JSON.parse(event.data);

        setMessage(
          `${payload.port} at ${payload.baudRate}`
        );
      }
    );

    stream.addEventListener(
      "line",
      (event) => {

        const payload =
          JSON.parse(event.data);

        appendLine(payload.line);
      }
    );

    stream.addEventListener(
      "error",
      (event) => {

        if (event.data) {

          const payload =
            JSON.parse(event.data);

          setMessage(payload.message);

        } else {

          setMessage(
            "Serial monitor stopped"
          );
        }

        stopStream();
      }
    );
  }

  useEffect(() => {

    if (outputRef.current) {

      outputRef.current.scrollTop =
        outputRef.current.scrollHeight;
    }

  }, [lines]);

  useEffect(() => {

    if (!open) {
      stopStream();
    }

    return () => stopStream();

  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="monitor-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Serial Monitor"
    >

      <div className="monitor-panel">

        <div className="monitor-header">

          <div>

            <div className="step-kicker">
              SERIAL MONITOR
            </div>

            <h2>
              Live Arduino Output
            </h2>

          </div>

          <button
            className="ghost-button"
            onClick={onClose}
          >
            Close
          </button>

        </div>

        <div className="monitor-toolbar">

          <label className="monitor-select">

            <span>
              Baud Rate
            </span>

            <select
              value={baudRate}
              onChange={(event) =>
                setBaudRate(
                  Number(event.target.value)
                )
              }
              disabled={running}
            >

              {baudRates.map((rate) => (

                <option
                  key={rate}
                  value={rate}
                >
                  {rate}
                </option>

              ))}

            </select>

          </label>

          <div className="monitor-actions">

            <button
              className={`monitor-run-button ${
                running
                  ? "active"
                  : ""
              }`}
              onClick={
                running
                  ? stopStream
                  : startStream
              }
              disabled={
                !connection.connected
              }
            >
              {running
                ? "Stop"
                : "Start"}
            </button>

            <button
              className="ghost-button"
              onClick={() =>
                setLines([])
              }
            >
              Clear
            </button>

          </div>

        </div>

        <div className="monitor-status-row">

          <div className="monitor-status-card">

            <span>
              Connection
            </span>

            <strong>
              {connection.connected
                ? "Arduino Connected"
                : "No Arduino"}
            </strong>

          </div>

          <div className="monitor-status-card">

            <span>
              Status
            </span>

            <strong>
              {running
                ? "Streaming Live"
                : "Idle"}
            </strong>

          </div>

          <div className="monitor-status-card">

            <span>
              Port
            </span>

            <strong>
              {connection.connected
                ? connection.port
                : "--"}
            </strong>

          </div>

        </div>

        {message ? (

          <div className="monitor-message">
            {message}
          </div>

        ) : null}

        <div
          className="monitor-output modern"
          ref={outputRef}
        >

          {lines.length === 0 ? (

            <div className="monitor-empty">
              Waiting for Arduino data...
            </div>

          ) : (

            lines.map((line, index) => (

              <div
                className="monitor-line"
                key={`${index}-${line}`}
              >

                <span className="monitor-line-number">
                  {String(index + 1).padStart(3, "0")}
                </span>

                <span className="monitor-line-content">
                  {line}
                </span>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}