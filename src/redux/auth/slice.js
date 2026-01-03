import { createSlice } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUser,
  sendPasswordResetEmail,
  resetPassword,
  updateUser,
} from "./operations";

const handlePending = (state) => {
  state.isLoading = true;
  state.error = null;
};

const handleRejected = (state, action) => {
  state.isLoading = false;
  state.isRefreshing = false;
  state.error = action.payload;
};

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: { name: null, surname: null, email: null },
    token: null,
    isLoggedIn: false,
    isLoading: false,
    isRefreshing: false,
    error: null,

    passwordReset: {
      isSending: false,
      success: false,
      message: null,
    },
  },
  reducers: {
    localLogout(state) {
      state.user = { name: null, surname: null, email: null };
      state.token = null;
      state.isLoggedIn = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, (state, action) => {
        const { user, token } = action.payload;

        state.user = {
          name: user?.name || null,
          surname: user?.surname || null,
          email: user?.email || null,
        };

        // DUZELTILMIS KISIM
        state.token = token || null;
        state.isLoggedIn = !!token;

        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, handleRejected)

      // LOGIN
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, token } = action.payload;

        state.user = {
          _id: user._id,
          name: user?.name || null,
          surname: user?.surname || null,
          email: user?.email || null,
        };

        state.token = token || null;
        state.isLoggedIn = !!token;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, handleRejected)

      // LOGOUT
      .addCase(logoutUser.pending, handlePending)
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = { name: null, surname: null, email: null };
        state.token = null;
        state.isLoggedIn = false;
        state.isLoading = false;
      })
      .addCase(logoutUser.rejected, handleRejected)

      // REFRESH
      .addCase(refreshUser.pending, (state) => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        const { user, token } = action.payload;

        state.user = {
          _id: user._id,
          name: user?.name || null,
          surname: user?.surname || null,
          email: user?.email || null,
        };

        state.token = token || null;
        state.isLoggedIn = !!token;
        state.isRefreshing = false;
        state.error = null;
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.user = { name: null, surname: null, email: null };
        state.token = null;
        state.isLoggedIn = false;
        state.isRefreshing = false;
        state.error = action.payload;
      })

      // SEND RESET EMAIL
      .addCase(sendPasswordResetEmail.pending, (state) => {
        state.passwordReset.isSending = true;
        state.passwordReset.success = false;
        state.passwordReset.message = null;
      })
      .addCase(sendPasswordResetEmail.fulfilled, (state, action) => {
        state.passwordReset.isSending = false;
        state.passwordReset.success = true;
        state.passwordReset.message =
          action.payload?.message ?? "Reset email sent";
      })
      .addCase(sendPasswordResetEmail.rejected, (state, action) => {
        state.passwordReset.isSending = false;
        state.passwordReset.success = false;
        state.passwordReset.message =
          action.payload ?? action.error?.message ?? "Reset failed";
      })

      // RESET PASSWORD
      .addCase(resetPassword.pending, (state) => {
        state.passwordReset.isSending = true;
        state.passwordReset.success = false;
        state.passwordReset.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.passwordReset.isSending = false;
        state.passwordReset.success = true;
        state.passwordReset.message =
          action.payload?.message ?? "Password has been reset";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.passwordReset.isSending = false;
        state.passwordReset.success = false;
        state.passwordReset.message =
          action.payload ?? action.error?.message ?? "Password reset failed";
      })
      // UPDATE USER
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload;

        state.user = {
          ...state.user,
          ...updatedUser, // ✅ sadece gelen alanları overwrite eder
        };

        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { localLogout } = authSlice.actions;
export default authSlice.reducer;
