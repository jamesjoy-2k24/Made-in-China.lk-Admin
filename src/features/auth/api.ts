/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type LoginReq = { email: string; password: string };
type LoginRespRaw = {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
};
type MeResp = {
  user: unknown; // decodedIdToken + optional role/permissions from backend
};

function normalizeUser(u: any) {
  return {
    id: u.uid,
    role: u.role ?? "User",
    permissions: u.permissions ?? [],
    email: u.email ?? undefined,
    phone: u.phone_number ?? "",
    name: u.name ?? u.displayName ?? "",
    ...u,
  };
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("idToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (b) => ({
    // Returns { token, user } to match your LoginPage expectations
    login: b.mutation<{ token: string; user: any }, LoginReq>({
      async queryFn(args, _api, _extra, baseQuery) {
        // 1) Backend login -> returns { idToken, ... }
        const loginRes = await baseQuery({
          url: "/auth/login",
          method: "POST",
          body: args,
        });
        if (loginRes.error) return { error: loginRes.error as any };
        const { idToken } = loginRes.data as LoginRespRaw;
        localStorage.setItem("idToken", idToken);

        // 2) Fetch /me to get claims (role/permissions)
        const meRes = await baseQuery({
          url: "/auth/me",
          method: "GET",
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (meRes.error) {
          localStorage.removeItem("idToken");
          return { error: meRes.error as any };
        }
        const meData = meRes.data as MeResp;
        return { data: { token: idToken, user: normalizeUser(meData.user) } };
      },
    }),

    // Optional helpers
    me: b.query<any, void>({
      async queryFn(_args, _api, _extra, baseQuery) {
        const token = localStorage.getItem("idToken");
        if (!token) return { error: { status: 401, data: { message: "No token" } } as any };
        const meRes = await baseQuery({
          url: "/auth/me",
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.error) return { error: meRes.error as any };
        const meData = meRes.data as MeResp;
        return { data: normalizeUser(meData.user) };
      },
    }),

    logout: b.mutation<{ ok: boolean }, void>({
      async queryFn(_a, _b, _c, baseQuery) {
        const token = localStorage.getItem("idToken");
        await baseQuery({
          url: "/auth/logout",
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        localStorage.removeItem("idToken");
        return { data: { ok: true } };
      },
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useLogoutMutation } = authApi;
