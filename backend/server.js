// backend/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from "./routes/authRoutes.js";
import userRoutes from './routes/userRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import transactionRoutes from './routes/transRoutes.js';
import portalRoutes from './routes/PortalRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

connectDB();

const app = express();

/* ── Middleware ── */
app.use(cors());
app.use(express.json());

/* ── Routes ── */
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/portals', portalRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/enquiries', enquiryRoutes);

// Static path for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
/* ── Test route ── */
app.get('/', (req, res) => {
  res.send('🚀 Cashflow API running...');
});

/* ── Start server ── */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});