import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrator.js';
import { seedDefaultSampleQueries } from './db/seeds/default-queries.seed.js';
import { logger } from './utils/logger.js';
import { getDbPool } from './config/database.js';
async function bootstrap() {
    try {
        logger.info('Bootstrapping Low-Code Platform Backend...');
        // 1. Run database migrations automatically on boot
        await runMigrations();
        // 2. Seed default sample queries for Visual Query Builder
        await seedDefaultSampleQueries();
        // 3. Initialize Express application
        const app = createApp();
        // 3. Start listening on configured port
        const server = app.listen(env.PORT, () => {
            logger.info(`Server listening on port ${env.PORT}`, {
                apiPrefix: env.API_PREFIX,
                docs: `http://localhost:${env.PORT}/api/docs`,
                mediaStorage: env.RESOLVED_MEDIA_PATH,
                environment: env.NODE_ENV,
            });
        });
        // Graceful shutdown handling
        const shutdown = async (signal) => {
            logger.info(`Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                try {
                    const pool = getDbPool();
                    await pool.end();
                    logger.info('Database pool closed. Shutdown complete.');
                    process.exit(0);
                }
                catch (err) {
                    logger.error('Error during shutdown:', { error: err.message });
                    process.exit(1);
                }
            });
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
    catch (err) {
        logger.error('Fatal error during application startup:', {
            error: err.message,
            stack: err.stack,
        });
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map