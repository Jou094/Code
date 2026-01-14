import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import blogReducer from "./blogSlice";
import commentsReducer from "./commentsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    blog: blogReducer,
    comments: commentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
