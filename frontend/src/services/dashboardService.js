import api from './api';

export const getDashboard = async (filters = {}) => {
  const { data } = await api.get('/dashboard', { params: filters });
  return data;
};
