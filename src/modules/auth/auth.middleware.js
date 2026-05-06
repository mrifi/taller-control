const jwt = require('jsonwebtoken');
const AppError = require('../../utils/AppError');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticacion requerido', 401));
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    return next(new AppError('JWT_SECRET no esta configurado en el servidor', 500));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.empresaId) {
      return next(new AppError('Token sin empresa asociada', 401));
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return next(new AppError('Token invalido o expirado', 401));
  }
};

module.exports = {
  verifyToken
};
