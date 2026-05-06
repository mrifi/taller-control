const { z } = require('zod');

const updateProfileSchema = z.object({
  nombre: z.string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  email: z.string({ required_error: 'El email es obligatorio' })
    .trim()
    .email('El email no tiene un formato valido')
    .max(150, 'El email no puede superar 150 caracteres'),
  nombreEmpresa: z.string({ required_error: 'El nombre de empresa es obligatorio' })
    .trim()
    .min(1, 'El nombre de empresa es obligatorio')
    .max(150, 'El nombre de empresa no puede superar 150 caracteres')
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'La contrasena actual es obligatoria' })
    .min(1, 'La contrasena actual es obligatoria')
    .max(255, 'La contrasena actual no puede superar 255 caracteres'),
  newPassword: z.string({ required_error: 'La nueva contrasena es obligatoria' })
    .min(8, 'La nueva contrasena debe tener al menos 8 caracteres')
    .max(255, 'La nueva contrasena no puede superar 255 caracteres')
}).strict();

module.exports = {
  changePasswordSchema,
  updateProfileSchema
};
