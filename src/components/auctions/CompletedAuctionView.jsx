import React, { useState } from "react";
import {
    Trophy,
    Users,
    User,
    Search,
    Award,
    TrendingUp,
    Coins,
    BarChart3,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    Gavel
} from "lucide-react";

const CompletedAuctionView = ({ tournament, allTeams, allPlayers, formatINR, isOrganizer, isOwner, myTeam, completedStats, completedBidLogs }) => {
    const [activeTab, setActiveTab] = useState("overview"); // overview, squads, players
    const [playersSubTab, setPlayersSubTab] = useState("sold"); // sold, unsold
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [expandedTeams, setExpandedTeams] = useState(() => {
        const myTeamId = myTeam?.id || myTeam?._id;
        if (myTeamId) {
            return { [myTeamId]: true };
        }
        return {};
    });

    // Timeline Search and Filter States
    const [timelineSearch, setTimelineSearch] = useState("");
    const [timelineTeamFilter, setTimelineTeamFilter] = useState("");

    // Formatting Helpers
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "0 Pts";
        return new Intl.NumberFormat("en-IN").format(amount) + " Pts";
    };

    // Calculate Analytics with Backend Fallback
    const soldPlayers = allPlayers.filter(p => !!p.soldRecord);
    const unsoldPlayers = allPlayers.filter(p => !p.soldRecord);

    const totalSpend = completedStats && completedStats.totalSpent !== undefined
        ? completedStats.totalSpent
        : soldPlayers.reduce((sum, p) => sum + p.soldRecord.price, 0);

    const averageSpend = completedStats && completedStats.averageBid !== undefined
        ? completedStats.averageBid
        : (soldPlayers.length > 0 ? Math.round(totalSpend / soldPlayers.length) : 0);

    const totalSoldBackend = completedStats && completedStats.playersSold !== undefined ? completedStats.playersSold : soldPlayers.length;
    const totalUnsoldBackend = completedStats && completedStats.playersUnsold !== undefined ? completedStats.playersUnsold : unsoldPlayers.length;

    // Highest Bid Info with backend stats lookup
    let highestBidPrice = 0;
    let highestBidderName = "";
    let highestBidTeam = "";

    if (completedStats && completedStats.highestBid) {
        highestBidPrice = completedStats.highestBid.price;
        highestBidderName = completedStats.highestBid.playerName;
        highestBidTeam = completedStats.highestBid.teamName;
    } else if (soldPlayers.length > 0) {
        const localHighest = [...soldPlayers].sort((a, b) => b.soldRecord.price - a.soldRecord.price)[0];
        highestBidPrice = localHighest.soldRecord.price;
        highestBidderName = localHighest.name;
        const bTeam = allTeams.find(t => t.id === localHighest.soldRecord.teamId);
        highestBidTeam = bTeam ? bTeam.name : "";
    }

    // Top 5 Highest Bids
    const topBids = [...soldPlayers]
        .sort((a, b) => b.soldRecord.price - a.soldRecord.price)
        .slice(0, 5);

    // Toggle Team Roster Expansion
    const toggleTeam = (teamId) => {
        setExpandedTeams(prev => ({
            ...prev,
            [teamId]: !prev[teamId]
        }));
    };

    // Filter Players List
    const filteredPlayers = allPlayers.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "" || p.role === roleFilter;
        const matchesStatus = playersSubTab === "sold" ? !!p.soldRecord : !p.soldRecord;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const rolesList = [...new Set(allPlayers.map(p => p.role))];

    // Filter Bid Logs
    const filteredBidLogs = (completedBidLogs || []).filter(log => {
        const matchesSearch = log.player?.name.toLowerCase().includes(timelineSearch.toLowerCase());
        const matchesTeam = timelineTeamFilter === "" || log.team?.id === timelineTeamFilter;
        return matchesSearch && matchesTeam;
    });

    // Team Owner Specific Data
    const myTeamId = myTeam?.id || myTeam?._id;
    const myTeamBoughtPlayers = myTeamId ? soldPlayers.filter(p => p.soldRecord && (p.soldRecord.teamId === myTeamId)) : [];
    const myTeamSpend = myTeamBoughtPlayers.reduce((sum, p) => sum + p.soldRecord.price, 0);
    const myTeamRemaining = myTeam ? (myTeam.remainingPurse !== undefined ? myTeam.remainingPurse : (myTeam.purseAmount - myTeamSpend)) : 0;

    // Count Roles in My Team
    const myTeamRoles = myTeamBoughtPlayers.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
    }, {});

    // Sort Teams to display own team at the top
    const displayTeams = [...allTeams].sort((a, b) => {
        if (myTeamId) {
            const aId = a.id || a._id;
            const bId = b.id || b._id;
            if (aId === myTeamId) return -1;
            if (bId === myTeamId) return 1;
        }
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HERO COMPLETE COVER */}
            <div className="bg-[#080E27] border border-white/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FDB913]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10 relative">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 bg-[#FDB913]/10 border border-[#FDB913]/20 px-3.5 py-1.5 rounded-full">
                            <Trophy size={14} className="text-[#FDB913]" />
                            <span className="text-[10px] font-extrabold uppercase text-[#FDB913] tracking-widest">
                                Auction Arena Finished
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                            {isOwner && myTeam
                                ? `Congratulations! ${myTeam.name} Squad is Finalized`
                                : `${tournament.name} — Final Standings & Summary`}
                        </h2>
                        <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                            {isOwner && myTeam
                                ? `Welcome to your team summary, ${myTeam.ownerName}. You bought ${myTeamBoughtPlayers.length} players with a remaining budget of ${formatCurrency(myTeamRemaining)}. Explore team standings and statistics below.`
                                : `The live hammer has rested. All teams have finalized their rosters and registered their bidding history. Check final standings, points spend analytics, and player stats below.`}
                        </p>
                    </div>
                </div>
            </div>

            {/* ROLE-SPECIFIC BANNER WIDGETS */}
            {isOwner && myTeam && (
                <div className="bg-gradient-to-br from-[#0D1C48] to-[#080E27] border border-[#FDB913]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-stretch gap-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDB913]/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex-1 space-y-4">
                        <div>
                            <span className="text-[10px] font-bold text-[#FDB913] uppercase tracking-wider">My Squad Performance</span>
                            <h3 className="text-lg font-black text-white mt-1 uppercase">Squad Registry Completed</h3>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                You have successfully finalized your squad details. Below is a breakdown of your budget spent, remaining purse, and squad balance.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-center">
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Remaining Points</p>
                                <p className="text-sm font-black text-green-400 mt-0.5">{formatCurrency(myTeamRemaining)}</p>
                            </div>
                            <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-center">
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Total Spent</p>
                                <p className="text-sm font-black text-white mt-0.5">{formatCurrency(myTeamSpend)}</p>
                            </div>
                            <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-center">
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Squad Count</p>
                                <p className="text-sm font-black text-white mt-0.5">{myTeamBoughtPlayers.length} Players</p>
                            </div>
                            <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-center">
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Captain</p>
                                <p className="text-sm font-bold text-yellow-400 truncate mt-0.5">{myTeam.captainName || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center min-w-[200px] space-y-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Role Breakdown</p>
                        <div className="space-y-1.5">
                            {Object.keys(myTeamRoles).length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No players acquired</p>
                            ) : (
                                Object.entries(myTeamRoles).map(([role, count]) => (
                                    <div key={role} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">{role}</span>
                                        <span className="font-extrabold text-white bg-white/5 px-2 py-0.5 rounded-md text-[10px]">{count}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isOrganizer && (
                <div className="bg-gradient-to-br from-[#0D1C48] to-[#080E27] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-stretch gap-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex-1 space-y-4">
                        <div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Organizer Controls & Statistics</span>
                            <h3 className="text-lg font-black text-white mt-1 uppercase">Tournament Stats Summary</h3>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                As organizer, you have ended the active live session. Roster lock status is verified, and team squads are ready for competition schedules.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-center">
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Total Teams</p>
                                <p className="text-sm font-black text-white mt-0.5">{allTeams.length} Teams</p>
                            </div>
                            <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-center">
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Total Players Pool</p>
                                <p className="text-sm font-black text-white mt-0.5">{allPlayers.length} Players</p>
                            </div>
                            <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-center">
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Unsold Count</p>
                                <p className="text-sm font-black text-yellow-500 mt-0.5">{totalUnsoldBackend} Players</p>
                            </div>
                            <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-center">
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Sold Count</p>
                                <p className="text-sm font-black text-green-400 mt-0.5">{totalSoldBackend} Players</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center min-w-[200px] gap-2.5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Quick Actions</p>
                        <button
                            onClick={() => window.print()}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-xl text-xs transition border border-white/10"
                        >
                            Print Summary Report
                        </button>
                        <a
                            href="/organizer-dashboard"
                            className="w-full bg-[#FDB913] hover:bg-amber-500 text-black text-center font-black py-2 rounded-xl text-xs transition shadow-lg shadow-yellow-500/10 block"
                        >
                            Organizer Dashboard
                        </a>
                    </div>
                </div>
            )}

            {/* KEY METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* TOTAL SPEND */}
                <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total League Points Spent</span>
                        <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/25 text-green-400">
                            <Coins size={16} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-green-400">{formatCurrency(totalSpend)}</h3>
                        <p className="text-[10px] text-gray-500 mt-1">Invested across all teams</p>
                    </div>
                </div>

                {/* PLAYERS SOLD RATIO */}
                <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sold vs Unsold</span>
                        <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/25 text-blue-400">
                            <User size={16} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white">
                            {totalSoldBackend} <span className="text-xs font-medium text-gray-500">/ {allPlayers.length}</span>
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1">
                            {totalUnsoldBackend} players went unsold
                        </p>
                    </div>
                </div>

                {/* HIGHEST BID */}
                <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Highest Winning Bid</span>
                        <div className="bg-yellow-500/10 p-2 rounded-xl border border-[#FDB913]/25 text-[#FDB913]">
                            <Award size={16} />
                        </div>
                    </div>
                    <div>
                        {highestBidPrice > 0 ? (
                            <div>
                                <h3 className="text-2xl font-black text-[#FDB913] truncate">
                                    {formatCurrency(highestBidPrice)}
                                </h3>
                                <p className="text-[10px] text-gray-300 font-medium truncate mt-0.5">
                                    {highestBidderName} {highestBidTeam && `• by ${highestBidTeam}`}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-gray-400 italic">No sales recorded</p>
                        )}
                    </div>
                </div>

                {/* AVERAGE PLAYER BID */}
                <div className="bg-[#080E27] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Average Bid Price</span>
                        <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/25 text-purple-400">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white">{formatCurrency(averageSpend)}</h3>
                        <p className="text-[10px] text-gray-500 mt-1">Per successfully sold player</p>
                    </div>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-white/5 p-1 bg-white/2 rounded-2xl max-w-md">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 py-2.5 px-2 text-center font-bold text-xs rounded-xl transition ${activeTab === "overview" ? "bg-[#FDB913] text-black shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                >
                    Overview & Stats
                </button>
                <button
                    onClick={() => setActiveTab("squads")}
                    className={`flex-1 py-2.5 px-2 text-center font-bold text-xs rounded-xl transition ${activeTab === "squads" ? "bg-[#FDB913] text-black shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                >
                    Squad Rosters ({allTeams.length})
                </button>
                <button
                    onClick={() => setActiveTab("players")}
                    className={`flex-1 py-2.5 px-2 text-center font-bold text-xs rounded-xl transition ${activeTab === "players" ? "bg-[#FDB913] text-black shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                >
                    Player Pool ({allPlayers.length})
                </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="space-y-6">
                {/* 1. OVERVIEW & LEADERBOARD TAB */}
                {activeTab === "overview" && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* TOP BIDS LEADERBOARD */}
                            <div className="bg-[#080E27] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
                                <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 uppercase tracking-wide">
                                    <Award size={18} className="text-[#FDB913]" /> Top 5 Highest Winning Bids
                                </h3>

                                {topBids.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic py-6 text-center">No successful bids logged.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {topBids.map((player, index) => {
                                            const buyerTeam = allTeams.find(t => t.id === player.soldRecord.teamId);
                                            return (
                                                <div
                                                    key={player.id}
                                                    className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index === 0 ? "bg-[#FDB913] text-black" :
                                                            index === 1 ? "bg-slate-300 text-black" :
                                                                index === 2 ? "bg-amber-700 text-white" :
                                                                    "bg-white/5 text-gray-400"
                                                            }`}>
                                                            #{index + 1}
                                                        </span>
                                                        <div>
                                                            <h4 className="font-extrabold text-sm text-white">{player.name}</h4>
                                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                                {player.role} • Sold to <span className="text-[#FDB913] font-semibold">{buyerTeam?.name || "Unknown Team"}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-black text-sm text-green-400">{formatCurrency(player.soldRecord.price)}</span>
                                                        <p className="text-[9px] text-gray-500 mt-0.5">Base: {formatCurrency(player.basePrice)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* TEAM SPEND PROGRESS BAR GRAPH */}
                            <div className="bg-[#080E27] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
                                <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 uppercase tracking-wide">
                                    <BarChart3 size={18} className="text-blue-400" /> Team Budget Spent Utilization
                                </h3>

                                {allTeams.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic py-6 text-center">No registered teams found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {allTeams.map((team) => {
                                            const totalSpent = team.playersWon?.reduce((sum, p) => sum + p.price, 0) || 0;
                                            const remaining = team.remainingPurse !== undefined ? team.remainingPurse : (team.purseAmount - totalSpent);
                                            const initialPurse = team.purseAmount || (totalSpent + remaining);
                                            const pct = initialPurse > 0 ? (totalSpent / initialPurse) * 100 : 0;

                                            return (
                                                <div key={team.id} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-gray-300 flex items-center gap-1.5">
                                                            {team.name}
                                                            {myTeamId && (team.id === myTeamId || team._id === myTeamId) && (
                                                                <span className="text-[8px] font-extrabold bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/25 px-1 py-0.2 rounded uppercase">Me</span>
                                                            )}
                                                        </span>
                                                        <span className="text-gray-400">
                                                            <strong className="text-green-400">{formatCurrency(totalSpent)}</strong> spent / {formatCurrency(initialPurse)}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-500 ${pct >= 90 ? "bg-red-500" :
                                                                pct >= 70 ? "bg-yellow-500" : "bg-green-500"
                                                                }`}
                                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[9px] text-gray-500">
                                                        <span>Spent: {pct.toFixed(0)}%</span>
                                                        <span>Points Left: {formatCurrency(remaining)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* OFFICIAL BIDDING TIMELINE LOGGER */}
                        <div className="bg-[#080E27] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                                <div>
                                    <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 uppercase tracking-wide">
                                        <Coins size={18} className="text-[#FDB913]" /> Official Chronological Bidding Timeline
                                    </h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Audit log of all successful and competing bids placed in the auction arena</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                            <Search size={12} />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Filter by player..."
                                            value={timelineSearch}
                                            onChange={(e) => setTimelineSearch(e.target.value)}
                                            className="pl-8 pr-3 py-1.5 bg-white/2 border border-white/10 rounded-xl focus:outline-none focus:border-[#FDB913] text-[10px] text-white w-full sm:w-44 placeholder-gray-600"
                                        />
                                    </div>

                                    <select
                                        value={timelineTeamFilter}
                                        onChange={(e) => setTimelineTeamFilter(e.target.value)}
                                        className="bg-white/2 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-gray-400 focus:outline-none focus:border-[#FDB913] max-w-[150px]"
                                    >
                                        <option value="">All Teams</option>
                                        {allTeams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {filteredBidLogs.length === 0 ? (
                                <p className="text-xs text-gray-500 italic py-10 text-center">No matching activity log entries found.</p>
                            ) : (
                                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                                    {filteredBidLogs.map((log, index) => {
                                        const isLoggedBidByMe = myTeamId && (log.team?.id === myTeamId || log.team?._id === myTeamId);
                                        const logTeamId = log.team?.id || log.team?._id;

                                        // Match if this bid was the successful sold/winning bid
                                        const matchedPlayer = soldPlayers.find(sp => sp.id === log.player?.id || sp._id === log.player?.id);
                                        const isWinningBid = matchedPlayer &&
                                            matchedPlayer.soldRecord &&
                                            matchedPlayer.soldRecord.price === log.amount &&
                                            (matchedPlayer.soldRecord.teamId === logTeamId);

                                        return (
                                            <div
                                                key={log.id || index}
                                                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 rounded-2xl border text-xs gap-2 transition duration-200 ${isWinningBid
                                                        ? "bg-amber-500/10 border-amber-500/35 text-white ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5"
                                                        : isLoggedBidByMe
                                                            ? "bg-green-500/5 border-green-500/25 text-white"
                                                            : "bg-white/2 border-white/5 text-gray-300 hover:border-white/10"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${isWinningBid
                                                            ? "bg-amber-500/25 text-amber-400 border border-amber-500/30 animate-pulse"
                                                            : isLoggedBidByMe
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-white/5 text-gray-500"
                                                        }`}>
                                                        {filteredBidLogs.length - index}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-white">{log.player?.name || "Player"}</span>
                                                            <span className="text-[10px] text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded font-bold uppercase">
                                                                {log.player?.role || "Cricket"}
                                                            </span>
                                                            {isWinningBid && (
                                                                <span className="bg-[#FDB913]/20 text-[#FDB913] border border-[#FDB913]/40 text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase flex items-center gap-0.5 shadow-md">
                                                                    <Gavel size={9} className="rotate-45" /> SOLD / Hammer Price
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 border-white/5 pt-2 sm:pt-0">
                                                    <span className="text-[10px] text-gray-400">
                                                        Placed by <strong className={`font-semibold ${isWinningBid ? "text-[#FDB913]" : isLoggedBidByMe ? "text-green-400" : "text-gray-300"}`}>{log.team?.name || "Team"}</strong>
                                                        {isLoggedBidByMe && <span className="text-[8px] bg-green-500/10 text-green-400 font-extrabold border border-green-500/30 px-1 rounded uppercase ml-1">Me</span>}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-black text-sm ${isWinningBid ? "text-[#FDB913]" : "text-green-400"}`}>{formatCurrency(log.amount)}</span>
                                                        <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap">
                                                            {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. SQUAD ROSTERS TAB */}
                {activeTab === "squads" && (
                    allTeams.length === 0 ? (
                        <div className="text-center py-12 bg-[#080E27] border border-white/5 rounded-3xl text-gray-500 text-sm">
                            No registered teams in this tournament.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {displayTeams.map((team) => {
                                const teamId = team.id || team._id;
                                const isExpanded = !!expandedTeams[teamId];
                                // Gather players won by this team
                                const teamBoughtPlayers = soldPlayers.filter(p => p.soldRecord.teamId === teamId);
                                const totalSpent = teamBoughtPlayers.reduce((sum, p) => sum + p.soldRecord.price, 0);
                                const initialPurse = team.purseAmount || (team.remainingPurse + totalSpent);
                                const remaining = team.remainingPurse !== undefined ? team.remainingPurse : (initialPurse - totalSpent);
                                const isOwnTeam = myTeamId && (teamId === myTeamId);

                                return (
                                    <div
                                        key={teamId}
                                        className={`bg-[#080E27] border rounded-3xl overflow-hidden hover:border-white/10 transition duration-300 shadow-lg ${isOwnTeam
                                                ? "border-[#FDB913] shadow-[#FDB913]/5 shadow-xl ring-1 ring-[#FDB913]/30"
                                                : "border-white/5"
                                            }`}
                                    >
                                        {/* Card Header Summary */}
                                        <div
                                            onClick={() => toggleTeam(teamId)}
                                            className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/1 select-none"
                                        >
                                            <div className="flex items-center gap-4">
                                                {team.logo ? (
                                                    <img
                                                        src={team.logo}
                                                        alt={team.name}
                                                        className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-lg uppercase shadow-md">
                                                        {team.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-black text-base text-white uppercase tracking-tight flex items-center gap-2">
                                                        {team.name}
                                                        {isOwnTeam && (
                                                            <span className="bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/30 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                                                                My Team
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">Owner: {team.ownerName} • Captain: {team.captainName}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Points Remaining</p>
                                                    <p className="text-sm font-extrabold text-green-400 mt-0.5">{formatCurrency(remaining)}</p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Squad Count</p>
                                                    <p className="text-sm font-extrabold text-white mt-0.5">{teamBoughtPlayers.length} Players</p>
                                                </div>
                                                <button className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition self-center shrink-0">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expandable Player List Table */}
                                        {isExpanded && (
                                            <div className="border-t border-white/5 bg-black/20 p-5 animate-in slide-in-from-top-4 duration-300">
                                                {teamBoughtPlayers.length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic py-4 text-center">No players bought by this team.</p>
                                                ) : (
                                                    <div className="overflow-x-auto rounded-2xl border border-white/5">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="bg-[#001F54]/30 text-gray-400 font-semibold text-xs border-b border-white/5">
                                                                <tr>
                                                                    <th className="p-3">Player Name</th>
                                                                    <th className="p-3">Role</th>
                                                                    <th className="p-3 text-right">Base Price</th>
                                                                    <th className="p-3 text-right">Winning Price</th>
                                                                    <th className="p-3 text-right">Bidding Increment</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5 bg-[#080E27]/40">
                                                                {teamBoughtPlayers.map((player) => {
                                                                    const diff = player.soldRecord.price - player.basePrice;
                                                                    const pctIncr = player.basePrice > 0 ? (diff / player.basePrice) * 100 : 0;
                                                                    return (
                                                                        <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                                                            <td className="p-3 font-bold text-white text-sm">{player.name}</td>
                                                                            <td className="p-3">
                                                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/15">
                                                                                    {player.role}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-3 text-right text-gray-400 font-medium text-xs">{formatCurrency(player.basePrice)}</td>
                                                                            <td className="p-3 text-right text-green-400 font-black text-sm">{formatCurrency(player.soldRecord.price)}</td>
                                                                            <td className="p-3 text-right text-xs">
                                                                                {diff > 0 ? (
                                                                                    <span className="text-yellow-500 font-semibold">
                                                                                        +{formatCurrency(diff)} (+{pctIncr.toFixed(0)}%)
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-gray-500 italic">Sold at Base</span>
                                                                                )}
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
                                );
                            })}
                        </div>
                    )
                )}

                {/* 3. PLAYER POOL REGISTRY TAB */}
                {activeTab === "players" && (
                    <div className="bg-[#080E27] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
                        {/* Registry Sub-Tabs and Search Filters */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-white/5">
                            {/* Sold vs Unsold Selector */}
                            <div className="flex gap-2 p-1 bg-white/2 rounded-xl w-full sm:w-auto">
                                <button
                                    onClick={() => setPlayersSubTab("sold")}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${playersSubTab === "sold" ? "bg-[#FDB913] text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    Sold Players ({soldPlayers.length})
                                </button>
                                <button
                                    onClick={() => setPlayersSubTab("unsold")}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${playersSubTab === "unsold" ? "bg-[#FDB913] text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    Unsold Players ({unsoldPlayers.length})
                                </button>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <Search size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search by player name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white/2 border border-white/10 rounded-xl focus:outline-none focus:border-[#FDB913] text-xs text-white placeholder-gray-500"
                                    />
                                </div>

                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="bg-white/2 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#FDB913]"
                                >
                                    <option value="">All Roles</option>
                                    {rolesList.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Player Listing Table */}
                        {filteredPlayers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 text-xs italic">
                                No players match your search criteria.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-white/5">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#001F54]/30 text-gray-400 font-semibold text-xs border-b border-white/5">
                                        <tr>
                                            <th className="p-4">Player Name</th>
                                            <th className="p-4">Role</th>
                                            {playersSubTab === "sold" ? (
                                                <>
                                                    <th className="p-4">Bought By</th>
                                                    <th className="p-4 text-right">Base Price</th>
                                                    <th className="p-4 text-right">Winning Price</th>
                                                    <th className="p-4 text-right">Bid Premium</th>
                                                </>
                                            ) : (
                                                <th className="p-4 text-right">Base Price</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredPlayers.map((player) => {
                                            const buyerTeam = playersSubTab === "sold"
                                                ? allTeams.find(t => t.id === player.soldRecord.teamId)
                                                : null;

                                            const diff = playersSubTab === "sold" ? player.soldRecord.price - player.basePrice : 0;
                                            const pctIncr = player.basePrice > 0 ? (diff / player.basePrice) * 100 : 0;
                                            const isBoughtByMe = myTeam && player.soldRecord && player.soldRecord.teamId === myTeam.id;

                                            return (
                                                <tr key={player.id} className={`transition-colors ${isBoughtByMe ? "bg-green-500/5 hover:bg-green-500/10 border-l-2 border-green-500" : "hover:bg-white/3"}`}>
                                                    <td className="p-4 font-bold text-white text-sm">
                                                        <div className="flex items-center gap-2">
                                                            {player.name}
                                                            {isBoughtByMe && (
                                                                <span className="bg-green-500/15 text-green-400 text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase border border-green-500/30">
                                                                    My Player
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            {player.role}
                                                        </span>
                                                    </td>
                                                    {playersSubTab === "sold" ? (
                                                        <>
                                                            <td className="p-4 font-bold text-[#FDB913] text-sm">
                                                                {buyerTeam ? buyerTeam.name : "Unknown Team"}
                                                            </td>
                                                            <td className="p-4 text-right text-gray-400 text-xs font-semibold">{formatCurrency(player.basePrice)}</td>
                                                            <td className="p-4 text-right text-green-400 font-black text-sm">{formatCurrency(player.soldRecord.price)}</td>
                                                            <td className="p-4 text-right text-xs">
                                                                {diff > 0 ? (
                                                                    <span className="text-yellow-500 font-semibold">
                                                                        +{formatCurrency(diff)} (+{pctIncr.toFixed(0)}%)
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-500 italic">Sold at Base</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <td className="p-4 text-right text-gray-300 font-bold text-sm">{formatCurrency(player.basePrice)}</td>
                                                    )}
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
    );
};

export default CompletedAuctionView;
