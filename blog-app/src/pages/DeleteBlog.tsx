import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteBlog } from "../app/blogSlice";
import { supabase } from "../lib/supabase";
import type { Blog } from "../app/blogSlice";
import type { AppDispatch, RootState } from "../app/store";

const DeleteBlog: React.FC = () => {
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

  const handleDelete = async () => {
    if (id) {
      await dispatch(deleteBlog(String(id)));
      navigate("/blogs");
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
          <p className="mb-4">You can only delete your own blog posts.</p>
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
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Delete Blog</h2>
        <p>Are you sure you want to delete this blog?</p>
        <h3 className="text-lg font-semibold mt-4 mb-2">{blog.title}</h3>
        <p className="mb-4">{blog.content}</p>
        <div className="flex gap-4">
          <button
            onClick={handleDelete}
            className="px-4 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold border border-gray-300 shadow-sm"
          >
            Delete
          </button>
          <Link
            to="/blogs"
            className="px-4 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold border border-blue-300 shadow-sm"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DeleteBlog;