export type RootState = ReturnType<typeof import('./store').store.getState>;
export type AppDispatch = typeof import('./store').store.dispatch;
