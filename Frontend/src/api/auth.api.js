import api from "./axios";

export const login = (data) => {
    return api.post("/auth/login", data);
};

export const register = data =>
  api.post("/auth/register", data);

export const getMe = () =>
  api.get("/users/me");

export const refresh = (refreshToken) =>
  api.post("/auth/refresh", { refresh_token: refreshToken });

export const logout = () =>
  api.post("/auth/logout");

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = (token, newPassword) =>
  api.post("/auth/reset-password", { token, new_password: newPassword });

export const googleLogin = (payload) =>
  api.post("/auth/google", payload);
