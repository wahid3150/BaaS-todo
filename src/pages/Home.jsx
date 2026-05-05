import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Zap } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="border-b border-blue-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                BaaS Todo
              </span>
            </div>
            <div className="flex gap-4">
              <Link
                to="/login"
                className="rounded-lg px-5 py-2 text-gray-700 transition hover:bg-gray-100"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
        <div className="text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Manage Your Tasks Effortlessly
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl">
            A modern todo application powered by Appwrite. Stay organized, boost
            productivity, and never miss a task again.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-blue-200 px-8 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl bg-white p-8 shadow-md hover:shadow-lg transition">
            <CheckCircle2 className="mb-4 h-10 w-10 text-blue-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Easy Task Management
            </h3>
            <p className="text-gray-600">
              Create, update, and organize your todos with an intuitive
              interface.
            </p>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-md hover:shadow-lg transition">
            <Clock className="mb-4 h-10 w-10 text-blue-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Real-time Sync
            </h3>
            <p className="text-gray-600">
              Your tasks sync instantly across all your devices in real-time.
            </p>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-md hover:shadow-lg transition">
            <Zap className="mb-4 h-10 w-10 text-blue-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Secure & Fast
            </h3>
            <p className="text-gray-600">
              Built on Appwrite backend with enterprise-grade security and
              speed.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-blue-200 bg-white/50 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-gray-600">
          <p>&copy; 2026 BaaS Todo. Powered by Appwrite.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
