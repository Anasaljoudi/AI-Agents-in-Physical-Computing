import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { execFileAsync } from "../utils/exec.js";
import { closeSerialMonitor } from "./serialMonitorService.js";

const sketchRoot = path.resolve(process.cwd(), "..", "..", "generated-sketches");

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseBoardListPayload(payload) {
  const parsed = safeJsonParse(payload, null);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.detected_ports)) return parsed.detected_ports;
  if (Array.isArray(parsed.ports)) return parsed.ports;
  return [];
}

function friendlyBoardNameFromFqbn(fqbn) {
  if (!fqbn) return "Unknown board";
  const parts = fqbn.split(":");
  const last = parts[parts.length - 1];
  return last
    .replace(/nano33ble/i, "Nano 33 BLE")
    .replace(/nano/i, "Nano")
    .replace(/uno/i, "Uno")
    .replace(/mega/i, "Mega")
    .replace(/leonardo/i, "Leonardo")
    .replace(/micro/i, "Micro")
    .replace(/due/i, "Due")
    .replace(/zero/i, "Zero")
    .replace(/mkrzero/i, "MKR Zero")
    .replace(/mkr1000/i, "MKR1000")
    .replace(/mkrwifi1010/i, "MKR WiFi 1010")
    .replace(/mkrfox1200/i, "MKR FOX 1200")
    .replace(/mkrwan1300/i, "MKR WAN 1300")
    .replace(/mkrnb1500/i, "MKR NB 1500")
    .replace(/mkrgsm1400/i, "MKR GSM 1400")
    .replace(/portenta/i, "Portenta")
    .replace(/nicla/i, "Nicla")
    .replace(/giga/i, "Giga")
    .replace(/opta/i, "Opta")
    .replace(/edgecontrol/i, "Edge Control")
    .replace(/esplora/i, "Esplora")
    .replace(/robot/i, "Robot")
    .replace(/yun/i, "Yún")
    .replace(/tian/i, "Tian")
    .replace(/industrial/i, "Industrial 101")
    .replace(/linino/i, "Linino One");
}

function mapDetectedPort(entry) {
  const board = entry.matching_boards?.[0] ?? {};
  const port = entry.port ?? {};
  const rawBoardName = board.name ?? entry.board_name ?? null;
  const fqbn = board.fqbn ?? entry.fqbn ?? null;
  let boardName = rawBoardName;
  if (!boardName || boardName === "Unknown board") {
    boardName = friendlyBoardNameFromFqbn(fqbn);
  }
  return {
    port: port.address ?? port.port ?? entry.address ?? null,
    label: port.label ?? port.address ?? "Unknown port",
    protocol: port.protocol ?? null,
    boardName: boardName,
    fqbn: fqbn,
  };
}

function isUsableBoard(board) {
  return Boolean(board.port && board.fqbn && board.boardName && board.boardName !== "Unknown board");
}

function formatCommand(command, args) {
  return [command, ...args].join(" ");
}

async function runArduinoCli(args) {
  const command = formatCommand("arduino-cli", args);
  console.log(command);
  try {
    const { stdout, stderr } = await execFileAsync("arduino-cli", args);
    return {
      command,
      stdout,
      stderr,
      log: [stdout, stderr].filter(Boolean).join("\n").trim(),
    };
  } catch (error) {
    error.command = command;
    throw error;
  }
}

export async function listBoards() {
  const { stdout } = await execFileAsync("arduino-cli", ["board", "list", "--format", "json"]);
  return parseBoardListPayload(stdout).map(mapDetectedPort);
}

export async function getConnectionStatus() {
  const boards = await listBoards();
  const active = boards.find(isUsableBoard);
  if (!active) {
    return { connected: false, availableBoards: boards };
  }
  return {
    connected: true,
    board: active.boardName,
    boardName: active.boardName,
    port: active.port,
    fqbn: active.fqbn,
    protocol: active.protocol,
    availableBoards: boards,
  };
}

