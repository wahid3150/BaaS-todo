import {
  CheckCircle2,
  LogOut,
  Loader,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  appwriteAccount,
  appwriteDatabases,
  appwriteStorage,
} from "../appwrite/config";
import { ID, Permission, Query, Role } from "appwrite";

const Dashboard = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const didFetch = useRef(false);

  // Get the database and collection IDs from env
  const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;
  const COLLECTION_ID = import.meta.env.VITE_APPWRITE_TODOS_COLLECTION_ID;
  const USERS_COLLECTION_ID = "users";
  const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;

  const getUserProfilePermissions = (userId) => [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];

  const getProfilePhotoPermissions = (userId) => [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];

  const getProfilePhotoUrl = (fileId) =>
    appwriteStorage.getFileView(BUCKET_ID, fileId);

  const fetchUserAndTodos = async () => {
    try {
      setLoading(true);
      setError("");

      // Get current user
      const currentUser = await appwriteAccount.get();
      setUser(currentUser);

      // Fetch user profile (with profile photo)
      await fetchUserProfile(currentUser);

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

  const fetchUserProfile = async (currentUser) => {
    try {
      // Check if user profile exists
      const response = await appwriteDatabases.listDocuments(
        DB_ID,
        USERS_COLLECTION_ID,
        [Query.equal("userId", currentUser.$id)],
      );

      if (response.documents.length > 0) {
        const profile = response.documents[0];
        setUserProfile(profile);

        // If profile has a photo, get the direct view URL
        if (profile.profilePhotoFileId) {
          setProfilePhoto(getProfilePhotoUrl(profile.profilePhotoFileId));
        }

        return profile;
      }

      return await createDefaultUserProfile(currentUser);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return await createDefaultUserProfile(currentUser);
    }
  };

  const createDefaultUserProfile = async (currentUser) => {
    try {
      const newProfile = await appwriteDatabases.createDocument(
        DB_ID,
        USERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: currentUser.$id,
          profilePhotoFileId: null,
          displayName: currentUser.name || "User",
        },
        getUserProfilePermissions(currentUser.$id),
      );
      setUserProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error("Error creating user profile:", err);
      setError(
        err.message ||
          "Unable to create your profile. Check the users collection permissions.",
      );
      return null;
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!user) {
      setError("You must be signed in before uploading a photo");
      return;
    }

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError("");

      const profile = userProfile || (await createDefaultUserProfile(user));

      if (!profile) {
        setError(
          "Unable to prepare your profile. Check the users collection create/update permissions.",
        );
        return;
      }

      // Delete old photo if it exists
      if (profile.profilePhotoFileId) {
        try {
          await appwriteStorage.deleteFile(
            BUCKET_ID,
            profile.profilePhotoFileId,
          );
        } catch (err) {
          console.error("Error deleting old photo:", err);
        }
      }

      // Upload new photo
      const uploadedFile = await appwriteStorage.createFile(
        BUCKET_ID,
        ID.unique(),
        file,
        getProfilePhotoPermissions(user.$id),
        (progress) => setUploadProgress(Math.round(progress.progress)),
      );

      // Update user profile with new file ID
      const updatedProfile = await appwriteDatabases.updateDocument(
        DB_ID,
        USERS_COLLECTION_ID,
        profile.$id,
        {
          profilePhotoFileId: uploadedFile.$id,
        },
      );

      setUserProfile(updatedProfile);

      setProfilePhoto(getProfilePhotoUrl(uploadedFile.$id));
    } catch (err) {
      console.error("Error uploading profile photo:", err);
      setError(err.message || "Failed to upload profile photo");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteProfilePhoto = async () => {
    if (!user || !userProfile || !userProfile.profilePhotoFileId) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError("");

      // Delete file from storage
      await appwriteStorage.deleteFile(
        BUCKET_ID,
        userProfile.profilePhotoFileId,
      );

      // Update profile to remove file ID
      const updatedProfile = await appwriteDatabases.updateDocument(
        DB_ID,
        USERS_COLLECTION_ID,
        userProfile.$id,
        {
          profilePhotoFileId: null,
        },
      );

      setUserProfile(updatedProfile);
      setProfilePhoto(null);
    } catch (err) {
      console.error("Error deleting profile photo:", err);
      setError(err.message || "Failed to delete profile photo");
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  // Fetch user and todos on component mount
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchUserAndTodos();
  }, []);

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

        {/* Profile Section */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile</h2>
          <div className="flex items-center gap-6">
            {/* Profile Photo */}
            <div className="relative">
              {profilePhoto ? (
                <div className="relative h-24 w-24">
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    onError={() => {
                      setProfilePhoto(null);
                      setError(
                        "The photo uploaded, but Appwrite is blocking image preview. Allow public read on the storage bucket or enable file security with read permission.",
                      );
                    }}
                    className="h-full w-full rounded-full border-4 border-blue-200 object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Delete profile photo"
                    onClick={handleDeleteProfilePhoto}
                    disabled={uploading}
                    className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center border-4 border-blue-100">
                  <span className="text-2xl font-bold text-blue-600">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info and Upload */}
            <div className="flex-1">
              <p className="mb-2 text-sm text-gray-600">Name</p>
              <p className="mb-4 text-lg font-semibold text-gray-900">
                {user?.name}
              </p>
              <p className="mb-2 text-sm text-gray-600">Email</p>
              <p className="mb-4 text-gray-700">{user?.email}</p>

              {/* Upload Button */}
              <label
                className={`inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition ${
                  uploading
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-blue-700"
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>
                  {uploading
                    ? `Uploading${uploadProgress ? ` ${uploadProgress}%` : "..."}`
                    : "Upload Photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

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
