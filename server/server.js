import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/db.js';
import auditRoutes from './routes/auditRoutes.js';
import authRoutes from './routes/authRoutes.js';
import jobOrderRoutes from './routes/jobOrderRoutes.js';
import manpowerRoutes from './routes/manpowerRoutes.js';

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://manpower-management-system-lime.vercel.app'],
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/manpower', manpowerRoutes);
app.use('/api/job-orders', jobOrderRoutes);
app.use('/api/audit-logs', auditRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Manpower Allocation API Running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
