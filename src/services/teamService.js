import api from "./api";

export const getTeams = async () => {
    const res = await api.get("/teams/organizer");
    return res.data.data;
};

export const createTeam = async (data) => {
    const res = await api.post("/teams/create", data);
    return res.data.data;
};

export const deleteTeam = async (id) => {
    const res = await api.delete(`/teams/${id}`);
    return res.data;
};

export const getTeamById = async (id) => {
    const res = await api.get(`/teams/${id}`);
    return res.data.data;
};

export const updateTeam = async (id, data) => {
    const res = await api.put(`/teams/${id}`, data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return res.data.data;
};