import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  // Check for a token in local or session storage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // If a token exists (meaning the user is logged in), redirect them to the home page.
  // If not, allow them to see the public route (e.g., the login page).
  return token ? <Navigate to="/home" replace /> : <Outlet />;
};

export default PublicRoute;
