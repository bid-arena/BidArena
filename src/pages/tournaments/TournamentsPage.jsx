import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import { FaTrophy, FaUsers, FaCalendarAlt, FaMapPin, FaWallet } from "react-icons/fa";
import { getTournaments } from "../../services/tournamentService";

const TournamentPage = () => {

    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getTournaments();
                setTournaments(data);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return "₹0";
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">

            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">
                            Tournament Management
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Create & manage tournaments
                        </p>
                    </div>

                    <Link
                        to="/tournaments/add"
                        className="bg-[#FDB913] px-5 py-2 rounded-lg text-black font-semibold hover:scale-105 transition"
                    >
                        + Add Tournament
                    </Link>

                </div>

                {/* LOADING */}
                {loading && <div className="text-center py-10">Loading...</div>}

                {/* NO DATA */}
                {!loading && tournaments.length === 0 && (
                    <div className="text-center py-10">No tournaments found</div>
                )}

                {/* GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                    {tournaments.map((tournament) => (

                        <div
                            key={tournament.id}
                            className="bg-[#0F1E4D] rounded-xl p-5 border border-white/10 hover:scale-[1.02] transition flex flex-col justify-between"
                        >

                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <FaTrophy className="text-yellow-400 text-xl" />
                                    <h2 className="text-lg font-semibold line-clamp-1">
                                        {tournament.name}
                                    </h2>
                                </div>

                                <div className="space-y-2.5 text-sm text-gray-300">

                                    <p className="flex items-center gap-2">
                                        <FaMapPin className="text-blue-400 shrink-0" />
                                        <span className="truncate">{tournament.location || "-"}</span>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-amber-400 shrink-0" />
                                        <span>{formatDate(tournament.date)}</span>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <FaWallet className="text-green-400 shrink-0" />
                                        <span className="text-green-400 font-medium">
                                            {formatCurrency(tournament.purseAmount)}
                                        </span>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <FaUsers className="text-purple-400 shrink-0" />
                                        <span>
                                            Teams: {tournament.teams?.length || 0} / {tournament.maxTeams ? tournament.maxTeams : "∞"}
                                        </span>
                                    </p>

                                </div>
                            </div>

                            <div className="flex gap-3 mt-5">

                                <Link
                                    to={`/tournaments/${tournament.id}`}
                                    className="flex-1 text-center py-2 rounded bg-blue-500/20 hover:bg-blue-500/30 transition text-sm"
                                >
                                    View
                                </Link>

                                <Link
                                    to={`/tournaments/edit/${tournament.id}`}
                                    className="flex-1 text-center py-2 rounded bg-yellow-500/20 hover:bg-yellow-500/30 transition text-sm"
                                >
                                    Edit
                                </Link>

                            </div>

                        </div>

                    ))}

                </div>

            </main>

        </div>
    );
};

export default TournamentPage;
