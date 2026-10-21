import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
    Trophy,
    Users,
    User,
    Coins,
    Clock,
    Tag,
    AlertTriangle,
    ShieldAlert,
    TrendingUp,
    Flame,
    Bell,
    Mail,
    Search,
    RefreshCw,
    Play,
    Target,
    Zap,
    ShieldCheck,
    SlidersHorizontal,
    RotateCcw,
    ChevronDown,
    ArrowUpRight,
    Sparkles,
    Calendar,
    Wallet,
    Award,
    Activity,
    Layers,
    CheckCircle2
} from "lucide-react";
import { toast } from "react-hot-toast";
import PlayerDetailsModal from "../components/players/PlayerDetailsModal";

/* ── Role & Badge Configurations ─────────────────────────────── */
const ROLE_CONFIG = {
    Batsman: {
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        badge: "bg-blue-500 text-white",
        icon: Target,
    },
    Bowler: {
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        badge: "bg-emerald-500 text-white",
        icon: Zap,
    },
    "All-Rounder": {
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        badge: "bg-purple-500 text-white",
        icon: ShieldCheck,
    },
    "Wicket-Keeper": {
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        badge: "bg-amber-500 text-black",
        icon: Users,
    },
    Wicketkeeper: {
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        badge: "bg-amber-500 text-black",
        icon: Users,
    },
    default: {
        color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        badge: "bg-gray-500 text-white",
        icon: User,
    },
};

const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.default;
    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}
        >
            <Icon size={12} className="shrink-0" />
            <span>{role || "Player"}</span>
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const s = (status || "AVAILABLE").toUpperCase();
    if (s === "SOLD") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                SOLD
            </span>
        );
    }
    if (s === "UNSOLD") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                UNSOLD
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            AVAILABLE
        </span>
    );
};

const Avatar = ({ name, size = "md" }) => {
    const initials = name
        ? name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "P";
    const hue = (name?.charCodeAt(0) || 60) * 47 % 360;

    const dim = size === "lg" ? "w-12 h-12 text-sm" : size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";

    return (
        <div
            className={`${dim} rounded-xl flex items-center justify-center text-black font-black shrink-0 shadow-md border border-white/20 select-none`}
            style={{
                background: `linear-gradient(135deg, hsl(${hue},85%,65%), hsl(${(hue + 45) % 360},85%,45%))`,
            }}
        >
            {initials}
        </div>
    );
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0) + " Pts";
};

