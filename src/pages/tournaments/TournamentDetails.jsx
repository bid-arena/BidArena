import React, { useEffect, useState, useMemo, useRef } from "react";
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
    FileSpreadsheet,
    ChevronDown,
    Check,
    X,
    ExternalLink,
    Sparkles,
    RotateCcw,
    Wallet,
    Percent,
    Shield,
    Flame,
    ArrowRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import BulkPlayerUploadModal from "../../components/players/BulkPlayerUploadModal";

/* ─── Helpers & Configurations ────────────────────────────── */
const ROLE_CONFIG = {
    Batsman: { color: "bg-blue-500/15 text-blue-400 border border-blue-500/30", icon: Target },
    Bowler: { color: "bg-red-500/15 text-red-400 border border-red-500/30", icon: Zap },
    "All-Rounder": { color: "bg-purple-500/15 text-purple-400 border border-purple-500/30", icon: ShieldCheck },
    "Wicket-Keeper": { color: "bg-amber-500/15 text-amber-400 border border-amber-500/30", icon: Users },
    Wicketkeeper: { color: "bg-amber-500/15 text-amber-400 border border-amber-500/30", icon: Users },
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
        UNSOLD: { label: "Unsold", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
        SOLD: { label: "Sold", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
        PENDING: { label: "Pending", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    };
    const current = map[status] || map.PENDING;
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border ${current.color}`}
        >
            {current.label}
        </span>
    );
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0) + " Pts";
};

const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    return new Date(dateString).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
};

const getTournamentStatus = (dateString) => {
    if (!dateString) return { label: "Draft", color: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-400" };
    const tournamentDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tournamentDate.setHours(0, 0, 0, 0);

    if (tournamentDate.getTime() === today.getTime()) {
        return { label: "Live Today", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10", dot: "bg-emerald-400 animate-ping" };
    } else if (tournamentDate.getTime() > today.getTime()) {
        return { label: "Upcoming", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", dot: "bg-blue-400" };
    } else {
        return { label: "Concluded", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", dot: "bg-gray-400" };
    }
};

const Avatar = ({ name }) => {
    const initials = name
        ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "P";
    const hue = (name?.charCodeAt(0) || 60) % 360;
    return (
        <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-black text-xs font-black shrink-0 shadow-md ring-1 ring-white/10"
            style={{
                background: `linear-gradient(135deg, hsl(${hue},80%,60%), hsl(${(hue + 40) % 360},80%,50%))`,
            }}
        >
            {initials}
        </div>
    );
};

/* ─── Custom Glassmorphic Dropdown ────────────────────────── */
const CustomDropdown = ({
    id,
    label,
    icon: Icon,
    value,
    onChange,
    options,
    minWidth = "w-52"
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption =
        options.find((opt) => String(opt.value) === String(value)) || options[0];

    return (
        <div ref={ref} className="relative inline-block text-left">
            <button
                type="button"
                id={id}
                onClick={() => setOpen((prev) => !prev)}
                className={`group inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                    open
                        ? "bg-[#0F1B3D] border-[#FDB913]/60 text-white shadow-lg ring-1 ring-[#FDB913]/30"
                        : "bg-[#050B1A] border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-[#0c1435]"
                }`}
            >
                {Icon && (
                    <Icon
                        size={13}
                        className={`transition-colors shrink-0 ${
                            open ? "text-[#FDB913]" : "text-amber-400 group-hover:text-[#FDB913]"
                        }`}
                    />
                )}
                {label && <span className="text-gray-400 font-medium shrink-0">{label}:</span>}
                <span className="font-bold text-white truncate max-w-[130px]">
                    {selectedOption?.label || "Select"}
                </span>
                <ChevronDown
                    size={13}
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        open ? "rotate-180 text-[#FDB913]" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className={`absolute left-0 mt-2 ${minWidth} bg-[#0A122C]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1`}
                >
                    {options.map((option) => {
                        const isSelected = String(option.value) === String(value);
                        return (
                            <button
                                key={String(option.value)}
                                type="button"
                                onClick={() => onChange(option.value)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                    isSelected
                                        ? "bg-[#FDB913]/15 text-[#FDB913] font-bold"
                                        : "text-gray-300 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                <span className="truncate">{option.label}</span>
                                {isSelected && <Check size={14} className="text-[#FDB913] shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/* ─── Role / Status / Sort Options for Players Tab ───────── */
const ROLE_OPTIONS = [
    { label: "All Roles", value: "ALL" },
    { label: "Batsman", value: "Batsman" },
    { label: "Bowler", value: "Bowler" },
    { label: "All-Rounder", value: "All-Rounder" },
    { label: "Wicketkeeper", value: "Wicketkeeper" }
];

const STATUS_OPTIONS = [
    { label: "All Statuses", value: "ALL" },
    { label: "Pending Pool", value: "PENDING" },
    { label: "Sold", value: "SOLD" },
    { label: "Unsold", value: "UNSOLD" }
];

const SORT_OPTIONS = [
    { label: "Name (A-Z)", value: "name-asc" },
    { label: "Base Price (High-Low)", value: "basePrice-desc" },
    { label: "Base Price (Low-High)", value: "basePrice-asc" },
    { label: "Sold Price (High-Low)", value: "soldPrice-desc" }
];

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
    const soldPlayersMap = useMemo(() => {
        const map = new Map();
        if (!tournament || !tournament.teams) return map;
        tournament.teams.forEach((team) => {
            if (team.playersWon) {
                team.playersWon.forEach((soldRec) => {
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
            setTournament((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    players: (prev.players || []).filter((p) => p.id !== playerToDelete.id)
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

    // Calculating Tournament Financial & Team Stats
    const totalPurse = tournament?.purseAmount || 0;
    const maxTeams = tournament?.maxTeams || 0;
    const registeredTeamsCount = tournament?.teams?.length || 0;
    const registeredPlayersCount = tournament?.players?.length || 0;
    const allocatedPurse = tournament?.teams?.reduce((sum, t) => sum + (t.purseAmount || 0), 0) || 0;
    const remainingPurse = Math.max(0, totalPurse - allocatedPurse);
    const capacityPercent = maxTeams > 0 ? Math.min(100, Math.round((registeredTeamsCount / maxTeams) * 100)) : 100;

    // Players analytics calculations
    const playerStats = useMemo(() => {
        if (!tournament?.players) return { total: 0, sold: 0, unsold: 0, pending: 0, totalSpent: 0 };
        const total = tournament.players.length;
        let sold = 0;
        let unsold = 0;
        let pending = 0;
        let totalSpent = 0;

        tournament.players.forEach((p) => {
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
    }, [tournament?.players, soldPlayersMap]);

    // Filtering/sorting player pool
    const processedPlayers = useMemo(() => {
        if (!tournament?.players) return [];
        let result = [...tournament.players];

        // Search Filter
        if (playerSearchQuery.trim() !== "") {
            const query = playerSearchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(query)) ||
                    (p.role && p.role.toLowerCase().includes(query))
            );
        }

        // Role Filter
        if (playerRoleFilter !== "ALL") {
            result = result.filter((p) => {
                if (playerRoleFilter === "Wicketkeeper") {
                    return p.role === "Wicketkeeper" || p.role === "Wicket-Keeper";
                }
                return p.role === playerRoleFilter;
            });
        }

        // Status Filter
        if (playerStatusFilter !== "ALL") {
            if (playerStatusFilter === "SOLD") {
                result = result.filter((p) => soldPlayersMap.has(p.id));
            } else if (playerStatusFilter === "UNSOLD") {
                result = result.filter((p) => !soldPlayersMap.has(p.id) && p.status === "UNSOLD");
            } else if (playerStatusFilter === "PENDING") {
                result = result.filter((p) => !soldPlayersMap.has(p.id) && p.status !== "UNSOLD");
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
    }, [tournament?.players, playerSearchQuery, playerRoleFilter, playerStatusFilter, playerSortBy, soldPlayersMap]);

    const getSoldTeam = (player) => soldPlayersMap.get(player.id)?.team || null;
    const getSoldTeamName = (player) => getSoldTeam(player)?.name || "Unknown Team";
    const getSoldPrice = (player) => soldPlayersMap.get(player.id)?.price || null;

    if (loading) {
        return (
            <div className="min-h-screen flex bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm font-semibold">Loading tournament dashboard...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen flex bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <ShieldAlert size={48} className="text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
                    <p className="text-gray-400 max-w-md mb-6 text-sm">
                        The tournament details could not be retrieved. It may have been removed or the ID is incorrect.
                    </p>
                    <Link
                        to="/tournaments"
                        className="inline-flex items-center gap-2 bg-[#FDB913] text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition"
                    >
                        <ArrowLeft size={16} /> Back to Tournaments
                    </Link>
                </main>
            </div>
        );
    }

    const statusInfo = getTournamentStatus(tournament.date);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* BREADCRUMB & HEADER ACTIONS */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <Link
                            to="/tournaments"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group text-xs font-semibold"
                        >
                            <ArrowLeft
                                size={14}
                                className="group-hover:-translate-x-1 transition-transform"
                            />
                            <span>Back to Tournaments</span>
                        </Link>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <Link
                                to={`/tournaments/edit/${tournament.id}`}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#FDB913]/10 hover:bg-[#FDB913]/20 text-[#FDB913] border border-[#FDB913]/30 px-3.5 py-2 rounded-xl transition font-bold text-xs"
                            >
                                <Edit size={14} />
                                <span>Edit Season</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(true)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl transition font-bold text-xs cursor-pointer"
                            >
                                <Trash2 size={14} />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>

                    {/* HERO HEADER CARD WITH KPI TILES */}
                    <div className="relative rounded-2xl bg-[#080E27]/90 border border-white/10 p-6 sm:p-8 overflow-hidden shadow-2xl space-y-6">
                        {/* Background ambient gradient glow */}
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Hero Top: Status, Name, Venue, Date */}
                        <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="space-y-3 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                                        <Trophy size={13} className="text-[#FDB913]" />
                                        <span>TOURNAMENT DASHBOARD</span>
                                    </div>

                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${statusInfo.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-[#FDB913] tracking-tight uppercase leading-tight">
                                    {tournament.name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-amber-400 shrink-0" />
                                        <span className="text-gray-300 font-medium truncate max-w-xs">
                                            {tournament.location || "Venue Not Set"}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-blue-400 shrink-0" />
                                        <span className="text-gray-300 font-medium">
                                            {formatDate(tournament.date)}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* Quick Shortcut Buttons */}
                            <div className="flex flex-wrap items-center gap-2 self-start">
                                <Link
                                    to={`/players/add?tournamentId=${id}`}
                                    className="inline-flex items-center gap-1.5 bg-[#FDB913] text-black px-3.5 py-2 rounded-xl text-xs font-extrabold hover:scale-105 active:scale-95 transition shadow-lg shadow-[#FDB913]/10"
                                >
                                    <Plus size={14} /> Add Player
                                </Link>
                                <Link
                                    to={`/teams/add?tournamentId=${id}`}
                                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold transition"
                                >
                                    <Users size={14} className="text-[#FDB913]" /> Add Team
                                </Link>
                            </div>
                        </div>

                        {/* FINANCIAL & CAPACITY KPI METRICS STRIP */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            <div className="p-4 rounded-xl bg-[#050B1A] border border-white/5 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                                    <Coins size={11} className="text-[#FDB913]" /> Total Purse
                                </span>
                                <p className="text-base sm:text-lg font-black text-[#FDB913] font-mono truncate">
                                    {formatCurrency(totalPurse)}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-[#050B1A] border border-white/5 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                                    <Wallet size={11} className="text-green-400" /> Allocated
                                </span>
                                <p className="text-base sm:text-lg font-bold text-green-400 font-mono truncate">
                                    {formatCurrency(allocatedPurse)}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-[#050B1A] border border-white/5 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                                    <Users size={11} className="text-blue-400" /> Teams
                                </span>
                                <p className="text-base sm:text-lg font-bold text-white truncate">
                                    {registeredTeamsCount}{" "}
                                    <span className="text-xs text-gray-500 font-normal">
                                        / {maxTeams ? `${maxTeams} max` : "∞"}
                                    </span>
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-[#050B1A] border border-white/5 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                                    <User size={11} className="text-purple-400" /> Player Pool
                                </span>
                                <p className="text-base sm:text-lg font-bold text-purple-400 truncate">
                                    {registeredPlayersCount}{" "}
                                    <span className="text-xs text-gray-500 font-normal">
                                        ({playerStats.sold} Sold)
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT TABS */}
                    <div className="bg-[#080E27]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Tab Headers */}
                        <div className="flex border-b border-white/10 bg-[#050B1A]/80 p-1.5 gap-1.5 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab("teams")}
                                className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === "teams"
                                        ? "bg-[#FDB913] text-black shadow-lg shadow-[#FDB913]/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <Users size={15} />
                                <span>Teams ({registeredTeamsCount})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("players")}
                                className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === "players"
                                        ? "bg-[#FDB913] text-black shadow-lg shadow-[#FDB913]/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <User size={15} />
                                <span>Player Pool ({registeredPlayersCount})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("auctions")}
                                className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === "auctions"
                                        ? "bg-[#FDB913] text-black shadow-lg shadow-[#FDB913]/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <Clock size={15} />
                                <span>Live Auctions ({tournament.auctions?.length || 0})</span>
                            </button>
                        </div>

                        {/* Tab Body */}
                        <div className="p-6 sm:p-8">
                            {/* ── TEAMS TAB ───────────────────────── */}
                            {activeTab === "teams" && (
                                <div className="space-y-6 animate-in fade-in duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                                <Users size={18} className="text-[#FDB913]" />
                                                <span>Participating Franchises</span>
                                            </h2>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Overview of registered squads and remaining auction point budgets.
                                            </p>
                                        </div>
                                        <Link
                                            to={`/teams/add?tournamentId=${id}`}
                                            className="inline-flex items-center gap-1.5 bg-[#FDB913] text-black px-3.5 py-2 rounded-xl text-xs font-extrabold hover:scale-105 active:scale-95 transition shadow-sm self-start sm:self-auto cursor-pointer"
                                        >
                                            <Plus size={14} /> Add Franchise
                                        </Link>
                                    </div>

                                    {registeredTeamsCount === 0 ? (
                                        <div className="py-16 text-center bg-[#050B1A]/50 rounded-2xl border border-white/5 p-6 space-y-3">
                                            <div className="w-12 h-12 rounded-2xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center text-[#FDB913] mx-auto">
                                                <Users size={22} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white">No Franchises Registered</h3>
                                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                                Add teams to this tournament to allocate their bidding purses and begin roster recruitment.
                                            </p>
                                            <Link
                                                to={`/teams/add?tournamentId=${id}`}
                                                className="inline-flex items-center gap-1.5 bg-[#FDB913] text-black px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition"
                                            >
                                                <Plus size={14} /> Register First Team
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tournament.teams.map((team) => {
                                                const totalTeamPurse = team.purseAmount || 0;
                                                const remPurse = team.remainingPurse || 0;
                                                const squadCount = team.playersWon?.length || 0;
                                                const spentPurse = Math.max(0, totalTeamPurse - remPurse);
                                                const spentPct = totalTeamPurse > 0 ? Math.round((spentPurse / totalTeamPurse) * 100) : 0;

                                                return (
                                                    <Link
                                                        key={team.id}
                                                        to={`/teams/${team.id}`}
                                                        className="group bg-[#050B1A] border border-white/10 hover:border-[#FDB913]/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 block space-y-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3.5 min-w-0">
                                                                {team.logo ? (
                                                                    <img
                                                                        src={team.logo}
                                                                        alt={team.name}
                                                                        className="w-12 h-12 rounded-xl border border-white/10 object-cover shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-black text-sm text-[#FDB913] shrink-0">
                                                                        {team.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <h4 className="font-bold text-white group-hover:text-[#FDB913] transition-colors truncate">
                                                                        {team.name}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                                        <Shield size={11} className="text-[#FDB913]" />
                                                                        <span>Captain: {team.captainName || "Not assigned"}</span>
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 shrink-0">
                                                                {squadCount} Signed
                                                            </span>
                                                        </div>

                                                        {/* Team Purse Breakdown */}
                                                        <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 uppercase font-semibold block">
                                                                    Remaining Budget
                                                                </span>
                                                                <span className="font-extrabold text-emerald-400 font-mono">
                                                                    {formatCurrency(remPurse)}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[10px] text-gray-500 uppercase font-semibold block">
                                                                    Starting Purse
                                                                </span>
                                                                <span className="font-bold text-gray-300 font-mono">
                                                                    {formatCurrency(totalTeamPurse)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Mini Spent Progress */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                                                                <span>Budget Utilized</span>
                                                                <span>{spentPct}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-emerald-500 to-[#FDB913] rounded-full transition-all duration-300"
                                                                    style={{ width: `${spentPct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PLAYERS TAB ─────────────────────── */}
                            {activeTab === "players" && (
                                <div className="space-y-6 animate-in fade-in duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                                <User size={18} className="text-[#FDB913]" />
                                                <span>Season Player Pool</span>
                                            </h2>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Manage athlete rosters, reserve base prices, and auction statuses.
                                            </p>
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
                                                className="inline-flex items-center gap-1.5 bg-[#FDB913] text-black px-4 py-2 rounded-xl text-xs font-extrabold hover:scale-105 active:scale-95 transition shadow-lg shadow-yellow-500/10 cursor-pointer"
                                            >
                                                <Plus size={14} /> Add Player
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Dynamic Player Analytics Strip */}
                                    {tournament.players?.length > 0 && (
                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                            <div className="bg-[#050B1A] border border-white/5 p-3.5 rounded-xl">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Pool</span>
                                                <span className="text-base font-black text-white mt-1 block">{playerStats.total}</span>
                                            </div>
                                            <div className="bg-[#050B1A] border border-white/5 p-3.5 rounded-xl">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sold</span>
                                                <span className="text-base font-black text-emerald-400 mt-1 block">{playerStats.sold}</span>
                                            </div>
                                            <div className="bg-[#050B1A] border border-white/5 p-3.5 rounded-xl">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Unsold</span>
                                                <span className="text-base font-black text-amber-400 mt-1 block">{playerStats.unsold}</span>
                                            </div>
                                            <div className="bg-[#050B1A] border border-white/5 p-3.5 rounded-xl">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pending</span>
                                                <span className="text-base font-black text-blue-400 mt-1 block">{playerStats.pending}</span>
                                            </div>
                                            <div className="bg-[#050B1A] border border-white/5 p-3.5 rounded-xl col-span-2 lg:col-span-1">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Spend</span>
                                                <span className="text-base font-black text-[#FDB913] mt-1 block truncate font-mono">
                                                    {formatCurrency(playerStats.totalSpent)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* SEARCH & CUSTOM DROPDOWN FILTERS PANEL */}
                                    {tournament.players?.length > 0 && (
                                        <div className="bg-[#050B1A] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
                                            {/* Search input with clear button */}
                                            <div className="relative flex-1 max-w-sm">
                                                <Search
                                                    size={14}
                                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Search player name or role..."
                                                    value={playerSearchQuery}
                                                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                                                    className="w-full bg-[#080E27] border border-white/10 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/30 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
                                                />
                                                {playerSearchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPlayerSearchQuery("")}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Dropdowns group */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* Role Dropdown */}
                                                <CustomDropdown
                                                    id="player-role-dropdown"
                                                    label="Role"
                                                    icon={Target}
                                                    value={playerRoleFilter}
                                                    onChange={setPlayerRoleFilter}
                                                    options={ROLE_OPTIONS}
                                                    minWidth="w-44"
                                                />

                                                {/* Status Dropdown */}
                                                <CustomDropdown
                                                    id="player-status-dropdown"
                                                    label="Status"
                                                    icon={ShieldCheck}
                                                    value={playerStatusFilter}
                                                    onChange={setPlayerStatusFilter}
                                                    options={STATUS_OPTIONS}
                                                    minWidth="w-44"
                                                />

                                                {/* Sort Dropdown */}
                                                <CustomDropdown
                                                    id="player-sort-dropdown"
                                                    label="Sort"
                                                    icon={SlidersHorizontal}
                                                    value={playerSortBy}
                                                    onChange={setPlayerSortBy}
                                                    options={SORT_OPTIONS}
                                                    minWidth="w-56"
                                                />

                                                {/* Active Filters Clear Button */}
                                                {(playerSearchQuery ||
                                                    playerRoleFilter !== "ALL" ||
                                                    playerStatusFilter !== "ALL" ||
                                                    playerSortBy !== "name-asc") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPlayerSearchQuery("");
                                                            setPlayerRoleFilter("ALL");
                                                            setPlayerStatusFilter("ALL");
                                                            setPlayerSortBy("name-asc");
                                                        }}
                                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                                                        title="Reset filters"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty list state */}
                                    {processedPlayers.length === 0 ? (
                                        <div className="bg-[#050B1A]/50 border border-white/5 rounded-2xl py-14 px-6 text-center shadow">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mx-auto mb-3">
                                                <User size={22} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white mb-1">No Players Found</h3>
                                            <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
                                                {tournament.players?.length === 0
                                                    ? "Start adding players to this season to build the live auction pool."
                                                    : "No players matched your active search or filter selection."}
                                            </p>
                                            {tournament.players?.length === 0 ? (
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
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setPlayerSearchQuery("");
                                                        setPlayerRoleFilter("ALL");
                                                        setPlayerStatusFilter("ALL");
                                                        setPlayerSortBy("name-asc");
                                                    }}
                                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                                                >
                                                    Reset All Filters
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop View Table */}
                                            <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-[#050B1A] shadow-xl">
                                                <table className="w-full text-xs text-left border-collapse">
                                                    <thead className="bg-[#080E27] text-gray-400 font-bold border-b border-white/10 uppercase tracking-wider text-[10px]">
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
                                                                <tr key={player.id} className="hover:bg-white/5 transition duration-150">
                                                                    {/* Player Profile */}
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar name={player.name} />
                                                                            <div className="min-w-0">
                                                                                <span className="font-bold text-white block truncate">{player.name}</span>
                                                                                <span className="text-[10px] text-gray-500 font-mono block">ID: {player.id?.slice(0, 8)}...</span>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    {/* Role */}
                                                                    <td className="p-4">
                                                                        <RoleBadge role={player.role} />
                                                                    </td>
                                                                    {/* Base Price */}
                                                                    <td className="p-4 text-right font-mono font-bold text-gray-300">
                                                                        {formatCurrency(player.basePrice)}
                                                                    </td>
                                                                    {/* Status */}
                                                                    <td className="p-4 text-center">
                                                                        <StatusBadge status={isSold ? "SOLD" : player.status || "PENDING"} />
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
                                                                                <span
                                                                                    className="text-gray-200 font-bold truncate max-w-[120px]"
                                                                                    title={getSoldTeamName(player)}
                                                                                >
                                                                                    {getSoldTeamName(player)}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-600">—</span>
                                                                        )}
                                                                    </td>
                                                                    {/* Sold Price */}
                                                                    <td className="p-4 text-right font-mono">
                                                                        {isSold ? (
                                                                            <span className="text-emerald-400 font-black">
                                                                                {formatCurrency(soldPriceVal)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-600">—</span>
                                                                        )}
                                                                    </td>
                                                                    {/* Actions */}
                                                                    <td className="p-4">
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            <Link
                                                                                to={`/players/edit/${player.id}`}
                                                                                className="p-1.5 rounded-lg border border-[#FDB913]/20 bg-[#FDB913]/5 text-[#FDB913] hover:bg-[#FDB913]/20 transition"
                                                                                title="Edit Player"
                                                                            >
                                                                                <Edit size={13} />
                                                                            </Link>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setPlayerToDelete(player);
                                                                                    setPlayerDeleteModalOpen(true);
                                                                                }}
                                                                                className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                                                                                title="Delete Player"
                                                                            >
                                                                                <Trash2 size={13} />
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
                                                        <div
                                                            key={player.id}
                                                            className="bg-[#050B1A] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <Avatar name={player.name} />
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-bold text-white text-sm truncate">
                                                                            {player.name}
                                                                        </h4>
                                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                                            <RoleBadge role={player.role} />
                                                                            <StatusBadge status={isSold ? "SOLD" : player.status || "PENDING"} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-1.5 shrink-0">
                                                                    <Link
                                                                        to={`/players/edit/${player.id}`}
                                                                        className="p-1.5 rounded-lg border border-[#FDB913]/20 bg-[#FDB913]/5 text-[#FDB913]"
                                                                    >
                                                                        <Edit size={13} />
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => {
                                                                            setPlayerToDelete(player);
                                                                            setPlayerDeleteModalOpen(true);
                                                                        }}
                                                                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                    <span className="text-[10px] text-gray-500 uppercase font-medium block">Base Price</span>
                                                                    <span className="text-gray-200 font-bold font-mono">{formatCurrency(player.basePrice)}</span>
                                                                </div>

                                                                {isSold ? (
                                                                    <div>
                                                                        <span className="text-[10px] text-gray-500 uppercase font-medium block">Sold Price</span>
                                                                        <span className="text-emerald-400 font-black font-mono">{formatCurrency(soldPriceVal)}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-gray-600 italic">Unsold</div>
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

                            {/* ── AUCTIONS TAB ────────────────────── */}
                            {activeTab === "auctions" && (
                                <div className="space-y-6 animate-in fade-in duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                                <Clock size={18} className="text-[#FDB913]" />
                                                <span>Tournament Auction Stages</span>
                                            </h2>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Access real-time bidding consoles and historical stage transcripts.
                                            </p>
                                        </div>
                                    </div>

                                    {!tournament.auctions || tournament.auctions.length === 0 ? (
                                        <div className="py-16 text-center bg-[#050B1A]/50 rounded-2xl border border-white/5 p-6 space-y-3">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mx-auto">
                                                <Clock size={22} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white">No Auctions Scheduled</h3>
                                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                                Once franchises and players are enrolled, live auction rooms will appear here.
                                            </p>
                                            <Link
                                                to="/auctions"
                                                className="inline-flex items-center gap-1.5 bg-[#FDB913] text-black px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition"
                                            >
                                                Go to Auctions Hub
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tournament.auctions.map((auction) => (
                                                <div
                                                    key={auction.id}
                                                    className="bg-[#050B1A] border border-white/10 hover:border-[#FDB913]/40 rounded-2xl p-5 space-y-4 shadow-xl transition"
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">
                                                                Stage #{auction.id.substring(0, 8).toUpperCase()}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Created on: {new Date(auction.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                                                                auction.status === "ACTIVE"
                                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                                    : auction.status === "COMPLETED"
                                                                    ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                                                    : "bg-amber-500/10 text-[#FDB913] border-[#FDB913]/30"
                                                            }`}
                                                        >
                                                            {auction.status}
                                                        </span>
                                                    </div>

                                                    <Link
                                                        to="/auctions"
                                                        className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FDB913] to-[#e09e07] hover:from-[#fec435] text-black py-2.5 rounded-xl text-xs font-extrabold transition shadow-lg shadow-[#FDB913]/10"
                                                    >
                                                        <span>Enter Auction Arena</span>
                                                        <ArrowRight size={14} />
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

            {/* DELETE TOURNAMENT CONFIRMATION MODAL */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#080E27] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />

                        <div className="flex items-center gap-3 text-red-400">
                            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Delete Tournament?</h3>
                                <p className="text-xs text-gray-400">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs text-gray-300">
                            <p>
                                Are you sure you want to permanently delete{" "}
                                <span className="font-extrabold text-white">"{tournament.name}"</span>?
                            </p>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-200 text-xs flex gap-2">
                                <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
                                <span>
                                    <strong>CRITICAL:</strong> All associated franchises, registered players, bid records, and stage logs will be permanently purged.
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-bold transition text-xs text-gray-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-extrabold transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer"
                            >
                                {deleting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 size={14} />
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
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#080E27] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 space-y-4">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />

                        <div className="flex items-center gap-3 text-red-400">
                            <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">Delete Player?</h3>
                                <p className="text-[11px] text-gray-400">Remove player from season pool</p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-white">{playerToDelete.name}</span>?
                            Their registration and bidding transactions will be removed.
                        </p>

                        <div className="flex gap-2.5 pt-2">
                            <button
                                disabled={deletingPlayer}
                                onClick={() => {
                                    setPlayerDeleteModalOpen(false);
                                    setPlayerToDelete(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={deletingPlayer}
                                onClick={handleDeletePlayer}
                                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-red-500 hover:bg-red-600 text-white transition flex items-center justify-center gap-2 cursor-pointer"
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
