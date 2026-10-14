import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    getTournamentById,
    deleteTournament
} from "../../services/tournamentService";
import { deletePlayer } from "../../services/playerService";
import {
    Trophy,
    MapPin,
    Calendar,
    Coins,
    Users,
    ArrowLeft,
    Edit,
    Trash2,
    AlertTriangle,
    ShieldAlert,
    Clock,
    Plus,
    User,
    Search,
    SlidersHorizontal,
    Target,
    Zap,
    ShieldCheck,
    Eye,
    FileSpreadsheet
} from "lucide-react";
import { toast } from "react-hot-toast";
import BulkPlayerUploadModal from "../../components/players/BulkPlayerUploadModal";

/* ── helpers ─────────────────────────────────────────────── */
const ROLE_CONFIG = {
    Batsman: { color: "bg-blue-500/15 text-blue-400 border border-blue-500/25", icon: Target },
    Bowler: { color: "bg-red-500/15 text-red-400 border border-red-500/25", icon: Zap },
    "All-Rounder": { color: "bg-purple-500/15 text-purple-400 border border-purple-500/25", icon: ShieldCheck },
    "Wicket-Keeper": { color: "bg-amber-500/15 text-amber-400 border border-amber-500/25", icon: Users },
    Wicketkeeper: { color: "bg-amber-500/15 text-amber-400 border border-amber-500/25", icon: Users },
    default: { color: "bg-gray-500/15 text-gray-400 border border-gray-500/25", icon: User },
};

