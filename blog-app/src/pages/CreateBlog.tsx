import React from "react";
import { useNavigate } from "react-router-dom";
import BlogForm from "../components/BlogForm";

const CreateBlog: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto py-8">
      <BlogForm onSuccess={() => navigate("/blogs")} />
    </div>
  );
};

export default CreateBlog;