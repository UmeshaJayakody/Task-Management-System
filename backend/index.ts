import 'dotenv/config';                
import { execSync } from 'node:child_process';

try {
  console.log('Running `prisma generate` …');
  execSync('npx prisma generate', { stdio: 'inherit' }); 
} catch (err) {
  console.error('Could not run `prisma generate`:', err);
  process.exit(1);
}

import { prisma } from './src/utils/database.js';
import { queueService } from './src/services/queue.service.js';
import express, { type Application } from 'express';
import cors, { type CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import userRoutes from './src/routes/user.route.js';
import providerRoutes from './src/routes/provider.route.js';
import companyRoutes from './src/routes/company.route.js';
import servicesRoutes from './src/routes/services.route.js';
import categoryRoutes from './src/routes/category.route.js';
import adminRoutes from './src/routes/admin.route.js'; 
import confirmationRoutes from './src/routes/confirmation.route.js'; 
import reviewRoutes from './src/routes/review.route.js';
import serviceReviewRoutes from './src/routes/serviceReview.route.js';
import { chatbotRoutes, CHATBOT_MODULE_INFO } from './src/modules/chatbot/index.js';

// Simple database test function
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
} 

const app: Application = express();

// CORS configuration (must run before any rate limiting or routes)
const corsOptions: CorsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10000, // increased limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate-limit CORS preflight requests
  skip: (req) => req.method === 'OPTIONS',
});

// Apply rate limiting to all routes
app.use(limiter);

// Increase JSON payload limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/confirmations', confirmationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/service-reviews', serviceReviewRoutes);
app.use('/api/chatbot', chatbotRoutes);

console.log(`🤖 ${CHATBOT_MODULE_INFO.name} loaded with endpoints:`, CHATBOT_MODULE_INFO.endpoints);

const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Start server with basic database test
async function startServer() {
  console.log('🚀 Starting server...');
  
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.error('💥 Server startup aborted due to database connection failure');
    process.exit(1);
  }

  // Initialize queue service
  try {
    await queueService.connect();
    queueService.setupGracefulShutdown();
    console.log('✅ RabbitMQ connection established');
  } catch (error) {
    console.error('⚠️ RabbitMQ connection failed, emails will not be sent:', error);
    // Don't exit - continue without email functionality
  }
  
  app.listen(PORT, () => {
    console.log(`🎯 Server running on port ${PORT}`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
