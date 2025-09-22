import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    socket.disconnect();
    navigate("/", { replace: true });
  };

  return (
    <div className="h-screen w-screen grid grid-cols-12 bg-gray-50 dark:bg-gray-950 text-black dark:text-gray-100 shapes-bg">
      {/* Sidebar (fixed, full height) */}
      <aside className="col-span-3 border-r-2 border-black px-4 py-6 flex flex-col space-y-4 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
        {/* Title Box */}
        <div className="border-2 border-black p-3 text-center bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm">
          <h1 className="text-lg font-bold text-black dark:text-gray-100">CAMPUS CONECTO</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-grow flex flex-col space-y-3">
          <Link
            to="/home"
            className={`block p-3 font-bold text-center border-2 border-black ${
              isActive("/home")
                ? "bg-blue-500 text-white"
                : "bg-white text-black hover:bg-yellow-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Home
          </Link>
          <Link
            to="/profile"
            className={`block p-3 font-bold text-center border-2 border-black ${
              isActive("/profile")
                ? "bg-blue-500 text-white"
                : "bg-white text-black hover:bg-yellow-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Profile
          </Link>
          <Link
            to="/messages"
            className={`block p-3 font-bold text-center border-2 border-black ${
              isActive("/messages")
                ? "bg-blue-500 text-white"
                : "bg-white text-black hover:bg-yellow-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Messages
          </Link>
          <Link
            to="/resources"
            className={`block p-3 font-bold text-center border-2 border-black ${
              isActive("/resources")
                ? "bg-yellow-400 text-black dark:text-black"
                : "bg-white text-black hover:bg-yellow-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Resources
          </Link>
          <Link
            to="/find-friends"
            className={`block p-3 font-bold text-center border-2 border-black ${
              isActive("/find-friends")
                ? "bg-blue-500 text-white"
                : "bg-white text-black hover:bg-yellow-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Find Friends
          </Link>
          <Link
            to="/settings"
            className={`block p-3 font-bold text-center border-2 border-black ${
              isActive("/settings")
                ? "bg-blue-500 text-white"
                : "bg-white text-black hover:bg-yellow-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Settings
          </Link>
        </nav>

        {/* Logout button at bottom */}
        <button
          onClick={handleLogout}
          className="mt-auto block w-full p-3 font-bold text-center border-2 border-black bg-white text-black hover:bg-red-500 hover:text-white dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-red-600"
        >
          Logout
        </button>
      </aside>

      {/* Main Content (scrollable, fixed height) */}
      <main className="col-span-9 h-screen overflow-y-auto px-6 py-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
        <Outlet />
      </main>
    </div>
  );
}
