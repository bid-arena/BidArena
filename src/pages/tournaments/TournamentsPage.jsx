import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import {
    Trophy,
    MapPin,
    Calendar,
    Coins,
    Users,
    Edit,
    Trash2,
    Eye,
    Plus,
    Search,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    SlidersHorizontal
} from "lucide-react";
import { getTournaments, deleteTournament } from "../../services/tournamentService";
import { toast } from "react-hot-toast";

const TournamentPage = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search, Filter, Sort States
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [sortBy, setSortBy] = useState("date-asc");

    // Deletion Modal States
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tournamentToDelete, setTournamentToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await getTournaments();
            setTournaments(data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tournaments");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async () => {
        if (!tournamentToDelete) return;
        setDeleting(true);
        try {
            await deleteTournament(tournamentToDelete.id);
            toast.success("Tournament deleted successfully");
            setTournaments(prev => prev.filter(t => t.id !== tournamentToDelete.id));
            setDeleteModalOpen(false);
            setTournamentToDelete(null);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete tournament");
        } finally {
            setDeleting(false);
        }
    };

    const getTournamentStatus = (dateString) => {
        if (!dateString) return "DRAFT";
        const tournamentDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tournamentDate.setHours(0, 0, 0, 0);

        if (tournamentDate.getTime() === today.getTime()) {
            return "ONGOING";
        } else if (tournamentDate.getTime() > today.getTime()) {
            return "UPCOMING";
        } else {
            return "COMPLETED";
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "DRAFT":
                return {
                    label: "Draft",
                    classes: "bg-gray-500/10 text-gray-400 border-gray-500/20"
                };
            case "UPCOMING":
                return {
                    label: "Upcoming",
                    classes: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                };
            case "ONGOING":
                return {
                    label: "Ongoing",
                    classes: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse"
                };
            case "COMPLETED":
                return {
                    label: "Completed",
                    classes: "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                };
            default:
                return {
                    label: "Unknown",
                    classes: "bg-gray-500/10 text-gray-400 border-gray-500/20"
                };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "TBD";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN').format(amount || 0) + " Pts";
    };

    // Calculate dynamic stats
    const stats = React.useMemo(() => {
        const total = tournaments.length;
        let upcoming = 0;
        let ongoing = 0;
        let completed = 0;
        let totalPurse = 0;

        tournaments.forEach(t => {
            const status = getTournamentStatus(t.date);
            if (status === "UPCOMING") upcoming++;
            else if (status === "ONGOING") ongoing++;
            else if (status === "COMPLETED") completed++;
            
            totalPurse += (t.purseAmount || 0);
        });

        return { total, upcoming, ongoing, completed, totalPurse };
    }, [tournaments]);

    // Search, Filter and Sort Logic
    const processedTournaments = React.useMemo(() => {
        let result = [...tournaments];

        // Search filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => 
                (t.name && t.name.toLowerCase().includes(query)) ||
                (t.location && t.location.toLowerCase().includes(query))
            );
        }

        // Status filter
        if (filterStatus !== "ALL") {
            result = result.filter(t => getTournamentStatus(t.date) === filterStatus);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (sortBy === "purse-desc") {
                return (b.purseAmount || 0) - (a.purseAmount || 0);
            }
            
            // Dates handling (missing dates go to end)
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;

            if (sortBy === "date-asc") {
                if (dateA === 0) return 1;
                if (dateB === 0) return -1;
                return dateA - dateB;
            }
            if (sortBy === "date-desc") {
                return dateB - dateA;
            }
            return 0;
        });

        return result;
    }, [tournaments, searchQuery, filterStatus, sortBy]);

    const SkeletonCard = () => (
        <div className="bg-[#080E27] rounded-2xl p-6 border border-white/5 animate-pulse flex flex-col justify-between h-[280px]">
            <div>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-white/5 rounded-xl"></div>
                    <div>
                        <div className="h-4 bg-white/5 rounded w-28 mb-2"></div>
                        <div className="h-3 bg-white/5 rounded w-16"></div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-2/3"></div>
                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                </div>
            </div>
            <div className="flex gap-3 mt-6">
                <div className="flex-1 h-9 bg-white/5 rounded-lg"></div>
                <div className="flex-1 h-9 bg-white/5 rounded-lg"></div>
                <div className="w-9 h-9 bg-white/5 rounded-lg"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Tournament Hub
                            </h1>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                Create, monitor, and manage your competitive tournament seasons
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => loadData(true)}
                                disabled={refreshing}
                                className="p-2.5 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 hover:text-[#FDB913] transition active:scale-95 text-gray-400"
                                title="Refresh data"
                            >
                                <RefreshCw size={18} className={refreshing ? "animate-spin text-[#FDB913]" : ""} />
                            </button>

                            <Link
                                to="/tournaments/add"
                                className="inline-flex items-center gap-2 bg-[#FDB913] hover:bg-[#e0a20f] active:scale-95 text-black px-5 py-2.5 rounded-xl font-bold transition duration-200 shadow-lg shadow-yellow-500/10 group"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                <span>Add Tournament</span>
                            </Link>
                        </div>
                    </div>

                    {/* STATS TILES */}
                    {!loading && tournaments.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Total Tournaments</span>
                                <h3 className="text-2xl font-black text-white">{stats.total}</h3>
                                <p className="text-xs text-gray-500 mt-1">Seasons registered</p>
                            </div>
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Upcoming</span>
                                <h3 className="text-2xl font-black text-blue-400">{stats.upcoming}</h3>
                                <p className="text-xs text-gray-500 mt-1">Starting soon</p>
                            </div>
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Ongoing</span>
                                <h3 className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                                    {stats.ongoing}
                                    {stats.ongoing > 0 && <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Live matches today</p>
                            </div>
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Total Prize Pools</span>
                                <h3 className="text-2xl font-black text-yellow-400 truncate">{formatCurrency(stats.totalPurse)}</h3>
                                <p className="text-xs text-gray-500 mt-1">Combined points budget</p>
                            </div>
                        </div>
                    )}

                    {/* SEARCH & FILTERS ROW */}
                    <div className="bg-[#080E27] border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between shadow-xl">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/3 border border-white/10 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition"
                            />
                        </div>

                        {/* Filters & Sorting */}
                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                            {/* Status Pills */}
                            <div className="flex items-center bg-white/3 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                                {["ALL", "UPCOMING", "ONGOING", "COMPLETED", "DRAFT"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition whitespace-nowrap ${
                                            filterStatus === status
                                                ? "bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/15 shadow"
                                                : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            {/* Sorting Dropdown */}
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                    <SlidersHorizontal size={12} />
                                    Sort:
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-[#080E27] text-white text-xs border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 outline-none cursor-pointer transition"
                                >
                                    <option value="date-asc">Date (Soonest first)</option>
                                    <option value="date-desc">Date (Latest first)</option>
                                    <option value="name-asc">Name (A-Z)</option>
                                    <option value="purse-desc">Purse (High to Low)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* LOADING */}
                    {loading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
                        </div>
                    )}

                    {/* NO DATA STATE */}
                    {!loading && processedTournaments.length === 0 && (
                        <div className="bg-[#080E27] border border-white/5 rounded-2xl py-16 px-6 text-center shadow-xl">
                            <div className="w-16 h-16 rounded-full bg-white/3 flex items-center justify-center text-gray-500 mx-auto mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No Tournaments Found</h3>
                            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                                {tournaments.length === 0 
                                    ? "Get started by creating your very first tournament season right now."
                                    : "We couldn't find any tournaments matching your current search queries and filters."
                                }
                            </p>
                            
                            {tournaments.length > 0 ? (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterStatus("ALL");
                                        setSortBy("date-asc");
                                    }}
                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs font-semibold transition"
                                >
                                    Reset All Filters
                                </button>
                            ) : (
                                <Link
                                    to="/tournaments/add"
                                    className="bg-[#FDB913] hover:bg-[#e0a20f] text-black px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-yellow-500/10 inline-flex items-center gap-1.5"
                                >
                                    <Plus size={16} />
                                    <span>Create Tournament</span>
                                </Link>
                            )}
                        </div>
                    )}

                    {/* TOURAMENTS GRID */}
                    {!loading && processedTournaments.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {processedTournaments.map((t) => {
                                const status = getTournamentStatus(t.date);
                                const badge = getStatusBadge(status);
                                const totalTeams = t.maxTeams || 0;
                                const registeredCount = t.teams?.length || 0;
                                const progress = totalTeams ? Math.min(100, (registeredCount / totalTeams) * 100) : 100;

                                return (
                                    <div
                                        key={t.id}
                                        className="bg-[#080E27] rounded-2xl p-6 border border-white/5 hover:border-white/15 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:shadow-black/25"
                                    >
                                        {/* Dynamic Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                        <div>
                                            {/* Header Info */}
                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center text-[#FDB913] shrink-0">
                                                        <Trophy size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h2 className="text-base font-bold text-white truncate hover:text-[#FDB913] transition duration-200">
                                                            <Link to={`/tournaments/${t.id}`} title={t.name}>{t.name}</Link>
                                                        </h2>
                                                        <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[10px] font-semibold border ${badge.classes}`}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details Info */}
                                            <div className="space-y-2.5 text-xs text-gray-400 mt-5 relative z-10">
                                                <div className="flex items-center gap-2.5">
                                                    <MapPin size={14} className="text-blue-400 shrink-0" />
                                                    <span className="truncate">{t.location || "Location TBD"}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Calendar size={14} className="text-amber-400 shrink-0" />
                                                    <span>{formatDate(t.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Coins size={14} className="text-green-400 shrink-0" />
                                                    <span className="text-green-400 font-semibold">{formatCurrency(t.purseAmount)}</span>
                                                </div>
                                            </div>

                                            {/* Team Enrollment Capacity */}
                                            <div className="mt-5 space-y-1.5 relative z-10">
                                                <div className="flex justify-between text-[11px] text-gray-500">
                                                    <span>Teams Slots filled</span>
                                                    <span className="font-semibold text-gray-300">
                                                        {registeredCount} / {totalTeams || "∞"}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-[#FDB913] h-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/5 relative z-10">
                                            <Link
                                                to={`/tournaments/${t.id}`}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-white transition duration-200 text-xs font-semibold"
                                            >
                                                <Eye size={13} />
                                                <span>View</span>
                                            </Link>
                                            
                                            <Link
                                                to={`/tournaments/edit/${t.id}`}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FDB913] hover:text-white transition duration-200 text-xs font-semibold"
                                            >
                                                <Edit size={13} />
                                                <span>Edit</span>
                                            </Link>
                                            
                                            <button
                                                onClick={() => {
                                                    setTournamentToDelete(t);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="inline-flex items-center justify-center p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white transition duration-200 text-xs"
                                                title="Delete Tournament"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </main>

            {/* DELETE CONFIRMATION MODAL */}
            {deleteModalOpen && tournamentToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => {
                            if (!deleting) {
                                setDeleteModalOpen(false);
                                setTournamentToDelete(null);
                            }
                        }}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-[#080E27] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 text-red-400 mb-4">
                            <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                                <AlertCircle size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Delete Tournament?</h3>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
                            Are you sure you want to delete <span className="font-semibold text-white">"{tournamentToDelete.name}"</span>? 
                            This action is permanent and will remove all associated teams, players, and auction configurations.
                        </p>
                        
                        <div className="flex gap-3 justify-end">
                            <button
                                disabled={deleting}
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setTournamentToDelete(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={deleting}
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TournamentPage;
