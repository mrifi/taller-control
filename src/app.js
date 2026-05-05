require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./modules/auth/auth.routes');
const { verifyToken } = require('./modules/auth/auth.middleware');
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

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://taller-control.vercel.app'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

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

app.use(cors(corsOptions));

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/ingresos', verifyToken, ingresosRoutes);
app.use('/api/gastos', verifyToken, gastosRoutes);
app.use('/api/reportes', verifyToken, reportesRoutes);
app.use('/api/talleres', verifyToken, talleresRoutes);

app.use((req, res) => {
  throw new AppError('Ruta no encontrada', 404);
});

app.use(errorHandler);

module.exports = app;
