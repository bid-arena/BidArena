import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import api from "../../services/api";

const PlayersPage = () => {

    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:5000/api/players";

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            const res = await api.get("/players");
            setPlayers(res.data.data || []);
        } catch (err) {
            console.log("Error fetching players", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this player?")) return;

        try {
            await api.delete(`/players/${id}`);
            setPlayers(players.filter((p) => p.id !== id));
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">

            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

                    <h1 className="text-2xl md:text-3xl font-bold">
                        Players Management
                    </h1>

                    <Link
                        to="/players/add"
                        className="bg-[#FDB913] px-5 py-2 rounded-lg text-black font-semibold"
                    >
                        + Add Player
                    </Link>

                </div>

                {/* LOADING */}
                {loading && <div className="text-center py-10">Loading...</div>}

                {/* EMPTY */}
                {!loading && players.length === 0 && (
                    <div className="text-center py-10">No players found</div>
                )}

                {/* MOBILE CARDS */}
                <div className="md:hidden space-y-4">

                    {players.map((player) => (

                        <div key={player.id} className="bg-[#0F1E4D] p-4 rounded-lg">

                            <div className="flex items-center gap-3 mb-3">
                                <img
                                    src={player.image}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold">{player.name}</h3>
                                    <p className="text-sm text-gray-400">{player.role}</p>
                                </div>
                            </div>

                            <p className="text-green-400">
                                Base Price: ₹{player.basePrice}
                            </p>

                            <div className="flex gap-3 mt-3">
                                <FaEdit />
                                <FaTrash onClick={() => handleDelete(player.id)} />
                            </div>

                        </div>

                    ))}

                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">

                    <table className="w-full text-sm">

                        <thead className="bg-[#08163A] text-gray-300">
                            <tr>
                                <th className="p-4 text-left">Player</th>
                                <th className="p-4 text-left">Role</th>
                                <th className="p-4 text-left">Base Price</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {players.map((player) => (

                                <tr key={player.id} className="border-t border-white/10">

                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={player.image}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            {player.name}
                                        </div>
                                    </td>

                                    <td className="p-4">{player.role}</td>

                                    <td className="p-4 text-green-400">
                                        ₹{player.basePrice}
                                    </td>

                                    <td className="p-4">
                                        <div className="flex justify-center gap-3">
                                            <FaEdit />
                                            <FaTrash onClick={() => handleDelete(player.id)} />
                                        </div>
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </main>

        </div>
    );
};

export default PlayersPage;
