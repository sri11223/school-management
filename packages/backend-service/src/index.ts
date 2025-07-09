import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseManager } from './database/DatabaseManager';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import route modules
import studentRoutes from './routes/students';
import teacherRoutes from './routes/teachers';
import classRoutes from './routes/classes';
import attendanceRoutes from './routes/attendance';
import examRoutes from './routes/exams';
import feeRoutes from './routes/fees';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';
import whatsappRoutes from './routes/whatsapp';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';

// Import security middleware
import { corsOptions, generalLimiter, securityHeaders, requestLogger, sanitizeInput, securityErrorHandler } from './middleware/security';

dotenv.config();

class EduManageServer {
  private app: express.Application;
  private dbManager: DatabaseManager;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.dbManager = DatabaseManager.getInstance();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(securityHeaders);
    
    // Rate limiting
    this.app.use(generalLimiter);

    // CORS configuration
    this.app.use(cors(corsOptions));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Input sanitization
    this.app.use(sanitizeInput);

    // Request logging
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: this.dbManager.isConnected() ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/files', fileRoutes);
    this.app.use('/api/students', studentRoutes);
    this.app.use('/api/teachers', teacherRoutes);
    this.app.use('/api/classes', classRoutes);
    this.app.use('/api/attendance', attendanceRoutes);
    this.app.use('/api/exams', examRoutes);
    this.app.use('/api/fees', feeRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/ai', aiRoutes);
    this.app.use('/api/whatsapp', whatsappRoutes);

    // Database management endpoints
    this.app.post('/api/database/init', async (req, res) => {
      try {
        await this.dbManager.initializeDatabase();
        res.json({ message: 'Database initialized successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to initialize database' });
      }
    });

    this.app.get('/api/database/status', async (req, res) => {
      try {
        const status = await this.dbManager.getDatabaseStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get database status' });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private initializeErrorHandling(): void {
    // Security error handling
    this.app.use(securityErrorHandler);
    
    // General error handling
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await this.dbManager.initializeDatabase();
      logger.info('Database initialized successfully');

      // Start server
      this.app.listen(this.port, () => {
        logger.info(`EduManage Pro Backend Server running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async stop(): Promise<void> {
    await this.dbManager.close();
    logger.info('Server stopped');
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new EduManageServer();
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });
}

export default EduManageServer;