const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.default;
    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}
        >
            <Icon size={11} />
            {role || "—"}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const map = {
        UNSOLD: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
        SOLD: "bg-green-500/15 text-green-400 border border-green-500/25",
        PENDING: "bg-gray-500/15 text-gray-400 border border-gray-500/25",
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${map[status] || map.PENDING}`}
        >
            {status || "PENDING"}
        </span>
    );
};

const Avatar = ({ name }) => {
    const initials = name
        ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "P";
    const hue = (name?.charCodeAt(0) || 60) % 360;
    return (
        <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-black text-[11px] font-black shrink-0 shadow-md"
            style={{
                background: `linear-gradient(135deg, hsl(${hue},80%,60%), hsl(${(hue + 40) % 360},80%,50%))`,
            }}
        >
            {initials}
        </div>
    );
};

const TournamentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState("teams"); // tabs: teams, players, auctions

    // Players Tab Filter/Sort States
    const [playerSearchQuery, setPlayerSearchQuery] = useState("");
    const [playerRoleFilter, setPlayerRoleFilter] = useState("ALL");
    const [playerStatusFilter, setPlayerStatusFilter] = useState("ALL");
    const [playerSortBy, setPlayerSortBy] = useState("name-asc");

    // Player Deletion States
    const [playerDeleteModalOpen, setPlayerDeleteModalOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] = useState(null);
    const [deletingPlayer, setDeletingPlayer] = useState(false);

    // Bulk Upload Modal State
    const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);

    const fetchDetails = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getTournamentById(id);
            setTournament(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tournament details.");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails(true);
    }, [id]);

    // Memoized map of playerId -> { team, price } to fix missing soldRecord relation on player
    const soldPlayersMap = React.useMemo(() => {
        const map = new Map();
        if (!tournament || !tournament.teams) return map;
        tournament.teams.forEach(team => {
            if (team.playersWon) {
                team.playersWon.forEach(soldRec => {
                    map.set(soldRec.playerId, {
                        team,
                        price: soldRec.price || 0
                    });
                });
            }
        });
        return map;
    }, [tournament]);

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

    const handleDeletePlayer = async () => {
        if (!playerToDelete) return;
        setDeletingPlayer(true);
        try {
            await deletePlayer(playerToDelete.id);
            toast.success(`Player ${playerToDelete.name} deleted successfully`);

            // Update tournament.players state locally
            setTournament(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    players: (prev.players || []).filter(p => p.id !== playerToDelete.id)
                };
            });

            setPlayerDeleteModalOpen(false);
            setPlayerToDelete(null);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete player.");
        } finally {
            setDeletingPlayer(false);
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
        return new Intl.NumberFormat('en-IN').format(amount || 0) + " Pts";
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



    // Players analytics calculations
    const playerStats = (() => {
        if (!tournament.players) return { total: 0, sold: 0, unsold: 0, pending: 0, totalSpent: 0 };
        const total = tournament.players.length;
        let sold = 0;
        let unsold = 0;
        let pending = 0;
        let totalSpent = 0;

        tournament.players.forEach(p => {
            const isSold = soldPlayersMap.has(p.id);
            if (isSold) {
                sold++;
                totalSpent += soldPlayersMap.get(p.id).price;
            } else if (p.status === "UNSOLD") {
                unsold++;
            } else {
                pending++;
            }
        });

        return { total, sold, unsold, pending, totalSpent };
    })();

    // Filtering/sorting player pool
    const processedPlayers = (() => {
        if (!tournament.players) return [];
        let result = [...tournament.players];

        // Search Filter
        if (playerSearchQuery.trim() !== "") {
            const query = playerSearchQuery.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.role && p.role.toLowerCase().includes(query))
            );
        }

        // Role Filter
        if (playerRoleFilter !== "ALL") {
            result = result.filter(p => {
                if (playerRoleFilter === "Wicketkeeper") {
                    return p.role === "Wicketkeeper" || p.role === "Wicket-Keeper";
                }
                return p.role === playerRoleFilter;
            });
        }

        // Status Filter
        if (playerStatusFilter !== "ALL") {
            if (playerStatusFilter === "SOLD") {
                result = result.filter(p => soldPlayersMap.has(p.id));
            } else if (playerStatusFilter === "UNSOLD") {
                result = result.filter(p => !soldPlayersMap.has(p.id) && p.status === "UNSOLD");
            } else if (playerStatusFilter === "PENDING") {
                result = result.filter(p => !soldPlayersMap.has(p.id) && p.status !== "UNSOLD");
            }
        }

        // Sorting
        result.sort((a, b) => {
            if (playerSortBy === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (playerSortBy === "basePrice-desc") {
                return (b.basePrice || 0) - (a.basePrice || 0);
            }
            if (playerSortBy === "basePrice-asc") {
                return (a.basePrice || 0) - (b.basePrice || 0);
            }
            if (playerSortBy === "soldPrice-desc") {
                const priceA = soldPlayersMap.get(a.id)?.price || 0;
                const priceB = soldPlayersMap.get(b.id)?.price || 0;
                return priceB - priceA;
            }
            return 0;
        });

        return result;
    })();

    const getSoldTeam = (player) => {
        return soldPlayersMap.get(player.id)?.team || null;
    };

    const getSoldTeamName = (player) => {
        const team = getSoldTeam(player);
        return team ? team.name : "Unknown Team";
    };

    const getSoldPrice = (player) => {
        return soldPlayersMap.get(player.id)?.price || null;
    };

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
                                <div className="space-y-4 animate-in fade-in duration-200">
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
                                                        <p className="text-xs text-gray-500 font-medium">Remaining Points</p>
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
                                <div className="space-y-6 animate-in fade-in duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-200">Player Pool</h2>
                                            <p className="text-xs text-gray-500 mt-0.5">Manage player listings and auction statuses for this season</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setBulkUploadModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer"
                                            >
                                                <FileSpreadsheet size={14} className="text-emerald-400" />
                                                <span>Bulk Import Players</span>
                                            </button>
                                            <Link
                                                to={`/players/add?tournamentId=${id}`}
                                                className="inline-flex items-center gap-1.5 bg-[#FDB913] text-black px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition shadow-lg shadow-yellow-500/10 cursor-pointer"
                                            >
                                                <Plus size={14} /> Add Player
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Dynamic Mini Analytics Row */}
                                    {tournament.players?.length > 0 && (
                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                            <div className="bg-[#080E27]/40 border border-white/5 p-3 rounded-xl">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Pool</span>
                                                <span className="text-base font-black text-white mt-1 block">{playerStats.total}</span>
                                            </div>
                                            <div className="bg-[#080E27]/40 border border-white/5 p-3 rounded-xl">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Sold Players</span>
                                                <span className="text-base font-black text-green-400 mt-1 block">{playerStats.sold}</span>
                                            </div>
                                            <div className="bg-[#080E27]/40 border border-white/5 p-3 rounded-xl">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Unsold</span>
                                                <span className="text-base font-black text-yellow-500 mt-1 block">{playerStats.unsold}</span>
                                            </div>
                                            <div className="bg-[#080E27]/40 border border-white/5 p-3 rounded-xl">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pending Pool</span>
                                                <span className="text-base font-black text-blue-400 mt-1 block">{playerStats.pending}</span>
                                            </div>
                                            <div className="bg-[#080E27]/40 border border-white/5 p-3 rounded-xl col-span-2 lg:col-span-1">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Spent</span>
                                                <span className="text-base font-black text-[#FDB913] mt-1 block truncate">{formatCurrency(playerStats.totalSpent)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Interactive Filters Panel */}
                                    {tournament.players?.length > 0 && (
                                        <div className="bg-[#080E27]/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between shadow">
                                            {/* Search Bar */}
                                            <div className="relative flex-1 max-w-sm w-full">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                                                <input
                                                    type="text"
                                                    placeholder="Search player name..."
                                                    value={playerSearchQuery}
                                                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                                                    className="w-full bg-white/3 border border-white/8 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                                {/* Role Filter Selector */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-gray-500 font-medium">Role:</span>
                                                    <select
                                                        value={playerRoleFilter}
                                                        onChange={(e) => setPlayerRoleFilter(e.target.value)}
                                                        className="bg-[#080E27] border border-white/10 text-white text-[11px] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-white/20 transition"
                                                    >
                                                        <option value="ALL">All Roles</option>
                                                        <option value="Batsman">Batsmen</option>
                                                        <option value="Bowler">Bowlers</option>
                                                        <option value="All-Rounder">All-Rounders</option>
                                                        <option value="Wicketkeeper">Wicketkeeper</option>
                                                    </select>
                                                </div>

                                                {/* Status Filter Selector */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-gray-500 font-medium">Status:</span>
                                                    <select
                                                        value={playerStatusFilter}
                                                        onChange={(e) => setPlayerStatusFilter(e.target.value)}
                                                        className="bg-[#080E27] border border-white/10 text-white text-[11px] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-white/20 transition"
                                                    >
                                                        <option value="ALL">All Statuses</option>
                                                        <option value="PENDING">Pending/Pool</option>
                                                        <option value="SOLD">Sold</option>
                                                        <option value="UNSOLD">Unsold</option>
                                                    </select>
                                                </div>

                                                {/* Sort Selector */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                                                        <SlidersHorizontal size={11} />
                                                        Sort:
                                                    </span>
                                                    <select
                                                        value={playerSortBy}
                                                        onChange={(e) => setPlayerSortBy(e.target.value)}
                                                        className="bg-[#080E27] border border-white/10 text-white text-[11px] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-white/20 transition"
                                                    >
                                                        <option value="name-asc">Name (A-Z)</option>
                                                        <option value="basePrice-desc">Base Price (High to Low)</option>
                                                        <option value="basePrice-asc">Base Price (Low to High)</option>
                                                        <option value="soldPrice-desc">Sold Price (High to Low)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty list state */}
                                    {processedPlayers.length === 0 ? (
                                        <div className="bg-[#080E27]/40 border border-white/5 rounded-xl py-12 px-6 text-center shadow">
                                            <div className="w-12 h-12 rounded-full bg-white/3 flex items-center justify-center text-gray-500 mx-auto mb-3">
                                                <User size={24} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white mb-1">No Players Found</h3>
                                            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                                                {tournament.players?.length === 0
                                                    ? "Start adding players to this tournament to set up the draft pool."
                                                    : "No players matched your active search or filter selection."
                                                }
                                            </p>
                                            {tournament.players?.length === 0 && (
                                                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBulkUploadModalOpen(true)}
                                                        className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer"
                                                    >
                                                        <FileSpreadsheet size={14} className="text-emerald-400" />
                                                        <span>Upload Spreadsheet</span>
                                                    </button>
                                                    <Link
                                                        to={`/players/add?tournamentId=${id}`}
                                                        className="inline-flex items-center gap-1.5 bg-[#FDB913] text-black px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition cursor-pointer"
                                                    >
                                                        <Plus size={14} /> Add Player
                                                    </Link>
                                                </div>
                                            )}
                                            {tournament.players?.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setPlayerSearchQuery("");
                                                        setPlayerRoleFilter("ALL");
                                                        setPlayerStatusFilter("ALL");
                                                        setPlayerSortBy("name-asc");
                                                    }}
                                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                                                >
                                                    Reset Filters
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop View Table */}
                                            <div className="hidden md:block overflow-x-auto rounded-xl border border-white/5 bg-[#080E27]/30 shadow-lg">
                                                <table className="w-full text-xs text-left border-collapse">
                                                    <thead className="bg-[#001F54]/40 text-gray-400 font-semibold border-b border-white/5">
                                                        <tr>
                                                            <th className="p-4">Player</th>
                                                            <th className="p-4">Role</th>
                                                            <th className="p-4 text-right">Base Price</th>
                                                            <th className="p-4 text-center">Status</th>
                                                            <th className="p-4">Purchased By</th>
                                                            <th className="p-4 text-right">Sold Price</th>
                                                            <th className="p-4 text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {processedPlayers.map((player) => {
                                                            const soldTeam = getSoldTeam(player);
                                                            const isSold = soldPlayersMap.has(player.id);
                                                            const soldPriceVal = getSoldPrice(player);

                                                            return (
                                                                <tr key={player.id} className="hover:bg-white/3 transition duration-150">
                                                                    {/* Player Profile */}
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar name={player.name} />
                                                                            <div className="min-w-0">
                                                                                <span className="font-semibold text-gray-200 block truncate">{player.name}</span>
                                                                                <span className="text-[10px] text-gray-500 block mt-0.5">ID: {player.id?.slice(0, 8)}...</span>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    {/* Role */}
                                                                    <td className="p-4">
                                                                        <RoleBadge role={player.role} />
                                                                    </td>
                                                                    {/* Base Price */}
                                                                    <td className="p-4 text-right font-medium text-gray-300">
                                                                        {formatCurrency(player.basePrice)}
                                                                    </td>
                                                                    {/* Status */}
                                                                    <td className="p-4 text-center">
                                                                        <StatusBadge status={isSold ? "SOLD" : (player.status || "PENDING")} />
                                                                    </td>
                                                                    {/* Purchased By */}
                                                                    <td className="p-4">
                                                                        {isSold ? (
                                                                            <div className="flex items-center gap-2">
                                                                                {soldTeam?.logo ? (
                                                                                    <img
                                                                                        src={soldTeam.logo}
                                                                                        alt={soldTeam.name}
                                                                                        className="w-5 h-5 rounded-full border border-white/10 object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-5 h-5 rounded-full bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-black text-[9px] text-[#FDB913]">
                                                                                        {getSoldTeamName(player).substring(0, 2).toUpperCase()}
                                                                                    </div>
                                                                                )}
                                                                                <span className="text-gray-300 font-semibold truncate max-w-[120px]" title={getSoldTeamName(player)}>
                                                                                    {getSoldTeamName(player)}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-600">—</span>
                                                                        )}
                                                                    </td>
                                                                    {/* Sold Price */}
                                                                    <td className="p-4 text-right">
                                                                        {isSold ? (
                                                                            <span className="text-green-400 font-bold">
                                                                                {formatCurrency(soldPriceVal)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-600">—</span>
                                                                        )}
                                                                    </td>
                                                                    {/* Actions */}
                                                                    <td className="p-4">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <Link
                                                                                to={`/players/edit/${player.id}`}
                                                                                className="p-1.5 rounded-lg border border-[#FDB913]/20 bg-[#FDB913]/5 text-[#FDB913] hover:bg-[#FDB913]/15 hover:text-white transition"
                                                                                title="Edit Player Details"
                                                                            >
                                                                                <Edit size={12} />
                                                                            </Link>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setPlayerToDelete(player);
                                                                                    setPlayerDeleteModalOpen(true);
                                                                                }}
                                                                                className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:text-white transition"
                                                                                title="Delete Player"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile View Cards */}
                                            <div className="md:hidden space-y-3">
                                                {processedPlayers.map((player) => {
                                                    const soldTeam = getSoldTeam(player);
                                                    const isSold = soldPlayersMap.has(player.id);
                                                    const soldPriceVal = getSoldPrice(player);

                                                    return (
                                                        <div key={player.id} className="bg-[#080E27]/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between shadow">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar name={player.name} />
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-200 text-xs sm:text-sm">{player.name}</h4>
                                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                            <RoleBadge role={player.role} />
                                                                            <StatusBadge status={isSold ? "SOLD" : (player.status || "PENDING")} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1.5">
                                                                    <Link
                                                                        to={`/players/edit/${player.id}`}
                                                                        className="p-1.5 rounded-lg border border-[#FDB913]/20 bg-[#FDB913]/5 text-[#FDB913] hover:bg-[#FDB913]/15 transition"
                                                                    >
                                                                        <Edit size={12} />
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => {
                                                                            setPlayerToDelete(player);
                                                                            setPlayerDeleteModalOpen(true);
                                                                        }}
                                                                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 pt-3.5 border-t border-white/5 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                                                                <div>
                                                                    <span className="text-[10px] text-gray-500 block uppercase font-medium">Base Price</span>
                                                                    <span className="text-gray-300 font-bold">{formatCurrency(player.basePrice)}</span>
                                                                </div>

                                                                {isSold ? (
                                                                    <>
                                                                        <div>
                                                                            <span className="text-[10px] text-gray-500 block uppercase font-medium">Purchased By</span>
                                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                                {soldTeam?.logo ? (
                                                                                    <img
                                                                                        src={soldTeam.logo}
                                                                                        alt={soldTeam.name}
                                                                                        className="w-4 h-4 rounded-full border border-white/10 object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-4 h-4 rounded-full bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-black text-[8px] text-[#FDB913]">
                                                                                        {getSoldTeamName(player).substring(0, 2).toUpperCase()}
                                                                                    </div>
                                                                                )}
                                                                                <span className="text-gray-300 font-bold truncate max-w-[90px]">
                                                                                    {getSoldTeamName(player)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] text-gray-500 block uppercase font-medium">Sold Price</span>
                                                                            <span className="text-green-400 font-black">{formatCurrency(soldPriceVal)}</span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="col-span-2 text-gray-600 italic">Not sold yet</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* AUCTIONS TAB */}
                            {activeTab === "auctions" && (
                                <div className="space-y-4 animate-in fade-in duration-200">
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

            {/* PLAYER DELETE CONFIRMATION MODAL */}
            {playerDeleteModalOpen && playerToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0F1E4D] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Red visual top band */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />

                        <div className="flex items-center gap-3 text-red-400 mb-4">
                            <div className="bg-red-500/10 p-2 rounded-xl">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="font-bold text-white text-base">Delete Player?</h3>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-white">{playerToDelete.name}</span>?
                            This action cannot be undone and will remove all their bid records.
                        </p>

                        <div className="flex gap-3">
                            <button
                                disabled={deletingPlayer}
                                onClick={() => {
                                    setPlayerDeleteModalOpen(false);
                                    setPlayerToDelete(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={deletingPlayer}
                                onClick={handleDeletePlayer}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition flex items-center justify-center gap-2"
                            >
                                {deletingPlayer ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span>Delete</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BULK PLAYER UPLOAD MODAL */}
            <BulkPlayerUploadModal
                isOpen={bulkUploadModalOpen}
                onClose={() => setBulkUploadModalOpen(false)}
                tournamentId={id}
                tournamentName={tournament?.name}
                onSuccess={() => {
                    fetchDetails(false);
                }}
            />
        </div>
    );
};

export default TournamentDetails;
