import { authApi } from '@/features/auth/api';
import { usersApi } from '@/features/users/api';
import { productsApi } from '@/features/products/api';

// Create a combined API
export const rtkQueryApi = {
  reducerPath: 'api',
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
  },
  middleware: [authApi.middleware, usersApi.middleware, productsApi.middleware],
};
