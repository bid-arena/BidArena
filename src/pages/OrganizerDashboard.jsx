import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";
import Sidebar from "../components/layout/Sidebar";

const OrganizerDashboard = () => {

    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {

        const fetchDashboard = async () => {
            try {

                const token = localStorage.getItem("token");

                const res = await axios.get(
                    "http://localhost:5000/api/users/dashboard",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                console.log(res.data.data);

                setDashboard(res.data.data);

            } catch (error) {
                console.log(error);
            }
        };

        fetchDashboard();

    }, []);

    if (!dashboard) {
        return (
            <div className="text-white p-10 text-xl">
                Loading Dashboard...
            </div>
        );
    }

    const stats = dashboard.stats;

    const graphData = [
        { month: "Jan", players: 10 },
        { month: "Feb", players: 25 },
        { month: "Mar", players: 40 },
        { month: "Apr", players: 60 },
        { month: "May", players: 80 },
        { month: "Jun", players: 120 }
    ];

    return (
        <div className="min-h-screen flex bg-[#0A0F2C]">

            {/* Sidebar */}
            <Sidebar />

            {/* Main */}

            <main className="flex-1 p-8">

                <h1 className="text-3xl font-bold text-white mb-8">
                    Welcome {dashboard.name} 👋
                </h1>

                {/* Stats */}

                <div className="grid md:grid-cols-3 gap-6">

                    <div className="bg-[#0F1E4D] p-6 rounded-xl border border-white/10">

                        <p className="text-gray-400 text-sm">
                            Total Teams
                        </p>

                        <h2 className="text-3xl text-[#FDB913] font-bold mt-3">
                            {stats.teams}
                        </h2>

                    </div>

                    <div className="bg-[#0F1E4D] p-6 rounded-xl border border-white/10">

                        <p className="text-gray-400 text-sm">
                            Players
                        </p>

                        <h2 className="text-3xl text-[#00E676] font-bold mt-3">
                            {stats.players}
                        </h2>

                    </div>

                    <div className="bg-[#0F1E4D] p-6 rounded-xl border border-white/10">

                        <p className="text-gray-400 text-sm">
                            Active Auctions
                        </p>

                        <h2 className="text-3xl text-white font-bold mt-3">
                            {stats.auctions}
                        </h2>

                    </div>

                </div>

                {/* Graph Section */}

                <div className="mt-12 bg-[#0F1E4D] p-6 rounded-xl">

                    <h2 className="text-xl text-white mb-6">
                        Player Registrations
                    </h2>

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

                <div className="mt-10 grid md:grid-cols-3 gap-6">

                    <button className="bg-[#00E676] text-black py-3 rounded-lg font-semibold hover:scale-105 transition">
                        Add Team
                    </button>

                    <button className="bg-[#FDB913] text-black py-3 rounded-lg font-semibold hover:scale-105 transition">
                        Add Player
                    </button>

                    <button className="border border-[#FDB913] text-[#FDB913] py-3 rounded-lg font-semibold hover:bg-[#FDB913] hover:text-black transition">
                        Start Auction
                    </button>

                </div>

            </main>

        </div>
    );
};

export default OrganizerDashboard;