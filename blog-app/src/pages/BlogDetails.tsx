import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Blog } from "../app/blogSlice";

const BlogDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error)
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  if (!blog) return <div className="text-center mt-8">Blog not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link to="/blogs" className="text-blue-600 hover:underline">
        &larr; Back to Blogs
      </Link>
      <div className="bg-white p-6 rounded shadow mt-4">
        <h1 className="text-3xl font-bold mb-2">{blog.title}</h1>
        <p className="text-gray-700 whitespace-pre-line mb-4">{blog.content}</p>
        <div className="text-sm text-gray-500 mb-2">By: {blog.email}</div>
        <div className="text-xs text-gray-400">
          Created: {new Date(blog.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;