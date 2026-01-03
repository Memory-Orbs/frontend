// BASE
export const selectAuthState = (state) => state.auth;

// USER
export const selectUser = (state) => state.auth.user;
export const selectUserName = (state) => state.auth.user?.name;
export const selectUserSurname = (state) => state.auth.user?.surname;
export const selectUserEmail = (state) => state.auth.user?.email;
export const selectUserGender = (state) => state.auth.user?.gender;
export const selectUserBirthDate = (state) => state.auth.user?.birthDate;

// AUTH STATUS
export const selectToken = (state) => state.auth.token;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectIsRefreshing = (state) => state.auth.isRefreshing;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

// PASSWORD RESET
export const selectPasswordReset = (state) => state.auth.passwordReset;
export const selectIsPasswordResetSending = (state) =>
  state.auth.passwordReset?.isSending;
export const selectIsPasswordResetSuccess = (state) =>
  state.auth.passwordReset?.success;
export const selectPasswordResetMessage = (state) =>
  state.auth.passwordReset?.message;
