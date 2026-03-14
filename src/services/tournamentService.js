import axios from "axios";

const API_URL = "http://localhost:5000/api/tournaments";

const getToken = () => {
    return localStorage.getItem("token");
};

export const getTournaments = async () => {
    const res = await axios.get(API_URL, {
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