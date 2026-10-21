import api from "./api";

export const getTournaments = async () => {
    const res = await api.get("/tournaments/organizer");
    return res.data.data;
};

export const createTournament = async (data) => {
    const res = await api.post("/tournaments/create", data);
    return res.data.data;
};

export const getTournamentById = async (id) => {
    const res = await api.get(`/tournaments/${id}`);
    return res.data.data;
};

export const updateTournament = async (id, data) => {
    const res = await api.put(`/tournaments/${id}`, data);
    return res.data.data;
};

export const deleteTournament = async (id) => {
    const res = await api.delete(`/tournaments/${id}`);
    return res.data.data;
};