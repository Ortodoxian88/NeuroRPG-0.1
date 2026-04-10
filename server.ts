import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './server/routes/api.routes';
import { checkDatabaseConnection } from './server/database/client';
import { errorHandler } from './server/middleware/error.middleware';
import { logger } from './server/utils/logger';
import 'dotenv/config';

// Global error handlers for better debugging on Render
process.on('uncaughtException', (err) => {
  logger.error('CRITICAL: Uncaught Exception', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('CRITICAL: Unhandled Rejection', { reason });
});

logger.info('>>> NEURORPG SERVER STARTING <<<');

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Добавляем заголовок версии для отладки
app.use((req, res, next) => {
  res.setHeader("X-Server-Version", "1.0.2");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// 2. API Роуты
// Регистрируем ПРЯМО ЗДЕСЬ для максимальной надежности
app.use('/api', apiRouter);

// 3. Error Handler (MUST be after routes)
app.use(errorHandler);

// Дополнительный проверочный роут прямо в корне app
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.2',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// 3. Статика и Vite (Development vs Production)
async function setupStatic() {
  const __dirname = path.resolve();
  const distPath = path.join(__dirname, 'dist');

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Running in DEVELOPMENT mode (Vite)');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Running in PRODUCTION mode (Static)');
    console.log(`[Server] Serving static files from: ${distPath}`);
    
    // Проверяем наличие папки dist
    app.use(express.static(distPath));
    
    // 4. Catch-all (Для SPA навигации) - ВСЕГДА последний
    app.get('*', (req, res) => {
      // Если это запрос к /api, который не сработал выше - возвращаем 404 JSON, а не HTML
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: `API route not found: ${req.path}` });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// 5. Функция запуска
async function startServer() {
  try {
    logger.info('Checking database connection...');
    let isDbConnected = false;
    try {
      isDbConnected = await checkDatabaseConnection();
    } catch (dbErr) {
      logger.error('Unexpected error during DB connection check:', { error: dbErr });
    }
    
    if (!isDbConnected) {
      logger.error('CRITICAL: Database not available. API endpoints will fail.');
      logger.error('Ensure DATABASE_URL is set correctly in Render dashboard.');
    }

    await setupStatic();

    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health/db`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
}

startServer();
