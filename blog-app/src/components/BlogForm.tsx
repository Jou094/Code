import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { createBlog } from "../app/blogSlice"; 

interface BlogFormProps {
  initialTitle?: string;
  initialContent?: string;
  initialFile?: File;
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
  const { status, error } = useSelector((state: RootState) => state.blog);


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
      <div className="flex items-center gap-4">
  <input
    id="file-upload"
    type="file"
    accept="image/*"
    onChange={(e) => setFile(e.target.files?.[0])}
    className="hidden"
  />
  <label
    htmlFor="file-upload"
    className="
      cursor-pointer
      rounded-md
      bg-blue-600
      px-4
      py-2
      text-white
      font-medium
      hover:bg-blue-700
      transition
    "
  >
    Choose file
    
  </label>
  <span className="text-sm text-gray-600">
    {file ? file.name : 'No file chosen'}
    
  </span>
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