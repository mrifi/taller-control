require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');

const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const ingresosRoutes = require('./modules/ingresos/ingresos.routes');
const gastosRoutes = require('./modules/gastos/gastos.routes');
const reportesRoutes = require('./modules/reportes/reportes.routes');
const talleresRoutes = require('./modules/talleres/talleres.routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./config/logger');
const AppError = require('./utils/AppError');

const app = express();
app.set('trust proxy', 1);

const defaultCorsOrigins = 'http://localhost:5173,http://localhost:5174,http://localhost:5175';
const allowedOrigins = (process.env.CORS_ORIGIN || defaultCorsOrigins)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.'
  }
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/talleres', talleresRoutes);

app.use((req, res) => {
  throw new AppError('Ruta no encontrada', 404);
});

app.use(errorHandler);

module.exports = app;
