import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv before anything else that needs env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../../../.env') });

// Now import other modules
import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/api.js";

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(
  cors({
    origin: process.env.WEB_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/api", apiRouter);

app.use((error, _request, response, _next) => {
  response.status(500).json({
    error: error.message || "Unexpected server error",
    command: error.command
  });
});

app.listen(port, () => {
  console.log(`Arduino Visual Studio backend running on http://localhost:${port}`);
});