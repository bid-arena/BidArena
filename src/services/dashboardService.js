import api from "./api";

/**
 * Fetch logged-in user profile from server.
 * Falls back to localStorage if the endpoint is not yet available.
 */
export const getProfile = async () => {
    try {
        const res = await api.get("/auth/me");
        return res.data.data;
    } catch {
        // Fallback: read user object stored at login
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    }
};

/**
 * Aggregate dashboard stats.
 * API returns: { name, stats: { tournaments, teams, players, purse, auctions }, monthlyRegistrations, recentActivities }
 * We normalize this into a flat shape for the dashboard.
 */
export const getDashboardStats = async () => {
    try {
        const res = await api.get("/dashboard/stats");
        const raw = res.data.data;

        // Fetch recent items in parallel using existing list endpoints
        const [tourRes, teamRes] = await Promise.allSettled([
            api.get("/tournaments/organizer"),
            api.get("/teams/organizer"),
        ]);

        const tournaments = tourRes.status === "fulfilled" ? (tourRes.value.data.data || []) : [];
        const teams = teamRes.status === "fulfilled" ? (teamRes.value.data.data || []) : [];

        return {
            // Flatten nested stats into top-level keys
            totalTournaments: raw.stats?.tournaments ?? 0,
            totalTeams: raw.stats?.teams ?? 0,
            totalPlayers: raw.stats?.players ?? 0,
            totalPurse: raw.stats?.purse ?? 0,
            totalAuctions: raw.stats?.auctions ?? 0,

            // Extra context
            organizerName: raw.name,
            monthlyRegistrations: raw.monthlyRegistrations || [],
            recentActivities: raw.recentActivities || [],

            // Recent lists (sorted newest first)
            recentTournaments: [...tournaments]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5),
            recentTeams: [...teams]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5),
        };
    } catch {
        // Fallback: compose stats from existing endpoints only
        const [tourRes, teamRes] = await Promise.all([
            api.get("/tournaments/organizer"),
            api.get("/teams/organizer"),
        ]);

        const tournaments = tourRes.data.data || [];
        const teams = teamRes.data.data || [];

        const totalPlayers = tournaments.reduce(
            (sum, t) => sum + (t.players?.length || 0),
            0
        );
        const totalPurse = teams.reduce(
            (sum, t) => sum + (t.purseAmount || 0),
            0
        );

        return {
            totalTournaments: tournaments.length,
            totalTeams: teams.length,
            totalPlayers,
            totalPurse,
            totalAuctions: 0,
            monthlyRegistrations: [],
            recentActivities: [],
            recentTournaments: [...tournaments]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5),
            recentTeams: [...teams]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5),
        };
    }
};

/**
 * Server-side logout — blacklists the JWT in Redis.
 */
export const logoutUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            await api.post("/auth/logout", { token });
        } catch {
            // Even if server call fails, we clear client-side storage
        }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};
