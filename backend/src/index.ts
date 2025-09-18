import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import userRoutes from './routes/user.routes';

// Import middlewares
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Types
interface ApiResponse {
  message: string;
  status: 'success' | 'error' | 'healthy';
  timestamp: string;
  uptime?: number;
}

// Health check routes
app.get('/', (req: Request, res: Response<ApiResponse>) => {
  res.json({
    message: 'Task Management System Backend API',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req: Request, res: Response<ApiResponse>) => {
  res.json({
    message: 'Backend server is running!',
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 User API: http://localhost:${PORT}/api/users`);
});