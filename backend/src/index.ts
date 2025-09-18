import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import SocketService from './utils/socket';
import { setSocketService } from './services/activity.service';
import { setTaskSocketService } from './services/task.service';

// Import routes
import userRoutes from './routes/user.routes';
import taskRoutes from './routes/task.routes';
import teamRoutes from './routes/team.routes';
import commentRoutes from './routes/comment.routes';
import activityRoutes from './routes/activity.routes';
import dependencyRoutes from './routes/dependency.routes';

// Import middlewares
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
const socketService = new SocketService(server);
setSocketService(socketService);
setTaskSocketService(socketService);

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
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dependencies', dependencyRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 User API: http://localhost:${PORT}/api/users`);
  console.log(`📋 Task API: http://localhost:${PORT}/api/tasks`);
  console.log(`👥 Team API: http://localhost:${PORT}/api/teams`);
  console.log(`💬 Comment API: http://localhost:${PORT}/api/comments`);
  console.log(`📈 Activity API: http://localhost:${PORT}/api/activities`);
  console.log(`🔗 Dependency API: http://localhost:${PORT}/api/dependencies`);
  console.log(`⚡ WebSocket server is running`);
});