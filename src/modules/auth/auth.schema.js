const { z } = require('zod');

const loginSchema = z.object({
  email: z.string({
    required_error: 'El email es obligatorio'
  }).trim().email('El email no tiene un formato valido').max(150, 'El email no puede superar 150 caracteres'),
  password: z.string({
    required_error: 'La contrasena es obligatoria'
  }).min(1, 'La contrasena es obligatoria').max(255, 'La contrasena no puede superar 255 caracteres'),
  rememberMe: z.coerce.boolean().optional().default(false)
}).strict();

const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'El email es obligatorio' })
    .trim()
    .email('El email no tiene un formato valido')
    .max(150, 'El email no puede superar 150 caracteres')
}).strict();

const resetPasswordSchema = z.object({
  email: z.string({ required_error: 'El email es obligatorio' })
    .trim()
    .email('El email no tiene un formato valido')
    .max(150, 'El email no puede superar 150 caracteres'),
  token: z.string({ required_error: 'El token es obligatorio' })
    .trim()
    .min(1, 'El token es obligatorio')
    .max(255, 'El token no puede superar 255 caracteres'),
  newPassword: z.string({ required_error: 'La nueva contrasena es obligatoria' })
    .min(8, 'La nueva contrasena debe tener al menos 8 caracteres')
    .max(255, 'La nueva contrasena no puede superar 255 caracteres')
}).strict();

module.exports = {
  forgotPasswordSchema,
  resetPasswordSchema,
  loginSchema
};
