import React, { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Link } from "react-router-dom";
import axios from "axios";
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
    RotateCcw
} from "lucide-react";
import { toast } from "react-hot-toast";
import PlayerDetailsModal from "../components/players/PlayerDetailsModal";

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
        AVAILABLE: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
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

    const getToken = () => {
        return localStorage.getItem("token");
    };

    const loadDashboardData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            // Fetch all owner's teams
            const teamsRes = await axios.get("http://localhost:5000/api/teams/owner/my-teams", {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });
            const teamsData = teamsRes.data.data || [];
            setAllTeams(teamsData);

            let currentTeam = team;
            if (teamsData.length > 0) {
                if (!currentTeam || !teamsData.some(t => t.id === currentTeam.id)) {
                    currentTeam = teamsData[0];
                } else {
                    currentTeam = teamsData.find(t => t.id === currentTeam.id);
                }
                setTeam(currentTeam);

                // Fetch tournament details for the selected team
                if (currentTeam?.tournamentId) {
                    const tourRes = await axios.get(`http://localhost:5000/api/tournaments/${currentTeam.tournamentId}`, {
                        headers: {
                            Authorization: `Bearer ${getToken()}`
                        }
                    });
                    setTournament(tourRes.data.data);
                } else {
                    setTournament(null);
                }
            } else {
                setTeam(null);
                setTournament(null);
            }
        } catch (error) {
            console.error("Dashboard load error:", error);
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

    // Memoized map of playerId -> { team, price } to determine if player is sold
    const soldPlayersMap = React.useMemo(() => {
        const map = new Map();
        if (!tournament || !tournament.teams) return map;
        tournament.teams.forEach(t => {
            if (t.playersWon) {
                t.playersWon.forEach(soldRec => {
                    map.set(soldRec.playerId, {
                        teamName: t.name,
                        logo: t.logo,
                        price: soldRec.price || 0
                    });
                });
            }
        });
        return map;
    }, [tournament]);

    // Player Pool filtering & sorting logic
    const processedPlayers = React.useMemo(() => {
        if (!tournament || !tournament.players) return [];
        let result = [...tournament.players];

        // Search Filter
        if (playerSearch.trim() !== "") {
            const q = playerSearch.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.role && p.role.toLowerCase().includes(q))
            );
        }

        // Role Filter
        if (playerRole !== "All") {
            result = result.filter(p => {
                if (playerRole === "Wicketkeeper") {
                    return p.role === "Wicketkeeper" || p.role === "Wicket-Keeper";
                }
                return p.role === playerRole;
            });
        }

        // Status Filter
        if (playerStatus !== "All") {
            if (playerStatus === "SOLD") {
                result = result.filter(p => soldPlayersMap.has(p.id));
            } else if (playerStatus === "AVAILABLE") {
                result = result.filter(p => !soldPlayersMap.has(p.id));
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
    const activeAuctions = React.useMemo(() => {
        const list = [];
        allTeams.forEach(t => {
            const active = t.tournament?.auctions?.find(a => a.status === "ACTIVE");
            if (active) {
                list.push({
                    team: t,
                    tournament: t.tournament,
                    auction: active
                });
            }
        });
        return list;
    }, [allTeams]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN').format(amount || 0) + " Pts";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex bg-[#0A0F2C] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm">Loading Owner Dashboard...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
                <Sidebar />
                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-6 animate-pulse">
                        <ShieldAlert size={36} />
                    </div>
                    <h2 className="text-2xl font-black mb-2 uppercase tracking-tight text-white">
                        No Team Registered
                    </h2>
                    <p className="text-gray-400 max-w-md mb-8 text-sm">
                        Your account is registered as a Team Owner, but you haven't been assigned to a team yet.
                        Please contact the Tournament Organizer to register your team.
                    </p>
                    <button
                        onClick={() => loadDashboardData(false)}
                        className="inline-flex items-center gap-2 bg-[#FDB913] text-black px-6 py-3 rounded-xl font-bold hover:opacity-95 transition"
                    >
                        <RefreshCw size={16} /> Check Assignment
                    </button>
                </main>
            </div>
        );
    }

    // Calculations
    const totalPurse = team.purseAmount || 0;
    const remainingPurse = team.remainingPurse || 0;
    const spentPurse = totalPurse - remainingPurse;
    const spentPercent = totalPurse > 0 ? (spentPurse / totalPurse) * 100 : 0;
    const rosterCount = team.playersWon?.length || 0;
    const bidsCount = team.bids?.length || 0;

    // Filtered lists
    const filteredRoster = (team.playersWon || []).filter((record) => {
        const pName = record.player?.name || "";
        return pName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const activeAuction = tournament?.auctions?.find(a => a.status === "ACTIVE");

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* TOP HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-[#FDB913]/10 px-3 py-1 rounded-full border border-[#FDB913]/20 mb-2">
                                <Flame size={12} className="text-[#FDB913]" />
                                <span className="text-[10px] font-bold text-[#FDB913] uppercase tracking-wider">Owner Portal</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                                {team.name}
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Welcome back, <strong className="text-gray-200">{team.ownerName}</strong>. Monitor your squad, bidding history, and purse balances.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {allTeams.length > 1 && (
                                <div className="flex items-center gap-2 mr-2">
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Switch Team:</span>
                                    <select
                                        value={team.id}
                                        onChange={async (e) => {
                                            const selectedId = e.target.value;
                                            const selectedTeam = allTeams.find(t => t.id === selectedId);
                                            setTeam(selectedTeam);
                                            if (selectedTeam?.tournamentId) {
                                                setLoading(true);
                                                try {
                                                    const tourRes = await axios.get(`http://localhost:5000/api/tournaments/${selectedTeam.tournamentId}`, {
                                                        headers: {
                                                            Authorization: `Bearer ${getToken()}`
                                                        }
                                                    });
                                                    setTournament(tourRes.data.data);
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
                                        className="bg-[#080E27] hover:bg-[#0F1B3D] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FDB913] text-gray-300 font-bold transition cursor-pointer"
                                    >
                                        {allTeams.map(t => (
                                            <option key={t.id} value={t.id} className="bg-[#0A0F2C]">
                                                {t.name} ({t.tournament?.name || "No Tournament"})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                onClick={() => loadDashboardData(true)}
                                disabled={refreshing}
                                className="p-2.5 rounded-xl bg-[#080E27] hover:bg-[#0F1B3D] border border-white/5 text-gray-400 hover:text-white transition disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
                            >
                                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                                <span>Sync Data</span>
                            </button>
                        </div>
                    </div>

                    {/* LIVE AUCTIONS LIST */}
                    {activeAuctions.length > 0 && (
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-2 px-1">
                                <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">
                                    Live Auctions Running
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeAuctions.map(({ team: t, tournament: tour }) => (
                                    <div key={t.id} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 animate-pulse">
                                                <Flame size={24} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-white text-base truncate uppercase" title={tour.name}>{tour.name}</h4>
                                                <p className="text-xs text-gray-300 mt-0.5">Participating as: <strong className="text-white">{t.name}</strong></p>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/auctions/live/${t.tournamentId}`}
                                            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-red-600/25 active:scale-95 shrink-0"
                                        >
                                            <Play size={10} fill="currentColor" /> Enter Arena
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STATS TILES GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* TOTAL PURSE */}
                        <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Allocated Points</span>
                                <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20 text-green-400">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-green-400">
                                    {formatCurrency(totalPurse)}
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1">Starting points allocation</p>
                            </div>
                        </div>

                        {/* REMAINING PURSE */}
                        <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Remaining Points</span>
                                <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20 text-blue-400">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className={`text-2xl font-black ${remainingPurse < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                    {formatCurrency(remainingPurse)}
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1">Available points budget</p>
                            </div>
                        </div>

                        {/* PURSE SPENT */}
                        <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Points Spent</span>
                                <div className="bg-yellow-500/10 p-2 rounded-xl border border-yellow-500/20 text-[#FDB913]">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {formatCurrency(spentPurse)} <span className="text-xs font-semibold text-gray-500">({spentPercent.toFixed(0)}%)</span>
                                </h3>
                                <div className="w-full bg-[#001F54] rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div
                                        className={`h-1.5 rounded-full ${spentPercent >= 80 ? 'bg-red-500' : 'bg-green-400'}`}
                                        style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ROSTER SIZE */}
                        <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Roster Size</span>
                                <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20 text-purple-400">
                                    <Users size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {rosterCount}
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1">Purchased squad players</p>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT BLOCK */}
                    <div className="bg-[#080E27] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Tab Headers */}
                        <div className="flex border-b border-white/5 bg-[#001F54]/10">
                            <button
                                onClick={() => setActiveTab("roster")}
                                className={`flex-1 py-4 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "roster" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/25" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <Users size={16} />
                                <span className="hidden sm:inline">Squad Roster</span>
                                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">{rosterCount}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("players")}
                                className={`flex-1 py-4 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "players" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/25" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <User size={16} />
                                <span className="hidden sm:inline">Player Pool</span>
                                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">{tournament?.players?.length || 0}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("bids")}
                                className={`flex-1 py-4 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "bids" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/25" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <Clock size={16} />
                                <span className="hidden sm:inline">Bids History</span>
                                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">{bidsCount}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("opponents")}
                                className={`flex-1 py-4 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "opponents" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/25" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <Trophy size={16} />
                                <span className="hidden sm:inline">League Competitors</span>
                                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">{(tournament?.teams?.length || 1) - 1}</span>
                            </button>
                        </div>

                        {/* Tab Body */}
                        <div className="p-6">
                            {/* ROSTER TAB */}
                            {activeTab === "roster" && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <h2 className="text-lg font-bold text-gray-300">Purchased Roster</h2>

                                        {rosterCount > 0 && (
                                            <div className="relative w-full sm:w-64">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                                    <Search size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search squad..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#001F54]/30 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#FDB913] transition text-xs text-white placeholder-gray-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {rosterCount === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No players purchased during live bidding yet.
                                        </div>
                                    ) : filteredRoster.length === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No squad players matching "{searchQuery}".
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#001F54]/5">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#001F54]/30 text-gray-400 font-semibold text-xs border-b border-white/5">
                                                    <tr>
                                                        <th className="p-4">Player Name</th>
                                                        <th className="p-4">Role</th>
                                                        <th className="p-4 text-right">Base Price</th>
                                                        <th className="p-4 text-right">Winning Price</th>
                                                        <th className="p-4 text-right">Sold At</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {filteredRoster.map((record) => (
                                                        <tr 
                                                            key={record.id} 
                                                            onClick={() => record.player?.id && setSelectedPlayerId(record.player.id)}
                                                            className="hover:bg-white/5 transition-colors cursor-pointer"
                                                        >
                                                            <td className="p-4 font-bold text-white">
                                                                {record.player?.name || "Unknown Player"}
                                                            </td>
                                                            <td className="p-4 text-gray-300 text-xs">
                                                                <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10 font-medium">
                                                                    {record.player?.role || "Batsman"}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right text-gray-400 font-medium">
                                                                {formatCurrency(record.player?.basePrice)}
                                                            </td>
                                                            <td className="p-4 text-right text-green-400 font-black">
                                                                {formatCurrency(record.price)}
                                                            </td>
                                                            <td className="p-4 text-right text-gray-500 text-xs">
                                                                {new Date(record.soldAt).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PLAYERS TAB (PLAYER POOL) */}
                            {activeTab === "players" && (
                                <div className="space-y-6">
                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Tournament Player Pool</h2>
                                            <p className="text-xs text-gray-400 mt-1">Browse all players registered for this tournament auction.</p>
                                        </div>

                                        {/* Filter Bar Controls */}
                                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full xl:w-auto">
                                            {/* Search */}
                                            <div className="relative flex-1 sm:w-64 sm:flex-none">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                                    <Search size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search player name/role..."
                                                    value={playerSearch}
                                                    onChange={(e) => setPlayerSearch(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#001F54]/30 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#FDB913] transition text-xs text-white placeholder-gray-500"
                                                />
                                            </div>

                                            {/* Sort Select */}
                                            <div className="flex items-center gap-2">
                                                <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
                                                <select
                                                    value={playerSort}
                                                    onChange={(e) => setPlayerSort(e.target.value)}
                                                    className="bg-[#001F54]/30 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FDB913] text-gray-300"
                                                >
                                                    <option value="name-asc" className="bg-[#0A0F2C]">Name (A-Z)</option>
                                                    <option value="basePrice-desc" className="bg-[#0A0F2C]">Base Price: High to Low</option>
                                                    <option value="basePrice-asc" className="bg-[#0A0F2C]">Base Price: Low to High</option>
                                                    <option value="soldPrice-desc" className="bg-[#0A0F2C]">Sold Price: High to Low</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabs for Category Filters */}
                                    <div className="flex flex-wrap gap-2 items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/5">
                                        <div className="flex flex-wrap gap-1">
                                            {["All", "Batsman", "Bowler", "All-Rounder", "Wicketkeeper"].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => setPlayerRole(role)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${playerRole === role ? 'bg-[#FDB913] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-1 border-l border-white/10 pl-2 mt-2 sm:mt-0">
                                            {["All", "AVAILABLE", "SOLD"].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setPlayerStatus(status)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${playerStatus === status ? 'bg-[#001F54] text-[#FDB913] border border-[#FDB913]/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {status === "AVAILABLE" ? "Available" : status === "SOLD" ? "Sold" : "All Status"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Players Grid / Table */}
                                    {!tournament?.players || tournament.players.length === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No players registered in this tournament yet.
                                        </div>
                                    ) : processedPlayers.length === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No players matching the filters.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop Table View */}
                                            <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/5 bg-[#001F54]/5 shadow-xl">
                                                <table className="w-full text-sm text-left border-collapse">
                                                    <thead className="bg-[#001F54]/30 text-gray-400 font-semibold text-xs border-b border-white/5">
                                                        <tr>
                                                            <th className="p-4">Player</th>
                                                            <th className="p-4">Role</th>
                                                            <th className="p-4 text-right">Base Price</th>
                                                            <th className="p-4 text-center">Status</th>
                                                            <th className="p-4">Purchased By</th>
                                                            <th className="p-4 text-right">Sold Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {processedPlayers.map((player) => {
                                                            const soldInfo = soldPlayersMap.get(player.id);
                                                            const isSold = !!soldInfo;

                                                            return (
                                                                <tr 
                                                                    key={player.id} 
                                                                    onClick={() => setSelectedPlayerId(player.id)}
                                                                    className="hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                                                                >
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar name={player.name} />
                                                                            <div>
                                                                                <div className="font-bold text-white text-sm">{player.name}</div>
                                                                                <div className="text-[10px] text-gray-500">ID: {player.id.substring(0, 8)}...</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <RoleBadge role={player.role} />
                                                                    </td>
                                                                    <td className="p-4 text-right text-gray-300 font-bold">
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
                                                                                    <div className="w-5 h-5 rounded-full bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-black text-[9px] text-[#FDB913]">
                                                                                        {soldInfo.teamName.substring(0, 2).toUpperCase()}
                                                                                    </div>
                                                                                )}
                                                                                <span className="text-gray-300 font-semibold truncate max-w-[120px]" title={soldInfo.teamName}>
                                                                                    {soldInfo.teamName}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-600">—</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4 text-right">
                                                                        {isSold ? (
                                                                            <span className="text-green-400 font-black">{formatCurrency(soldInfo.price)}</span>
                                                                        ) : (
                                                                            <span className="text-gray-600">—</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Cards View */}
                                            <div className="md:hidden space-y-3">
                                                {processedPlayers.map((player) => {
                                                    const soldInfo = soldPlayersMap.get(player.id);
                                                    const isSold = !!soldInfo;

                                                    return (
                                                         <div 
                                                             key={player.id} 
                                                             onClick={() => setSelectedPlayerId(player.id)}
                                                             className="bg-[#001F54]/10 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/10 transition shadow-md cursor-pointer"
                                                         >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar name={player.name} />
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-bold text-white text-sm truncate">{player.name}</h4>
                                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                            <RoleBadge role={player.role} />
                                                                            <StatusBadge status={isSold ? "SOLD" : "AVAILABLE"} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
                                                                <div>
                                                                    <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Base Price</span>
                                                                    <span className="text-gray-300 font-extrabold mt-0.5 block">{formatCurrency(player.basePrice)}</span>
                                                                </div>
                                                                {isSold ? (
                                                                    <div>
                                                                        <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Sold Price</span>
                                                                        <span className="text-green-400 font-extrabold mt-0.5 block">{formatCurrency(soldInfo.price)}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Purchased By</span>
                                                                        <span className="text-gray-400 mt-0.5 block">—</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {isSold && (
                                                                <div className="mt-3 bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                                                                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Purchaser:</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {soldInfo.logo ? (
                                                                            <img
                                                                                src={soldInfo.logo}
                                                                                alt={soldInfo.teamName}
                                                                                className="w-4 h-4 rounded-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-4 h-4 rounded-full bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-black text-[8px] text-[#FDB913]">
                                                                                {soldInfo.teamName.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                        <span className="text-xs text-gray-200 font-bold truncate max-w-[150px]">{soldInfo.teamName}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* BIDS TAB */}
                            {activeTab === "bids" && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-gray-300">My Bidding History</h2>

                                    {bidsCount === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No bids placed by your team yet.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#001F54]/5">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#001F54]/30 text-gray-400 font-semibold text-xs border-b border-white/5">
                                                    <tr>
                                                        <th className="p-4">Player</th>
                                                        <th className="p-4 text-right">Bid Amount</th>
                                                        <th className="p-4 text-right">Timestamp</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {team.bids.map((bid) => (
                                                        <tr key={bid.id} className="hover:bg-white/5 transition-colors">
                                                            <td className="p-4 font-bold text-white">
                                                                {bid.player?.name || `Player #${bid.playerId.substring(0, 8)}`}
                                                            </td>
                                                            <td className="p-4 text-right text-[#FDB913] font-black">
                                                                {formatCurrency(bid.amount)}
                                                            </td>
                                                            <td className="p-4 text-right text-gray-500 text-xs">
                                                                {new Date(bid.createdAt).toLocaleTimeString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* LEAGUE OPPONENTS TAB */}
                            {activeTab === "opponents" && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-gray-300">League Competitors</h2>

                                    {!tournament?.teams || tournament.teams.length <= 1 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No other competitor teams registered in this league yet.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tournament.teams.filter(t => t.id !== team.id).map((opponent) => (
                                                <div key={opponent.id} className="bg-[#001F54]/10 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition">
                                                    {opponent.logo ? (
                                                        <img
                                                            src={opponent.logo}
                                                            alt={opponent.name}
                                                            className="w-12 h-12 rounded-full object-cover border border-[#FDB913]"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-bold text-sm text-[#FDB913]">
                                                            {opponent.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-extrabold text-white text-sm truncate uppercase">{opponent.name}</h4>
                                                        <p className="text-xs text-gray-400 mt-0.5">Owner: {opponent.ownerName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Remaining Points</p>
                                                        <p className="text-sm font-extrabold text-[#FDB913] mt-0.5">{formatCurrency(opponent.remainingPurse)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
