const API_URL = "http://localhost:8787/api";
export const API_BASE_URL = API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = [payload.error || payload.message || "Request failed", payload.command]
      .filter(Boolean)
      .join("\n");
    throw new Error(message);
  }

  return payload;
}

export const api = {
  getState: () => request("/state"),
  getCatalog: () => request("/catalog"),
  getConnectionStatus: () => request("/connection-status"),
  connect: () => request("/connect", { method: "POST" }),
  disconnect: () => request("/disconnect", { method: "POST" }),
  stopSerial: () => request("/serial-stop", { method: "POST" }),
  selectBoard: (boardType) =>
    request("/board", {
      method: "POST",
      body: JSON.stringify({ boardType })
    }),
  generate: (payload) =>
    request("/generate", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  run: (payload) =>
    request("/run", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  upload: (payload) =>
    request("/upload", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
