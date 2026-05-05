import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Mail, Lock, CheckCircle2 } from "lucide-react";
import { appwriteAccount } from "../appwrite/config";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || "",
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (location.state?.message) {
      // Clear message from history state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Delete any existing session first
      try {
        await appwriteAccount.deleteSession("current");
      } catch {
        // No existing session, that's fine
        console.log("No existing session to delete");
      }

      // Create email/password session with Appwrite
      await appwriteAccount.createEmailPasswordSession(
        formData.email,
        formData.password,
      );
      console.log("Login successful");

      // Clear success message and redirect to dashboard
      setSuccessMessage("");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message || "Failed to sign in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-2xl bg-white p-8 shadow-xl ring-1 ring-blue-100 sm:p-10">
          <div className="mb-8 flex justify-center">
            <CheckCircle2 className="h-10 w-10 text-blue-600" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Welcome Back
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
              Sign in to your account to manage your todos.
            </p>
          </div>

          {successMessage && (
            <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 shadow-sm transition duration-150 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Password
                </span>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 shadow-sm transition duration-150 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter your password"
                  />
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-150 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
