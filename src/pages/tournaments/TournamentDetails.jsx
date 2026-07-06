import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    getTournamentById,
    deleteTournament
} from "../../services/tournamentService";
import {
    Trophy,
    MapPin,
    Calendar,
    IndianRupee,
    Users,
    ArrowLeft,
    Edit,
    Trash2,
    AlertTriangle,
    ShieldAlert,
    Clock,
    Plus,
    User
} from "lucide-react";
import { toast } from "react-hot-toast";

const TournamentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState("teams"); // tabs: teams, players, auctions

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getTournamentById(id);
                setTournament(data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load tournament details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteTournament(id);
            toast.success("Tournament deleted successfully!");
            navigate("/tournaments");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete tournament.");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Date not set";
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex bg-[#0A0F2C] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm">Loading tournament details...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen flex bg-[#0A0F2C] text-white">
                <Sidebar />
                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <ShieldAlert size={48} className="text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
                    <p className="text-gray-400 max-w-md mb-6">
                        The tournament details could not be retrieved. It may have been deleted or the ID is incorrect.
                    </p>
                    <Link to="/tournaments" className="inline-flex items-center gap-2 bg-[#FDB913] text-black px-5 py-2.5 rounded-lg font-bold">
                        <ArrowLeft size={16} /> Back to Tournaments
                    </Link>
                </main>
            </div>
        );
    }

    // Calculating Stats
    const totalPurse = tournament.purseAmount || 0;
    const maxTeams = tournament.maxTeams || 0;
    const registeredTeamsCount = tournament.teams?.length || 0;
    const registeredPlayersCount = tournament.players?.length || 0;

    // Calculate total purse allocated to teams
    const allocatedPurse = tournament.teams?.reduce((sum, t) => sum + (t.purseAmount || 0), 0) || 0;
    const remainingPurse = totalPurse - allocatedPurse;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* BACK NAVIGATION */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <Link to="/tournaments" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Tournaments</span>
                        </Link>

                        {/* QUICK ACTIONS */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Link
                                to={`/tournaments/edit/${tournament.id}`}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FDB913] border border-[#FDB913]/30 px-4 py-2.5 rounded-lg transition font-semibold text-sm"
                            >
                                <Edit size={16} />
                                <span>Edit Details</span>
                            </Link>

                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-lg transition font-semibold text-sm"
                            >
                                <Trash2 size={16} />
                                <span>Delete Tournament</span>
                            </button>
                        </div>
                    </div>

                    {/* HERO HEADER */}
                    <div className="bg-[#0F1E4D]/30 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 bg-[#FDB913]/10 px-3 py-1.5 rounded-full border border-[#FDB913]/20">
                                    <Trophy size={14} className="text-[#FDB913]" />
                                    <span className="text-xs font-bold text-[#FDB913] uppercase tracking-wider">Tournament Portal</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-[#FDB913] bg-clip-text text-transparent uppercase tracking-tight">
                                    {tournament.name}
                                </h1>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={16} className="text-blue-400" />
                                        {tournament.location || "Venue not specified"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={16} className="text-amber-400" />
                                        {formatDate(tournament.date)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STATS TILES GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* TOTAL PURSE */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Purse Budget</span>
                                <div className="bg-green-500/10 p-1.5 rounded-lg border border-green-500/20 text-green-400">
                                    <IndianRupee size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-green-400">
                                    {formatCurrency(totalPurse)}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Starting budget for team bids</p>
                            </div>
                        </div>

                        {/* REMAINING PURSE */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unallocated Purse</span>
                                <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20 text-blue-400">
                                    <IndianRupee size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className={`text-2xl font-black ${remainingPurse < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                    {formatCurrency(remainingPurse)}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {remainingPurse < 0 ? "Purse over-allocated!" : "Available for new teams"}
                                </p>
                            </div>
                        </div>

                        {/* REGISTERED TEAMS */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Teams</span>
                                <div className="bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20 text-purple-400">
                                    <Users size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {registeredTeamsCount} <span className="text-sm font-semibold text-gray-500">/ {maxTeams || "∞"}</span>
                                </h3>
                                <div className="w-full bg-[#001F54] rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-1.5 rounded-full"
                                        style={{ width: maxTeams ? `${Math.min((registeredTeamsCount / maxTeams) * 100, 100)}%` : '100%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* REGISTERED PLAYERS */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Players</span>
                                <div className="bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20 text-yellow-400">
                                    <User size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {registeredPlayersCount}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Available in auction pool</p>
                            </div>
                        </div>
                    </div>

                    {/* DETAILED CONTENT TABS */}
                    <div className="bg-[#0F1E4D]/20 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        {/* Tab Headers */}
                        <div className="flex border-b border-white/10 bg-[#001F54]/30">
                            <button
                                onClick={() => setActiveTab("teams")}
                                className={`flex-1 py-4 px-6 font-bold text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "teams" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/30" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <Users size={16} />
                                <span>Teams ({registeredTeamsCount})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("players")}
                                className={`flex-1 py-4 px-6 font-bold text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "players" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/30" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <User size={16} />
                                <span>Players ({registeredPlayersCount})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("auctions")}
                                className={`flex-1 py-4 px-6 font-bold text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "auctions" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/30" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <Clock size={16} />
                                <span>Auctions ({tournament.auctions?.length || 0})</span>
                            </button>
                        </div>

                        {/* Tab Body */}
                        <div className="p-6">
                            {/* TEAMS TAB */}
                            {activeTab === "teams" && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-gray-300">Registered Teams</h2>
                                        <Link
                                            to="/teams/add"
                                            className="inline-flex items-center gap-1 bg-[#FDB913] text-black px-3.5 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition"
                                        >
                                            <Plus size={14} /> Add Team
                                        </Link>
                                    </div>

                                    {registeredTeamsCount === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No teams registered in this tournament yet.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tournament.teams.map((team) => (
                                                <div
                                                    key={team.id}
                                                    className="bg-[#001F54]/30 border border-white/5 rounded-xl p-4 flex justify-between items-center hover:border-white/10 transition"
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        {team.logo ? (
                                                            <img
                                                                src={team.logo}
                                                                alt={team.name}
                                                                className="w-10 h-10 rounded-full border border-white/10 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-black text-sm text-[#FDB913]">
                                                                {team.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="font-bold text-gray-200">{team.name}</h4>
                                                            <p className="text-xs text-gray-500">Captain: {team.captainName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 font-medium">Remaining Purse</p>
                                                        <p className="text-sm font-black text-green-400 mt-0.5">
                                                            {formatCurrency(team.remainingPurse)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PLAYERS TAB */}
                            {activeTab === "players" && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-gray-300">Player Pool</h2>
                                        <Link
                                            to="/players/add"
                                            className="inline-flex items-center gap-1 bg-[#FDB913] text-black px-3.5 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition"
                                        >
                                            <Plus size={14} /> Add Player
                                        </Link>
                                    </div>

                                    {registeredPlayersCount === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No players registered in this tournament yet.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-white/5">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#001F54]/50 text-gray-400 font-semibold text-xs border-b border-white/5">
                                                    <tr>
                                                        <th className="p-4">Player Name</th>
                                                        <th className="p-4">Role</th>
                                                        <th className="p-4 text-right">Base Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 bg-[#001F54]/10">
                                                    {tournament.players.map((player) => (
                                                        <tr key={player.id} className="hover:bg-[#001F54]/30 transition-colors">
                                                            <td className="p-4 font-semibold text-gray-200">{player.name}</td>
                                                            <td className="p-4">
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                    {player.role}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right text-green-400 font-extrabold">
                                                                {formatCurrency(player.basePrice)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AUCTIONS TAB */}
                            {activeTab === "auctions" && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-gray-300">Live Auctions</h2>
                                    </div>

                                    {!tournament.auctions || tournament.auctions.length === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No auctions scheduled for this tournament.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tournament.auctions.map((auction) => (
                                                <div
                                                    key={auction.id}
                                                    className="bg-[#001F54]/30 border border-white/5 rounded-xl p-5 hover:border-white/10 transition"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="font-bold text-gray-200">Auction #{auction.id.substring(0, 8).toUpperCase()}</h4>
                                                            <p className="text-xs text-gray-500 mt-1">Created on: {new Date(auction.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        <span className={`text-xs px-2.5 py-1 rounded font-bold border ${auction.status === "ACTIVE" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                            auction.status === "COMPLETED" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
                                                                "bg-yellow-500/10 text-[#FDB913] border-[#FDB913]/20"
                                                            }`}>
                                                            {auction.status}
                                                        </span>
                                                    </div>

                                                    <Link
                                                        to="/auctions"
                                                        className="w-full inline-flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2.5 rounded-lg text-sm font-semibold transition"
                                                    >
                                                        Go to Auction Arena
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* DELETE CONFIRMATION MODAL */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0F1E4D] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Red visual top band */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />

                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle size={28} className="shrink-0" />
                            <h3 className="text-xl font-bold">Delete Tournament?</h3>
                        </div>

                        <div className="space-y-3.5 text-sm text-gray-300">
                            <p>
                                Are you absolutely sure you want to delete <span className="font-extrabold text-white">"{tournament.name}"</span>?
                            </p>
                            <p className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-200 text-xs flex gap-2">
                                <ShieldAlert size={16} className="shrink-0 text-red-400" />
                                <span>
                                    <strong>CRITICAL WARNING:</strong> This will permanently delete all associated teams, registered players, bids, sold records, and auctions linked to this tournament. This action is irreversible.
                                </span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-lg font-bold transition text-sm text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                {deleting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Confirm Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentDetails;
