import api from './api';

export const getTalleres = async () => {
  const { data } = await api.get('/talleres');
  return data;
};

export const getComparativaTalleres = async () => {
  const { data } = await api.get('/talleres/comparativa');
  return data;
};

export const createTaller = async (payload) => {
  const { data } = await api.post('/talleres', payload);
  return data;
};

export const updateTaller = async (id, payload) => {
  const { data } = await api.put(`/talleres/${id}`, payload);
  return data;
};
