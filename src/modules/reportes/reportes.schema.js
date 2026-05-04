const { z } = require('zod');
const { requiredDate, requiredPositiveInt } = require('../common/common.schema');

const resumenReporteQuerySchema = z.object({
  tallerId: requiredPositiveInt('tallerId'),
  fechaInicio: requiredDate('fechaInicio'),
  fechaFin: requiredDate('fechaFin')
}).strict().refine((data) => data.fechaInicio <= data.fechaFin, {
  path: ['fechaFin'],
  message: 'fechaFin debe ser mayor o igual que fechaInicio'
});

module.exports = {
  resumenReporteQuerySchema
};
