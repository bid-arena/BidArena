import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link, useNavigate } from "react-router-dom";
import { FaTrophy, FaCalendarAlt, FaPlay, FaStop, FaPlus, FaExternalLinkAlt, FaGavel, FaSpinner } from "react-icons/fa";
import { getTournaments } from "../../services/tournamentService";
import { createAuction, startAuction, endAuction, getAuctionByTournamentId } from "../../services/auctionService";
import { toast } from "react-hot-toast";

const AuctionsPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // stores tournamentId of active action

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const tournamentList = await getTournaments();
            const enriched = await Promise.all(
                tournamentList.map(async (t) => {
                    try {
                        const auction = await getAuctionByTournamentId(t.id);
                        return { ...t, auction };
                    } catch (err) {
                        console.error(`Error loading auction for ${t.id}:`, err);
                        return { ...t, auction: null };
                    }
                })
            );
            setTournaments(enriched);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tournaments data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateAuction = async (tournamentId) => {
        setActionLoading(tournamentId);
        try {
            await createAuction({ tournamentId });
            toast.success("Auction session created successfully!");
            await loadData(true);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to create auction session");
        } finally {
            setActionLoading(null);
        }
    };

    const handleStartAuction = async (tournamentId, auctionId) => {
        setActionLoading(tournamentId);
        try {
            await startAuction({ auctionId });
            toast.success("Auction session started!");
            await loadData(true);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to start auction session");
        } finally {
            setActionLoading(null);
        }
    };

    const handleEndAuction = async (tournamentId, auctionId) => {
        setActionLoading(tournamentId);
        try {
            await endAuction({ auctionId });
            toast.success("Auction session completed!");
            await loadData(true);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to complete auction session");
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case "ACTIVE":
                return "bg-green-500/10 text-green-400 border border-green-500/20";
            case "COMPLETED":
                return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
            case "PENDING":
                return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
            default:
                return "bg-red-500/10 text-red-400 border border-red-500/20";
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <FaGavel className="text-[#FDB913]" /> Auction Management
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Initialize, control, and enter real-time auction arenas for your tournaments.
                    </p>
                </div>

                {/* LOADING */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <FaSpinner className="animate-spin text-3xl text-[#FDB913]" />
                        <span className="text-gray-400 text-sm">Loading auctions...</span>
                    </div>
                )}

                {/* NO DATA */}
                {!loading && tournaments.length === 0 && (
                    <div className="text-center py-20 bg-[#0F1E4D]/20 rounded-2xl border border-white/5">
                        <FaTrophy className="mx-auto text-4xl text-gray-600 mb-3" />
                        <h3 className="text-lg font-bold">No Tournaments Found</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            You must create a tournament before scheduling an auction.
                        </p>
                        <Link
                            to="/tournaments/add"
                            className="inline-flex items-center gap-2 mt-4 bg-[#FDB913] px-4 py-2 rounded-lg text-black font-semibold hover:scale-105 transition text-sm"
                        >
                            <FaPlus size={12} /> Create Tournament
                        </Link>
                    </div>
                )}

                {/* LISTING GRID */}
                {!loading && tournaments.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.map((t) => {
                            const isWorking = actionLoading === t.id;
                            const hasAuction = !!t.auction;
                            const status = hasAuction ? t.auction.status : "NO_SESSION";

                            return (
                                <div
                                    key={t.id}
                                    className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-[#0F1B3D]/50 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4 gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <FaTrophy className="text-[#FDB913] shrink-0" />
                                                <h3 className="font-bold text-lg text-white line-clamp-1">
                                                    {t.name}
                                                </h3>
                                            </div>
                                            <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full shrink-0 ${getStatusStyles(status)}`}>
                                                {status === "NO_SESSION" ? "No Session" : status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-400 border-b border-white/5 pb-4 mb-4">
                                            <div className="flex justify-between">
                                                <span>Location</span>
                                                <span className="text-white font-medium">{t.location || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Scheduled Date</span>
                                                <span className="text-white font-medium">{formatDate(t.date)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Registered Teams</span>
                                                <span className="text-white font-medium">{t.teams?.length || 0} / {t.maxTeams}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2.5">
                                        {status === "NO_SESSION" && (
                                            <button
                                                disabled={isWorking}
                                                onClick={() => handleCreateAuction(t.id)}
                                                className="w-full flex items-center justify-center gap-2 bg-[#FDB913] hover:bg-amber-500 text-black py-2.5 rounded-xl font-bold transition disabled:opacity-50 text-sm shadow-lg shadow-yellow-500/10"
                                            >
                                                {isWorking ? <FaSpinner className="animate-spin" /> : <FaPlus size={12} />}
                                                Create Auction Session
                                            </button>
                                        )}

                                        {status === "PENDING" && (
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={isWorking}
                                                    onClick={() => handleStartAuction(t.id, t.auction.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl font-bold transition disabled:opacity-50 text-sm"
                                                >
                                                    {isWorking ? <FaSpinner className="animate-spin" /> : <FaPlay size={12} />}
                                                    Start Session
                                                </button>
                                                <button
                                                    disabled={isWorking}
                                                    onClick={() => navigate(`/auctions/live/${t.id}`)}
                                                    className="px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition flex items-center justify-center"
                                                    title="Enter Arena"
                                                >
                                                    <FaExternalLinkAlt size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {status === "ACTIVE" && (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => navigate(`/auctions/live/${t.id}`)}
                                                    className="w-full flex items-center justify-center gap-2 bg-[#FDB913]/10 border border-[#FDB913]/30 hover:bg-[#FDB913]/20 text-[#FDB913] py-2.5 rounded-xl font-bold transition text-sm"
                                                >
                                                    <FaGavel size={13} />
                                                    Enter Live Arena
                                                </button>
                                                <button
                                                    disabled={isWorking}
                                                    onClick={() => handleEndAuction(t.id, t.auction.id)}
                                                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 py-2 rounded-xl font-semibold transition disabled:opacity-50 text-xs"
                                                >
                                                    {isWorking ? <FaSpinner className="animate-spin" /> : <FaStop size={10} />}
                                                    Close Auction Session
                                                </button>
                                            </div>
                                        )}

                                        {status === "COMPLETED" && (
                                            <button
                                                onClick={() => navigate(`/auctions/live/${t.id}`)}
                                                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl font-bold border border-white/10 transition text-sm"
                                            >
                                                <FaExternalLinkAlt size={12} />
                                                Review Arena / Standings
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AuctionsPage;
