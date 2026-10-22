import axios from "axios";
import { isTokenValid, clearAuthSession } from "../utils/auth";
import { disconnectUserSocket } from "./socketService";

export const getApiBaseUrl = () => {
    const rawUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
    if (!rawUrl) {
        return "http://localhost:5000/api";
    }
    return rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
});

axios.defaults.baseURL = api.defaults.baseURL;

// 🔐 Attach and validate token automatically before request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            if (!isTokenValid(token)) {
                disconnectUserSocket();
                clearAuthSession();
                if (window.location.pathname !== "/login") {
                    window.location.replace("/login");
                }
                return Promise.reject(new Error("Token expired or unauthorized"));
            }
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// 🚨 Handle unauthorized responses and single-device logout enforcement
let isHandlingTermination = false;
let isRedirecting = false;

const handleUnauthorized = (error) => {
    if (error.response) {
        const status = error.response.status;
        const code = error.response.data?.code;
        const message = error.response.data?.message;
        const url = error.config?.url || "";

        const isAuthEndpoint =
            url.includes("/auth/login") ||
            url.includes("/auth/register");

        // 1. Single-device login enforcement: catch 401 where code === "SESSION_TERMINATED"
        if (status === 401 && code === "SESSION_TERMINATED" && !isAuthEndpoint) {
            if (!isHandlingTermination) {
                isHandlingTermination = true;

                // Disconnect socket and clear authentication state
                disconnectUserSocket();
                clearAuthSession();

                const logoutMessage =
                    message ||
                    "You have been logged out because your account was logged in from another device.";

                // Store message so the notification toast displays on /login
                sessionStorage.setItem("auth_toast", logoutMessage);
                sessionStorage.setItem("auth_toast_type", "error");

                // Redirect to /login
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
            return Promise.reject(error);
        }

        // 2. Generic unauthorized token handling
        const isUnauthorized =
            status === 401 ||
            (status === 403 && (message?.toLowerCase().includes("token") || message?.toLowerCase().includes("unauthorized") || message?.toLowerCase().includes("jwt")));

        if (isUnauthorized && !isAuthEndpoint) {
            disconnectUserSocket();
            clearAuthSession();

            // Store message for the user whose session was revoked
            const serverMsg = error.response.data?.message;
            const revokeToast =
                serverMsg ||
                "Your session was revoked from another device. Please sign in again.";

            sessionStorage.setItem("auth_toast", revokeToast);
            sessionStorage.setItem("auth_toast_type", "error");

            if (!isRedirecting && window.location.pathname !== "/login") {
                isRedirecting = true;
                window.location.replace("/login");
            }
        }
    }

    return Promise.reject(error);
};

// Attach interceptor to custom api instance as well as global axios instance
api.interceptors.response.use((response) => response, handleUnauthorized);
axios.interceptors.response.use((response) => response, handleUnauthorized);

export default api;

