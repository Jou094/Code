import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "./app/store";
import { logout } from "./features/auth/authSlice";
import { fetchBlogs } from "./app/blogSlice";
import Register from "./pages/Register";
import Login from "./pages/Login";
import DeleteBlog from "./pages/DeleteBlog";
import UpdateBlog from "./pages/UpdateBlog";
import CreateBlog from "./pages/CreateBlog";
import BlogDetails from "./pages/BlogDetails";
import { fetchCommentCounts, selectCommentCountByPost } from "./app/commentsSlice";

const Account: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { blogs } = useSelector((state: RootState) => state.blog);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  // Get user's own blogs
  const userBlogs = blogs.filter((b) => b.user_id === user?.id && b.id);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-10 text-center">
        <h2 className="text-3xl font-extrabold mb-6 text-blue-700 tracking-tight">
          Account Page
        </h2>
        <p className="text-lg mb-8 text-gray-700">
          Welcome,{" "}
          <span className="font-semibold text-blue-600">{user?.email}</span>!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/blogs"
            className="block p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
          >
            <h3 className="text-xl font-semibold text-blue-700 mb-2">
              View All Blogs
            </h3>
            <p className="text-gray-600">See all blog posts from everyone</p>
          </Link>

          <Link
            to="/blogs/create"
            className="block p-6 bg-green-50 rounded-xl hover:bg-green-100 transition"
          >
            <h3 className="text-xl font-semibold text-green-700 mb-2">
              Create New Blog
            </h3>
            <p className="text-gray-600">Write and publish a new blog post</p>
          </Link>
        </div>

        {/* My Blogs Section */}
        <div className="text-left">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">
            My Blogs ({userBlogs.length})
          </h3>
          {userBlogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              You haven't created any blogs yet.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {userBlogs.slice(0, 5).map((blog) => (
                <div key={blog.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {blog.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {blog.content.length > 100
                          ? `${blog.content.substring(0, 100)}...`
                          : blog.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Created:{" "}
                        {new Date(blog.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link to={`/blogs/update/${blog.id}`}>
                        <button className="px-4 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold border border-blue-300 shadow-sm">
                          Edit
                        </button>
                      </Link>
                      <Link to={`/blogs/delete/${blog.id}`}>
                        <button className="px-4 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold border border-gray-300 shadow-sm">
                          Delete
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {userBlogs.length > 5 && (
                <p className="text-center text-gray-500 text-sm">
                  Showing 5 of {userBlogs.length} blogs.
                  <Link
                    to="/blogs"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    View all
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-8 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-semibold shadow"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { user } = useSelector((state: RootState) => state.auth);
  return user ? children : <Navigate to="/login" replace />;
}

const Blogs: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { blogs, status } = useSelector((state: RootState) => state.blog);
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const BLOGS_PER_PAGE = 4;

  // Fetch blogs on mount
  useEffect(() => {
    dispatch(fetchBlogs());
  }, [dispatch]);

  // Fetch comment counts when blogs are loaded
  useEffect(() => {
    const allBlogs = blogs.filter((b) => b.id);
    if (allBlogs.length > 0) {
      const postIds = allBlogs.map(blog => blog.id);
      dispatch(fetchCommentCounts(postIds));
    }
  }, [dispatch, blogs.length]);

  // Add logout handler for the blogs navbar
  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  // Show all blogs from all users
  const allBlogs = blogs.filter((b) => b.id);
  const totalPages = Math.ceil(allBlogs.length / BLOGS_PER_PAGE);
  const paginatedBlogs = allBlogs.slice(
    (page - 1) * BLOGS_PER_PAGE,
    page * BLOGS_PER_PAGE
  );

  return (
    <>
      {/* Custom navbar for blogs page */}
      <nav className="bg-white shadow-lg mb-12 p-6 flex items-center justify-between relative rounded-b-2xl">
        <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-gray-800">
          Blog App
        </span>
        <div className="flex gap-4 ml-auto">
          <Link
            to="/account"
            className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg shadow hover:bg-blue-50 font-semibold transition"
          >
            My Account
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition font-semibold shadow"
          >
            Logout
          </button>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex justify-end mb-8">
          <Link to="/blogs/create">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold shadow">
              Create Blog
            </button>
          </Link>
        </div>
        <h1 className="text-3xl font-extrabold mb-10 text-center text-blue-700 tracking-tight">
          All Blogs
        </h1>
        <div className="mt-8 space-y-6">
          {status === "loading" && (
            <p className="text-center text-lg text-blue-600">Loading...</p>
          )}
          {allBlogs.length === 0 && (
            <p className="text-center text-gray-500">No blogs yet.</p>
          )}
          {paginatedBlogs.map((blog, index) => (
            <BlogCard key={blog.id || `temp-${index}`} blog={blog} user={user} />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 rounded-lg border font-semibold ${
                  page === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border-blue-600"
                } hover:bg-blue-700 hover:text-white transition`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// Separate BlogCard component to use the selector properly
const BlogCard: React.FC<{ blog: any; user: any }> = ({ blog, user }) => {
  const commentCount = useSelector((state: RootState) => 
    selectCommentCountByPost(state, blog.id)
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-2 transition hover:shadow-lg">
      <div className="flex gap-2">
        <Link
          to={`/blogs/${blog.id}`}
          className="px-4 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold border border-blue-300 shadow-sm"
        >
          View
        </Link>
      </div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-blue-800">{blog.title}</h2>
        {/* Only show edit/delete buttons if user is the author */}
        {blog.user_id === user?.id && (
          <div className="flex gap-2">
            <Link to={`/blogs/update/${blog.id}`}>
              <button className="px-4 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold border border-blue-300 shadow-sm">
                Edit
              </button>
            </Link>
            <Link to={`/blogs/delete/${blog.id}`}>
              <button className="px-4 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold border border-gray-300 shadow-sm">
                Delete
              </button>
            </Link>
          </div>
        )}
      </div>
      <p className="text-gray-700 mb-2">{blog.content}</p>
      {blog.image_path && (
        <div className="mb-2">
          <img
            src={`https://hhlbfsrrjopwzmzmeltr.supabase.co/storage/v1/object/public/post-files/${blog.image_path}`}
            alt=""
            className="w-full max-h-[300px] object-contain rounded-lg border bg-gray-50"
          />
        </div>
      )}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>By: {blog.email}</span>
        <div className="flex items-center gap-4">
          <span>Created: {new Date(blog.created_at).toLocaleString()}</span>
          {/* Comment Count Display */}
          <div className="flex items-center gap-1 text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium">{commentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { user } = useSelector((state: RootState) => state.auth);
  return (
    <Router>
      <Routes>
        <Route
          key="home"
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <h1 className="text-4xl font-bold mb-8">Blog App</h1>
                {/* Home page content for logged-in users can go here */}
              </div>
            )
          }
        />
        <Route key="register" path="/register" element={<Register />} />
        <Route key="login" path="/login" element={<Login />} />
        <Route
          key="account"
          path="/account"
          element={
            <PrivateRoute>
              <Account />
            </PrivateRoute>
          }
        />
        <Route
          key="blogs"
          path="/blogs"
          element={
            <PrivateRoute>
              <Blogs />
            </PrivateRoute>
          }
        />
        <Route
          key="blog-details"
          path="/blogs/:id"
          element={
            <PrivateRoute>
              <BlogDetails />
            </PrivateRoute>
          }
        />
        <Route
          key="create-blog"
          path="/blogs/create"
          element={
            <PrivateRoute>
              <CreateBlog />
            </PrivateRoute>
          }
        />
        <Route
          key="update-blog"
          path="/blogs/update/:id"
          element={
            <PrivateRoute>
              <UpdateBlog />
            </PrivateRoute>
          }
        />
        <Route
          key="delete-blog"
          path="/blogs/delete/:id"
          element={
            <PrivateRoute>
              <DeleteBlog />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;