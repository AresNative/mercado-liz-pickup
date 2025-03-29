import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { api } from "@/hooks/reducers/api";
import { auth } from "@/hooks/reducers/auth";
import { EnvConfig } from "@/utils/constants/env.config";

import dropDownReducer from "@/hooks/reducers/drop-down";
import filterData from "@/hooks/reducers/filter";

const config = EnvConfig();
export const store = configureStore({
  reducer: {
    dropDownReducer,
    filterData,
    [api.reducerPath]: api.reducer,
    [auth.reducerPath]: auth.reducer,
  },
  devTools: /* config.mode !== "production" */ true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({}).concat([api.middleware, auth.middleware]),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
