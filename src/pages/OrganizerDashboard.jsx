import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import Sidebar from "../components/layout/Sidebar";
import { Link, useNavigate } from "react-router-dom";
import { FaUsers, FaLayerGroup, FaGavel, FaTrophy } from "react-icons/fa";

const OrganizerDashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [tournaments, setTournaments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");

                // Dashboard stats
                const dashboardRes = await axios.get(
                    "http://localhost:5000/api/users/dashboard",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setDashboard(dashboardRes.data.data);

                // Fetch tournaments
                const tournamentsRes = await axios.get(
                    "http://localhost:5000/api/tournaments",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setTournaments(tournamentsRes.data.data);

                // Fetch teams
                const teamsRes = await axios.get(
                    "http://localhost:5000/api/teams/organizer",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setTeams(teamsRes.data.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading || !dashboard) {
        return (
            <div className="text-white p-10 text-xl">
                Loading Dashboard...
            </div>
        );
    }

    const stats = dashboard.stats || {};

    // Example graphData dynamically generated from stats.monthlyPlayers if available
    const graphData = stats.monthlyPlayers || [
        { month: "Jan", players: 10 },
        { month: "Feb", players: 25 },
        { month: "Mar", players: 40 },
    ];

    const cardData = [
        {
            title: "Total Teams",
            value: stats.teams || 0,
            color: "text-[#FDB913]",
            icon: <FaLayerGroup size={30} />,
        },
        {
            title: "Players",
            value: stats.players || 0,
            color: "text-[#00E676]",
            icon: <FaUsers size={30} />,
        },
        {
            title: "Active Auctions",
            value: stats.auctions || 0,
            color: "text-white",
            icon: <FaGavel size={30} />,
        },
        {
            title: "Tournaments",
            value: stats.tournaments || 0,
            color: "text-[#FF6B6B]",
            icon: <FaTrophy size={30} />,
        },
    ];

    return (
        <div className="min-h-screen flex bg-[#0A0F2C] text-white">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-8">
                <h1 className="text-3xl font-bold mb-8">
                    Welcome {dashboard.name} 👋
                </h1>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-10">
                    {cardData.map((card, idx) => (
                        <div
                            key={idx}
                            className="bg-[#0F1E4D] p-6 rounded-xl border border-white/10 flex items-center gap-4 hover:shadow-xl transition"
                        >
                            <div className="bg-white/10 p-3 rounded-full">
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">{card.title}</p>
                                <h2 className={`text-3xl font-bold mt-2 ${card.color}`}>
                                    {card.value}
                                </h2>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Player Registrations Graph */}
                <div className="bg-[#0F1E4D] p-6 rounded-xl mb-10">
                    <h2 className="text-xl mb-6">Player Registrations (Monthly)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2a5a" />
                            <XAxis dataKey="month" stroke="#fff" />
                            <YAxis stroke="#fff" />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="players"
                                stroke="#FDB913"
                                strokeWidth={3}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <Link
                        to="/teams/add"
                        className="bg-[#00E676] text-black py-3 rounded-lg font-semibold hover:scale-105 transition text-center"
                    >
                        Add Team
                    </Link>
                    <Link
                        to="/players/add"
                        className="bg-[#FDB913] text-black py-3 rounded-lg font-semibold hover:scale-105 transition text-center"
                    >
                        Add Player
                    </Link>
                    <Link
                        to="/auctions/start"
                        className="border border-[#FDB913] text-[#FDB913] py-3 rounded-lg font-semibold hover:bg-[#FDB913] hover:text-black transition text-center"
                    >
                        Start Auction
                    </Link>
                </div>

                {/* Tournaments Table */}
                <div className="bg-[#0F1E4D] rounded-xl p-6 mb-10">
                    <h2 className="text-xl mb-4">Your Tournaments</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#001F54]">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Location</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Purse</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tournaments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center">
                                            No tournaments found
                                        </td>
                                    </tr>
                                ) : (
                                    tournaments.map((t) => (
                                        <tr key={t.id} className="border-t border-white/10">
                                            <td className="p-4">{t.name}</td>
                                            <td className="p-4">{t.location}</td>
                                            <td className="p-4">
                                                {new Date(t.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                ₹{t.purseAmount.toLocaleString()}
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        navigate(`/tournaments/edit/${t.id}`)
                                                    }
                                                    className="bg-blue-500 px-3 py-1 rounded hover:scale-105 transition"
                                                >
                                                    Edit
                                                </button>
                                                <button className="bg-red-500 px-3 py-1 rounded hover:scale-105 transition">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Teams Table */}
                <div className="bg-[#0F1E4D] rounded-xl p-6">
                    <h2 className="text-xl mb-4">Your Teams</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#001F54]">
                                <tr>
                                    <th className="p-4">Logo</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Captain</th>
                                    <th className="p-4">Tournament</th>
                                    <th className="p-4">Purse</th>
                                    <th className="p-4">Remaining</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center">
                                            No teams found
                                        </td>
                                    </tr>
                                ) : (
                                    teams.map((team) => (
                                        <tr key={team.id} className="border-t border-white/10">
                                            <td className="p-4">
                                                <img
                                                    src={team.logo}
                                                    alt={team.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            </td>
                                            <td className="p-4">{team.name}</td>
                                            <td className="p-4">{team.captainName}</td>
                                            <td className="p-4">{team.tournament?.name}</td>
                                            <td className="p-4 text-green-400 font-bold">
                                                ₹{team.purseAmount.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-yellow-400 font-bold">
                                                ₹{team.remainingPurse.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrganizerDashboard;
