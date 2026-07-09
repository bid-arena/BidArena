import React, { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Link } from "react-router-dom";
import axios from "axios";
import {
    Trophy,
    Users,
    User,
    IndianRupee,
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
    Play
} from "lucide-react";
import { toast } from "react-hot-toast";

const TeamOwnerDashboard = () => {
    const [team, setTeam] = useState(null);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("roster"); // Tabs: roster, bids, opponents, league-info
    const [searchQuery, setSearchQuery] = useState("");

    const getToken = () => {
        return localStorage.getItem("token");
    };

    const loadDashboardData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            // Fetch owner's team details
            const teamRes = await axios.get("http://localhost:5000/api/teams/owner/my-team", {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });
            const teamData = teamRes.data.data;
            setTeam(teamData);

            // Fetch tournament details if team is registered
            if (teamData?.tournamentId) {
                const tourRes = await axios.get(`http://localhost:5000/api/tournaments/${teamData.tournamentId}`, {
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                });
                setTournament(tourRes.data.data);
            }
        } catch (error) {
            console.error("Dashboard load error:", error);
            // Don't show toast error if it is a 404 (handled in UI)
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

                        <div className="flex items-center gap-3">
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

                    {/* LIVE AUCTION HIGHLIGHT */}
                    {activeAuction && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 animate-pulse">
                                    <Flame size={24} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-white text-base">Auction is Live!</h4>
                                    <p className="text-xs text-gray-300 mt-0.5">Bids are currently being placed in your tournament.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                                <span className="text-xs font-bold uppercase text-red-400 tracking-wider">Active Arena Session</span>
                                <Link
                                    to={`/auctions/live/${team.tournamentId}`}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-red-600/25 active:scale-95 shrink-0"
                                >
                                    <Play size={10} fill="currentColor" /> Enter Arena & Bid
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* STATS TILES GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* TOTAL PURSE */}
                        <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Allocated Purse</span>
                                <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20 text-green-400">
                                    <IndianRupee size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-green-400">
                                    {formatCurrency(totalPurse)}
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1">Starting budget for players</p>
                            </div>
                        </div>

                        {/* REMAINING PURSE */}
                        <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Remaining Purse</span>
                                <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20 text-blue-400">
                                    <IndianRupee size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className={`text-2xl font-black ${remainingPurse < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                    {formatCurrency(remainingPurse)}
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1">Available bidding cash</p>
                            </div>
                        </div>

                        {/* PURSE SPENT */}
                        <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Purse Spent</span>
                                <div className="bg-yellow-500/10 p-2 rounded-xl border border-yellow-500/20 text-[#FDB913]">
                                    <IndianRupee size={16} />
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
                                                        <tr key={record.id} className="hover:bg-white/5 transition-colors">
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
                                                        <p className="text-xs text-gray-500">Remaining Purse</p>
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
            </main>
        </div>
    );
};

export default TeamOwnerDashboard;
