import axios from "axios";

const API_URL = "http://localhost:5000/api/tournaments";

const getToken = () => {
    return localStorage.getItem("token");
};

export const getTournaments = async () => {
    const res = await axios.get(`${API_URL}/organizer`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return res.data.data;
};

export const createTournament = async (data) => {
    const res = await axios.post(`${API_URL}/create`, data, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return res.data.data;
};

export const getTournamentById = async (id) => {
    const res = await axios.get(`${API_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return res.data.data;
};

export const updateTournament = async (id, data) => {
    const res = await axios.put(`${API_URL}/${id}`, data, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return res.data.data;
};

export const deleteTournament = async (id) => {
    const res = await axios.delete(`${API_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return res.data.data;
};