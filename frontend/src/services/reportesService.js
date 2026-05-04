import api from './api';

export const getReporteResumen = async (filters = {}) => {
  const { data } = await api.get('/reportes/resumen', { params: filters });
  return data;
};
