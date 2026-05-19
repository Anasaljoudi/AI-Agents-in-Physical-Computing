// import { generateWokwiDiagram } from "../services/wokwiService.js";
import { Router } from "express";
import { componentCatalog, getBoardConfig } from "../config/components.js";

import {
  autoConnect,
  compileAndUpload,
  getConnectionStatus,
  listBoards
} from "../services/arduinoService.js";

import { generateArduinoCode } from "../services/codeGenerator.js";
import { resolvePinMapping } from "../services/pinMapper.js";

import {
  closeSerialMonitor,
  openSerialStream
} from "../services/serialMonitorService.js";

import {
  clearConnection,
  getAppState,
  setComponents,
  setConnection,
  setGeneratedCode,
  setSelectedBoard,
  setUploadStatus
} from "../services/state.js";

import { generateWiringDiagram } from "../services/wiringService.js";

export const apiRouter = Router();

function extractBoardType(fqbn) {
  if (!fqbn) return "other";

  if (fqbn.includes("nano33ble")) return "nano";
  if (fqbn.includes("nano")) return "nano";
  if (fqbn.includes("uno")) return "uno";
  if (fqbn.includes("mega")) return "mega";

  return "other";
}

/* ---------------- HEALTH ---------------- */

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/* ---------------- CATALOG ---------------- */

apiRouter.get("/catalog", (_req, res) => {
  res.json({
    boards: ["uno", "nano", "mega", "other"].map(getBoardConfig),
    components: componentCatalog
  });
});

/* ---------------- STATE ---------------- */

apiRouter.get("/state", async (_req, res) => {
  let detectedBoards = [];

  try {
    detectedBoards = await listBoards();
  } catch {}

  res.json({
    ...getAppState(),
    detectedBoards
  });
});

/* ---------------- CONNECTION ---------------- */

apiRouter.get("/connection-status", async (_req, res, next) => {
  try {
    const status = await getConnectionStatus();

    if (!status.connected) {
      clearConnection();
      res.json({ connected: false });
      return;
    }

    const connection = {
      connected: true,
      boardName: status.boardName,
      port: status.port,
      fqbn: status.fqbn
    };

    setConnection(connection);

    res.json(connection);
  } catch (e) {
    clearConnection();
    next(e);
  }
});

apiRouter.post("/connect", async (_req, res, next) => {
  try {
    const connection = await autoConnect();

    if (!connection.connected) {
      clearConnection();
      res.json({ connected: false });
      return;
    }

    setConnection(connection);
    res.json(connection);
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/disconnect", async (_req, res, next) => {
  try {
    clearConnection();
    await closeSerialMonitor();

    res.json({
      connected: false
    });
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/serial-stop", async (_req, res, next) => {
  try {
    await closeSerialMonitor();

    res.json({
      stopped: true
    });
  } catch (e) {
    next(e);
  }
});

/* ---------------- GENERATE ---------------- */

apiRouter.post("/generate", async (req, res, next) => {
  try {
    const { prompt, components = [] } = req.body;

    const connection = getAppState().connection;

    if (!connection?.fqbn) {
      res.status(400).json({
        error: "No Arduino connected."
      });

      return;
    }

    const boardType = extractBoardType(connection.fqbn);
    const boardLabel = connection.boardName;

    const mapped = resolvePinMapping(components);

    setComponents(mapped);

    setSelectedBoard({
      label: boardLabel,
      value: boardType,
      fqbn: connection.fqbn
    });

    const result = await generateArduinoCode({
      prompt,
      boardType,
      boardLabel,
      components: mapped
    });

    setGeneratedCode({
      prompt,
      code: result.code
    });

    res.json({
      ...result,

      components: mapped,

      wiring: generateWiringDiagram({
        boardType,
        components: mapped,
        boardOverride: {
          label: boardLabel,
          value: boardType,
          fqbn: connection.fqbn
        }
      }),

      // wokwi: generateWokwiDiagram({
      //   components: mapped,
      //   boardLabel
      // })
    });
  } catch (e) {
    next(e);
  }
});

/* ---------------- RUN ---------------- */

apiRouter.post("/run", async (req, res, next) => {
  try {
    const { prompt, components = [] } = req.body;

    const connection = await autoConnect();

    if (!connection.connected || !connection.port || !connection.fqbn) {
      clearConnection();

      res.status(400).json({
        error: "Connect an Arduino first."
      });

      return;
    }

    setConnection(connection);

    const boardType = extractBoardType(connection.fqbn);
    const boardLabel = connection.boardName;

    const mapped = resolvePinMapping(components);

    setComponents(mapped);

    const generation = await generateArduinoCode({
      prompt,
      boardType,
      boardLabel,
      components: mapped
    });

    setGeneratedCode({
      prompt,
      code: generation.code
    });

    setUploadStatus({
      status: "running",
      startedAt: new Date().toISOString()
    });

    let upload = null;

    try {
      upload = await compileAndUpload({
        code: generation.code,
        port: connection.port,
        detectedFqbn: connection.fqbn,
        detectedBoardName: connection.boardName
      });

      setUploadStatus({
        status: "success",
        completedAt: new Date().toISOString()
      });
    } catch (uploadError) {
      console.error(uploadError);

      setUploadStatus({
        status: "error",
        completedAt: new Date().toISOString(),
        message: uploadError.message
      });
    }

    res.json({
      status: "done",

      uploadSuccess: Boolean(upload),

      board: {
        label: boardLabel,
        value: boardType,
        fqbn: connection.fqbn
      },

      port: connection.port,

      code: generation.code,

      components: mapped,

      wiring: generateWiringDiagram({
        boardType,
        components: mapped,
        boardOverride: {
          label: boardLabel,
          value: boardType,
          fqbn: connection.fqbn
        }
      }),

      // wokwi: generateWokwiDiagram({
      //   components: mapped,
      //   boardLabel
      // })
    });
  } catch (e) {
    setUploadStatus({
      status: "error",
      completedAt: new Date().toISOString(),
      message: e.message
    });

    next(e);
  }
});

/* ---------------- WIRING ---------------- */

apiRouter.post("/wiring", (req, res) => {
  const { boardType, components } = req.body;

  res.json({
    wiring: generateWiringDiagram({
      boardType,
      components
    }),

    // wokwi: generateWokwiDiagram({
    //   components
    // })
  });
});

/* ---------------- SERIAL STREAM (SSE) ---------------- */

apiRouter.get("/serial-stream", async (req, res, next) => {
  const baudRate = parseInt(req.query.baudRate, 10) || 9600;
  const connection = getAppState().connection;

  if (!connection?.connected || !connection.port) {
    res.status(400).json({ error: "No Arduino connected" });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  res.flushHeaders();

  let closeStream = null;
  let isClosed = false;

  const onLine = (line) => {
    if (!isClosed) {
      res.write(`event: line\ndata: ${JSON.stringify({ line })}\n\n`);
    }
  };

  const onError = (err) => {
    if (!isClosed) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
      isClosed = true;
    }
  };

  const cleanup = async () => {
    if (isClosed) return;
    isClosed = true;
    if (closeStream) await closeStream();
    await closeSerialMonitor().catch(console.error);
    if (!res.writableEnded) res.end();
  };

  req.on("close", cleanup);

  try {
    closeStream = await openSerialStream({
      port: connection.port,
      baudRate,
      onLine,
      onError,
    });
    // Send initial status
    res.write(`event: status\ndata: ${JSON.stringify({ port: connection.port, baudRate })}\n\n`);
  } catch (err) {
    onError(err);
    return;
  }
});

