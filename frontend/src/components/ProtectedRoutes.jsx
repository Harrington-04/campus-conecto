import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check for a token in local or session storage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  console.log("ProtectedRoute - Token exists:", !!token);
  console.log("ProtectedRoute - Current path:", window.location.pathname);

  // If a token exists, allow access to the nested routes (Outlet).
  // If not, redirect the user to the login page.
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;