import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { login } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";

// Action to clear error in authSlice
const clearAuthError = () => ({ type: "auth/clearError" });

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { status, error } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "succeeded" && !error) {
      navigate("/account");
    }
  }, [status, error, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(login({ email, password }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-extrabold mb-8 text-blue-700 text-center">
        Blog App
      </h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && (
          <div className="mb-4 text-red-600 text-center text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                dispatch(clearAuthError());
              }}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                dispatch(clearAuthError());
              }}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold disabled:opacity-60"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm">
          New to Blog App?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;