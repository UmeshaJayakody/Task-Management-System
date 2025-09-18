import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface ApiResponse {
  message: string;
  status: 'success' | 'error' | 'healthy';
  timestamp: string;
  uptime?: number;
}

// Routes
app.get('/', (req: Request, res: Response<ApiResponse>) => {
  res.json({
    message: 'Hello World from Task Management System Backend!',
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

app.get('/api/hello', (req: Request, res: Response<ApiResponse>) => {
  const { name } = req.query;
  const nameStr = typeof name === 'string' ? name : undefined;
  
  res.json({
    message: nameStr ? `Hello, ${nameStr}!` : 'Hello, World!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  res.status(404).json({
    message: 'Route not found',
    status: 'error',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    status: 'error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`....Server is running on http://localhost:${PORT}`);
  console.log(`....Health check available at http://localhost:${PORT}/api/health`);
  console.log(`....Hello endpoint available at http://localhost:${PORT}/api/hello`);
});