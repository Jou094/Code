import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../lib/supabase";
import type { RootState } from "./store";

export interface Blog {
  id: string;
  title: string;
  content: string;
  user_id: string;
  email: string;
  image_path?: string;
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
  { title: string; content: string; file?: File },
  { state: RootState; rejectValue: string }
>(
  "blogs/createBlog",
  async ({ title, content, file }, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user || !user.id) {
      return rejectWithValue("Not authenticated or user has no ID");
    }

    let image_path: string | null = null
    if (file) {
      // store only the path
      image_path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("post-files")
        .upload(image_path, file);
      if (uploadError) return rejectWithValue(uploadError.message);
    }
      
    const blogData = {
      title,
      content,
      user_id: user.id,
      email: user.email,
      image_path,
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
    {
      id,
      title,
      content,
      file,
      oldImagePath,
    }: {
      id: string;
      title: string;
      content: string;
      file?: File;
      oldImagePath?: string | null;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { user } = (getState() as RootState).auth;
      if (!user || !user.id) {
        return rejectWithValue("Not authenticated");
      }

      let newImagePath = oldImagePath ?? null;

      if (file) {
        // Use user.id consistently, just like in createBlog
        const filePath = `${user.id}/${Date.now()}-${file.name}`;

        // Delete old image FIRST if it exists
        if (oldImagePath) {
          await supabase.storage
            .from("post-files")
            .remove([oldImagePath])
            .catch(() => {}); // ignore if not found
        }

        // Then upload the new file
        const { error: uploadError } = await supabase.storage
          .from("post-files")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return rejectWithValue(uploadError.message);
        }

        newImagePath = filePath;
      }

      // Update the post
      const { data, error } = await supabase
        .from("posts")
        .update({ title, content, image_path: newImagePath })
        .eq("id", id)
        .select()
        .single();

      if (error) return rejectWithValue(error.message);

      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
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

export const selectAllBlogs = (state: RootState) => state.blog.blogs;
export const getPostsStatus = (state: RootState) => state.blog.status;
export const getPostsError = (state: RootState) => state.blog.error;

export const selectBlogById = (state: RootState, blogId: string) =>
  state.blog.blogs.find((blog) => blog.id === blogId);

export default blogSlice.reducer;