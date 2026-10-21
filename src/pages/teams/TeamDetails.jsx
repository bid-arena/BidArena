import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    getTeamById,
    deleteTeam
} from "../../services/teamService";
import {
    getPlayersByTournament,
    getPlayers
} from "../../services/playerService";
import PlayerDetailsModal from "../../components/players/PlayerDetailsModal";
import {
    Trophy,
    User,
    Coins,
    Users,
    ArrowLeft,
    Edit,
    Trash2,
    AlertTriangle,
    ShieldAlert,
    Clock,
    Plus,
    Mail,
    Eye,
    Target,
    Zap,
    ShieldCheck,
    Shield,
    Sparkles,
    Search,
    LayoutGrid,
    List,
    TrendingUp,
    Wallet,
    CheckCircle2,
    Calendar,
    ArrowUpRight
} from "lucide-react";
import { toast } from "react-hot-toast";

import batsmanIcon from "../../assets/icons/batsman-rb.png";
import bowlerIcon from "../../assets/icons/bowler-rb.png";
import allRounderIcon from "../../assets/icons/all-rounder-rb.png";
import wicketkeeperIcon from "../../assets/icons/wicketkeeper-rb.png";

/* ─── Role Configuration ──────────────────────────────────── */
const ROLE_CONFIG = {
    Batsman: {
        color: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
        badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        accent: "#38bdf8",
        icon: Target,
        image: batsmanIcon,
        label: "Batsman",
    },
    Batter: {
        color: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
        badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        accent: "#38bdf8",
        icon: Target,
        image: batsmanIcon,
        label: "Batsman",
    },
    Bowler: {
        color: "bg-red-500/15 text-red-400 border border-red-500/25",
        badge: "bg-red-500/20 text-red-300 border-red-500/30",
        accent: "#f87171",
        icon: Zap,
        image: bowlerIcon,
        label: "Bowler",
    },
    "All-Rounder": {
        color: "bg-purple-500/15 text-purple-400 border border-purple-500/25",
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        accent: "#c084fc",
        icon: ShieldCheck,
        image: allRounderIcon,
        label: "All-Rounder",
    },
    "Wicket-Keeper": {
        color: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        accent: "#fbbf24",
        icon: Users,
        image: wicketkeeperIcon,
        label: "Wicket-Keeper",
    },
    Wicketkeeper: {
        color: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        accent: "#fbbf24",
        icon: Users,
        image: wicketkeeperIcon,
        label: "Wicket-Keeper",
    },
    default: {
        color: "bg-gray-500/15 text-gray-400 border border-gray-500/25",
        badge: "bg-gray-500/20 text-gray-300 border-gray-500/30",
        accent: "#9ca3af",
        icon: User,
        image: null,
        label: "Player",
    },
};

const getRoleConfig = (role) => {
    if (!role) return ROLE_CONFIG.default;
    return ROLE_CONFIG[role] || ROLE_CONFIG.default;
};

