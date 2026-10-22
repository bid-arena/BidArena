import { io } from "socket.io-client";
import { clearAuthSession } from "../utils/auth";

let userSocket = null;
let isForceLoggingOut = false;

/**
 * Resolves the Socket.IO server URL based on environment or default.
 */
export const getSocketUrl = () => {
    const rawUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
    if (rawUrl) {
        return rawUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
    }
    return "http://localhost:5000";
};

/**
 * Initializes and authenticates the global Socket.IO connection for the logged-in user.
 * Listens for the "force-logout" event emitted when the user logs in from another device.
 * @param {string} token - JWT authentication token
 * @returns {import("socket.io-client").Socket|null}
 */
export const initUserSocket = (token) => {
    if (!token) return null;

    // Reset logout guard for newly initialized connection
    isForceLoggingOut = false;

    // If already connected with the same instance, return existing socket
    if (userSocket && userSocket.connected) {
        return userSocket;
    }

    // Disconnect any existing disconnected socket before recreating
    if (userSocket) {
        try {
            userSocket.disconnect();
        } catch {
            // ignore
        }
    }

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
        // Authenticate with user room if user info is in localStorage
        try {
            const rawUser = localStorage.getItem("user");
            if (rawUser) {
                const user = JSON.parse(rawUser);
                const userId = user?._id || user?.id;
                if (userId) {
                    socket.emit("join-user", userId);
                }
            }
        } catch (e) {
            console.warn("Could not parse user for join-user emit:", e);
        }
    });

    socket.on("force-logout", (data) => {
        if (isForceLoggingOut) return;
        isForceLoggingOut = true;

        // 1. Disconnect the socket
        try {
            socket.disconnect();
        } catch {
            // ignore
        }
        userSocket = null;

        // 2. Clear authentication state
        clearAuthSession();

        // 3. Store notification for the login screen toast
        const message =
            data?.message ||
            "You have been logged out because your account was logged in from another device.";

        sessionStorage.setItem("auth_toast", message);
        sessionStorage.setItem("auth_toast_type", "error");

        // 4. Redirect the user to /login
        if (window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
    });

    userSocket = socket;
    return socket;
};

/**
 * Returns current user socket instance.
 */
export const getUserSocket = () => userSocket;

/**
 * Disconnects and cleans up the user socket connection.
 */
export const disconnectUserSocket = () => {
    if (userSocket) {
        try {
            userSocket.disconnect();
        } catch {
            // ignore
        }
        userSocket = null;
    }
};

export default {
    initUserSocket,
    getUserSocket,
    disconnectUserSocket,
    getSocketUrl,
};
