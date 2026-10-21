import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isTokenValid, clearAuthSession } from "../utils/auth";

const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (!token || !isTokenValid(token)) {
        clearAuthSession();
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
