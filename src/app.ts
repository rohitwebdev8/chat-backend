import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { getHealth } from './controllers/notification.controller.js';
import notificationRoutes from './routes/notification.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { ApiResponse } from './types/notification.types.js';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root welcome endpoint
app.get('/', (_req: Request, res: Response<ApiResponse>) => {
  res.status(200).json({
    success: true,
    message: 'Chat Notification API is running',
  });
});

// Health endpoint
app.get('/health', getHealth);


// Notification API routes
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((_req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Central error handler
app.use(errorHandler);

export default app;
