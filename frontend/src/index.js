import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize theme before rendering
try {
  const saved = localStorage.getItem("theme");
  const isDark = saved ? saved === "dark" : false;
  document.documentElement.classList.toggle("dark", isDark);
} catch {}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

