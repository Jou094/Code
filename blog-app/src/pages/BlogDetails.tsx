import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Blog } from "../app/blogSlice";
import Comments from "../components/Comments";

const BlogDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Helper to get public URL from Supabase storage path
  const getImageUrl = (path?: string) => {
    if (!path) return null;
    const { data } = supabase.storage.from("post-files").getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  // Fetch the blog post by ID
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

  // Update image URL whenever the blog changes
  useEffect(() => {
    if (blog?.image_path) {
      setImageUrl(getImageUrl(blog.image_path));
    }
  }, [blog]);


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

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Post attachment"
            className="mt-6 w-full max-h-[420px] object-contain rounded-lg border bg-gray-50"
          />
        )}

        <div className="text-xs text-gray-400">
          Created: {new Date(blog.created_at).toLocaleString()}
        </div>
      </div>
      <Comments postId={id!} />
    </div>
  );
};

export default BlogDetails;
