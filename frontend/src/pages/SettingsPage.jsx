import React, { useEffect, useState } from "react";

export default function SettingsPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const dark = saved ? saved === "dark" : false;
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    } catch (_) {}
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch (_) {}
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 py-6 text-black dark:text-gray-100">
      <div className="relative bg-white dark:bg-gray-800 border-2 border-black p-4 flex items-center justify-between">
        <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10"></div>
        <div>
          <div className="font-bold text-black dark:text-gray-100">Dark mode</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Toggle site appearance</div>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`relative inline-flex h-8 w-14 items-center border-2 border-black ${
            isDark ? "bg-blue-500" : "bg-white dark:bg-gray-900"
          }`}
          aria-label="Toggle dark mode"
        >
          <span
            className={`inline-block h-6 w-6 transform border-2 border-black bg-white dark:bg-gray-100 transition ${
              isDark ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}