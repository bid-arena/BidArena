import api from "./api";

// Returns players scoped to the organizer's tournaments, with nested tournament object
export const getPlayers = async () => {
    const res = await api.get("/players/organizer");
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
