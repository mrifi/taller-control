const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');
const { loginSchema } = require('./auth.schema');
const AppError = require('../../utils/AppError');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no esta configurado en el servidor', 500);
  }

  return process.env.JWT_SECRET;
};

const login = async (data) => {
  const validatedData = loginSchema.parse(data);
  const usuario = await authRepository.buscarPorEmail(validatedData.email);

  if (!usuario) {
    throw new AppError('Email o contrasena incorrectos', 401);
  }

  if (!usuario.Activo) {
    throw new AppError('Usuario inactivo', 403);
  }

  const passwordOk = await bcrypt.compare(validatedData.password, usuario.PasswordHash);

  if (!passwordOk) {
    throw new AppError('Email o contrasena incorrectos', 401);
  }

  const user = {
    id: usuario.IDUsuario,
    nombre: usuario.Nombre,
    email: usuario.Email,
    rol: usuario.Rol
  };

  const token = jwt.sign(
    {
      id: usuario.IDUsuario,
      email: usuario.Email,
      rol: usuario.Rol
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    success: true,
    message: 'Login correcto',
    token,
    user
  };
};

module.exports = {
  login
};
