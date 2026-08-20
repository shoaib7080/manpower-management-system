import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// ─── Core: Infrastructure ───────────────────────────────────────────────────
import connectDB from "./core/config/db.js";
import { notFound, errorHandler } from "./core/middleware/errorHandler.js";

// ─── Module: Users (Auth + Audit) ───────────────────────────────────────────
import authRoutes from "./modules/users/routes/authRoutes.js";
import auditRoutes from "./modules/users/routes/auditRoutes.js";

// ─── Module: Operations (Manpower + Job Orders) ─────────────────────────────
import jobOrderRoutes from "./modules/operations/routes/jobOrderRoutes.js";
import manpowerRoutes from "./modules/operations/routes/manpowerRoutes.js";
import specializationRoutes from "./modules/operations/routes/specializationRoutes.js";
import staffRoutes from "./modules/operations/routes/staffRoutes.js";
import tradeRoutes from "./modules/operations/routes/tradeRoutes.js";

// ─── Shared: Startup Utilities ───────────────────────────────────────────────
import { seedInitialTrades } from "./shared/utils/seedTrades.js";
import { migrateEmployeeDocuments } from "./shared/utils/migrateEmployeeDocuments.js";
import { migrateUserPermissions } from "./shared/utils/migrateUserPermissions.js";

import timesheetRoutes from "./modules/finance/routes/timesheetRoutes.js";

dotenv.config();

const app = express();

// Connect Database & run one-time startup tasks
connectDB().then(async () => {
  await seedInitialTrades();
  await migrateEmployeeDocuments();
  await migrateUserPermissions();
});

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://manpower-management-system-lime.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────
// Users module
app.use("/api/auth", authRoutes);
app.use("/api/audit-logs", auditRoutes);

// Operations module
app.use("/api/manpower", manpowerRoutes);
app.use("/api/job-orders", jobOrderRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/finance/timesheets", timesheetRoutes);

// Base Route
app.get("/", (req, res) => {
  res.send("ERP API Running — Modules: [operations, users]");
});

// Anything past this point didn't match a defined route.
app.use(notFound);

// Must be registered last — catches everything thrown or passed to
// next(error) anywhere in the app.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
