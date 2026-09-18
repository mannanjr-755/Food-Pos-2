import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import dashboardRoutes from './routes/dashboard';
import menuRoutes from './routes/menu';
import categoryRoutes from './routes/categories';
import tableRoutes from './routes/tables';
import orderRoutes from './routes/orders';
import inventoryRoutes from './routes/inventory';
import reportRoutes from './routes/reports';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/menu-items', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

export default app;
