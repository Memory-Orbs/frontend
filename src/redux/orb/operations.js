import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// İstek için temel URL ayarlanmış varsayılıyor.
// Eğer özel bir axios instance kullanıyorsanız burayı güncelleyin.
// import { instance } from '../../redux/auth/operations'; // Örnek
axios.defaults.baseURL = "http://localhost:3000/api"; // Geliştirme ortamı için varsayılan
/*
 * GET /orbs
 * ?startDate=&endDate=
 */
export const fetchOrbs = createAsyncThunk(
  "orbs/fetchAll",
  async ({ startDate, endDate }, thunkAPI) => {
    try {
      const response = await axios.get("/orbs", {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);
/*
 * GET /orbs/date/:date
 */
export const fetchOrbByDate = createAsyncThunk(
  "orbs/fetchByDate",
  async (date, thunkAPI) => {
    try {
      const response = await axios.get(`/orbs/date/${date}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);
/*
 * POST /orbs
 * Body: { date, emotions, note, animationSeed }
 */
export const addOrb = createAsyncThunk(
  "orbs/addOrb",
  async (credentials, thunkAPI) => {
    try {
      const response = await axios.post("/orbs", credentials);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);
/*
 * PUT /orbs/:id
 * Body: { emotions, note, animationSeed }
 */
export const updateOrb = createAsyncThunk(
  "orbs/updateOrb",
  async ({ id, ...data }, thunkAPI) => {
    try {
      const response = await axios.put(`/orbs/${id}`, data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);
/*
 * DELETE /orbs/:id
 */
export const deleteOrb = createAsyncThunk(
  "orbs/deleteOrb",
  async (id, thunkAPI) => {
    try {
      await axios.delete(`/orbs/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);
/*
 * GET /orbs/stats
 * ?startDate=&endDate=
 */
export const fetchOrbStats = createAsyncThunk(
  "orbs/fetchStats",
  async ({ startDate, endDate }, thunkAPI) => {
    try {
      const response = await axios.get("/orbs/stats", {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);
