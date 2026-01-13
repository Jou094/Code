import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BlogForm from "../components/BlogForm";
import { supabase } from "../lib/supabase";
import type { Blog } from "../app/blogSlice";
import { useDispatch, useSelector } from "react-redux";
import { updateBlog } from "../app/blogSlice";
import type { AppDispatch, RootState } from "../app/store";

const UpdateBlog: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) setError(error.message);
      else setBlog(data);
      setLoading(false);
    };
    fetchBlog();
  }, [id]);

  const handleEdit = async (title: string, content: string, file?: File, shouldRemoveImage?: boolean) => {
    if (!id || !blog) return;

    console.log("UpdateBlog - handleEdit called:", { 
    hasFile: !!file, 
    shouldRemoveImage,
    oldImagePath: blog.image_path 
  });
  
    const result = await dispatch(
      updateBlog({ id: String(id), title, content, file, oldImagePath: blog.image_path, shouldRemoveImage })
    );
    if (updateBlog.fulfilled.match(result)) {
      navigate("/blogs");
    } else if (result.error) {
      setError(result.error.message || "Failed to update blog");
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error)
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  if (!blog) return <div className="text-center mt-8">Blog not found.</div>;

  // Check if current user is the author
  if (blog.user_id !== user?.id) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white p-6 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">Access Denied</h2>
          <p className="mb-4">You can only edit your own blog posts.</p>
          <button
            onClick={() => navigate("/blogs")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <BlogForm
        isEdit
        initialTitle={blog.title}
        initialContent={blog.content}
        initialImagePath={blog.image_path}
        onSubmitEdit={handleEdit}
        onCancel={() => navigate("/blogs")}
      />
    </div>
  );
};

export default UpdateBlog;