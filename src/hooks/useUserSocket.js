import { useEffect } from "react";
import { initUserSocket, disconnectUserSocket } from "../services/socketService";
import { isTokenValid } from "../utils/auth";

/**
 * Custom hook to maintain authenticated Socket.IO connection
 * and single-device login enforcement across the application.
 */
export const useUserSocket = () => {
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token && isTokenValid(token)) {
            initUserSocket(token);
        }

        // Listen for storage changes across tabs (e.g. login or logout in another tab)
        const handleStorageChange = (e) => {
            if (e.key === "token") {
                if (e.newValue && isTokenValid(e.newValue)) {
                    initUserSocket(e.newValue);
                } else {
                    disconnectUserSocket();
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);
};

export default useUserSocket;
