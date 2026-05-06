import api from './api.js';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const login = async (email, password, rememberMe = false) => {
  let response;

  try {
    response = await api.post('/auth/login', { email, password, rememberMe });
  } catch (error) {
    if (!isRememberMeCompatibilityError(error)) {
      throw error;
    }

    response = await api.post('/auth/login', { email, password });
  }

  const { data } = response;

  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }

  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data;
};

const isRememberMeCompatibilityError = (error) => {
  const errors = error?.response?.data?.errors || [];

  return error?.response?.status === 400 && errors.some((item) => (
    item.message || ''
  ).includes('rememberMe'));
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async ({ email, token, newPassword }) => {
  const { data } = await api.post('/auth/reset-password', { email, token, newPassword });
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

export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...getUser(), ...user }));
  }
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};
