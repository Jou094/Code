import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { createBlog } from "../app/blogSlice"; 
import { supabase } from "../lib/supabase";

interface BlogFormProps {
  initialTitle?: string;
  initialContent?: string;
  initialFile?: File;
  initialImagePath?: string;
  onSuccess?: () => void;
  isEdit?: boolean;
  onSubmitEdit?: (title: string, content: string, file?: File) => void;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}

const BlogForm: React.FC<BlogFormProps> = ({
  initialTitle = "",
  initialContent = "",
  initialFile= undefined,
  initialImagePath,
  onSuccess,
  isEdit = false,
  onSubmitEdit,
  onCreated,
  onCancel,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [ file, setFile ] = useState(initialFile);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const { status, error } = useSelector((state: RootState) => state.blog);

  React.useEffect(() => {
    if (initialImagePath) {
      const { data } = supabase.storage
        .from("post-files")
        .getPublicUrl(initialImagePath);
      setExistingImageUrl(data?.publicUrl ?? null);
    }
  }, [initialImagePath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && onSubmitEdit) {
      onSubmitEdit(title, content, file);
    } else {
      const result = await dispatch(createBlog({ title, content, file: file, }));
      if (createBlog.fulfilled.match(result)) {
        setTitle("");
        setContent("");
        setFile(undefined);
        if (onSuccess) onSuccess();
        let blogId: string | undefined;
        if (result.payload) {
          if (Array.isArray(result.payload) && result.payload[0]?.id) {
            blogId = result.payload[0].id;
          } else if (
            typeof result.payload === "object" &&
            "id" in result.payload
          ) {
            blogId = (result.payload as { id: string }).id;
          }
        }
        if (onCreated && blogId) onCreated(blogId);
      }
      // Only log error if present
      if ("error" in result && result.error) {
        console.error("Blog creation error:", result.error);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Clear the existing image preview when a new file is selected
      setExistingImageUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(undefined);
    setExistingImageUrl(null);
    // Reset the file input
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-8 rounded-2xl shadow-lg max-w-xl mx-auto"
    >
      <h2 className="text-2xl font-extrabold mb-6 text-center text-blue-700 tracking-tight">
        {isEdit ? "Edit Blog" : "Create Blog"}
      </h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px] bg-gray-50"
      />
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
          >
            {existingImageUrl || file ? "Change file" : "Choose file"}
          </label>
          <span className="text-sm text-gray-600">
            {file ? file.name : existingImageUrl ? "Existing image" : "No file chosen"}
          </span>
        </div>

        {(existingImageUrl || file) && (
          <div className="relative border rounded-lg p-3 bg-gray-50">
            <div className="flex items-start gap-3">
              {existingImageUrl && !file ? (
                <img
                  src={existingImageUrl}
                  alt="Current attachment"
                  className="w-24 h-24 object-cover rounded"
                />
              ) : file ? (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">New file selected</p>
                    <p className="text-xs text-gray-500">{file.name}</p>
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 shadow"
        >
          {isEdit
            ? "Update Blog"
            : status === "loading"
            ? "Creating..."
            : "Create Blog"}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Cancel
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-center font-medium">{error}</p>}
    </form>
  );
};

export default BlogForm;