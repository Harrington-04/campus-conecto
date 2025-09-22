import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import ProfileCreationPage from "./pages/ProfileCreationPage";
import HomePage from "./pages/HomePage";
import ResourcesPage from "./pages/ResourcesPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import MessagesPage from "./pages/MessagesPage";
import FindFriendsPage from "./pages/FindFriendsPage";
import Layout from "./pages/Layoutt"; // ✅ check spelling
import "./index.css";

function App() {
  const isAuthenticated = () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    return Boolean(token);
  };

  const isProfileCreated = () => {
    return (
      (sessionStorage.getItem("profileCreated") || localStorage.getItem("profileCreated")) === "true"
    );
  };

  const CreateProfileRoute = () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const created = isProfileCreated();

    if (!token) return <Navigate to="/login" replace />;
    if (created) return <Navigate to="/home" replace />;
    return <ProfileCreationPage />;
  };

  const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const created = isProfileCreated();

    if (!token) return <Navigate to="/login" replace />;
    if (!created) return <Navigate to="/create-profile" replace />;
    return children;
  };

  // Redirect authenticated users away from public routes
  const PublicOnlyRoute = ({ children }) => {
    if (isAuthenticated() && isProfileCreated()) {
      return <Navigate to="/home" replace />;
    }
    return children;
  };

  const NotFound = () => (
    <div className="flex items-center justify-center h-screen shapes-bg">
      <div className="text-center p-8 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border-2 border-black">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Route Not Found</h1>
        <p className="text-gray-700 dark:text-gray-200 mb-4">The page you're looking for doesn't exist.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Current path: {window.location.pathname}</p>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />

        {/* Profile creation route */}
        <Route path="/create-profile" element={<CreateProfileRoute />} />

        {/* Protected routes with Layout + nested children */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/find-friends" element={<FindFriendsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
