import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Import routers
import authRouter from "./routes/auth.js";
import areasRouter from "./routes/areas.js";
import cargosRouter from "./routes/cargos.js";
import questionsRouter from "./routes/questions.js";
import candidatesRouter from "./routes/candidates.js";
import testsRouter from "./routes/tests.js";
import resumesRouter from "./routes/resumes.js";
import dashboardRouter from "./routes/dashboard.js";
import pipelineRouter from "./routes/pipeline.js";
import adminsRouter from "./routes/admins.js";

import { authMiddleware } from "./middlewares/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "*", // Allow all origins for development ease
}));
app.use(express.json());

// Servir arquivos estáticos (currículos salvos no backend)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/areas", areasRouter);
app.use("/api/cargos", cargosRouter);
app.use("/api/tests", testsRouter);
app.use("/api/resumes", resumesRouter);
app.use("/api/pipeline", pipelineRouter);
app.use("/api/admins", adminsRouter);

// Protect entire questions and dashboard routers (Admin only)
app.use("/api/questions", authMiddleware, questionsRouter);
app.use("/api/dashboard", authMiddleware, dashboardRouter);

// Candidates router contains mixed public/admin routes, auth applied inside the candidate router file
app.use("/api/candidates", candidatesRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
