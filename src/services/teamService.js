import axios from "axios";

const API = "http://localhost:5000/api";

const getToken = () => {
    return localStorage.getItem("token");
};

export const getTeams = async () => {

    const res = await axios.get(`${API}/teams/organizer`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return res.data.data;
};

export const createTeam = async (data) => {

    const res = await axios.post(`${API}/teams/create`, data, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return res.data.data;
};

export const deleteTeam = async (id) => {

    const res = await axios.delete(`${API}/teams/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });

    return res.data;
};