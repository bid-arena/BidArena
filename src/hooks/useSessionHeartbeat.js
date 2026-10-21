import { useEffect } from "react";
import api from "../services/api";

/**
 * Checks session health periodically and on window focus.
 * If the current session was revoked from another device,
 * the server returns 401, triggering immediate logout
 * with the "Your session was revoked from another device" toast.
 */
export const useSessionHeartbeat = () => {
    useEffect(() => {
        // Only run check if user is logged in
        const token = localStorage.getItem("token");
        if (!token) return;

        let isChecking = false;

        const checkSessionHealth = async () => {
            const currentToken = localStorage.getItem("token");
            if (!currentToken || isChecking || window.location.pathname === "/login") return;

            try {
                isChecking = true;
                await api.get("/auth/me");
            } catch {
                // 401 is automatically intercepted by api.js, which clears session,
                // sets sessionStorage flash message, and redirects to /login!
            } finally {
                isChecking = false;
            }
        };

        // Check on window/tab focus
        const onWindowFocus = () => {
            checkSessionHealth();
        };

        window.addEventListener("focus", onWindowFocus);

        // Heartbeat check every 25 seconds
        const timer = setInterval(checkSessionHealth, 25000);

        return () => {
            window.removeEventListener("focus", onWindowFocus);
            clearInterval(timer);
        };
    }, []);
};

export default useSessionHeartbeat;
