import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

// add response interceptor to handle 401 centrally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn(
      "Axios error - url:",
      error.config?.url,
      "method:",
      error.config?.method,
    );
    console.warn("Request headers:", error.config?.headers);
    console.warn(
      "Response status:",
      error.response?.status,
      "body:",
      error.response?.data,
    );
    // 401 durumunda header temizle (loop engellemek için)
    if (error.response?.status === 401) {
      delete axios.defaults.headers.common.Authorization;
    }
    return Promise.reject(error);
  },
);

export const setAuthHeader = (token) => {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearAuthHeader = () => {
  delete axios.defaults.headers.common.Authorization;
};

// REGISTER
export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, surname, email, password }, thunkAPI) => {
    try {
      const response = await axios.post("/auth/register", {
        name,
        surname,
        email,
        password,
      });

      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// LOGIN
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await axios.post(
        "/auth/login",
        { email, password },
        { withCredentials: true },
      );

      // Backend sadece user döner, token cookie'dedir
      const { user } = response.data.data;

      if (!user) {
        return thunkAPI.rejectWithValue("User not found in response");
      }

      // Sadece user bilgisini sakla (opsiyonel)
      localStorage.setItem("user", JSON.stringify(user));

      // Login sonrası access token'ı almak için refresh endpoint'i çağır
      try {
        const refreshResponse = await axios.post(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );
        const accessToken = refreshResponse.data?.data?.accessToken;
        if (accessToken) {
          setAuthHeader(accessToken);
          return { user, token: accessToken };
        }
      } catch (refreshError) {
        console.warn(
          "Could not get access token from refresh:",
          refreshError.message,
        );
      }

      return { user, token: null };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// LOGOUT
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
      clearAuthHeader();
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// REFRESH
export const refreshUser = createAsyncThunk(
  "auth/refresh",
  async (_, thunkAPI) => {
    try {
      // POST request, cookie otomatik gönderilecek (withCredentials)
      const response = await axios.post(
        "/auth/refresh",
        {},
        { withCredentials: true },
      );

      const accessToken = response.data?.data?.accessToken;
      if (!accessToken) throw new Error("Access token not found from refresh");

      // access token'ı header'a set et
      setAuthHeader(accessToken);

      // Kullanıcı bilgisini localStorage'dan al
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      return { user, token: accessToken };
    } catch (error) {
      console.error("Refresh error:", error.response?.data || error.message);

      // 401 veya başka bir hata durumunda kullanıcı logout
      // thunkAPI.dispatch(logoutUser());
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

//password reset mail
export const sendPasswordResetEmail = createAsyncThunk(
  "/auth/send-reset-email",
  async (email, thunkAPI) => {
    try {
      const response = await axios.post(
        "/auth/send-reset-email",
        { email },
        { withCredentials: true },
      );
      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Bir hata oluştu";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);
//password reset
export const resetPassword = createAsyncThunk(
  "/auth/reset-password",
  async ({ token, newPassword }, thunkAPI) => {
    try {
      const response = await axios.post(
        "/auth/reset-password",
        { token, password: newPassword },
        { withCredentials: true },
      );
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);
// user update
export const updateUser = createAsyncThunk(
  "auth/update-user",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await axios.patch(`/auth/update-user/${id}`, data, {
        withCredentials: true,
      });

      const updatedUser = response.data.data;

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : {};

      const newUser = { ...user, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUser));

      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      return thunkAPI.rejectWithValue(message);
    }
  },
);
