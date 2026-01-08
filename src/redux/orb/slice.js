import { createSlice } from "@reduxjs/toolkit";
import {
  fetchOrbs,
  fetchOrbByDate,
  addOrb,
  updateOrb,
  deleteOrb,
  fetchOrbStats,
} from "./operations";
const initialState = {
  items: [],
  currentOrb: null,
  stats: null,
  isLoading: false,
  error: null,
};
const handlePending = (state) => {
  state.isLoading = true;
  state.error = null;
};
const handleRejected = (state, action) => {
  state.isLoading = false;
  state.error = action.payload;
};
const orbsSlice = createSlice({
  name: "orbs",
  initialState,
  extraReducers: (builder) => {
    builder
      // GAP /orbs (fetchAll)
      .addCase(fetchOrbs.pending, handlePending)
      .addCase(fetchOrbs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.items = action.payload;
      })
      .addCase(fetchOrbs.rejected, handleRejected)
      // GET /orbs/date/:date (fetchByDate)
      .addCase(fetchOrbByDate.pending, handlePending)
      .addCase(fetchOrbByDate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.currentOrb = action.payload;
      })
      .addCase(fetchOrbByDate.rejected, handleRejected)
      // POST /orbs (addOrb)
      .addCase(addOrb.pending, handlePending)
      .addCase(addOrb.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.items.push(action.payload);
        state.currentOrb = action.payload; // Yeni ekleneni seçili yapabiliriz
      })
      .addCase(addOrb.rejected, handleRejected)
      // PUT /orbs/:id (updateOrb)
      .addCase(updateOrb.pending, handlePending)
      .addCase(updateOrb.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const index = state.items.findIndex(
          (orb) => orb._id === action.payload._id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.currentOrb = action.payload;
      })
      .addCase(updateOrb.rejected, handleRejected)
      // DELETE /orbs/:id (deleteOrb)
      .addCase(deleteOrb.pending, handlePending)
      .addCase(deleteOrb.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const index = state.items.findIndex(
          (orb) => orb._id === action.payload
        );
        if (index !== -1) {
          state.items.splice(index, 1);
        }
        if (state.currentOrb?._id === action.payload) {
          state.currentOrb = null;
        }
      })
      .addCase(deleteOrb.rejected, handleRejected)
      // GET /orbs/stats (fetchStats)
      .addCase(fetchOrbStats.pending, handlePending)
      .addCase(fetchOrbStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.stats = action.payload;
      })
      .addCase(fetchOrbStats.rejected, handleRejected);
  },
});
export const orbsReducer = orbsSlice.reducer;
