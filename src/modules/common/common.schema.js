const { z } = require('zod');
const { paymentMethods } = require('./paymentMethods');

const isMissing = (value) => value === undefined || value === null || value === '';
const emptyStringToUndefined = (value) => (isMissing(value) ? undefined : value);

const optionalPositiveInt = (fieldName) => z.preprocess(
  emptyStringToUndefined,
  z.coerce.number({ error: `${fieldName} debe ser numerico` })
    .int(`${fieldName} debe ser un numero entero`)
    .positive(`${fieldName} debe ser mayor que 0`)
    .optional()
);

const requiredNumberError = (fieldName) => (issue) => (
  issue.input === undefined ? `${fieldName} es obligatorio` : `${fieldName} debe ser numerico`
);

const requiredDateError = (fieldName) => (issue) => (
  issue.input === undefined ? `${fieldName} es obligatorio` : `${fieldName} debe ser una fecha valida`
);

const requiredPositiveInt = (fieldName) => z.preprocess(
  emptyStringToUndefined,
  z.coerce.number({ error: requiredNumberError(fieldName) })
    .int(`${fieldName} debe ser un numero entero`)
    .positive(`${fieldName} debe ser mayor que 0`)
);

const requiredPositiveNumber = (fieldName) => z.preprocess(
  emptyStringToUndefined,
  z.coerce.number({ error: requiredNumberError(fieldName) })
    .positive(`${fieldName} debe ser mayor que 0`)
);

const optionalDate = (fieldName) => z.preprocess(
  emptyStringToUndefined,
  z.coerce.date({ error: `${fieldName} debe ser una fecha valida` }).optional()
);

const requiredDate = (fieldName) => z.preprocess(
  emptyStringToUndefined,
  z.coerce.date({ error: requiredDateError(fieldName) })
);

const optionalPaymentMethod = z.preprocess(
  emptyStringToUndefined,
  z.enum(paymentMethods, { error: 'Metodo de pago no permitido' }).optional()
);

const requiredPaymentMethod = z.preprocess(
  emptyStringToUndefined,
  z.enum(paymentMethods, {
    error: (issue) => (issue.input === undefined ? 'metodoPago es obligatorio' : 'Metodo de pago no permitido')
  })
);

const dateRangeSchema = z.object({
  fechaInicio: optionalDate('fechaInicio'),
  fechaFin: optionalDate('fechaFin')
}).refine((data) => {
  if (!data.fechaInicio || !data.fechaFin) {
    return true;
  }

  return data.fechaInicio <= data.fechaFin;
}, {
  path: ['fechaFin'],
  message: 'fechaFin debe ser mayor o igual que fechaInicio'
});

module.exports = {
  dateRangeSchema,
  optionalDate,
  optionalPaymentMethod,
  optionalPositiveInt,
  requiredDate,
  requiredPaymentMethod,
  requiredPositiveInt,
  requiredPositiveNumber
};
