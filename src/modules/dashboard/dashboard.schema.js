const { z } = require('zod');
const { dateRangeSchema, optionalPositiveInt } = require('../common/common.schema');

const dashboardQuerySchema = dateRangeSchema.extend({
  tallerId: optionalPositiveInt('tallerId')
}).strict();

module.exports = {
  dashboardQuerySchema
};