const TeamOwnerDashboard = () => {
    const [team, setTeam] = useState(null);
    const [allTeams, setAllTeams] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("roster");
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedPlayerId, setSelectedPlayerId] = useState(null);

    // Players Tab Filter/Sort States
    const [playerSearch, setPlayerSearch] = useState("");
    const [playerRole, setPlayerRole] = useState("All");
    const [playerStatus, setPlayerStatus] = useState("All");
    const [playerSort, setPlayerSort] = useState("name-asc");

    const loadDashboardData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            // Fetch all owner's teams via central API
            const teamsRes = await api.get("/teams/owner/my-teams");
            const teamsData = teamsRes.data?.data || [];
            setAllTeams(teamsData);

            let currentTeam = team;
            if (teamsData.length > 0) {
                if (!currentTeam || !teamsData.some((t) => t.id === currentTeam.id)) {
                    currentTeam = teamsData[0];
                } else {
                    currentTeam = teamsData.find((t) => t.id === currentTeam.id);
                }
                setTeam(currentTeam);

                // Fetch tournament details for the selected team
                if (currentTeam?.tournamentId) {
                    try {
                        const tourRes = await api.get(`/tournaments/${currentTeam.tournamentId}`);
                        setTournament(tourRes.data?.data || null);
                    } catch {
                        setTournament(null);
                    }
                } else {
                    setTournament(null);
                }
            } else {
                setTeam(null);
                setTournament(null);
            }
        } catch (error) {
            console.error("Owner Dashboard load error:", error);
            if (error.response?.status !== 404) {
                toast.error("Failed to load dashboard data");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    // Memoized map of playerId -> { teamName, logo, price }
    const soldPlayersMap = useMemo(() => {
        const map = new Map();
        if (!tournament || !tournament.teams) return map;
        tournament.teams.forEach((t) => {
            if (t.playersWon) {
                t.playersWon.forEach((soldRec) => {
                    map.set(soldRec.playerId, {
                        teamName: t.name,
                        logo: t.logo,
                        price: soldRec.price || 0,
                    });
                });
            }
        });
        return map;
    }, [tournament]);

    // Player Pool filtering & sorting logic
    const processedPlayers = useMemo(() => {
        if (!tournament || !tournament.players) return [];
        let result = [...tournament.players];

        // Search Filter
        if (playerSearch.trim() !== "") {
            const q = playerSearch.toLowerCase();
            result = result.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.role && p.role.toLowerCase().includes(q))
            );
        }

        // Role Filter
        if (playerRole !== "All") {
            result = result.filter((p) => {
                if (playerRole === "Wicketkeeper") {
                    return p.role === "Wicketkeeper" || p.role === "Wicket-Keeper";
                }
                return p.role === playerRole;
            });
        }

        // Status Filter
        if (playerStatus !== "All") {
            if (playerStatus === "SOLD") {
                result = result.filter((p) => soldPlayersMap.has(p.id));
            } else if (playerStatus === "AVAILABLE") {
                result = result.filter((p) => !soldPlayersMap.has(p.id));
            }
        }

        // Sort
        result.sort((a, b) => {
            if (playerSort === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (playerSort === "basePrice-desc") {
                return (b.basePrice || 0) - (a.basePrice || 0);
            }
            if (playerSort === "basePrice-asc") {
                return (a.basePrice || 0) - (b.basePrice || 0);
            }
            if (playerSort === "soldPrice-desc") {
                const priceA = soldPlayersMap.get(a.id)?.price || 0;
                const priceB = soldPlayersMap.get(b.id)?.price || 0;
                return priceB - priceA;
            }
            return 0;
        });

        return result;
    }, [tournament, playerSearch, playerRole, playerStatus, playerSort, soldPlayersMap]);

    // Active auctions across all teams the owner participates with
    const activeAuctions = useMemo(() => {
        const list = [];
        allTeams.forEach((t) => {
            const active = t.tournament?.auctions?.find((a) => a.status === "ACTIVE");
            if (active) {
                list.push({
                    team: t,
                    tournament: t.tournament,
                    auction: active,
                });
            }
        });
        return list;
    }, [allTeams]);

    // Squad composition breakdown
    const squadRoleBreakdown = useMemo(() => {
        const breakdown = { Batsman: 0, Bowler: 0, "All-Rounder": 0, "Wicket-Keeper": 0 };
        if (!team?.playersWon) return breakdown;
        team.playersWon.forEach((rec) => {
            const role = rec.player?.role;
            if (role === "Batsman") breakdown.Batsman++;
            else if (role === "Bowler") breakdown.Bowler++;
            else if (role === "All-Rounder") breakdown["All-Rounder"]++;
            else if (role === "Wicket-Keeper" || role === "Wicketkeeper") breakdown["Wicket-Keeper"]++;
        });
        return breakdown;
    }, [team]);

    // Top player purchase
    const topPurchase = useMemo(() => {
        if (!team?.playersWon || team.playersWon.length === 0) return null;
        return [...team.playersWon].sort((a, b) => (b.price || 0) - (a.price || 0))[0];
    }, [team]);

    if (loading) {
        return (
            <div className="min-h-screen flex bg-[#070C1E] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="flex flex-col items-center gap-4 bg-[#0B132B]/80 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-[#FDB913]/20 border-t-[#FDB913] rounded-full animate-spin" />
                            <Trophy className="absolute inset-0 m-auto text-[#FDB913]/60" size={18} />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold text-base">Loading Owner Arena</p>
                            <p className="text-gray-400 text-xs mt-1">Retrieving franchise squad, purse & tournament stats...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#070C1E] text-white">
                <Sidebar />
                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 shadow-2xl shadow-amber-500/10 animate-pulse">
                        <ShieldAlert size={40} />
                    </div>
                    <h2 className="text-2xl font-black mb-2 uppercase tracking-tight text-white">
                        No Franchise Assigned
                    </h2>
                    <p className="text-gray-400 max-w-md mb-8 text-sm leading-relaxed">
                        Your account is registered as a <strong className="text-white">Team Owner</strong>, but you have not been linked to a tournament team yet. Please contact your Tournament Organizer to complete team registration.
                    </p>
                    <button
                        onClick={() => loadDashboardData(false)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDB913] to-amber-500 text-black px-6 py-3 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-yellow-500/20 transition active:scale-95 cursor-pointer"
                    >
                        <RefreshCw size={16} /> Re-check Team Assignment
                    </button>
                </main>
            </div>
        );
    }

    // Calculations
    const totalPurse = team.purseAmount || 0;
    const remainingPurse = team.remainingPurse || 0;
    const spentPurse = Math.max(0, totalPurse - remainingPurse);
    const spentPercent = totalPurse > 0 ? (spentPurse / totalPurse) * 100 : 0;
    const rosterCount = team.playersWon?.length || 0;
    const bidsCount = team.bids?.length || 0;
    const maxSquad = tournament?.maxPlayersPerTeam || 15;
    const avgPrice = rosterCount > 0 ? Math.round(spentPurse / rosterCount) : 0;

    // Filtered lists
    const filteredRoster = (team.playersWon || []).filter((record) => {
        const pName = record.player?.name || "";
        const pRole = record.player?.role || "";
        return (
            pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pRole.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#070C1E] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-y-auto space-y-6">
                {/* ── FRANCHISE HEADER BANNER ─────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#0C1530] to-[#070C1E] border border-white/10 p-6 sm:p-8 shadow-2xl">
                    {/* Background Glow Accents */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDB913]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Team & Owner Info */}
                        <div className="flex items-start sm:items-center gap-5">
                            {/* Team Logo / Avatar */}
                            <div className="relative shrink-0">
                                {team.logo ? (
                                    <img
                                        src={team.logo}
                                        alt={team.name}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#FDB913]/40 shadow-xl bg-black/40"
                                    />
                                ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center font-black text-2xl sm:text-3xl text-black shadow-xl shadow-yellow-500/10 border-2 border-white/20">
                                        {team.name ? team.name.substring(0, 2).toUpperCase() : "TM"}
                                    </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0B132B] flex items-center justify-center shadow-md" title="Franchise Active">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                </span>
                            </div>

                            {/* Titles */}
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FDB913]/15 text-[#FDB913] border border-[#FDB913]/30 text-[11px] font-bold uppercase tracking-wider">
                                        <Award size={12} />
                                        Team Franchise
                                    </span>
                                    {tournament && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10 text-[11px] font-semibold flex items-center gap-1.5">
                                            <Trophy size={11} className="text-[#FDB913]" />
                                            {tournament.name}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
                                    {team.name}
                                </h1>

                                <p className="text-xs sm:text-sm text-gray-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span>Owner: <strong className="text-gray-200">{team.ownerName || "Franchise Management"}</strong></span>
                                    <span className="text-gray-600">•</span>
                                    <span>Squad: <strong className="text-white">{rosterCount} / {maxSquad} Players</strong></span>
                                </p>
                            </div>
                        </div>

                        {/* Switch Team & Sync Controls */}
                        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
                            {allTeams.length > 1 && (
                                <div className="relative">
                                    <select
                                        value={team.id}
                                        onChange={async (e) => {
                                            const selectedId = e.target.value;
                                            const selectedTeam = allTeams.find((t) => t.id === selectedId);
                                            setTeam(selectedTeam);
                                            if (selectedTeam?.tournamentId) {
                                                setLoading(true);
                                                try {
                                                    const tourRes = await api.get(`/tournaments/${selectedTeam.tournamentId}`);
                                                    setTournament(tourRes.data?.data || null);
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("Failed to load tournament details");
                                                } finally {
                                                    setLoading(false);
                                                }
                                            } else {
                                                setTournament(null);
                                            }
                                        }}
                                        className="appearance-none bg-[#09122C] hover:bg-[#0E1A3D] border border-white/10 text-white font-bold text-xs rounded-xl px-4 py-2.5 pr-9 transition cursor-pointer shadow-lg focus:outline-none focus:border-[#FDB913]"
                                    >
                                        {allTeams.map((t) => (
                                            <option key={t.id} value={t.id} className="bg-[#09122C] text-white">
                                                {t.name} ({t.tournament?.name || "Tournament"})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            )}

                            <button
                                onClick={() => loadDashboardData(true)}
                                disabled={refreshing}
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition disabled:opacity-50 flex items-center gap-2 text-xs font-bold cursor-pointer"
                                title="Refresh Dashboard Stats"
                            >
                                <RefreshCw size={14} className={refreshing ? "animate-spin text-[#FDB913]" : ""} />
                                <span>{refreshing ? "Syncing..." : "Sync"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── LIVE AUCTION ARENA CALLOUT (IF ACTIVE) ────────────────── */}
                {activeAuctions.length > 0 && (
                    <div className="space-y-3">
                        {activeAuctions.map(({ team: t, tournament: tour }) => (
                            <div
                                key={t.id}
                                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-[#070C1E] border border-red-500/40 p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-lg shadow-red-500/20">
                                        <Flame size={24} className="animate-bounce" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                                                Live Auction Active
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                                            {tour.name}
                                        </h3>
                                        <p className="text-xs text-gray-300">
                                            Participating with <strong className="text-white">{t.name}</strong>
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    to={`/auctions/live/${t.tournamentId}`}
                                    className="relative z-10 w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <Play size={12} fill="currentColor" />
                                    <span>Enter Auction Arena</span>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── EXECUTIVE FINANCIAL & SQUAD METRICS ─────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* ALLOCATED PURSE */}
                    <div className="bg-[#0B132B]/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-xl hover:border-white/20 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Purse</span>
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#FDB913]">
                                <Coins size={18} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-white tracking-tight">
                                {formatCurrency(totalPurse)}
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                <span>Initial tournament allocation</span>
                            </p>
                        </div>
                    </div>

                    {/* REMAINING PURSE */}
                    <div className="bg-[#0B132B]/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-xl hover:border-white/20 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Remaining Points</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Wallet size={18} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className={`text-2xl font-black tracking-tight ${remainingPurse < 100000 ? "text-rose-400" : "text-emerald-400"}`}>
                                {formatCurrency(remainingPurse)}
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-1">
                                {(100 - spentPercent).toFixed(1)}% points available to bid
                            </p>
                        </div>
                    </div>

                    {/* SPENT POINTS & GAUGE */}
                    <div className="bg-[#0B132B]/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-xl hover:border-white/20 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Points Spent</span>
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-2xl font-black text-white tracking-tight">
                                    {formatCurrency(spentPurse)}
                                </h3>
                                <span className="text-xs font-bold text-gray-400">
                                    {spentPercent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2 mt-2.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${spentPercent >= 90 ? "bg-rose-500" : spentPercent >= 75 ? "bg-amber-400" : "bg-gradient-to-r from-blue-500 to-[#FDB913]"}`}
                                    style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ROSTER / SQUAD CAPACITY */}
                    <div className="bg-[#0B132B]/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-xl hover:border-white/20 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Squad Strength</span>
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <Users size={18} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-2xl font-black text-white tracking-tight">
                                    {rosterCount} <span className="text-sm font-semibold text-gray-400">/ {maxSquad}</span>
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                                    {maxSquad - rosterCount} Slots Open
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">
                                Avg. cost: <strong className="text-gray-200">{formatCurrency(avgPrice)}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── SQUAD COMPOSITION QUICK SUMMARY BAR ────────────────────── */}
                <div className="bg-[#0B132B]/60 border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Layers size={14} className="text-[#FDB913]" /> Squad Composition:
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold flex items-center gap-1.5">
                            <Target size={12} /> Batsmen: <strong className="text-white">{squadRoleBreakdown.Batsman}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
                            <Zap size={12} /> Bowlers: <strong className="text-white">{squadRoleBreakdown.Bowler}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold flex items-center gap-1.5">
                            <ShieldCheck size={12} /> All-Rounders: <strong className="text-white">{squadRoleBreakdown["All-Rounder"]}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1.5">
                            <Users size={12} /> Wicketkeepers: <strong className="text-white">{squadRoleBreakdown["Wicket-Keeper"]}</strong>
                        </span>
                    </div>
                </div>

                {/* ── MAIN TABBED SECTION ───────────────────────────────────── */}
                <div className="bg-[#0B132B]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                    {/* Responsive Tab Bar */}
                    <div className="flex border-b border-white/10 bg-[#070C1E]/60 overflow-x-auto no-scrollbar">
                        {[
                            { id: "roster", label: "Squad Roster", count: rosterCount, icon: Users },
                            { id: "players", label: "Tournament Pool", count: tournament?.players?.length || 0, icon: User },
                            { id: "bids", label: "Bidding History", count: bidsCount, icon: Clock },
                            { id: "opponents", label: "League Teams", count: Math.max(0, (tournament?.teams?.length || 1) - 1), icon: Trophy },
                        ].map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`flex-1 min-w-[140px] py-4 px-5 font-bold text-xs sm:text-sm border-b-2 transition flex items-center justify-center gap-2 cursor-pointer ${isActive
                                            ? "border-[#FDB913] text-[#FDB913] bg-[#0F1C3F]/40 shadow-inner"
                                            : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Icon size={16} />
                                    <span>{t.label}</span>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive
                                                ? "bg-[#FDB913] text-black"
                                                : "bg-white/10 text-gray-300"
                                            }`}
                                    >
                                        {t.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Body */}
                    <div className="p-4 sm:p-6 lg:p-8">
                        {/* ── TAB 1: SQUAD ROSTER ─────────────────────────── */}
                        {activeTab === "roster" && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h2 className="text-lg font-black text-white tracking-tight uppercase">
                                            Purchased Squad Roster
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Official players drafted and acquired in live bidding for this tournament.
                                        </p>
                                    </div>

                                    {rosterCount > 0 && (
                                        <div className="relative w-full sm:w-72">
                                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Filter by name or role..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-[#070C1E] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition"
                                            />
                                        </div>
                                    )}
                                </div>

                                {rosterCount === 0 ? (
                                    <div className="py-16 text-center rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center p-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-3">
                                            <Users size={28} />
                                        </div>
                                        <h4 className="text-base font-bold text-gray-300">No Players Purchased Yet</h4>
                                        <p className="text-xs text-gray-500 max-w-sm mt-1">
                                            When live bidding commences, players won by your franchise will appear here in real time.
                                        </p>
                                    </div>
                                ) : filteredRoster.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 text-xs">
                                        No squad players matched your search "{searchQuery}".
                                    </div>
                                ) : (
                                    <>
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-[#070C1E]/50 shadow-xl">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#09122C] text-gray-400 font-bold text-xs uppercase tracking-wider border-b border-white/10">
                                                    <tr>
                                                        <th className="p-4">Player</th>
                                                        <th className="p-4">Playing Role</th>
                                                        <th className="p-4 text-right">Base Price</th>
                                                        <th className="p-4 text-right">Winning Bid</th>
                                                        <th className="p-4 text-right">Acquired</th>
                                                        <th className="p-4 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {filteredRoster.map((record) => (
                                                        <tr
                                                            key={record.id}
                                                            onClick={() => record.player?.id && setSelectedPlayerId(record.player.id)}
                                                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                                                        >
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar name={record.player?.name} />
                                                                    <div>
                                                                        <div className="font-bold text-white group-hover:text-[#FDB913] transition">
                                                                            {record.player?.name || "Unknown Player"}
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-400">
                                                                            {record.player?.country || "India"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <RoleBadge role={record.player?.role} />
                                                            </td>
                                                            <td className="p-4 text-right text-gray-400 font-medium">
                                                                {formatCurrency(record.player?.basePrice)}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <span className="font-black text-emerald-400 text-sm">
                                                                    {formatCurrency(record.price)}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right text-xs text-gray-400">
                                                                {record.soldAt ? new Date(record.soldAt).toLocaleDateString() : "Live Auction"}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="text-xs text-[#FDB913] group-hover:underline font-bold inline-flex items-center gap-1">
                                                                    View Stats <ArrowUpRight size={12} />
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Roster Cards */}
                                        <div className="md:hidden space-y-3">
                                            {filteredRoster.map((record) => (
                                                <div
                                                    key={record.id}
                                                    onClick={() => record.player?.id && setSelectedPlayerId(record.player.id)}
                                                    className="p-4 rounded-2xl bg-[#070C1E] border border-white/10 hover:border-[#FDB913]/30 transition shadow-md cursor-pointer space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar name={record.player?.name} />
                                                            <div>
                                                                <h4 className="font-bold text-white text-sm">
                                                                    {record.player?.name || "Unknown Player"}
                                                                </h4>
                                                                <span className="text-[11px] text-gray-400">
                                                                    {record.player?.country || "India"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <RoleBadge role={record.player?.role} />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                                                        <div>
                                                            <span className="text-gray-500 block text-[10px] uppercase font-bold">Base Price</span>
                                                            <span className="text-gray-300 font-bold">{formatCurrency(record.player?.basePrice)}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-gray-500 block text-[10px] uppercase font-bold">Winning Bid</span>
                                                            <span className="text-emerald-400 font-black">{formatCurrency(record.price)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── TAB 2: TOURNAMENT PLAYER POOL ───────────────── */}
                        {activeTab === "players" && (
                            <div className="space-y-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-black text-white tracking-tight uppercase">
                                            Registered Player Pool
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Search and evaluate all draft prospects in this championship.
                                        </p>
                                    </div>

                                    {/* Search & Sort Controls */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                        <div className="relative flex-1 sm:w-64">
                                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Search player name..."
                                                value={playerSearch}
                                                onChange={(e) => setPlayerSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-[#070C1E] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition"
                                            />
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={playerSort}
                                                onChange={(e) => setPlayerSort(e.target.value)}
                                                className="appearance-none w-full sm:w-auto bg-[#070C1E] border border-white/10 rounded-xl px-4 py-2 pr-9 text-xs text-gray-300 font-bold focus:outline-none focus:border-[#FDB913] cursor-pointer"
                                            >
                                                <option value="name-asc" className="bg-[#09122C]">Name (A-Z)</option>
                                                <option value="basePrice-desc" className="bg-[#09122C]">Base Price: High to Low</option>
                                                <option value="basePrice-asc" className="bg-[#09122C]">Base Price: Low to High</option>
                                                <option value="soldPrice-desc" className="bg-[#09122C]">Sold Price: High to Low</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Filter Chips */}
                                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070C1E]/80 p-3 rounded-2xl border border-white/5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {["All", "Batsman", "Bowler", "All-Rounder", "Wicketkeeper"].map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => setPlayerRole(role)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${playerRole === role
                                                        ? "bg-[#FDB913] text-black shadow-md shadow-yellow-500/20"
                                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto">
                                        {["All", "AVAILABLE", "SOLD"].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setPlayerStatus(status)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${playerStatus === status
                                                        ? "bg-white/15 text-white border border-white/20"
                                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                {status === "AVAILABLE" ? "Available" : status === "SOLD" ? "Sold" : "All Status"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Table / Grid of Players */}
                                {!tournament?.players || tournament.players.length === 0 ? (
                                    <div className="py-16 text-center text-gray-500 text-sm">
                                        No players registered in this tournament yet.
                                    </div>
                                ) : processedPlayers.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 text-xs">
                                        No players matched your active filters.
                                    </div>
                                ) : (
                                    <>
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-[#070C1E]/50 shadow-xl">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#09122C] text-gray-400 font-bold text-xs uppercase tracking-wider border-b border-white/10">
                                                    <tr>
                                                        <th className="p-4">Player</th>
                                                        <th className="p-4">Role</th>
                                                        <th className="p-4 text-right">Base Price</th>
                                                        <th className="p-4 text-center">Status</th>
                                                        <th className="p-4">Franchise</th>
                                                        <th className="p-4 text-right">Winning Bid</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {processedPlayers.map((player) => {
                                                        const soldInfo = soldPlayersMap.get(player.id);
                                                        const isSold = Boolean(soldInfo);
                                                        const isMyPlayer = isSold && soldInfo.teamName === team.name;

                                                        return (
                                                            <tr
                                                                key={player.id}
                                                                onClick={() => setSelectedPlayerId(player.id)}
                                                                className={`hover:bg-white/5 transition-colors cursor-pointer group ${isMyPlayer ? "bg-[#FDB913]/5" : ""
                                                                    }`}
                                                            >
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar name={player.name} />
                                                                        <div>
                                                                            <div className="font-bold text-white group-hover:text-[#FDB913] transition flex items-center gap-1.5">
                                                                                <span>{player.name}</span>
                                                                                {isMyPlayer && (
                                                                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#FDB913] text-black">
                                                                                        MY TEAM
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-[11px] text-gray-400">
                                                                                {player.country || "India"}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <RoleBadge role={player.role} />
                                                                </td>
                                                                <td className="p-4 text-right text-gray-400 font-medium">
                                                                    {formatCurrency(player.basePrice)}
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <StatusBadge status={isSold ? "SOLD" : "AVAILABLE"} />
                                                                </td>
                                                                <td className="p-4">
                                                                    {isSold ? (
                                                                        <div className="flex items-center gap-2">
                                                                            {soldInfo.logo ? (
                                                                                <img
                                                                                    src={soldInfo.logo}
                                                                                    alt={soldInfo.teamName}
                                                                                    className="w-5 h-5 rounded-full object-cover border border-white/10"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-5 h-5 rounded-full bg-[#FDB913]/20 text-[#FDB913] text-[9px] font-black flex items-center justify-center">
                                                                                    {soldInfo.teamName.substring(0, 2).toUpperCase()}
                                                                                </div>
                                                                            )}
                                                                            <span className="text-gray-200 font-bold text-xs truncate max-w-[130px]" title={soldInfo.teamName}>
                                                                                {soldInfo.teamName}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-600 font-mono text-xs">—</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    {isSold ? (
                                                                        <span className="font-black text-emerald-400 text-sm">
                                                                            {formatCurrency(soldInfo.price)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-600 font-mono text-xs">—</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Player Pool Cards */}
                                        <div className="md:hidden space-y-3">
                                            {processedPlayers.map((player) => {
                                                const soldInfo = soldPlayersMap.get(player.id);
                                                const isSold = Boolean(soldInfo);
                                                const isMyPlayer = isSold && soldInfo.teamName === team.name;

                                                return (
                                                    <div
                                                        key={player.id}
                                                        onClick={() => setSelectedPlayerId(player.id)}
                                                        className={`p-4 rounded-2xl bg-[#070C1E] border border-white/10 hover:border-[#FDB913]/30 transition shadow-md cursor-pointer space-y-3 ${isMyPlayer ? "ring-1 ring-[#FDB913]/40" : ""
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar name={player.name} />
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <h4 className="font-bold text-white text-sm">{player.name}</h4>
                                                                        {isMyPlayer && (
                                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#FDB913] text-black">
                                                                                MY TEAM
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[11px] text-gray-400">{player.country || "India"}</span>
                                                                </div>
                                                            </div>
                                                            <StatusBadge status={isSold ? "SOLD" : "AVAILABLE"} />
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                                                            <RoleBadge role={player.role} />
                                                            <div className="text-right">
                                                                <span className="text-gray-500 block text-[10px] uppercase font-bold">
                                                                    {isSold ? "Winning Bid" : "Base Price"}
                                                                </span>
                                                                <span className={`font-black ${isSold ? "text-emerald-400" : "text-gray-200"}`}>
                                                                    {formatCurrency(isSold ? soldInfo.price : player.basePrice)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── TAB 3: BIDDING HISTORY ──────────────────────── */}
                        {activeTab === "bids" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black text-white tracking-tight uppercase">
                                        Live Bidding Log
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Audit record of bids submitted by your team franchise.
                                    </p>
                                </div>

                                {bidsCount === 0 ? (
                                    <div className="py-16 text-center rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center p-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-3">
                                            <Clock size={28} />
                                        </div>
                                        <h4 className="text-base font-bold text-gray-300">No Bids Recorded</h4>
                                        <p className="text-xs text-gray-500 max-w-sm mt-1">
                                            Bids made from the live auction floor will be chronologically documented here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#070C1E]/50 shadow-xl">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-[#09122C] text-gray-400 font-bold text-xs uppercase tracking-wider border-b border-white/10">
                                                <tr>
                                                    <th className="p-4">Target Player</th>
                                                    <th className="p-4 text-right">Bid Value</th>
                                                    <th className="p-4 text-right">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {team.bids.map((bid) => (
                                                    <tr key={bid.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4 font-bold text-white flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#FDB913] flex items-center justify-center font-bold text-xs">
                                                                <Clock size={14} />
                                                            </div>
                                                            <span>{bid.player?.name || `Player ID #${bid.playerId.substring(0, 8)}`}</span>
                                                        </td>
                                                        <td className="p-4 text-right text-[#FDB913] font-black text-sm">
                                                            {formatCurrency(bid.amount)}
                                                        </td>
                                                        <td className="p-4 text-right text-gray-400 text-xs">
                                                            {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 4: LEAGUE COMPETITORS ───────────────────── */}
                        {activeTab === "opponents" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black text-white tracking-tight uppercase">
                                        Championship Competitors
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Rival franchises, remaining purses, and ownership details in this tournament.
                                    </p>
                                </div>

                                {!tournament?.teams || tournament.teams.length <= 1 ? (
                                    <div className="py-16 text-center text-gray-500 text-sm rounded-2xl bg-white/5 border border-white/5">
                                        No other rival teams currently registered in this championship.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {tournament.teams
                                            .filter((t) => t.id !== team.id)
                                            .map((opponent) => {
                                                const oppTotal = opponent.purseAmount || 0;
                                                const oppRem = opponent.remainingPurse || 0;
                                                const oppSpent = Math.max(0, oppTotal - oppRem);
                                                const oppSquad = opponent.playersWon?.length || 0;

                                                return (
                                                    <div
                                                        key={opponent.id}
                                                        className="bg-[#070C1E] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-200 shadow-xl flex flex-col justify-between gap-4"
                                                    >
                                                        <div className="flex items-center gap-3.5">
                                                            {opponent.logo ? (
                                                                <img
                                                                    src={opponent.logo}
                                                                    alt={opponent.name}
                                                                    className="w-12 h-12 rounded-xl object-cover border border-[#FDB913]/30 shadow-md bg-black/30"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FDB913]/20 to-amber-600/20 border border-[#FDB913]/30 text-[#FDB913] flex items-center justify-center font-black text-sm shadow-md">
                                                                    {opponent.name.substring(0, 2).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-extrabold text-white text-base truncate uppercase">
                                                                    {opponent.name}
                                                                </h4>
                                                                <p className="text-xs text-gray-400 mt-0.5">
                                                                    Owner: <strong className="text-gray-200">{opponent.ownerName || "Organizer Allotment"}</strong>
                                                                </p>
                                                            </div>
                                                            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white/5 text-gray-300 border border-white/10">
                                                                {oppSquad} Players
                                                            </span>
                                                        </div>

                                                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                                                            <div>
                                                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Spent</span>
                                                                <span className="text-gray-300 font-semibold">{formatCurrency(oppSpent)}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Purse Balance</span>
                                                                <span className="text-[#FDB913] font-black text-sm">{formatCurrency(oppRem)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── PLAYER DETAILS MODAL ───────────────────────────────────── */}
                {selectedPlayerId && (
                    <PlayerDetailsModal
                        playerId={selectedPlayerId}
                        onClose={() => setSelectedPlayerId(null)}
                    />
                )}
            </main>
        </div>
    );
};

export default TeamOwnerDashboard;
