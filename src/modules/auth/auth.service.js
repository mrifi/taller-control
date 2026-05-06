const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');
const { forgotPasswordSchema, loginSchema, resetPasswordSchema } = require('./auth.schema');
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
    empresaId: usuario.IDEmpresa,
    nombre: usuario.Nombre,
    email: usuario.Email,
    rol: usuario.Rol
  };

  const token = jwt.sign(
    {
      id: usuario.IDUsuario,
      empresaId: usuario.IDEmpresa,
      email: usuario.Email,
      rol: usuario.Rol
    },
    getJwtSecret(),
    { expiresIn: validatedData.rememberMe ? process.env.JWT_REMEMBER_EXPIRES_IN || '30d' : process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    success: true,
    message: 'Login correcto',
    token,
    user
  };
};

const forgotPassword = async (data) => {
  const { email } = forgotPasswordSchema.parse(data);
  const usuario = await authRepository.buscarPorEmail(email);
  const message = 'Si el email existe, recibiras instrucciones para recuperar la contrasena.';

  if (!usuario || !usuario.Activo) {
    return { success: true, message };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await authRepository.guardarResetPassword({ email, tokenHash, expiresAt });

  const resetLink = `https://taller-control.vercel.app/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  console.log('Password reset link:', resetLink);

  return { success: true, message };
};

const resetPassword = async (data) => {
  const { email, token, newPassword } = resetPasswordSchema.parse(data);
  const usuario = await authRepository.buscarPorEmail(email);

  if (!usuario || !usuario.Activo || !usuario.PasswordResetTokenHash || !usuario.PasswordResetExpires) {
    throw new AppError('Token de recuperacion invalido o expirado', 400);
  }

  if (new Date(usuario.PasswordResetExpires).getTime() < Date.now()) {
    throw new AppError('Token de recuperacion invalido o expirado', 400);
  }

  const tokenHash = hashResetToken(token);

  if (tokenHash !== usuario.PasswordResetTokenHash) {
    throw new AppError('Token de recuperacion invalido o expirado', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await authRepository.actualizarPasswordPorReset({ email, passwordHash });

  return { success: true, message: 'Contrasena actualizada correctamente' };
};

const hashResetToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

module.exports = {
  forgotPassword,
  login,
  resetPassword
};
