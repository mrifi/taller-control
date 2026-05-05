const { z } = require('zod');
const {
  dateRangeSchema,
  optionalPaymentMethod,
  optionalPositiveInt,
  requiredDate,
  requiredPaymentMethod,
  requiredPositiveInt,
  requiredPositiveNumber
} = require('../common/common.schema');

const listarGastosQuerySchema = dateRangeSchema.extend({
  tallerId: optionalPositiveInt('tallerId'),
  metodoPago: optionalPaymentMethod,
  tipoGastoId: optionalPositiveInt('tipoGastoId'),
  limit: z.coerce.number({ error: 'limit debe ser numerico' })
    .int('limit debe ser un numero entero')
    .min(1, 'limit debe ser mayor que 0')
    .max(50, 'limit no puede ser mayor que 50')
    .default(20),
  offset: z.coerce.number({ error: 'offset debe ser numerico' })
    .int('offset debe ser un numero entero')
    .min(0, 'offset no puede ser negativo')
    .default(0)
}).strict();

const crearGastoSchema = z.object({
  descripcion: z.string({ error: 'La descripcion es obligatoria' })
    .trim()
    .min(1, 'La descripcion es obligatoria')
    .max(255, 'La descripcion no puede superar 255 caracteres'),
  fecha: requiredDate('fecha'),
  monto: requiredPositiveNumber('monto'),
  cantidad: requiredPositiveInt('cantidad'),
  metodoPago: requiredPaymentMethod,
  tipoGastoId: requiredPositiveInt('tipoGastoId'),
  tallerId: requiredPositiveInt('tallerId')
}).strict();

const tipoGastoParamsSchema = z.object({
  id: requiredPositiveInt('id')
}).strict();

const gastoParamsSchema = z.object({
  id: requiredPositiveInt('id')
}).strict();

const tipoGastoSchema = z.object({
  denominacion: z.string({ error: 'La denominacion es obligatoria' })
    .trim()
    .min(2, 'La denominacion debe tener al menos 2 caracteres')
    .max(100, 'La denominacion no puede superar 100 caracteres')
}).strict();

module.exports = {
  crearGastoSchema,
  gastoParamsSchema,
  listarGastosQuerySchema,
  tipoGastoParamsSchema,
  tipoGastoSchema
};
