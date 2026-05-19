import { componentCatalog, getBoardConfig } from "../config/components.js";

const initialState = {
  connection: {
    connected: false,
    port: null,
    boardName: null,
    fqbn: null,
    protocol: null
  },
  selectedBoard: getBoardConfig("uno"),
  components: [],
  lastPrompt: "",
  lastCode: "",
  lastUpload: null
};

const runtimeState = structuredClone(initialState);

export function getAppState() {
  return {
    ...runtimeState,
    catalog: componentCatalog
  };
}

export function setConnection(connection) {
  runtimeState.connection = {
    ...runtimeState.connection,
    ...connection
  };
}

export function clearConnection() {
  runtimeState.connection = structuredClone(initialState.connection);
}

export function setSelectedBoard(board) {
  runtimeState.selectedBoard = board;
}

export function setComponents(components) {
  runtimeState.components = components;
}

export function setGeneratedCode({ prompt, code }) {
  runtimeState.lastPrompt = prompt;
  runtimeState.lastCode = code;
}

export function setUploadStatus(status) {
  runtimeState.lastUpload = status;
}
