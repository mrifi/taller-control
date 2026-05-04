import api from './api';

export const getIngresos = async (filters = {}) => {
  const { data } = await api.get('/ingresos', { params: filters });
  return data;
};

export const getCategoriasIngreso = async () => {
  const { data } = await api.get('/ingresos/categorias');
  return data;
};

export const getTodasCategoriasIngreso = async () => {
  const { data } = await api.get('/ingresos/categorias/todas');
  return data;
};

export const createCategoriaIngreso = async (payload) => {
  const { data } = await api.post('/ingresos/categorias', payload);
  return data;
};

export const updateCategoriaIngreso = async (id, payload) => {
  const { data } = await api.put(`/ingresos/categorias/${id}`, payload);
  return data;
};

export const desactivarCategoriaIngreso = async (id) => {
  const { data } = await api.patch(`/ingresos/categorias/${id}/desactivar`);
  return data;
};

export const activarCategoriaIngreso = async (id) => {
  const { data } = await api.patch(`/ingresos/categorias/${id}/activar`);
  return data;
};

export const createIngreso = async (payload) => {
  const { data } = await api.post('/ingresos', payload);
  return data;
};

export const marcarComoCobrado = async (id) => {
  const { data } = await api.patch(`/ingresos/${id}/cobrado`);
  return data;
};
