/**
 * Checks whether a given JWT token exists, has valid structure, and is not expired.
 * @param {string|null} token
 * @returns {boolean}
 */
export const isTokenValid = (token) => {
    if (!token || typeof token !== "string") return false;

    try {
        const parts = token.split(".");
        if (parts.length !== 3) return false;

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        const payload = JSON.parse(jsonPayload);

        if (payload.exp && typeof payload.exp === "number") {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            if (nowInSeconds >= payload.exp) {
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
};

/**
 * Extracts and decodes the payload of a JWT token safely.
 * @param {string|null} token
 * @returns {object|null}
 */
export const getJwtPayload = (token = localStorage.getItem("token")) => {
    if (!token || typeof token !== "string") return null;

    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

/**
 * Clears user auth session from localStorage.
 */
export const clearAuthSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};