const RoleBadge = ({ role, compact = false }) => {
    const cfg = getRoleConfig(role);
    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 font-bold border rounded-full ${
                compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
            } ${cfg.badge}`}
        >
            <Icon size={compact ? 10 : 12} />
            <span>{role || "Player"}</span>
        </span>
    );
};

/* ─── Currency / Points Formatter ─────────────────────────── */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0) + " Pts";
};

/* ─── Dynamic Avatar Style ────────────────────────────────── */
const getTeamAvatarStyle = (name) => {
    const hue = ((name?.charCodeAt(0) || 65) * 47) % 360;
    return {
        background: `linear-gradient(135deg, hsl(${hue}, 85%, 60%), hsl(${(hue + 45) % 360}, 90%, 45%))`,
    };
};

/* ══════════════════════════════════════════════════════════ */
const TeamDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playersMap, setPlayersMap] = useState({});
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState("roster"); // "roster" | "bids"

    // Roster search, filter, and view
    const [rosterSearch, setRosterSearch] = useState("");
    const [rosterRoleFilter, setRosterRoleFilter] = useState("ALL");
    const [rosterViewMode, setRosterViewMode] = useState("grid"); // "grid" | "table"

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getTeamById(id);
                setTeam(data);

                // Fetch players to ensure names are resolved even if unpopulated
                try {
                    let playersList = [];
                    if (data?.tournamentId) {
                        playersList = await getPlayersByTournament(data.tournamentId);
                    } else {
                        playersList = await getPlayers();
                    }
                    const map = {};
                    (playersList || []).forEach((p) => {
                        if (p.id) map[p.id] = p;
                        if (p._id) map[p._id] = p;
                    });
                    setPlayersMap(map);
                } catch (pErr) {
                    console.warn("Could not load players map for team details:", pErr);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load franchise details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const getPlayerData = (record) => {
        if (!record) return { name: "Unknown Player", role: "Player", id: null, image: null };
        const p = record.player;
        if (p && (p.name || p.playerName)) {
            return {
                name: p.name || p.playerName,
                role: p.role || "Player",
                basePrice: p.basePrice,
                image: p.image,
                id: p.id || p._id || record.playerId
            };
        }
        if (record.name || record.playerName) {
            return {
                name: record.name || record.playerName,
                role: record.role || "Player",
                basePrice: record.basePrice,
                image: record.image,
                id: record.playerId || record.id
            };
        }
        const pId = record.playerId || record.id;
        const found = playersMap[pId] || (pId ? playersMap[String(pId)] : null);
        if (found) {
            return {
                name: found.name,
                role: found.role || "Player",
                basePrice: found.basePrice,
                image: found.image,
                id: found.id || found._id || pId
            };
        }
        return {
            name: pId ? `Player #${String(pId).substring(0, 8).toUpperCase()}` : "Unknown Player",
            role: "Player",
            basePrice: null,
            image: null,
            id: pId
        };
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteTeam(id);
            toast.success("Franchise deleted successfully!");
            navigate("/teams");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete team.");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    // Filtered won players
    const filteredPlayers = useMemo(() => {
        if (!team?.playersWon) return [];
        return team.playersWon.filter((record) => {
            const pData = getPlayerData(record);
            const matchesSearch =
                pData.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                (pData.role && pData.role.toLowerCase().includes(rosterSearch.toLowerCase()));
            const matchesRole =
                rosterRoleFilter === "ALL" ||
                pData.role?.toLowerCase() === rosterRoleFilter.toLowerCase();
            return matchesSearch && matchesRole;
        });
    }, [team?.playersWon, rosterSearch, rosterRoleFilter, playersMap]);

    // Role Distribution Breakdown
    const roleDistribution = useMemo(() => {
        const counts = { Batsman: 0, Bowler: 0, "All-Rounder": 0, "Wicket-Keeper": 0 };
        if (team?.playersWon) {
            team.playersWon.forEach((record) => {
                const p = getPlayerData(record);
                const r = p.role;
                if (r === "Batsman" || r === "Batter") counts.Batsman++;
                else if (r === "Bowler") counts.Bowler++;
                else if (r === "All-Rounder") counts["All-Rounder"]++;
                else if (r === "Wicket-Keeper" || r === "Wicketkeeper") counts["Wicket-Keeper"]++;
            });
        }
        return counts;
    }, [team?.playersWon, playersMap]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm font-semibold">Loading franchise squad details…</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white">Franchise Not Found</h2>
                        <p className="text-gray-400 text-sm max-w-md mx-auto">
                            The team profile could not be retrieved. It may have been removed or the URL is incorrect.
                        </p>
                    </div>
                    <Link
                        to="/teams"
                        className="inline-flex items-center gap-2 bg-[#FDB913] hover:bg-[#FDB913]/90 text-black px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-yellow-500/20 active:scale-95"
                    >
                        <ArrowLeft size={16} /> Back to Teams
                    </Link>
                </main>
            </div>
        );
    }

    // Calculating Stats
    const totalPurse = team.purseAmount || 0;
    const remainingPurse = team.remainingPurse || 0;
    const spentPurse = Math.max(0, totalPurse - remainingPurse);
    const spentPercent = totalPurse > 0 ? (spentPurse / totalPurse) * 100 : 0;
    const rosterCount = team.playersWon?.length || 0;
    const bidsCount = team.bids?.length || 0;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white selection:bg-[#FDB913] selection:text-black">
            <Sidebar />

            <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 w-full overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                    {/* ── TOP NAV BAR ── */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <Link
                            to="/teams"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#FDB913] transition group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Teams Management</span>
                        </Link>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <Link
                                to={`/teams/edit/${team.id}`}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FDB913] border border-[#FDB913]/30 px-4 py-2 rounded-xl transition font-bold text-xs active:scale-95 shadow-sm"
                            >
                                <Edit size={14} />
                                <span>Edit Profile</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(true)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl transition font-bold text-xs active:scale-95 shadow-sm cursor-pointer"
                            >
                                <Trash2 size={14} />
                                <span>Delete Team</span>
                            </button>
                        </div>
                    </div>

                    {/* ── HERO FRANCHISE BANNER ── */}
                    <div className="bg-[#080E27] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                        {/* Ambient Glows */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FDB913]/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 text-center md:text-left">
                            {/* Franchise Crest / Logo */}
                            {team.logo ? (
                                <img
                                    src={team.logo}
                                    alt={team.name}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-[#FDB913]/40 shadow-2xl shrink-0 bg-[#050B1A]"
                                />
                            ) : (
                                <div
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-black font-black text-3xl shadow-2xl shrink-0 border-2 border-white/20"
                                    style={getTeamAvatarStyle(team.name)}
                                >
                                    {team.name ? team.name.substring(0, 2).toUpperCase() : "TM"}
                                </div>
                            )}

                            <div className="space-y-3 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/25 flex items-center gap-1.5">
                                        <Shield size={11} /> FRANCHISE ARENA
                                    </span>
                                    {team.tournament && (
                                        <Link
                                            to={`/tournaments/${team.tournament.id}`}
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-semibold border border-white/10 transition"
                                        >
                                            <Trophy size={11} className="text-[#FDB913]" />
                                            <span>{team.tournament.name}</span>
                                            <ArrowUpRight size={10} className="text-gray-500" />
                                        </Link>
                                    )}
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                                        ACTIVE SQUAD ({rosterCount})
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
                                    {team.name}
                                </h1>

                                <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-6 text-xs text-gray-400">
                                    <span className="flex items-center gap-1.5 bg-[#050B1A] px-3 py-1.5 rounded-xl border border-white/5">
                                        <User size={13} className="text-blue-400 shrink-0" />
                                        <span>
                                            Owner: <strong className="text-gray-200">{team.ownerName || "Unassigned"}</strong>
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-[#050B1A] px-3 py-1.5 rounded-xl border border-white/5">
                                        <Mail size={13} className="text-[#FDB913] shrink-0" />
                                        <span>
                                            Email: <strong className="text-gray-200">{team.ownerEmail || "Not provided"}</strong>
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-[#050B1A] px-3 py-1.5 rounded-xl border border-white/5 font-mono">
                                        <Calendar size={13} className="text-purple-400 shrink-0" />
                                        <span>
                                            ID: #{String(team.id).slice(-6).toUpperCase()}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── KPI METRICS CARDS ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                        {/* TOTAL STARTING PURSE */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Allocated Purse
                                </span>
                                <div className="p-2 rounded-xl bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/20">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-lg sm:text-2xl font-black text-white truncate">
                                    {formatCurrency(totalPurse)}
                                </h3>
                                <p className="text-[11px] text-gray-500">Starting point budget</p>
                            </div>
                        </div>

                        {/* REMAINING PURSE */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Remaining Capital
                                </span>
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Wallet size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-lg sm:text-2xl font-black text-emerald-400 truncate">
                                    {formatCurrency(remainingPurse)}
                                </h3>
                                <p className="text-[11px] text-gray-500">Available to bid</p>
                            </div>
                        </div>

                        {/* PURSE SPENT & BURN PROGRESS */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Purse Spent
                                </span>
                                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <TrendingUp size={16} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="text-lg sm:text-2xl font-black text-white truncate">
                                        {formatCurrency(spentPurse)}
                                    </h3>
                                    <span
                                        className={`text-xs font-bold font-mono ${
                                            spentPercent >= 80
                                                ? "text-red-400"
                                                : spentPercent >= 50
                                                ? "text-amber-400"
                                                : "text-emerald-400"
                                        }`}
                                    >
                                        {spentPercent.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-[#050B1A] rounded-full h-1.5 overflow-hidden border border-white/5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-500 ${
                                            spentPercent >= 80
                                                ? "bg-red-500"
                                                : spentPercent >= 50
                                                ? "bg-amber-400"
                                                : "bg-emerald-400"
                                        }`}
                                        style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SQUAD SIZE */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Squad Roster
                                </span>
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Users size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-lg sm:text-2xl font-black text-white">
                                    {rosterCount}
                                </h3>
                                <p className="text-[11px] text-gray-500">Won in live auction</p>
                            </div>
                        </div>
                    </div>

                    {/* ── ROLE DISTRIBUTION BREAKDOWN TILES ── */}
                    <div className="bg-[#080E27] border border-white/10 rounded-2xl p-4 shadow-xl">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Users size={14} className="text-[#FDB913]" /> Roster Role Balance
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono">
                                Total: {rosterCount} Players
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {/* Batsman */}
                            <div className="p-3 rounded-xl bg-[#050B1A] border border-blue-500/20 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/15 p-1.5 flex items-center justify-center shrink-0 border border-blue-500/30">
                                    <img src={batsmanIcon} alt="Batsman" className="w-full h-full object-contain filter drop-shadow" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-black text-blue-300 leading-none">{roleDistribution.Batsman}</p>
                                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">Batsmen</p>
                                </div>
                            </div>

                            {/* Bowler */}
                            <div className="p-3 rounded-xl bg-[#050B1A] border border-red-500/20 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/15 p-1.5 flex items-center justify-center shrink-0 border border-red-500/30">
                                    <img src={bowlerIcon} alt="Bowler" className="w-full h-full object-contain filter drop-shadow" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-black text-red-300 leading-none">{roleDistribution.Bowler}</p>
                                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">Bowlers</p>
                                </div>
                            </div>

                            {/* All-Rounder */}
                            <div className="p-3 rounded-xl bg-[#050B1A] border border-purple-500/20 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/15 p-1.5 flex items-center justify-center shrink-0 border border-purple-500/30">
                                    <img src={allRounderIcon} alt="All-Rounder" className="w-full h-full object-contain filter drop-shadow" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-black text-purple-300 leading-none">{roleDistribution["All-Rounder"]}</p>
                                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">All-Rounders</p>
                                </div>
                            </div>

                            {/* Wicket-Keeper */}
                            <div className="p-3 rounded-xl bg-[#050B1A] border border-amber-500/20 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/15 p-1.5 flex items-center justify-center shrink-0 border border-amber-500/30">
                                    <img src={wicketkeeperIcon} alt="Wicket-Keeper" className="w-full h-full object-contain filter drop-shadow" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-black text-amber-300 leading-none">{roleDistribution["Wicket-Keeper"]}</p>
                                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">Glovemen</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── TABS: SQUAD ROSTER VS BIDDING HISTORY ── */}
                    <div className="bg-[#080E27] border border-white/10 rounded-3xl overflow-hidden shadow-2xl space-y-4">
                        {/* Tab Headers */}
                        <div className="flex border-b border-white/10 bg-[#050B1A]/80 p-1.5 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setActiveTab("roster")}
                                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === "roster"
                                        ? "bg-[#080E27] text-[#FDB913] border border-white/10 shadow-lg"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <Users size={16} />
                                <span>Squad Roster</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                    activeTab === "roster"
                                        ? "bg-[#FDB913]/20 text-[#FDB913]"
                                        : "bg-white/5 text-gray-400"
                                }`}>
                                    {rosterCount}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("bids")}
                                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === "bids"
                                        ? "bg-[#080E27] text-[#FDB913] border border-white/10 shadow-lg"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <Clock size={16} />
                                <span>Bidding Logs</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                    activeTab === "bids"
                                        ? "bg-[#FDB913]/20 text-[#FDB913]"
                                        : "bg-white/5 text-gray-400"
                                }`}>
                                    {bidsCount}
                                </span>
                            </button>
                        </div>

                        {/* Tab Body */}
                        <div className="p-4 sm:p-6 space-y-6">
                            {/* ── ROSTER TAB CONTENT ── */}
                            {activeTab === "roster" && (
                                <div className="space-y-4">
                                    {/* Controls: Search, Role Filter, View Switcher */}
                                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                                        {/* Search in Roster */}
                                        <div className="relative flex-1">
                                            <Search
                                                size={15}
                                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                            />
                                            <input
                                                type="text"
                                                value={rosterSearch}
                                                onChange={(e) => setRosterSearch(e.target.value)}
                                                placeholder="Search roster players..."
                                                className="w-full bg-[#050B1A] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913]"
                                            />
                                        </div>

                                        {/* Role Filter Pills */}
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {["ALL", "Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"].map((r) => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setRosterRoleFilter(r)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                                        rosterRoleFilter === r
                                                            ? "bg-[#FDB913]/15 text-[#FDB913] border-[#FDB913]/40 font-bold"
                                                            : "bg-[#050B1A] border-white/10 text-gray-400 hover:text-white"
                                                    }`}
                                                >
                                                    {r === "ALL" ? "All Roles" : r}
                                                </button>
                                            ))}
                                        </div>

                                        {/* View Switcher: Grid vs Table */}
                                        <div className="inline-flex items-center p-1 rounded-xl bg-[#050B1A] border border-white/10 self-end md:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => setRosterViewMode("grid")}
                                                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                                                    rosterViewMode === "grid"
                                                        ? "bg-[#FDB913] text-black font-bold shadow-sm"
                                                        : "text-gray-400 hover:text-white"
                                                }`}
                                                title="Trading Card Grid"
                                            >
                                                <LayoutGrid size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRosterViewMode("table")}
                                                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                                                    rosterViewMode === "table"
                                                        ? "bg-[#FDB913] text-black font-bold shadow-sm"
                                                        : "text-gray-400 hover:text-white"
                                                }`}
                                                title="Data Table"
                                            >
                                                <List size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Empty Roster */}
                                    {rosterCount === 0 ? (
                                        <div className="py-16 text-center space-y-3 bg-[#050B1A]/40 rounded-2xl border border-white/5">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mx-auto">
                                                <Users size={28} />
                                            </div>
                                            <h3 className="text-base font-bold text-white">No Players in Squad Roster</h3>
                                            <p className="text-gray-400 text-xs max-w-sm mx-auto">
                                                This franchise has not won any players during the live auction room yet.
                                            </p>
                                        </div>
                                    ) : filteredPlayers.length === 0 ? (
                                        <div className="py-12 text-center text-gray-400 text-xs bg-[#050B1A]/40 rounded-2xl border border-white/5">
                                            No squad players match your search filter.
                                        </div>
                                    ) : rosterViewMode === "grid" ? (
                                        /* Roster Grid View */
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                                            {filteredPlayers.map((player) => {
                                                const pData = getPlayerData(player);
                                                const roleCfg = getRoleConfig(pData.role);
                                                const initials =
                                                    pData.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().slice(0, 2).toUpperCase() || "P";

                                                return (
                                                    <div
                                                        key={player.id}
                                                        onClick={() => pData.id && setSelectedPlayerId(pData.id)}
                                                        className="bg-[#050B1A] border border-white/10 rounded-2xl p-4 hover:border-[#FDB913]/40 transition-all duration-200 group cursor-pointer relative overflow-hidden shadow-lg flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                                <RoleBadge role={pData.role} compact />
                                                                <span className="text-[10px] text-gray-500 font-mono">
                                                                    {player.soldAt ? new Date(player.soldAt).toLocaleDateString() : ""}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-3 mb-3">
                                                                {roleCfg.image ? (
                                                                    <div
                                                                        className="w-12 h-12 rounded-2xl flex items-center justify-center p-2 border border-white/10 shadow shrink-0"
                                                                        style={{
                                                                            background: `radial-gradient(circle at 50% 30%, ${roleCfg.accent}30, #080E27 90%)`,
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={roleCfg.image}
                                                                            alt={pData.role}
                                                                            className="w-full h-full object-contain filter drop-shadow"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black text-xs font-black flex items-center justify-center shrink-0 shadow">
                                                                        {initials}
                                                                    </div>
                                                                )}

                                                                <div className="min-w-0">
                                                                    <h4 className="font-black text-sm text-white group-hover:text-[#FDB913] transition truncate">
                                                                        {pData.name}
                                                                    </h4>
                                                                    {pData.basePrice && (
                                                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                                                            Base: {formatCurrency(pData.basePrice)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                                            <span className="text-[10px] text-gray-400 uppercase font-semibold">
                                                                Winning Bid
                                                            </span>
                                                            <span className="font-black text-sm text-emerald-400">
                                                                {formatCurrency(player.price)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* Roster Table View */
                                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#050B1A]">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#080E27] text-gray-400 font-semibold text-xs border-b border-white/10">
                                                    <tr>
                                                        <th className="py-3.5 px-4">Player</th>
                                                        <th className="py-3.5 px-4">Role</th>
                                                        <th className="py-3.5 px-4 text-right">Winning Bid</th>
                                                        <th className="py-3.5 px-4 text-right">Date Won</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                                                    {filteredPlayers.map((player) => {
                                                        const pData = getPlayerData(player);
                                                        const roleCfg = getRoleConfig(pData.role);
                                                        const initials =
                                                            pData.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().slice(0, 2).toUpperCase() || "P";

                                                        return (
                                                            <tr
                                                                key={player.id}
                                                                onClick={() => pData.id && setSelectedPlayerId(pData.id)}
                                                                className="hover:bg-white/[0.02] transition cursor-pointer group"
                                                            >
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-3">
                                                                        {roleCfg.image ? (
                                                                            <div
                                                                                className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5 border border-white/10 shrink-0"
                                                                                style={{
                                                                                    background: `radial-gradient(circle at 50% 30%, ${roleCfg.accent}30, #080E27 90%)`,
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={roleCfg.image}
                                                                                    alt={pData.role}
                                                                                    className="w-full h-full object-contain filter drop-shadow"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black text-xs font-black flex items-center justify-center shrink-0 shadow">
                                                                                {initials}
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <span className="font-bold text-white group-hover:text-[#FDB913] transition block">
                                                                                {pData.name}
                                                                            </span>
                                                                            {player.playerId && (
                                                                                <span className="text-[10px] text-gray-500 font-mono">
                                                                                    #{String(player.playerId).substring(0, 8).toUpperCase()}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <RoleBadge role={pData.role} compact />
                                                                </td>
                                                                <td className="py-3 px-4 text-right font-black text-emerald-400">
                                                                    {formatCurrency(player.price)}
                                                                </td>
                                                                <td className="py-3 px-4 text-right text-gray-400 text-xs font-mono">
                                                                    {player.soldAt ? new Date(player.soldAt).toLocaleDateString() : "—"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── BIDS TAB CONTENT ── */}
                            {activeTab === "bids" && (
                                <div className="space-y-4">
                                    {bidsCount === 0 ? (
                                        <div className="py-16 text-center space-y-3 bg-[#050B1A]/40 rounded-2xl border border-white/5">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mx-auto">
                                                <Clock size={28} />
                                            </div>
                                            <h3 className="text-base font-bold text-white">No Auction Bids Yet</h3>
                                            <p className="text-gray-400 text-xs max-w-sm mx-auto">
                                                This franchise has not submitted any live auction bids yet.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#050B1A]">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#080E27] text-gray-400 font-semibold text-xs border-b border-white/10">
                                                    <tr>
                                                        <th className="py-3.5 px-4">Bid Ref</th>
                                                        <th className="py-3.5 px-4">Target Player</th>
                                                        <th className="py-3.5 px-4 text-right">Bid Amount</th>
                                                        <th className="py-3.5 px-4 text-right">Timestamp</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                                                    {team.bids.map((bid) => {
                                                        const pData = getPlayerData(bid);
                                                        return (
                                                            <tr
                                                                key={bid.id}
                                                                onClick={() => pData.id && setSelectedPlayerId(pData.id)}
                                                                className="hover:bg-white/[0.02] transition cursor-pointer group"
                                                            >
                                                                <td className="py-3 px-4 font-mono text-xs text-gray-400">
                                                                    #{String(bid.id).substring(0, 8).toUpperCase()}
                                                                </td>
                                                                <td className="py-3 px-4 font-semibold text-white group-hover:text-[#FDB913] transition">
                                                                    <div className="flex items-center gap-2">
                                                                        <User size={13} className="text-[#FDB913]" />
                                                                        <span>{pData.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 text-right font-black text-[#FDB913]">
                                                                    {formatCurrency(bid.amount)}
                                                                </td>
                                                                <td className="py-3 px-4 text-right text-gray-400 text-xs font-mono">
                                                                    {new Date(bid.createdAt).toLocaleTimeString([], {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                        second: "2-digit",
                                                                    })}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* ── DELETE SAFETY CONFIRMATION MODAL ── */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#080E27] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Red Accent Line */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />

                        <div className="flex items-center gap-3 text-red-400">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Delete Franchise Team?</h3>
                                <p className="text-xs text-gray-400">This action cannot be reversed</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs sm:text-sm text-gray-300">
                            <div className="p-3.5 rounded-2xl bg-[#050B1A] border border-white/10 flex items-center gap-3">
                                {team.logo ? (
                                    <img
                                        src={team.logo}
                                        alt={team.name}
                                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                                    />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black text-xs shrink-0"
                                        style={getTeamAvatarStyle(team.name)}
                                    >
                                        {team.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white truncate">{team.name}</h4>
                                    <p className="text-xs text-gray-400 truncate">
                                        Owner: {team.ownerName || "Unassigned"}
                                    </p>
                                </div>
                            </div>

                            <p className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-300 text-xs flex gap-2.5 leading-relaxed">
                                <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
                                <span>
                                    <strong>CRITICAL WARNING:</strong> Deleting this franchise will release all {rosterCount} assigned players back into the draft pool and forfeit any active bids.
                                </span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-bold transition text-xs sm:text-sm text-gray-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-xl font-bold transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {deleting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

            {/* ── PLAYER DETAILS MODAL ── */}
            {selectedPlayerId && (
                <PlayerDetailsModal
                    playerId={selectedPlayerId}
                    onClose={() => setSelectedPlayerId(null)}
                />
            )}
        </div>
    );
};

export default TeamDetails;
