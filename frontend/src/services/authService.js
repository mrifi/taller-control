import api from './api.js';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });

  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }

  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = () => {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    logout();
    return null;
  }
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};
