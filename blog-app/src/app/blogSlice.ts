import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../lib/supabase";
import type { RootState } from "./store";

export interface Blog {
  id: string;
  title: string;
  content: string;
  user_id: string;
  email: string;
  created_at: string;
}

interface BlogState {
  blogs: Blog[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: BlogState = {
  blogs: [],
  status: "idle",
  error: null,
};

export const fetchBlogs = createAsyncThunk(
  "blogs/fetchBlogs",
  async (_, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return rejectWithValue(error.message);
    return data;
  }
);

export const createBlog = createAsyncThunk<
  Blog,
  { title: string; content: string },
  { state: RootState; rejectValue: string }
>(
  "blogs/createBlog",
  async ({ title, content }, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user || !user.id) {
      return rejectWithValue("Not authenticated or user has no ID");
    }
    const blogData = {
      title,
      content,
      user_id: user.id,
      email: user.email,
    };
    const { data, error } = await supabase
      .from("posts")
      .insert([blogData])
      .select()
      .single();
    if (error) {
      return rejectWithValue(error.message);
    }
    return data;
  }
);

export const updateBlog = createAsyncThunk(
  "blogs/updateBlog",
  async (
    { id, title, content }: { id: string; title: string; content: string },
    { rejectWithValue }
  ) => {
    const { data, error } = await supabase
      .from("posts")
      .update({ title, content })
      .eq("id", id)
      .select();
    if (error) return rejectWithValue(error.message);
    return data?.[0];
  }
);

export const deleteBlog = createAsyncThunk(
  "blogs/deleteBlog",
  async (id: string, { rejectWithValue }) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return rejectWithValue(error.message);
    return id;
  }
);

const blogSlice = createSlice({
  name: "blogs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.blogs = action.payload || [];
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        if (action.payload) state.blogs.unshift(action.payload);
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.blogs.findIndex((b) => b.id === action.payload.id);
          if (idx !== -1) state.blogs[idx] = action.payload;
        }
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.blogs = state.blogs.filter((b) => b.id !== action.payload);
      });
  },
});

export default blogSlice.reducer;