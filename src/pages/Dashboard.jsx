import { Plus, Trash2, CheckCircle2, LogOut, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appwriteAccount, appwriteDatabases } from "../appwrite/config";
import { ID, Query } from "appwrite";

const Dashboard = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Get the database and collection IDs from env
  const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;
  const COLLECTION_ID = import.meta.env.VITE_APPWRITE_TODOS_COLLECTION_ID;

  // Fetch user and todos on component mount
  useEffect(() => {
    fetchUserAndTodos();
  }, []);

  const fetchUserAndTodos = async () => {
    try {
      setLoading(true);
      setError("");

      // Get current user
      const currentUser = await appwriteAccount.get();
      setUser(currentUser);

      // Fetch todos for this user
      await fetchTodos(currentUser.$id);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load todos");
      // Redirect to login if not authenticated
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchTodos = async (userId) => {
    try {
      const response = await appwriteDatabases.listDocuments(
        DB_ID,
        COLLECTION_ID,
        [Query.equal("userId", userId)],
      );
      setTodos(response.documents);
    } catch (err) {
      console.error("Error fetching todos:", err);
      setError("Failed to load todos");
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      // Delete the current session from Appwrite
      await appwriteAccount.deleteSession("current");
      console.log("Logged out successfully");
      // Redirect to home page
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      // Redirect to home anyway
      navigate("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleAddTodo = async () => {
    if (!input.trim()) return;
    if (!user) return;

    try {
      setSubmitting(true);
      setError("");

      // Create new todo in Appwrite
      const newTodo = await appwriteDatabases.createDocument(
        DB_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          title: input.trim(),
          completed: false,
          userId: user.$id,
        },
      );

      // Add to local state
      setTodos([...todos, newTodo]);
      setInput("");
    } catch (err) {
      console.error("Error adding todo:", err);
      setError("Failed to add todo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTodo = async (todoId, currentCompleted) => {
    if (!user) return;

    try {
      // Update in Appwrite
      const updatedTodo = await appwriteDatabases.updateDocument(
        DB_ID,
        COLLECTION_ID,
        todoId,
        {
          completed: !currentCompleted,
        },
      );

      // Update local state
      setTodos(todos.map((todo) => (todo.$id === todoId ? updatedTodo : todo)));
    } catch (err) {
      console.error("Error updating todo:", err);
      setError("Failed to update todo");
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (!user) return;

    try {
      // Delete from Appwrite
      await appwriteDatabases.deleteDocument(DB_ID, COLLECTION_ID, todoId);

      // Remove from local state
      setTodos(todos.filter((todo) => todo.$id !== todoId));
    } catch (err) {
      console.error("Error deleting todo:", err);
      setError("Failed to delete todo");
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="border-b border-blue-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
              </div>
              {user && (
                <p className="text-sm text-gray-500">Welcome, {user.name}!</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-5 w-5" />
              <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-3xl font-bold text-gray-900">{todos.length}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 shadow-md">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {completedCount}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 shadow-md">
            <p className="text-sm text-blue-600">Pending</p>
            <p className="text-3xl font-bold text-blue-600">
              {todos.length - completedCount}
            </p>
          </div>
        </div>

        {/* Add Todo */}
        <div className="mb-8 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
            placeholder="Add a new task..."
            disabled={submitting}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition duration-150 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
          />
          <button
            onClick={handleAddTodo}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            <span className="hidden sm:inline">
              {submitting ? "Adding..." : "Add"}
            </span>
          </button>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-gray-400" />
              <p className="text-gray-500">
                No tasks yet. Add one to get started!
              </p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.$id}
                className="group flex items-center gap-3 rounded-lg bg-white p-4 shadow-md transition hover:shadow-lg"
              >
                <button
                  onClick={() => handleToggleTodo(todo.$id, todo.completed)}
                  className={`flex-shrink-0 rounded-full p-1 transition ${
                    todo.completed
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  <CheckCircle2 className="h-6 w-6" />
                </button>
                <span
                  className={`flex-1 text-lg ${
                    todo.completed
                      ? "line-through text-gray-400"
                      : "text-gray-900"
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => handleDeleteTodo(todo.$id)}
                  className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
