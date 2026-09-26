import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Fix #10 — restrict CORS to the configured origin instead of wildcard.
// Set ALLOWED_ORIGIN in .env for your frontend URL. Falls back to
// localhost:3000 for local development.
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Fix #11 — explicit body size limit prevents large payload denial-of-service.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Task Manager API'
  });
});

// Simple health check — useful for uptime monitors and load balancer checks.
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// notFound and errorHandler must be registered last — after all routes —
// so they catch unmatched URLs and errors thrown above them.
app.use(notFound);
app.use(errorHandler);

export default app;
