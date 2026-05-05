const { z } = require('zod');

const loginSchema = z.object({
  email: z.string({
    required_error: 'El email es obligatorio'
  }).trim().email('El email no tiene un formato valido').max(150, 'El email no puede superar 150 caracteres'),
  password: z.string({
    required_error: 'La contrasena es obligatoria'
  }).min(1, 'La contrasena es obligatoria').max(255, 'La contrasena no puede superar 255 caracteres')
}).strict();

module.exports = {
  loginSchema
};
