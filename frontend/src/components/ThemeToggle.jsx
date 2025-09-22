import React, { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const dark = saved ? saved === "dark" : false;
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    } catch {}
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10"></div>
      <button
        onClick={toggle}
        className={`px-3 py-2 border-2 border-black font-bold uppercase tracking-wide transition-colors
          bg-white text-black hover:bg-yellow-300
          dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800`}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {isDark ? "Light" : "Dark"}
      </button>
    </div>
  );
}
