import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import auditRoutes from "./routes/auditRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import jobOrderRoutes from "./routes/jobOrderRoutes.js";
import manpowerRoutes from "./routes/manpowerRoutes.js";
import specializationRoutes from "./routes/specializationRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import { seedInitialTrades } from "./utils/seedTrades.js";
import { migrateEmployeeDocuments } from "./utils/migrateEmployeeDocuments.js";

dotenv.config();

const app = express();

// Connect Database & Seed Initial Trades & Migrate Employee Documents
connectDB().then(async () => {
  await seedInitialTrades();
  await migrateEmployeeDocuments();
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/manpower", manpowerRoutes);
app.use("/api/job-orders", jobOrderRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/trades", tradeRoutes);

// Base Route
app.get("/", (req, res) => {
  res.send("Manpower Allocation API Running...");
});

// Anything past this point didn't match a route above.
app.use(notFound);

// Must be registered last — catches everything thrown or passed to
// next(error) anywhere in the app.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
