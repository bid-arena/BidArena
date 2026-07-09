import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Direct unauthorized role-specific redirect to prevent cross-portal access
        if (user.role === "ORGANIZER") {
            return <Navigate to="/organizer-dashboard" replace />;
        } else if (user.role === "TEAM_OWNER") {
            return <Navigate to="/owner-dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
