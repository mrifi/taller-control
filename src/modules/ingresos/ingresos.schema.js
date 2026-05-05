const { z } = require('zod');
const {
  dateRangeSchema,
  optionalDate,
  optionalPaymentMethod,
  optionalPositiveInt,
  requiredDate,
  requiredPaymentMethod,
  requiredPositiveInt,
  requiredPositiveNumber
} = require('../common/common.schema');

const estadosPago = ['CONFIRMADO', 'PENDIENTE'];

const listarIngresosQuerySchema = dateRangeSchema.extend({
  tallerId: optionalPositiveInt('tallerId'),
  metodoPago: optionalPaymentMethod,
  estadoPago: z.enum(estadosPago, { error: 'Estado de pago no permitido' }).optional(),
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

const crearIngresoSchema = z.object({
  descripcion: z.string({ error: 'La descripcion es obligatoria' })
    .trim()
    .min(1, 'La descripcion es obligatoria')
    .max(255, 'La descripcion no puede superar 255 caracteres'),
  fecha: requiredDate('fecha'),
  monto: requiredPositiveNumber('monto'),
  cantidad: requiredPositiveInt('cantidad'),
  metodoPago: requiredPaymentMethod,
  categoriaId: requiredPositiveInt('categoriaId'),
  tallerId: requiredPositiveInt('tallerId'),
  estadoPago: z.enum(estadosPago, { error: 'Estado de pago no permitido' }).default('CONFIRMADO'),
  fechaPagoPrevista: optionalDate('fechaPagoPrevista'),
  fechaPagoReal: optionalDate('fechaPagoReal'),
  cliente: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().max(150, 'El cliente no puede superar 150 caracteres').optional()
  )
}).strict().superRefine((data, ctx) => {
  if (data.estadoPago === 'PENDIENTE' && !data.cliente) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cliente'],
      message: 'El cliente es obligatorio si el ingreso esta pendiente'
    });
  }

  if (data.estadoPago === 'PENDIENTE' && !data.fechaPagoPrevista) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fechaPagoPrevista'],
      message: 'La fecha prevista de pago es obligatoria si el ingreso esta pendiente'
    });
  }
});

const marcarComoCobradoParamsSchema = z.object({
  id: requiredPositiveInt('id')
}).strict();

const ingresoParamsSchema = z.object({
  id: requiredPositiveInt('id')
}).strict();

const categoriaParamsSchema = z.object({
  id: requiredPositiveInt('id')
}).strict();

const categoriaIngresoSchema = z.object({
  denominacion: z.string({ error: 'La denominacion es obligatoria' })
    .trim()
    .min(2, 'La denominacion debe tener al menos 2 caracteres')
    .max(100, 'La denominacion no puede superar 100 caracteres')
}).strict();

module.exports = {
  categoriaIngresoSchema,
  categoriaParamsSchema,
  crearIngresoSchema,
  ingresoParamsSchema,
  listarIngresosQuerySchema,
  marcarComoCobradoParamsSchema
};
