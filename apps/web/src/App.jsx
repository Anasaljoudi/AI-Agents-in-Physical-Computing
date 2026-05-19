import { useEffect, useState } from "react";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { PromptPanel } from "./components/PromptPanel";
import { SerialMonitor } from "./components/SerialMonitor";
import { WiringPanel } from "./components/WiringPanel";
import { api } from "./lib/api";
import { createComponentInstance } from "./lib/componentFactory";

const initialConnection = {
  connected: false,
  port: null,
  boardName: null,
  fqbn: null,
  protocol: null
};

const initialState = {
  catalog: [],
  detectedBoards: [],
  connection: initialConnection,
  components: [],
  prompt: "",
  wiring: null,
  // wokwi: null, (removed)
  code: "",
  monitorOpen: false,
  pipeline: "idle",
  banner: ""
};

function statusText(pipeline) {
  if (pipeline === "generating") return "Generating...";
  if (pipeline === "uploading") return "Uploading...";
  if (pipeline === "done") return "Done";
  return "";
}

function normalizeConnection(status) {
  if (!status.connected) {
    return initialConnection;
  }

  return {
    ...initialConnection,
    connected: true,
    boardName: status.board,
    port: status.port,
    fqbn: status.fqbn
  };
}

export default function App() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;

    async function refreshConnection({ showLoading = false } = {}) {
      if (showLoading) {
        setState((previous) => ({
          ...previous,
          pipeline: "connecting",
          banner: ""
        }));
      }

      try {
        const status = await api.getConnectionStatus();

        if (cancelled) return;

        setState((previous) => {
          // If we are still connected but the new status has no board name,
          // reuse the previous board name.
          let newConnection = normalizeConnection(status);
          if (status.connected && !newConnection.boardName && previous.connection.boardName) {
            newConnection = {
              ...newConnection,
              boardName: previous.connection.boardName
            };
          }
          return {
            ...previous,
            pipeline: showLoading ? "idle" : previous.pipeline,
            connection: newConnection,
            banner: ""
          };
        });
      } catch (error) {
        if (cancelled) return;
        setState((previous) => ({
          ...previous,
          pipeline: showLoading ? "idle" : previous.pipeline,
          connection: initialConnection,
          banner: error.message
        }));
      }
    }

    async function boot() {
      // Load catalog (always succeeds, independent of board)
      let catalogComponents = [];
      try {
        const catalog = await api.getCatalog();
        catalogComponents = catalog.components || [];
      } catch (error) {
        console.error("Failed to load catalog:", error);
      }

      // Load connection status (may fail if no board or CLI issue)
      let connectionStatus = { connected: false };
      try {
        connectionStatus = await api.getConnectionStatus();
      } catch (error) {
        console.error("Failed to get connection status:", error);
      }

      if (cancelled) return;

      setState((previous) => ({
        ...previous,
        catalog: catalogComponents,
        connection: normalizeConnection(connectionStatus)
      }));
    }

    boot().catch((error) => {
      console.error("Boot error:", error);
      setState((previous) => ({
        ...previous,
        banner: error.message
      }));
    });

    const poll = window.setInterval(() => refreshConnection(), 2500);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  async function handleConnect() {
    setState((previous) => ({
      ...previous,
      pipeline: "connecting",
      banner: ""
    }));

    try {
      const connection = await api.connect();

      setState((previous) => ({
        ...previous,
        pipeline: "idle",
        connection: normalizeConnection({
          connected: connection.connected,
          board: connection.board || connection.boardName,
          port: connection.port
        }),
        banner: connection.connected ? "" : "No Arduino detected"
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        pipeline: "idle",
        connection: initialConnection,
        banner: error.message
      }));
    }
  }

  async function handleDisconnect() {
    await api.disconnect();

    setState((previous) => ({
      ...previous,
      connection: initialConnection,
      pipeline: "idle",
      wiring: null,
      // wokwi: null, (removed)
      code: ""
    }));
  }

  function handleAddComponent(definition) {
    setState((previous) => ({
      ...previous,
      components: [
        ...previous.components,
        createComponentInstance(definition)
      ]
    }));
  }

  function handleUpdateComponent(id, key, value) {
    setState((previous) => ({
      ...previous,
      components: previous.components.map((component) =>
        component.id === id
          ? {
              ...component,
              config: {
                ...component.config,
                [key]: value
              }
            }
          : component
      )
    }));
  }

  function handleRemoveComponent(id) {
    setState((previous) => ({
      ...previous,
      components: previous.components.filter(
        (component) => component.id !== id
      )
    }));
  }

  async function handleRun() {
    const prompt = state.prompt.trim();

    if (!prompt || !state.connection.connected) return;

    setState((previous) => ({
      ...previous,
      pipeline: "generating",
      banner: "",
      wiring: null,
      wokwi: null
    }));

    const uploadTimer = window.setTimeout(() => {
      setState((previous) =>
        previous.pipeline === "generating"
          ? { ...previous, pipeline: "uploading" }
          : previous
      );
    }, 900);

    try {
      const result = await api.run({
        prompt,
        components: state.components
      });

      console.log("RUN RESULT:", result);

      window.clearTimeout(uploadTimer);

      setState((previous) => ({
        ...previous,
        pipeline: "done",
        components: result.components,
        wiring: result.wiring,
        // wokwi: result.wokwi,
        code: result.code
      }));
    } catch (error) {
      window.clearTimeout(uploadTimer);

      setState((previous) => ({
        ...previous,
        pipeline: "idle",
        banner: error.message
      }));
    }
  }

  const feedback = statusText(state.pipeline);

  const isBusy = [
    "connecting",
    "generating",
    "uploading"
  ].includes(state.pipeline);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">
            Prompt to Programming and Wiring
          </div>

          <h1>Prompt to programming and wiring</h1>
        </div>
      </header>

      {state.banner ? (
        <div className="banner">{state.banner}</div>
      ) : null}

      <main className="flow">
        <section className="flow-step connect-step">
          <div className="step-kicker">1 Connect</div>

          <ConnectionPanel
            connection={state.connection}
            detectedBoards={state.detectedBoards}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            loading={state.pipeline === "connecting"}
          />
        </section>

        <section className="flow-step">
          <div className="step-kicker">
            2 Components optional
          </div>

          <ComponentLibrary
            catalog={state.catalog}
            components={state.components}
            onAdd={handleAddComponent}
            onUpdate={handleUpdateComponent}
            onRemove={handleRemoveComponent}
          />
        </section>

        <section className="flow-step prompt-step">
          <div className="step-kicker">
            3 Describe behavior
          </div>

          <PromptPanel
            prompt={state.prompt}
            onChange={(prompt) =>
              setState((previous) => ({
                ...previous,
                prompt
              }))
            }
            onSubmit={handleRun}
            loading={isBusy}
            disabled={!state.connection.connected}
            status={state.pipeline}
          />
        </section>

        <section className="result-step">
          <div className="result-heading">
            <div>
              <div className="step-kicker">Result</div>
              <h2>Wiring</h2>
            </div>
            {/* Board meta removed */}
          </div>

          <button
            className="monitor-open-button"
            onClick={() =>
              setState((previous) => ({
                ...previous,
                monitorOpen: true
              }))
            }
            disabled={!state.connection.connected}
          >
            Open Monitor
          </button>

          <WiringPanel
            wiring={state.wiring}
          />
        </section>
      </main>

      <SerialMonitor
        open={state.monitorOpen}
        connection={state.connection}
        onClose={() =>
          setState((previous) => ({
            ...previous,
            monitorOpen: false
          }))
        }
      />
    </div>
  );
}