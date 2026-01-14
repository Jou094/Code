import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../lib/supabase";
import type { RootState } from "./store";

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  email: string;
  image_path?: string;
  created_at: string;
  updated_at: string;
}

interface CommentState {
  comments: Comment[];
  commentCounts: Record<string, number>; // Store counts per post
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CommentState = {
  comments: [],
  commentCounts: {},
  status: "idle",
  error: null,
};

// Fetch all comments for a specific post
export const fetchCommentsByPost = createAsyncThunk(
  "comments/fetchCommentsByPost",
  async (postId: string, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    
    if (error) return rejectWithValue(error.message);
    return data;
  }
);

// Fetch comment counts for multiple posts
export const fetchCommentCounts = createAsyncThunk(
  "comments/fetchCommentCounts",
  async (postIds: string[], { rejectWithValue }) => {
    try {
      const counts: Record<string, number> = {};
      
      // Fetch counts for each post
      for (const postId of postIds) {
        const { count, error } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        
        if (error) throw error;
        counts[postId] = count || 0;
      }
      
      return counts;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Create a new comment
export const createComment = createAsyncThunk<
  Comment,
  { postId: string; content: string; file?: File },
  { state: RootState; rejectValue: string }
>(
  "comments/createComment",
  async ({ postId, content, file }, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user || !user.id) {
      return rejectWithValue("Not authenticated");
    }

    let image_path: string | null = null;
    if (file) {
      // Simpler path format that matches your blog posts
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      image_path = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("post-files")
        .upload(image_path, file, {
          cacheControl: "3600",
          upsert: false
        });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        return rejectWithValue(uploadError.message);
      }
    }

    const commentData = {
      content,
      post_id: postId,
      user_id: user.id,
      email: user.email,
      image_path,
    };

    const { data, error } = await supabase
      .from("comments")
      .insert([commentData])
      .select()
      .single();

    if (error) return rejectWithValue(error.message);
    return data;
  }
);

// Update a comment
export const updateComment = createAsyncThunk(
  "comments/updateComment",
  async (
    { 
      id, 
      content, 
      file, 
      oldImagePath,
      shouldRemoveImage 
    }: { 
      id: string; 
      content: string;
      file?: File;
      oldImagePath?: string | null;
      shouldRemoveImage?: boolean;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { user } = (getState() as RootState).auth;
      if (!user || !user.id) {
        return rejectWithValue("Not authenticated");
      }

      let newImagePath = oldImagePath ?? null;

      // If user explicitly wants to remove the image
      if (shouldRemoveImage) {
        if (oldImagePath) {
          await supabase.storage
            .from("post-files")
            .remove([oldImagePath])
            .catch(() => {});
        }
        newImagePath = null;
      }
      // If user uploaded a new file
      else if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Delete old image if it exists
        if (oldImagePath) {
          await supabase.storage
            .from("post-files")
            .remove([oldImagePath])
            .catch(() => {});
        }

        // Upload new file
        const { error: uploadError } = await supabase.storage
          .from("post-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return rejectWithValue(uploadError.message);
        }

        newImagePath = filePath;
      }

      const { data, error } = await supabase
        .from("comments")
        .update({ 
          content, 
          image_path: newImagePath,
          updated_at: new Date().toISOString() 
        })
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

// Delete a comment
export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async (
    { id, imagePath }: { id: string; imagePath?: string | null },
    { rejectWithValue }
  ) => {
    // Delete image from storage if it exists
    if (imagePath) {
      await supabase.storage
        .from("post-files")
        .remove([imagePath])
        .catch(() => {});
    }

    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) return rejectWithValue(error.message);
    return id;
  }
);

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearComments: (state) => {
      state.comments = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchCommentsByPost.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCommentsByPost.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.comments = action.payload || [];
      })
      .addCase(fetchCommentsByPost.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // Fetch comment counts
      .addCase(fetchCommentCounts.fulfilled, (state, action) => {
        state.commentCounts = action.payload;
      })
      // Create comment
      .addCase(createComment.fulfilled, (state, action) => {
        if (action.payload) {
          state.comments.unshift(action.payload);
          // Update count for this post
          const postId = action.payload.post_id;
          state.commentCounts[postId] = (state.commentCounts[postId] || 0) + 1;
        }
      })
      // Update comment
      .addCase(updateComment.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.comments.findIndex((c) => c.id === action.payload.id);
          if (idx !== -1) state.comments[idx] = action.payload;
        }
      })
      // Delete comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        const deletedComment = state.comments.find((c) => c.id === action.payload);
        state.comments = state.comments.filter((c) => c.id !== action.payload);
        // Update count for this post
        if (deletedComment) {
          const postId = deletedComment.post_id;
          state.commentCounts[postId] = Math.max(0, (state.commentCounts[postId] || 0) - 1);
        }
      });
  },
});

export const { clearComments } = commentSlice.actions;

export const selectAllComments = (state: RootState) => state.comments.comments;
export const getCommentsStatus = (state: RootState) => state.comments.status;
export const getCommentsError = (state: RootState) => state.comments.error;
export const selectCommentCounts = (state: RootState) => state.comments.commentCounts;
export const selectCommentCountByPost = (state: RootState, postId: string) => 
  state.comments.commentCounts[postId] || 0;

export default commentSlice.reducer;