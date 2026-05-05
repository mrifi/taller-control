import api from './api';

export const getGastos = async (filters = {}) => {
  const { data } = await api.get('/gastos', { params: filters });
  return data;
};

export const getTiposGasto = async () => {
  const { data } = await api.get('/gastos/tipos');
  return data;
};

export const getTodosTiposGasto = async () => {
  const { data } = await api.get('/gastos/tipos/todos');
  return data;
};

export const createTipoGasto = async (payload) => {
  const { data } = await api.post('/gastos/tipos', payload);
  return data;
};

export const updateTipoGasto = async (id, payload) => {
  const { data } = await api.put(`/gastos/tipos/${id}`, payload);
  return data;
};

export const desactivarTipoGasto = async (id) => {
  const { data } = await api.patch(`/gastos/tipos/${id}/desactivar`);
  return data;
};

export const activarTipoGasto = async (id) => {
  const { data } = await api.patch(`/gastos/tipos/${id}/activar`);
  return data;
};

export const createGasto = async (payload) => {
  const { data } = await api.post('/gastos', payload);
  return data;
};

export const updateGasto = async (id, payload) => {
  const { data } = await api.put(`/gastos/${id}`, payload);
  return data;
};

export const deleteGasto = async (id) => {
  const { data } = await api.delete(`/gastos/${id}`);
  return data;
};
