import React, { useEffect, useState } from "react";
import { getTeams, deleteTeam } from "../../services/teamService";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import {
    Users,
    Trophy,
    Wallet,
    Search,
    Filter,
    Edit,
    Trash2,
    IndianRupee,
    AlertTriangle,
    Eye,
    Plus,
    User,
    HelpCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

const TeamsPage = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedTournament, setSelectedTournament] = useState("All");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const loadTeams = async () => {
            try {
                const data = await getTeams();
                setTeams(data);
            } catch (error) {
                console.error("Teams fetch error:", error);
                toast.error("Failed to load teams.");
            } finally {
                setLoading(false);
            }
        };
        loadTeams();
    }, []);

    const openDeleteModal = (team) => {
        setTeamToDelete(team);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!teamToDelete) return;
        setDeleting(true);
        try {
            await deleteTeam(teamToDelete.id);
            setTeams((prev) => prev.filter((team) => team.id !== teamToDelete.id));
            toast.success("Team deleted successfully!");
        } catch (error) {
            console.error("Delete team error:", error);
            toast.error(error.response?.data?.message || "Failed to delete team.");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
            setTeamToDelete(null);
        }
    };

    /* FILTER */
    const filteredTeams = teams.filter((team) => {
        const matchSearch =
            team.name.toLowerCase().includes(search.toLowerCase()) ||
            (team.ownerName && team.ownerName.toLowerCase().includes(search.toLowerCase()));

        const matchTournament =
            selectedTournament === "All" ||
            team.tournament?.name === selectedTournament;

        return matchSearch && matchTournament;
    });

    /* TOURNAMENT LIST FOR FILTER DROPDOWN */
    const tournamentList = [
        "All",
        ...new Set(teams.map((t) => t.tournament?.name).filter(Boolean)),
    ];

    /* STATS */
    const totalPurse = teams.reduce((a, b) => a + (b.purseAmount || 0), 0);
    const totalRemaining = teams.reduce((a, b) => a + (b.remainingPurse || 0), 0);
    const totalSpent = totalPurse - totalRemaining;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 w-full p-4 sm:p-6 md:p-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                Teams Management
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Register and coordinate teams, check available bidding purse limits, and build league rosters.
                            </p>
                        </div>
                        <Link
                            to="/teams/add"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDB913] to-[#e09e07] hover:from-[#fec435] hover:to-[#f0ac11] px-5 py-2.5 rounded-lg text-black font-bold transition duration-300 hover:scale-105 shadow-lg shadow-yellow-500/20 w-full sm:w-auto justify-center"
                        >
                            <Plus size={16} />
                            <span>Add Team</span>
                        </Link>
                    </div>

                    {/* STATS TILES GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* TOTAL TEAMS */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Teams</span>
                                <div className="bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20 text-purple-400">
                                    <Users size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">{teams.length}</h3>
                                <p className="text-xs text-gray-500 mt-1">Enrolled across leagues</p>
                            </div>
                        </div>

                        {/* UNIQUE TOURNAMENTS */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Tournaments</span>
                                <div className="bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20 text-yellow-400">
                                    <Trophy size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {tournamentList.length - 1}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Host competitions</p>
                            </div>
                        </div>

                        {/* TOTAL BUDGET ALLOCATED */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Starting Purse Sum</span>
                                <div className="bg-green-500/10 p-1.5 rounded-lg border border-green-500/20 text-green-400">
                                    <IndianRupee size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-green-400">
                                    {formatCurrency(totalPurse)}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Allocated bidding capital</p>
                            </div>
                        </div>

                        {/* REMAINING PURSE BUDGET */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Remaining Purse</span>
                                <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20 text-blue-400">
                                    <IndianRupee size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-blue-400">
                                    {formatCurrency(totalRemaining)}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Available for bidding pools</p>
                            </div>
                        </div>
                    </div>

                    {/* SEARCH + FILTER CONTROLS */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                        <div className="md:col-span-8 relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by team name or owner..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F1E4D]/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#FDB913] transition text-white placeholder-gray-500"
                            />
                        </div>

                        <div className="md:col-span-4 relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Filter size={18} />
                            </div>
                            <select
                                value={selectedTournament}
                                onChange={(e) => setSelectedTournament(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F1E4D]/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#FDB913] transition text-white appearance-none cursor-pointer"
                            >
                                {tournamentList.map((t, index) => (
                                    <option key={index} value={t} className="bg-[#0A0F2C]">
                                        {t === "All" ? "All Tournaments" : t}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* LOADING */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 text-sm">Loading teams registry...</p>
                        </div>
                    )}

                    {/* NO DATA */}
                    {!loading && filteredTeams.length === 0 && (
                        <div className="bg-[#0F1E4D]/10 border border-white/5 rounded-2xl py-16 px-6 text-center">
                            <Users className="text-gray-500 mx-auto mb-3" size={40} />
                            <h3 className="text-lg font-bold mb-1">No Teams Found</h3>
                            <p className="text-gray-400 text-sm max-w-sm mx-auto">
                                We couldn't find any teams matching your filters. Create a new team or adjust the filters.
                            </p>
                        </div>
                    )}

                    {/* TEAMS CARDS GRID */}
                    {!loading && filteredTeams.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTeams.map((team) => {
                                const startingPurse = team.purseAmount || 0;
                                const remainingPurse = team.remainingPurse || 0;
                                const spentPurse = startingPurse - remainingPurse;
                                const spentPercent = startingPurse > 0 ? (spentPurse / startingPurse) * 100 : 0;

                                return (
                                    <div
                                        key={team.id}
                                        className="bg-gradient-to-br from-[#0F1E4D]/40 to-[#08163A]/40 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-[#FDB913]/30 transition group relative overflow-hidden"
                                    >
                                        {/* Corner highlight */}
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

                                        <div>
                                            {/* Card Header */}
                                            <div className="flex items-center gap-4 mb-5">
                                                {team.logo ? (
                                                    <img
                                                        src={team.logo}
                                                        alt={team.name}
                                                        className="w-12 h-12 rounded-full object-cover border border-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-black text-sm text-[#FDB913]">
                                                        {team.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-extrabold text-lg text-white group-hover:text-[#FDB913] transition line-clamp-1">
                                                        {team.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <User size={12} className="text-gray-500" />
                                                        <span>Owner: {team.ownerName}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Tournament Badge */}
                                            {team.tournament && (
                                                <div className="inline-flex items-center gap-1.5 bg-[#001F54] border border-white/5 rounded-full px-2.5 py-1 text-xs text-gray-300 mb-5 max-w-full">
                                                    <Trophy size={12} className="text-[#FDB913] shrink-0" />
                                                    <span className="truncate">{team.tournament.name}</span>
                                                </div>
                                            )}

                                            {/* Purse Details */}
                                            <div className="space-y-3 mb-6 bg-[#001F54]/30 rounded-xl p-4 border border-white/5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-400">Remaining Purse</span>
                                                    <span className="font-bold text-white">{formatCurrency(remainingPurse)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-400">Total Starting Purse</span>
                                                    <span className="font-bold text-gray-300">{formatCurrency(startingPurse)}</span>
                                                </div>

                                                {/* Spent Progress Bar */}
                                                <div className="space-y-1 pt-1.5">
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-gray-500 uppercase font-semibold">Purse Spent</span>
                                                        <span className={`font-bold ${spentPercent >= 80 ? 'text-red-400' : 'text-green-400'}`}>
                                                            {spentPercent.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-[#001F54] rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all duration-500 ${spentPercent >= 80 ? 'bg-red-500' : 'bg-green-400'}`}
                                                            style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="flex gap-2.5 border-t border-white/5 pt-4">
                                            <Link
                                                to={`/teams/${team.id}`}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 py-2.5 rounded-lg text-xs font-bold transition"
                                            >
                                                <Eye size={14} />
                                                <span>View</span>
                                            </Link>
                                            <Link
                                                to={`/teams/edit/${team.id}`}
                                                className="inline-flex items-center justify-center p-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-[#FDB913] rounded-lg transition"
                                                title="Edit Team"
                                            >
                                                <Edit size={14} />
                                            </Link>
                                            <button
                                                onClick={() => openDeleteModal(team)}
                                                className="inline-flex items-center justify-center p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition"
                                                title="Delete Team"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* DELETE SAFETY MODAL */}
            {deleteModalOpen && teamToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0F1E4D] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Red Visual Bar */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />

                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle size={28} className="shrink-0" />
                            <h3 className="text-xl font-bold">Delete Team?</h3>
                        </div>

                        <div className="space-y-3.5 text-sm text-gray-300">
                            <p>
                                Are you absolutely sure you want to delete <span className="font-extrabold text-white">"{teamToDelete.name}"</span>?
                            </p>
                            <p className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-200 text-xs flex gap-2">
                                <AlertTriangle size={16} className="shrink-0 text-red-400" />
                                <span>
                                    <strong>WARNING:</strong> Deleting this team will remove it from its registered tournament and delete any bids it made. Roster allocations for this team will be lost.
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

export default TeamsPage;
