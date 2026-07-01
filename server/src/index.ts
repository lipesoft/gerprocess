import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { router } from './routes';
import { apiLimiter, sanitizeInputs } from './middlewares/security';

const app = express();

// ============ SECURITY MIDDLEWARES ============
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);
app.use('/api', apiLimiter);

// ============ STATIC FILES (uploads) ============
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ============ ROUTES ============
app.use('/api', router);

// ============ HEALTH CHECK ============
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ ERROR HANDLER ============
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
});

// ============ START SERVER ============
app.listen(env.PORT, () => {
  console.log(`🚀 Gerprocess API rodando na porta ${env.PORT}`);
  console.log(`📦 Ambiente: ${env.NODE_ENV}`);
});

export { app };
