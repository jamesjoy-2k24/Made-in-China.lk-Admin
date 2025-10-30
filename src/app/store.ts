import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '@/features/auth/slice';

import { authApi } from '@/features/auth/api';
import { usersApi } from '@/features/users/api';
import { productsApi } from '@/features/products/api';
import { catalogApi } from '@/features/catalog/api';
import { attributesApi } from '@/features/catalog/attributes.api'; // ✅ add

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [catalogApi.reducerPath]: catalogApi.reducer,
    [attributesApi.reducerPath]: attributesApi.reducer, // ✅ add
  },
  middleware: (getDefault) =>
    getDefault().concat(
      authApi.middleware,
      usersApi.middleware,
      productsApi.middleware,
      catalogApi.middleware,
      attributesApi.middleware // ✅ add
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
