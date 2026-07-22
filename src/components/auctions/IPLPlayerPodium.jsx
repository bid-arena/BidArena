import React from "react";
import {
    Gavel,
    Clock,
    Check,
    X,
    Loader2,
    User,
    Coins,
    Trophy,
    AlertTriangle,
    Play,
    Pause,
    Sparkles,
    Flame,
    Search
} from "lucide-react";

// import batsmanIcon from "../../assets/icons/batsman.png";
// import bowlerIcon from "../../assets/icons/bowler.png";
// import allRounderIcon from "../../assets/icons/all-rounder.png";
// import wicketkeeperIcon from "../../assets/icons/wicketkeeper.png";

import batsmanIcon from "../../assets/icons/batsman-rb.png";
import bowlerIcon from "../../assets/icons/bowler-rb.png";
import allRounderIcon from "../../assets/icons/all-rounder-rb.png";
import wicketkeeperIcon from "../../assets/icons/wicketkeeper-rb.png";

const ROLE_CONFIG = {
    Batsman: { icon: batsmanIcon, label: "Batsman", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30 text-blue-300" },
    Bowler: { icon: bowlerIcon, label: "Bowler", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30 text-red-300" },
    "All-Rounder": { icon: allRounderIcon, label: "All-Rounder", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30 text-purple-300" },
    "Wicket-Keeper": { icon: wicketkeeperIcon, label: "Wicket-Keeper", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
    Wicketkeeper: { icon: wicketkeeperIcon, label: "Wicket-Keeper", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
};

const getAvatarStyle = (name) => {
    const hue = (name?.charCodeAt(0) || 75) * 23 % 360;
    return {
        background: `linear-gradient(135deg, hsl(${hue}, 80%, 45%), hsl(${(hue + 50) % 360}, 90%, 30%))`
    };
};

const getInitials = (name) => {
    if (!name || !name.trim()) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const IPLPlayerPodium = ({
    activePlayer,
    timeLeft,
    totalDuration = 30,
    isPaused,
    highestBid,
    highestBidderTeamName,
    highestBidderTeamId,
    myTeam,
    amILeading,
    formatINR,
    isOrganizer,
    isOwner,
    controlLoading,
    handlePause,
    handleResume,
    handleSell,
    handleMarkUnsold,
    nextMinBid,
    bidPlacing,
    handlePlaceBidAmount,
    customBidAmount,
    setCustomBidAmount,
    unsoldPlayers,
    nextPlayerId,
    setNextPlayerId,
    bidDuration,
    setBidDuration,
    handlePutPlayerOnAuction,
    nominatedPlayer,
    socketRef,
    tournamentId
}) => {
    // States for nomination search & filter (only for organizer)
    const [searchTerm, setSearchTerm] = React.useState("");
    const [roleFilter, setRoleFilter] = React.useState("All");

    // Timer Circular Ring Calculations
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const progressRatio = Math.max(0, Math.min(1, timeLeft / (totalDuration || 30)));
    const strokeDashoffset = circumference - progressRatio * circumference;

    const timerColor = timeLeft <= 5 ? "#EF4444" : timeLeft <= 10 ? "#F59E0B" : "#FDB913";

    // Filtering unsold players
    const filteredUnsold = unsoldPlayers.filter(p => {
        if (!p) return false;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "All" || p.role === roleFilter ||
            (roleFilter === "Wicket-Keeper" && p.role === "Wicketkeeper") ||
            (roleFilter === "Wicketkeeper" && p.role === "Wicket-Keeper");
        return matchesSearch && matchesRole;
    });

    return (
        <div className="bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#030712] border border-white/10 rounded-3xl p-5 sm:p-6 lg:p-7 relative overflow-hidden shadow-2xl">
            {/* Ambient Broadcast Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDB913]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Background Watermark Gavel */}
            <div className="absolute top-6 right-8 pointer-events-none opacity-5 hidden sm:block">
                <Gavel size={160} className="-rotate-45 text-white" />
            </div>

            {activePlayer ? (
                <div className="space-y-6 relative z-10">
                    {/* ── PLAYER PODIUM HEADER ── */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-5 gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {/* Avatar / Photo Ring with glowing backdrop */}
                            <div className="relative shrink-0 group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FDB913] to-blue-500 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse pointer-events-none" />
                                <div
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-black text-2xl sm:text-3xl font-black shadow-2xl border-2 border-white/20 relative z-10"
                                    style={getAvatarStyle(activePlayer.name)}
                                >
                                    {getInitials(activePlayer.name)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 z-20 bg-gradient-to-r from-[#FDB913] to-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black uppercase tracking-wider shadow-md animate-pulse">
                                    ON BLOCK
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase truncate">
                                    {activePlayer.name}
                                </h2>

                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    {ROLE_CONFIG[activePlayer.role] ? (
                                        <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-sm font-extrabold border ${ROLE_CONFIG[activePlayer.role].bg}`}>
                                            <img src={ROLE_CONFIG[activePlayer.role].icon} alt={activePlayer.role} className="w-8 h-8 object-contain scale-[1.5] -my-1 shrink-0" />
                                            {activePlayer.role}
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300 font-bold border border-white/10">
                                            {activePlayer.role}
                                        </span>
                                    )}

                                    {activePlayer.country && (
                                        <span className="px-2.5 py-0.5 bg-white/5 rounded-full text-[11px] text-gray-300 font-semibold border border-white/10">
                                            {activePlayer.country}
                                        </span>
                                    )}

                                    <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                        LIVE GAVEL
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── RADIAL COUNTDOWN TIMER RING ── */}
                        <div className={`w-full md:w-auto flex items-center justify-between md:justify-end gap-3.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border backdrop-blur-md transition-all ${timeLeft <= 5
                            ? "bg-red-500/20 border-red-500/60 text-red-400 animate-pulse shadow-xl shadow-red-500/20"
                            : "bg-[#030712]/90 border-white/10 text-white shadow-inner"
                            }`}>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                <Clock size={16} className={timeLeft <= 5 ? "text-red-400 animate-spin" : "text-[#FDB913]"} />
                                <span>Round Clock</span>
                            </div>

                            {/* Circular SVG Ring */}
                            <div className="relative w-14 h-14 flex items-center justify-center">
                                <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 64 64">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r={radius}
                                        className="stroke-white/10"
                                        strokeWidth="5"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r={radius}
                                        stroke={timerColor}
                                        strokeWidth="5"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-300 ease-linear"
                                    />
                                </svg>
                                <span className={`absolute text-sm sm:text-base font-black font-mono ${timeLeft <= 5 ? "text-red-400" : "text-white"}`}>
                                    {timeLeft}s
                                </span>
                            </div>

                            {isPaused && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-widest animate-pulse">
                                    PAUSED
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── BROADCAST BID TILES ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Base Price Card */}
                        <div className="bg-[#030712]/80 border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full blur-xl pointer-events-none" />
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Coins size={14} className="text-[#FDB913]" /> Base Reserve Price
                            </p>
                            <div className="mt-2">
                                <p className="text-xl sm:text-2xl font-black text-gray-200 font-mono tracking-tight">
                                    {formatINR(activePlayer.basePrice)}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">Official Base Valuation</p>
                            </div>
                        </div>

                        {/* Current Highest Bid Card */}
                        <div className={`border p-4 sm:p-5 rounded-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${amILeading
                            ? "bg-emerald-500/15 border-emerald-500/50 shadow-xl shadow-emerald-500/15"
                            : highestBidderTeamId
                                ? "bg-[#FDB913]/10 border-[#FDB913]/40 shadow-xl shadow-yellow-500/10"
                                : "bg-[#030712]/80 border-white/10"
                            }`}>
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <Trophy size={14} className={amILeading ? "text-emerald-400" : "text-[#FDB913]"} />
                                    Current Highest Bid
                                </p>
                                {amILeading && (
                                    <span className="text-[9px] bg-emerald-500/25 text-emerald-300 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-emerald-500/40 animate-pulse flex items-center gap-1">
                                        <Sparkles size={10} /> LEADING
                                    </span>
                                )}
                            </div>

                            {highestBidderTeamId ? (
                                <div className="mt-2">
                                    <p className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${amILeading ? "text-emerald-400" : "text-[#FDB913]"}`}>
                                        {formatINR(highestBid)}
                                    </p>
                                    <p className="text-xs text-gray-300 font-bold mt-1 truncate">
                                        Held by <span className="text-white font-extrabold">{highestBidderTeamName}</span>
                                        {amILeading && <span className="text-emerald-400 font-black ml-1.5">(Your Team)</span>}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <p className="text-lg font-black text-gray-400 font-mono">
                                        {formatINR(activePlayer.basePrice)}
                                    </p>
                                    <p className="text-xs font-semibold text-amber-400/80 italic mt-0.5 flex items-center gap-1">
                                        <Flame size={12} /> Opening bids starting at base price
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── ORGANIZER ROUND CONTROL CONSOLE ── */}
                    {isOrganizer && (
                        <div className="border-t border-white/10 pt-5">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Gavel size={12} className="text-[#FDB913]" /> Auctioneer Gavel Deck
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                                {isPaused ? (
                                    <button
                                        onClick={handleResume}
                                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black py-3 rounded-2xl transition text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 animate-pulse"
                                    >
                                        <Play size={14} /> Resume Timer
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePause}
                                        className="flex items-center justify-center gap-2 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 font-black py-3 rounded-2xl transition text-xs uppercase tracking-wider active:scale-95"
                                    >
                                        <Pause size={14} /> Pause Round
                                    </button>
                                )}

                                <button
                                    disabled={controlLoading || !highestBidderTeamId}
                                    onClick={handleSell}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 font-black py-3 rounded-2xl transition text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20 active:scale-95"
                                >
                                    {controlLoading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                                    Sell Player
                                </button>

                                <button
                                    disabled={controlLoading}
                                    onClick={handleMarkUnsold}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3 rounded-2xl transition text-xs uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-red-600/20 active:scale-95"
                                >
                                    {controlLoading ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                                    Mark Unsold
                                </button>

                                <div className="col-span-2 sm:col-span-1 border border-white/10 bg-white/3 rounded-2xl flex items-center justify-center px-3 py-2 text-[11px] text-gray-400 font-mono">
                                    ID: {activePlayer.id.substring(0, 8).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TEAM OWNER BIDDING CONSOLE ── */}
                    {isOwner && (
                        <div className="border-t border-white/10 pt-5 space-y-4">
                            {isPaused ? (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
                                    <Pause size={14} /> Round is temporarily paused by the auctioneer.
                                </div>
                            ) : amILeading ? (
                                <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-4 text-center text-emerald-400 text-sm font-black flex items-center justify-center gap-2 animate-pulse shadow-lg shadow-emerald-500/10 uppercase tracking-wider">
                                    <Check size={16} /> YOU HOLD THE LEADING BID ({formatINR(highestBid)})!
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2 flex items-center justify-between">
                                            <span>Quick Bid Increments</span>
                                            {myTeam && (
                                                <span className="text-gray-400 font-bold">
                                                    Purse: <span className="text-emerald-400 font-extrabold">{formatINR(myTeam.remainingPurse)}</span>
                                                </span>
                                            )}
                                        </p>

                                        {/* Quick Bid Increment Buttons */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            <button
                                                disabled={bidPlacing || (myTeam && myTeam.remainingPurse < nextMinBid)}
                                                onClick={() => handlePlaceBidAmount(nextMinBid)}
                                                className="bg-[#FDB913]/10 border border-[#FDB913]/40 hover:bg-[#FDB913]/25 text-[#FDB913] font-black py-3 px-3 rounded-xl transition text-xs truncate shadow-lg shadow-yellow-500/5 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                                            >
                                                Min: {formatINR(nextMinBid)}
                                            </button>
                                            <button
                                                disabled={bidPlacing || (myTeam && myTeam.remainingPurse < (nextMinBid + 50000))}
                                                onClick={() => handlePlaceBidAmount(nextMinBid + 50000)}
                                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold py-3 px-3 rounded-xl transition text-xs truncate hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                                            >
                                                + 50,000 Pts
                                            </button>
                                            <button
                                                disabled={bidPlacing || (myTeam && myTeam.remainingPurse < (nextMinBid + 100000))}
                                                onClick={() => handlePlaceBidAmount(nextMinBid + 100000)}
                                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold py-3 px-3 rounded-xl transition text-xs truncate hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                                            >
                                                + 100,000 Pts
                                            </button>
                                            <button
                                                disabled={bidPlacing || (myTeam && myTeam.remainingPurse < (nextMinBid + 250000))}
                                                onClick={() => handlePlaceBidAmount(nextMinBid + 250000)}
                                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold py-3 px-3 rounded-xl transition text-xs truncate hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                                            >
                                                + 250,000 Pts
                                            </button>
                                        </div>
                                    </div>

                                    {/* Custom Bid Input */}
                                    <div className="flex flex-col sm:flex-row gap-2.5">
                                        <div className="flex-1 relative">
                                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-extrabold text-xs">
                                                Pts
                                            </span>
                                            <input
                                                type="number"
                                                placeholder={`Enter bid (min: ${nextMinBid})`}
                                                value={customBidAmount}
                                                disabled={bidPlacing}
                                                onChange={(e) => setCustomBidAmount(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#030712]/90 border border-white/15 focus:outline-none focus:border-[#FDB913] transition text-xs sm:text-sm text-white font-bold placeholder-gray-500"
                                            />
                                        </div>
                                        <button
                                            disabled={bidPlacing || !customBidAmount || Number(customBidAmount) < nextMinBid || (myTeam && myTeam.remainingPurse < Number(customBidAmount))}
                                            onClick={() => handlePlaceBidAmount(customBidAmount)}
                                            className="bg-gradient-to-r from-[#FDB913] via-amber-400 to-yellow-500 hover:from-[#fec435] hover:to-yellow-400 text-black font-black px-6 py-3 rounded-xl transition text-xs uppercase tracking-wider shrink-0 disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/20 active:scale-95"
                                        >
                                            {bidPlacing ? <Loader2 className="animate-spin" size={15} /> : <Coins size={15} />}
                                            Place Custom Bid
                                        </button>
                                    </div>

                                    {myTeam && customBidAmount && Number(customBidAmount) > myTeam.remainingPurse && (
                                        <p className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                                            <AlertTriangle size={13} /> Custom bid exceeds your team's available purse!
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* ── PRE-AUCTION / NOMINATION SELECTOR STAGE ── */
                <div className="space-y-6 relative z-10">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <Gavel className="text-[#FDB913]" size={22} />
                            {isOrganizer ? "Nominate Player to Gavel" : "Waiting for Host Nomination"}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">
                            {isOrganizer
                                ? "Select an unsold player from the registered pool to open real-time bidding."
                                : "The tournament auctioneer is selecting the next player for live bidding."}
                        </p>
                    </div>

                    {isOrganizer ? (
                        unsoldPlayers.length === 0 ? (
                            <div className="text-center py-12 bg-white/3 border border-white/10 rounded-2xl">
                                <User size={36} className="mx-auto text-gray-500 mb-2" />
                                <p className="text-sm font-extrabold text-gray-200 uppercase">All Players Auctioned!</p>
                                <p className="text-xs text-gray-500 mt-1">There are no remaining unsold players in this tournament pool.</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePutPlayerOnAuction} className="space-y-5">
                                {/* Interactive Search & Filter Unsold Players */}
                                <div className="space-y-4 bg-black/30 border border-white/5 rounded-2xl p-4">
                                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-white/5 pb-3">
                                        <div className="relative w-full sm:max-w-xs">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search players..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-[#030712]/90 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition"
                                            />
                                        </div>
                                        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                                            {["All", "Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"].map((role) => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => setRoleFilter(role)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition shrink-0 ${roleFilter === role
                                                        ? "bg-[#FDB913] text-black shadow-lg shadow-yellow-500/10"
                                                        : "bg-white/5 text-gray-400 border border-white/10 hover:text-white"
                                                        }`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Unsold Players Grid List */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                                        {filteredUnsold.length === 0 ? (
                                            <div className="col-span-2 text-center py-10 text-gray-500 text-xs italic flex flex-col items-center justify-center gap-2">
                                                <User size={24} className="opacity-30" />
                                                No unsold players match the filter.
                                            </div>
                                        ) : (
                                            filteredUnsold.map((p) => {
                                                const isSelected = nextPlayerId === p.id;
                                                const initials = getInitials(p.name);
                                                const avatarBg = getAvatarStyle(p.name);
                                                const roleInfo = ROLE_CONFIG[p.role] || { bg: "bg-white/5 border-white/10 text-gray-300" };

                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            setNextPlayerId(p.id);
                                                            socketRef.current?.emit("nominate-player", {
                                                                tournamentId,
                                                                player: p
                                                            });
                                                        }}
                                                        className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                            ? "bg-[#FDB913]/10 border-[#FDB913] shadow-lg shadow-yellow-500/5 scale-[1.01]"
                                                            : "bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-black text-xs font-black shrink-0 relative"
                                                                style={avatarBg}
                                                            >
                                                                {initials}
                                                                {isSelected && (
                                                                    <div className="absolute -top-1 -right-1 bg-emerald-500 border border-black rounded-full p-0.5 text-white">
                                                                        <Check size={8} strokeWidth={4} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-extrabold text-white truncate">{p.name}</p>
                                                                <div className="mt-1">
                                                                    {ROLE_CONFIG[p.role] ? (
                                                                        <span 
                                                                            title={p.role} 
                                                                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full border shadow-sm p-0.5 overflow-hidden ${ROLE_CONFIG[p.role].bg}`}
                                                                        >
                                                                            <img src={ROLE_CONFIG[p.role].icon} alt={p.role} className="w-full h-full object-contain scale-[1.6]" />
                                                                        </span>
                                                                    ) : (
                                                                        <span title={p.role} className="inline-flex items-center justify-center w-10 h-10 bg-white/5 rounded-full border border-white/10 text-gray-300">
                                                                            <User size={18} />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs font-black text-emerald-400 font-mono">{formatINR(p.basePrice)}</p>
                                                            <p className="text-[8px] text-gray-500 font-semibold uppercase tracking-widest mt-0.5">Base</p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={controlLoading || !nextPlayerId}
                                    className="w-full bg-gradient-to-r from-[#FDB913] via-amber-400 to-yellow-500 hover:from-[#fec435] hover:to-yellow-400 text-black font-black py-4 rounded-xl transition text-xs uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/20 active:scale-98"
                                >
                                    {controlLoading ? <Loader2 className="animate-spin" size={16} /> : <Gavel size={16} />}
                                    Put Nominated Player Under The Gavel
                                </button>
                            </form>
                        )
                    ) : nominatedPlayer ? (
                        <div className="bg-gradient-to-br from-[#0B1120] to-[#030712] border border-[#FDB913]/40 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FDB913]/5 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-black text-2xl font-black shrink-0 border-2 border-white/10 relative z-10"
                                        style={getAvatarStyle(nominatedPlayer.name)}
                                    >
                                        {getInitials(nominatedPlayer.name)}
                                    </div>
                                    <div>
                                        <span className="inline-flex items-center gap-1 bg-[#FDB913]/15 text-[#FDB913] border border-[#FDB913]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
                                            Nominated Player
                                        </span>
                                        <h2 className="text-xl font-extrabold text-white uppercase">{nominatedPlayer.name}</h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-[#FDB913]/10 border border-[#FDB913]/30 px-3.5 py-1.5 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-[#FDB913] animate-ping" />
                                    <span className="text-xs font-bold text-[#FDB913] uppercase tracking-wider">Round Starting Soon</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                                <div className="bg-white/3 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 font-semibold uppercase text-[10px]">Role</p>
                                        <p className="font-bold text-white mt-0.5">{nominatedPlayer.role}</p>
                                    </div>
                                    {ROLE_CONFIG[nominatedPlayer.role] && (
                                        <span className={`w-8 h-8 rounded-full border flex items-center justify-center p-1.5 ${ROLE_CONFIG[nominatedPlayer.role].bg}`}>
                                            <img src={ROLE_CONFIG[nominatedPlayer.role].icon} alt={nominatedPlayer.role} className="w-full h-full object-contain" />
                                        </span>
                                    )}
                                </div>
                                <div className="bg-white/3 p-3.5 rounded-xl border border-white/5">
                                    <p className="text-gray-500 font-semibold uppercase text-[10px]">Base Reserve Price</p>
                                    <p className="font-bold text-emerald-400 mt-0.5">{formatINR(nominatedPlayer.basePrice)}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white/2 border border-white/5 rounded-3xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/40 to-transparent pointer-events-none" />
                            <Gavel className="mx-auto text-3xl text-gray-600 mb-3 animate-bounce" size={32} />
                            <p className="text-sm font-extrabold text-gray-200 uppercase tracking-wider">Gavel At Rest</p>
                            <p className="text-xs text-gray-500 mt-1.5">Waiting for the auctioneer to nominate a player.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default IPLPlayerPodium;