export async function autoConnect() {
  const status = await getConnectionStatus();
  if (!status.connected) {
    return {
      connected: false,
      availableBoards: status.availableBoards,
      message: "No Arduino detected. Connect a board over USB and try again.",
    };
  }
  return {
    connected: true,
    port: status.port,
    boardName: status.boardName,
    board: status.board,
    fqbn: status.fqbn,
    protocol: status.protocol,
    availableBoards: status.availableBoards,
  };
}

export async function writeSketch(code) {
  const sketchName = `visual_sketch_${Date.now()}`;
  const sketchDir = path.join(sketchRoot, sketchName);
  const sketchFile = path.join(sketchDir, `${sketchName}.ino`);
  await fs.mkdir(sketchDir, { recursive: true });
  await fs.writeFile(sketchFile, code, "utf8");
  return { sketchName, sketchDir, sketchFile };
}

export function resolveDetectedBoard({ detectedFqbn, detectedBoardName }) {
  if (!detectedFqbn) {
    throw new Error("No board FQBN detected. Run arduino-cli board list and install the required board core if needed.");
  }
  return {
    label: detectedBoardName || "Detected Arduino",
    value: "detected",
    fqbn: detectedFqbn,
  };
}

/**
 * Wait for the board to reappear after reset (e.g., after compilation).
 * Polls `listBoards` until a board with matching FQBN is found.
 * @param {string} originalPort - The port before reset (may change)
 * @param {string} fqbn - Board FQBN (e.g., arduino:mbed:nano33ble)
 * @param {number} timeoutMs - Max wait time in ms
 * @returns {Promise<string>} The new port (or original if unchanged)
 */
async function waitForBoardReconnection(originalPort, fqbn, timeoutMs = 5000) {
  const start = Date.now();
  const pollInterval = 500;
  let lastError = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const boards = await listBoards();
      const matching = boards.find((b) => b.fqbn === fqbn && b.port);
      if (matching) {
        console.log(`Board reconnected on port ${matching.port}`);
        return matching.port;
      }
    } catch (err) {
      lastError = err;
    }
    await setTimeout(pollInterval);
  }
  throw new Error(
    `Board not found after ${timeoutMs}ms. Last error: ${lastError?.message || "No matching board"}. Original port: ${originalPort}`
  );
}

async function uploadWithRetry(uploadArgs, maxRetries = 2, delayMs = 1500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await runArduinoCli(uploadArgs);
    } catch (error) {
      const isNoDevice = error.message && error.message.includes("No device found");
      if (isNoDevice && attempt < maxRetries) {
        console.log(`Upload attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await setTimeout(delayMs);
        continue;
      }
      throw error;
    }
  }
}

export async function compileAndUpload({ code, port, detectedFqbn, detectedBoardName }) {
  if (!port) {
    throw new Error("No Arduino port detected. Connect a board and try again.");
  }

  const board = resolveDetectedBoard({ detectedFqbn, detectedBoardName });
  const sketch = await writeSketch(code);
  const compileArgs = ["compile", "--fqbn", board.fqbn, sketch.sketchDir];

  await closeSerialMonitor();
  await setTimeout(800); // Allow board to reset

  console.log("Compiling sketch...");
  const compile = await runArduinoCli(compileArgs);
  console.log("Compile succeeded.");

  // After compilation, wait for the board to reappear (port may change)
  console.log("Waiting for board to reconnect after reset...");
  const newPort = await waitForBoardReconnection(port, board.fqbn, 8000);
  console.log(`Using port ${newPort} for upload (was ${port})`);

  const uploadArgs = ["upload", "-p", newPort, "--fqbn", board.fqbn, sketch.sketchDir];
  const upload = await uploadWithRetry(uploadArgs);

  return {
    board,
    sketch,
    port: newPort,
    commands: {
      compile: compile.command,
      upload: upload.command,
    },
    log: [compile.log, upload.log].filter(Boolean).join("\n").trim(),
  };
}

export async function compileOnly({ code, detectedFqbn, detectedBoardName }) {
  const board = resolveDetectedBoard({ detectedFqbn, detectedBoardName });
  const sketch = await writeSketch(code);
  const args = ["compile", "--fqbn", board.fqbn, sketch.sketchDir];
  const compile = await runArduinoCli(args);
  return {
    board,
    sketch,
    commands: { compile: compile.command },
    log: compile.log,
  };
}