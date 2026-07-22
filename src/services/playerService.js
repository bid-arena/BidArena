import api from "./api";

// Returns players scoped to the organizer's tournaments, with nested tournament object
export const getPlayers = async () => {
    const res = await api.get("/players/organizer");
    return res.data.data || [];
};

// Returns all players in the system (accessible to everyone)
export const getAllPlayers = async () => {
    const res = await api.get("/players");
    return res.data.data || [];
};

// Returns a single player with nested tournament, bids, and soldRecord
export const getPlayerById = async (id) => {
    const res = await api.get(`/players/${id}`);
    return res.data.data;
};

// Creates a player — requires name, role, basePrice, tournamentId
export const createPlayer = async (data) => {
    const res = await api.post("/players/create", data);
    return res.data.data;
};

// Updates name, role, basePrice only (API does not accept tournamentId)
export const updatePlayer = async (id, data) => {
    const res = await api.put(`/players/${id}`, data);
    return res.data.data;
};

export const deletePlayer = async (id) => {
    const res = await api.delete(`/players/${id}`);
    return res.data;
};

/**
 * Get all players of a specific tournament, with fallback to fetching all players
 * @param {string} tournamentId
 */
export const getPlayersByTournament = async (tournamentId) => {
    try {
        const res = await api.get(`/players/tournament/${tournamentId}`);
        return res.data.data || [];
    } catch (err) {
        console.warn("Dedicated tournament players endpoint not found, falling back to /players");
        const res = await api.get("/players");
        return (res.data.data || []).filter(p => p.tournamentId === tournamentId);
    }
};
