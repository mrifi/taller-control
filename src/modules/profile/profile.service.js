const bcrypt = require('bcryptjs');
const profileRepository = require('./profile.repository');
const { changePasswordSchema, updateProfileSchema } = require('./profile.schema');
const AppError = require('../../utils/AppError');

const getProfile = async ({ userId, empresaId }) => {
  const profile = await profileRepository.obtenerProfile({ userId, empresaId });

  if (!profile) {
    throw new AppError('Perfil no encontrado', 404);
  }

  return formatProfile(profile);
};

const updateProfile = async ({ userId, empresaId, data }) => {
  const validatedData = updateProfileSchema.parse(data);
  const emailExists = await profileRepository.existeEmailEnOtroUsuario({
    userId,
    email: validatedData.email
  });

  if (emailExists) {
    throw new AppError('El email ya esta en uso por otro usuario', 409);
  }

  const result = await profileRepository.actualizarProfile({
    userId,
    empresaId,
    nombre: validatedData.nombre,
    email: validatedData.email,
    nombreEmpresa: validatedData.nombreEmpresa
  });

  return {
    success: true,
    message: 'Perfil actualizado correctamente',
    data: {
      usuario: {
        id: result.usuario.IDUsuario,
        nombre: result.usuario.Nombre,
        email: result.usuario.Email,
        rol: result.usuario.Rol
      },
      empresa: {
        id: result.empresa.IDEmpresa,
        nombre: result.empresa.Nombre
      }
    }
  };
};

const changePassword = async ({ userId, empresaId, data }) => {
  const validatedData = changePasswordSchema.parse(data);
  const profile = await profileRepository.obtenerProfile({ userId, empresaId });

  if (!profile) {
    throw new AppError('Perfil no encontrado', 404);
  }

  const currentPasswordOk = await bcrypt.compare(validatedData.currentPassword, profile.PasswordHash);

  if (!currentPasswordOk) {
    throw new AppError('La contrasena actual no es correcta', 400);
  }

  const samePassword = await bcrypt.compare(validatedData.newPassword, profile.PasswordHash);

  if (samePassword) {
    throw new AppError('La nueva contrasena debe ser diferente a la actual', 400);
  }

  const passwordHash = await bcrypt.hash(validatedData.newPassword, 12);
  const updated = await profileRepository.actualizarPassword({ userId, empresaId, passwordHash });

  if (!updated) {
    throw new AppError('No se pudo actualizar la contrasena', 404);
  }

  return { success: true, message: 'Contrasena actualizada correctamente' };
};

const formatProfile = (profile) => ({
  success: true,
  data: {
    usuario: {
      id: profile.IDUsuario,
      nombre: profile.UsuarioNombre,
      email: profile.Email,
      rol: profile.Rol
    },
    empresa: {
      id: profile.IDEmpresa,
      nombre: profile.EmpresaNombre
    }
  }
});

module.exports = {
  changePassword,
  getProfile,
  updateProfile
};
