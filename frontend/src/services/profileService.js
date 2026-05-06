import api from './api.js';

export const getProfile = async () => {
  const { data } = await api.get('/profile');
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await api.put('/profile', profileData);
  return data;
};

export const changePassword = async (passwordData) => {
  const { data } = await api.put('/profile/password', passwordData);
  return data;
};
