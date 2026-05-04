const { z } = require('zod');
const { requiredPositiveInt } = require('../common/common.schema');

const tallerParamsSchema = z.object({
  id: requiredPositiveInt('id')
}).strict();

const tallerSchema = z.object({
  Nombre: z.string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(150, 'El nombre no puede superar 150 caracteres'),
  Codigo: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string()
      .trim()
      .max(50, 'El codigo no puede superar 50 caracteres')
      .optional()
  )
}).strict();

module.exports = {
  tallerParamsSchema,
  tallerSchema
};
