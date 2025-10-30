import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Role, User } from "@/types/user";

export type AuthState = {
  token: string | null;
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  token: localStorage.getItem("idToken"),
  user: null,
  role: null,
  isAuthenticated: !!localStorage.getItem("idToken"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User; role: Role }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      localStorage.setItem("idToken", action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      localStorage.removeItem("idToken");
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
