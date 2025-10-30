import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    const state: any = getState?.();
    const token =
      state?.auth?.token || window.localStorage.getItem('idToken') || null;

    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});
