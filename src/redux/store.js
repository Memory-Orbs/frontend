import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./auth/slice";
import orbsReducer from "./orb/slice";

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token"],
};
const orbsPersistConfig = {
  key: "orbs",
  storage,
  whitelist: ["items", "currentOrb"],
};

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
    orbs: persistReducer(orbsPersistConfig, orbsReducer),
  },
});

export let persistor = persistStore(store);
