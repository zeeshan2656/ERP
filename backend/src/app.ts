import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { mediaController } from './modules/media/media.controller.js';
import { swaggerSpec } from './config/swagger.js';

// Route imports
import systemRoutes from './modules/system/system.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import rolesRoutes from './modules/roles/roles.routes.js';
import appearanceRoutes from './modules/appearance/appearance.routes.js';
import brandingRoutes from './modules/branding/branding.routes.js';
import registryRoutes from './modules/registry/registry.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import databaseRoutes from './modules/database/database.routes.js';
import queriesRoutes from './modules/queries/queries.routes.js';
import formsRoutes from './modules/forms/forms.routes.js';

export function createApp(): Express {
  const app = express();

  // Security headers with resource policy permitting image loading
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Managed per deployment or Vite dev
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Capacitor)
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGIN_LIST.includes(origin) || env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error('CORS policy blocked access for this origin.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parse JSON and urlencoded requests
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Dedicated media streaming endpoint (Serves external files outside source folder)
  app.get('/media/*', (req, res, next) => mediaController.streamMedia(req, res, next));

  // Swagger Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Mount API V1 routes
  const apiRouter = express.Router();
  apiRouter.use('/system', systemRoutes);
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', usersRoutes);
  apiRouter.use('/roles', rolesRoutes);
  apiRouter.use('/settings/appearance', appearanceRoutes);
  apiRouter.use('/settings/branding', brandingRoutes);
  apiRouter.use('/modules', registryRoutes);
  apiRouter.use('/media', mediaRoutes);
  apiRouter.use('/audit-logs', auditRoutes);
  apiRouter.use('/database', databaseRoutes);
  apiRouter.use('/queries', queriesRoutes);
  apiRouter.use('/forms', formsRoutes);

  app.use(env.API_PREFIX, apiRouter);

  // Health check shortcut at root
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
}
