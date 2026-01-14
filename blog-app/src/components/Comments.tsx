import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { supabase } from "../lib/supabase";
import {
  fetchCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  clearComments,
} from "../app/commentsSlice";

interface CommentsProps {
  postId: string;
}

const Comments: React.FC<CommentsProps> = ({ postId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { comments, status, error } = useSelector(
    (state: RootState) => state.comments
  );

  const [newComment, setNewComment] = useState("");
  const [newFile, setNewFile] = useState<File | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState<File | undefined>();
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Clear comments first to avoid showing wrong post's comments
    dispatch(clearComments());
    // Then fetch the correct comments
    dispatch(fetchCommentsByPost(postId));
  }, [dispatch, postId]); // Removed the cleanup - not needed since we clear on entry

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const result = await dispatch(
      createComment({ postId, content: newComment, file: newFile })
    );
    if (createComment.fulfilled.match(result)) {
      setNewComment("");
      setNewFile(undefined);
      const fileInput = document.getElementById("new-file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  const handleEdit = (commentId: string, currentContent: string, imagePath?: string) => {
    setEditingId(commentId);
    setEditContent(currentContent);
    setEditFile(undefined);
    setShouldRemoveImage(false);
    
    // Get existing image URL if available
    if (imagePath) {
      const { data } = supabase.storage
        .from("post-files")
        .getPublicUrl(imagePath);
      setExistingImageUrl(data?.publicUrl ?? null);
    } else {
      setExistingImageUrl(null);
    }
  };

  const handleUpdate = async (commentId: string, oldImagePath?: string) => {
    if (!editContent.trim()) return;

    const result = await dispatch(
      updateComment({ 
        id: commentId, 
        content: editContent,
        file: editFile,
        oldImagePath,
        shouldRemoveImage
      })
    );
    if (updateComment.fulfilled.match(result)) {
      setEditingId(null);
      setEditContent("");
      setEditFile(undefined);
      setShouldRemoveImage(false);
      setExistingImageUrl(null);
    }
  };

  const handleDelete = async (commentId: string, imagePath?: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await dispatch(deleteComment({ id: commentId, imagePath }));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditFile(undefined);
    setShouldRemoveImage(false);
    setExistingImageUrl(null);
  };

  const handleRemoveEditImage = () => {
    setEditFile(undefined);
    setExistingImageUrl(null);
    setShouldRemoveImage(true);
    const fileInput = document.getElementById(`edit-file-upload-${editingId}`) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    const { data } = supabase.storage.from("post-files").getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  if (status === "loading") {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px] bg-gray-50"
            required
          />
          
          {/* File Upload for New Comment */}
          <div className="flex items-center gap-4 mt-2">
            <input
              id="new-file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setNewFile(e.target.files?.[0])}
              className="hidden"
            />
            <label
              htmlFor="new-file-upload"
              className="cursor-pointer rounded-md bg-gray-600 px-4 py-2 text-white text-sm font-medium hover:bg-gray-700 transition"
            >
              {newFile ? "Change file" : "Add image"}
            </label>
            {newFile && (
              <span className="text-sm text-gray-600">{newFile.name}</span>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Post Comment
          </button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600">Please log in to comment</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white p-4 rounded-lg shadow border"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{comment.email}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                    {comment.updated_at !== comment.created_at && " (edited)"}
                  </p>
                </div>
                {user?.id === comment.user_id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(comment.id, comment.content, comment.image_path)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id, comment.image_path)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="mt-2">
                  <textarea
                    aria-label="Edit"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
                  />
                  
                  {/* File Upload for Edit */}
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-4">
                      <input
                        id={`edit-file-upload-${comment.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setEditFile(e.target.files?.[0]);
                          setExistingImageUrl(null);
                          setShouldRemoveImage(false);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor={`edit-file-upload-${comment.id}`}
                        className="cursor-pointer rounded-md bg-gray-600 px-3 py-1 text-white text-sm font-medium hover:bg-gray-700 transition"
                      >
                        {existingImageUrl || editFile ? "Change image" : "Add image"}
                      </label>
                      {editFile && (
                        <span className="text-sm text-gray-600">{editFile.name}</span>
                      )}
                    </div>

                    {/* Preview existing or new image */}
                    {(existingImageUrl || editFile) && (
                      <div className="relative border rounded-lg p-2 bg-gray-50 flex items-center justify-between">
                        {existingImageUrl && !editFile ? (
                          <img
                            src={existingImageUrl}
                            alt="Current attachment"
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : editFile ? (
                          <span className="text-sm text-gray-700">New image: {editFile.name}</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleRemoveEditImage}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(comment.id, comment.image_path)}
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-200 text-gray-700 px-4 py-1 rounded hover:bg-gray-300 transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mt-2 whitespace-pre-line">
                    {comment.content}
                  </p>
                  {comment.image_path && (
                    <img
                      src={getImageUrl(comment.image_path) || ""}
                      alt="Comment attachment"
                      className="mt-3 max-w-sm max-h-64 object-contain rounded-lg border"
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;