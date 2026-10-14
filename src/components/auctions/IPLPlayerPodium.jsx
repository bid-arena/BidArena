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

const normalizeRole = (role) => {
    if (!role) return "";
    const norm = role.trim().toLowerCase();
    if (norm === "batsman" || norm === "batter" || norm.includes("bat")) return "Batsman";
    if (norm === "bowler" || norm.includes("bowl")) return "Bowler";
    if (norm === "all-rounder" || norm === "all rounder" || norm === "allrounder" || norm.includes("round")) return "All-Rounder";
    if (norm === "wicket-keeper" || norm === "wicketkeeper" || norm === "wicket keeper" || norm === "wk" || norm.includes("keeper")) return "Wicket-Keeper";
    return role;
};

const getRoleConfig = (role) => {
    if (!role) return null;
    const normalized = normalizeRole(role);
    return ROLE_CONFIG[normalized] || ROLE_CONFIG[role] || null;
};

const getRoleGlowClass = (role) => {
    const cfg = getRoleConfig(role);
    if (!cfg) return "shadow-[#FDB913]/10 border-[#FDB913]/30";
    if (cfg.label === "Batsman") return "shadow-blue-600/15 border-blue-500/40";
    if (cfg.label === "Bowler") return "shadow-red-600/15 border-red-500/40";
    if (cfg.label === "All-Rounder") return "shadow-purple-600/15 border-purple-500/40";
    return "shadow-amber-500/15 border-amber-500/40";
};

const getRoleBorderColor = (role) => {
    const cfg = getRoleConfig(role);
    if (!cfg) return "from-[#FDB913] to-amber-500";
    if (cfg.label === "Batsman") return "from-blue-500 to-indigo-500";
    if (cfg.label === "Bowler") return "from-red-500 to-rose-600";
    if (cfg.label === "All-Rounder") return "from-purple-500 to-fuchsia-500";
    return "from-amber-500 to-yellow-400";
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
    unsoldPlayers = [],
    nextPlayerId,
    setNextPlayerId,
    bidDuration = 30,
    setBidDuration,
    handlePutPlayerOnAuction,
    nominatedPlayer,
    socketRef,
    tournamentId,
    lastPurchased = null
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

    // Role counts for filter chips
    const batterCount = unsoldPlayers.filter(p => p && normalizeRole(p.role) === "Batsman").length;
    const bowlerCount = unsoldPlayers.filter(p => p && normalizeRole(p.role) === "Bowler").length;
    const allRounderCount = unsoldPlayers.filter(p => p && normalizeRole(p.role) === "All-Rounder").length;
    const wkCount = unsoldPlayers.filter(p => p && normalizeRole(p.role) === "Wicket-Keeper").length;

    // Filtering unsold players
    const filteredUnsold = unsoldPlayers.filter(p => {
        if (!p) return false;
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch = !query || (p.name && p.name.toLowerCase().includes(query));
        const matchesRole = roleFilter === "All" || normalizeRole(p.role) === roleFilter;
        return matchesSearch && matchesRole;
    });

    const selectedPlayerObj = unsoldPlayers.find(p => p.id === nextPlayerId);
    const selectedRoleCfg = selectedPlayerObj ? getRoleConfig(selectedPlayerObj.role) : null;

    return (
        <div className={`backdrop-blur-xl bg-[#0B1530]/95 border rounded-3xl p-3 sm:p-4 lg:p-5 relative overflow-hidden shadow-2xl transition-all duration-500 ${activePlayer ? getRoleGlowClass(activePlayer.role) : "border-white/[0.08] shadow-black/50"} h-full min-h-[460px] lg:min-h-0 flex flex-col justify-between shadow-black/40 w-full min-h-0`}>
            {/* Ambient Broadcast Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDB913]/[0.03] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Background Watermark Gavel */}
            <div className="absolute top-6 right-8 pointer-events-none opacity-5 hidden sm:block">
                <Gavel size={160} className="-rotate-45 text-white" />
            </div>

            {activePlayer ? (
                <div className="space-y-4 sm:space-y-5 relative z-10 flex-1 flex flex-col justify-between overflow-y-auto pr-1 min-h-0 scrollbar-thin scrollbar-thumb-white/10">
                    {/* ── PLAYER PODIUM HEADER ── */}
                    {/* ── PLAYER PODIUM HEADER ── */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-3 sm:pb-4 gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-3.5 w-full sm:w-auto min-w-0 flex-1">
                            {/* Avatar / Photo Ring with glowing backdrop */}
                            <div className="relative shrink-0 group">
                                <div className={`absolute inset-0 bg-gradient-to-tr ${getRoleBorderColor(activePlayer.role)} rounded-2xl blur-md opacity-45 group-hover:opacity-75 transition duration-500 animate-pulse pointer-events-none`} />
                                <div
                                    className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-lg sm:text-2xl font-black shadow-2xl border-2 border-white/20 relative z-10 overflow-hidden"
                                    style={getAvatarStyle(activePlayer.name)}
                                >
                                    {getInitials(activePlayer.name)}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 z-20 bg-gradient-to-r from-[#FDB913] to-amber-500 text-black text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded border border-black uppercase tracking-wider shadow-md animate-pulse">
                                    ON BLOCK
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight uppercase leading-tight truncate">
                                    {activePlayer.name}
                                </h2>

                                <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    {getRoleConfig(activePlayer.role) ? (
                                        <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-0.5 rounded-full text-xs font-extrabold border ${getRoleConfig(activePlayer.role).bg}`}>
                                            <img src={getRoleConfig(activePlayer.role).icon} alt={activePlayer.role} className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                                            {activePlayer.role}
                                        </span>
                                    ) : (
                                        <span className="px-2 sm:px-2.5 py-0.5 bg-white/5 rounded-full text-xs text-gray-300 font-bold border border-white/10">
                                            {activePlayer.role}
                                        </span>
                                    )}

                                    {activePlayer.country && (
                                        <span className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] sm:text-[11px] text-gray-300 font-semibold border border-white/10">
                                            {activePlayer.country}
                                        </span>
                                    )}

                                    <span className="text-[9px] sm:text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                        LIVE GAVEL
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── RADIAL COUNTDOWN TIMER RING ── */}
                        <div className={`w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 shrink-0 ${timeLeft <= 5
                            ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse shadow-lg shadow-red-500/10"
                            : "bg-black/35 border-white/[0.06] text-white shadow-inner"
                            }`}>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                <Clock size={14} className={timeLeft <= 5 ? "text-red-400 animate-spin" : "text-[#FDB913]"} />
                                <span className="hidden xs:inline">Round Clock</span>
                            </div>

                            {/* Circular SVG Ring */}
                            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
                                <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90 transform" viewBox="0 0 64 64">
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
                                <span className={`absolute text-[11px] sm:text-xs font-black font-mono ${timeLeft <= 5 ? "text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" : "text-white"}`}>
                                    {timeLeft}s
                                </span>
                            </div>

                            {isPaused && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40 uppercase tracking-widest animate-pulse">
                                    PAUSED
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── BROADCAST BID TILES ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Base Price Card */}
                        <div className="bg-black/40 border border-white/10 p-3.5 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-xl pointer-events-none" />
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Coins size={14} className="text-[#FDB913]" /> Base Reserve Price
                            </p>
                            <div className="mt-2">
                                <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[#FDB913]">
                                    {formatINR(activePlayer.basePrice)}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">Official Base Valuation</p>
                            </div>
                        </div>

                        {/* Current Highest Bid Card */}
                        <div className={`border p-3.5 sm:p-5 rounded-2xl relative overflow-hidden transition-all duration-500 flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.3)] ${amILeading
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-emerald-500/5"
                            : highestBidderTeamId
                                ? "bg-amber-950/40 border-[#FDB913]/40 shadow-yellow-500/5"
                                : "bg-black/40 border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
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
                                    <p className={`text-xl sm:text-3xl font-black tracking-tight font-mono ${amILeading ? "text-emerald-400 drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]" : "text-[#FDB913] drop-shadow-[0_2px_10px_rgba(253,185,19,0.2)]"}`}>
                                        {formatINR(highestBid)}
                                    </p>
                                    <p className="text-xs text-gray-300 font-bold mt-1 truncate">
                                        Held by <span className="text-white font-extrabold">{highestBidderTeamName}</span>
                                        {amILeading && <span className="text-emerald-400 font-black ml-1.5">(Your Team)</span>}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <p className="text-lg font-black text-gray-400 font-mono text-gray-300">
                                        {formatINR(activePlayer.basePrice)}
                                    </p>
                                    <p className="text-xs font-semibold text-[#FDB913] italic mt-0.5 flex items-center gap-1">
                                        <Flame size={12} className="animate-pulse" /> Opening bids starting at base price
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── ORGANIZER ROUND CONTROL CONSOLE ── */}
                    {isOrganizer && (
                        <div className="border-t border-white/10 pt-3.5 sm:pt-4">
                            {/* Command Deck Card */}
                            <div className="bg-gradient-to-br from-[#0c1633]/90 via-[#070e24]/95 to-[#050b1a]/95 border border-[#FDB913]/25 rounded-2xl p-3 sm:p-4 shadow-xl relative overflow-hidden backdrop-blur-xl">
                                {/* Ambient subtle gold accent */}
                                <div className="absolute top-0 right-0 w-36 h-36 bg-[#FDB913]/5 rounded-full blur-2xl pointer-events-none" />

                                {/* Header Strip with Live Status */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-white/[0.08] relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-[#FDB913]/15 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shrink-0 shadow-sm">
                                            <Gavel size={14} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                                                Auctioneer Gavel Deck
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Real-time Round Status Badge */}
                                    <div className="flex items-center gap-2">
                                        {isPaused ? (
                                            <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                                <Pause size={10} /> Round Paused
                                            </span>
                                        ) : highestBidderTeamId ? (
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Leading: <span className="text-white font-extrabold truncate max-w-[120px] sm:max-w-[160px]">{highestBidderTeamName}</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 bg-[#FDB913]/15 text-[#FDB913] border border-[#FDB913]/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913] animate-pulse" />
                                                Awaiting Opening Bid
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons: Hierarchical 2-Tier Gavel Deck */}
                                <div className="mt-2.5 sm:mt-3 relative z-10 space-y-2">
                                    {/* 1. Primary Hammer Strike Action (Full Width, Never Truncates) */}
                                    <button
                                        type="button"
                                        disabled={controlLoading || !highestBidderTeamId}
                                        onClick={handleSell}
                                        className={`w-full flex items-center justify-center gap-2 font-black py-2.5 sm:py-3 rounded-xl transition text-xs sm:text-sm uppercase tracking-wider shadow-xl active:scale-98 cursor-pointer ${highestBidderTeamId && !controlLoading
                                            ? "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 ring-1 ring-emerald-400/50 hover:scale-[1.005]"
                                            : "bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed opacity-50"
                                            }`}
                                    >
                                        {controlLoading ? (
                                            <Loader2 className="animate-spin shrink-0" size={15} />
                                        ) : (
                                            <Check size={16} strokeWidth={3} className={`shrink-0 ${highestBidderTeamId ? "text-white" : "text-gray-500"}`} />
                                        )}
                                        <span className="truncate">
                                            {highestBidderTeamId
                                                ? `Hammer Down • Sell To ${highestBidderTeamName} (${formatINR(highestBid)})`
                                                : "Sell Player • Awaiting Opening Bid"}
                                        </span>
                                    </button>

                                    {/* 2. Secondary Round Controls (2 Equal Columns) */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Pause / Resume Button */}
                                        {isPaused ? (
                                            <button
                                                type="button"
                                                onClick={handleResume}
                                                disabled={controlLoading}
                                                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black py-2.5 rounded-xl transition text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
                                            >
                                                {controlLoading ? <Loader2 className="animate-spin shrink-0" size={13} /> : <Play size={13} className="fill-current shrink-0" />}
                                                <span className="truncate">Resume Round</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handlePause}
                                                disabled={controlLoading}
                                                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 font-black py-2.5 rounded-xl transition text-xs uppercase tracking-wider active:scale-95 cursor-pointer disabled:opacity-50"
                                            >
                                                {controlLoading ? <Loader2 className="animate-spin shrink-0" size={13} /> : <Pause size={13} className="fill-current shrink-0" />}
                                                <span className="truncate">Pause Round</span>
                                            </button>
                                        )}

                                        {/* Mark Unsold Button */}
                                        <button
                                            type="button"
                                            disabled={controlLoading}
                                            onClick={handleMarkUnsold}
                                            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-600/80 to-rose-600/80 hover:from-red-600 hover:to-rose-600 border border-red-500/40 text-white font-black py-2.5 rounded-xl transition text-xs uppercase tracking-wider disabled:opacity-40 shadow-md shadow-red-600/15 active:scale-95 cursor-pointer"
                                        >
                                            {controlLoading ? <Loader2 className="animate-spin shrink-0" size={13} /> : <X size={13} strokeWidth={2.5} className="shrink-0" />}
                                            <span className="truncate">Mark Unsold</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Context Footer Strip */}
                                <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-400 relative z-10">
                                    <span className="flex items-center gap-1.5 truncate">
                                        <span className="text-[#FDB913]">●</span>
                                        {highestBidderTeamId ? (
                                            <span>
                                                Current Winning Bid: <strong className="text-white font-mono">{formatINR(highestBid)}</strong> held by <strong className="text-emerald-400">{highestBidderTeamName}</strong>
                                            </span>
                                        ) : (
                                            <span>Base price set at <strong className="text-[#FDB913] font-mono">{formatINR(activePlayer.basePrice)}</strong>. Waiting for franchise bids.</span>
                                        )}
                                    </span>
                                    <span className="font-mono text-gray-500 shrink-0">
                                        ID: {activePlayer.id?.substring(0, 8).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TEAM OWNER BIDDING CONSOLE ── */}
                    {isOwner && (
                        <div className="border-t border-white/10 pt-4 sm:pt-5 space-y-3 sm:space-y-4">
                            {isPaused ? (
                                <div className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 sm:p-4 text-center text-amber-400 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/[0.02]">
                                    <Pause size={14} className="animate-pulse" /> Round is temporarily paused by the auctioneer.
                                </div>
                            ) : amILeading ? (
                                <div className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 text-center text-emerald-400 text-xs sm:text-sm font-black flex items-center justify-center gap-2 animate-pulse shadow-lg shadow-emerald-500/10 uppercase tracking-wider">
                                    <Check size={16} /> YOU HOLD THE LEADING BID ({formatINR(highestBid)})!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-2 flex items-center justify-between">
                                            <span>Quick Bid Increments</span>
                                            {myTeam && (
                                                <span className="text-gray-400 font-bold">
                                                    Purse: <span className="text-emerald-400 font-extrabold">{formatINR(myTeam.remainingPurse)}</span>
                                                </span>
                                            )}
                                        </p>

                                        {/* Quick Bid Increment Buttons */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <button
                                                disabled={bidPlacing || (myTeam && myTeam.remainingPurse < nextMinBid)}
                                                onClick={() => handlePlaceBidAmount(nextMinBid)}
                                                className="bg-[#FDB913]/10 border border-[#FDB913]/40 hover:bg-[#FDB913]/20 text-[#FDB913] font-black py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl transition text-xs truncate shadow-lg shadow-yellow-500/[0.05] hover:scale-[1.02] active:scale-95 duration-200 disabled:opacity-40 disabled:hover:scale-100"
                                            >
                                                Min: {formatINR(nextMinBid)}
                                            </button>
                                            <button
                                                disabled={bidPlacing || (myTeam && myTeam.remainingPurse < (nextMinBid + 50000))}
                                                onClick={() => handlePlaceBidAmount(nextMinBid + 50000)}
                                                className="backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-extrabold py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl transition text-xs truncate hover:scale-[1.02] active:scale-95 duration-200 disabled:opacity-40"
                                            >
                                                + 50k Pts
                                            </button>
                                            <button
                                                disabled={bidPlacing || (myTeam && myTeam.remainingPurse < (nextMinBid + 100000))}
                                                onClick={() => handlePlaceBidAmount(nextMinBid + 100000)}
                                                className="backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-extrabold py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl transition text-xs truncate hover:scale-[1.02] active:scale-95 duration-200 disabled:opacity-40"
                                            >
                                                + 100k Pts
                                            </button>
                                            <button
                                                disabled={bidPlacing || (myTeam && myTeam.remainingPurse < (nextMinBid + 250000))}
                                                onClick={() => handlePlaceBidAmount(nextMinBid + 250000)}
                                                className="backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-extrabold py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl transition text-xs truncate hover:scale-[1.02] active:scale-95 duration-200 disabled:opacity-40"
                                            >
                                                + 250k Pts
                                            </button>
                                        </div>
                                    </div>

                                    {/* Custom Bid Input */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="flex-1 relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-extrabold text-xs">
                                                Pts
                                            </span>
                                            <input
                                                type="number"
                                                placeholder={`Enter bid (min: ${nextMinBid})`}
                                                value={customBidAmount}
                                                disabled={bidPlacing}
                                                onChange={(e) => setCustomBidAmount(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2.5 sm:py-3 rounded-xl bg-black/45 border border-white/10 focus:outline-none focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/30 transition duration-200 text-xs sm:text-sm text-white font-bold placeholder-gray-600"
                                            />
                                        </div>
                                        <button
                                            disabled={bidPlacing || !customBidAmount || Number(customBidAmount) < nextMinBid || (myTeam && myTeam.remainingPurse < Number(customBidAmount))}
                                            onClick={() => handlePlaceBidAmount(customBidAmount)}
                                            className="bg-gradient-to-r from-[#FDB913] via-[#F59E0B] to-[#FDB913] bg-[length:200%_auto] hover:bg-right text-black font-black px-5 py-2.5 sm:py-3 rounded-xl transition-all duration-300 text-xs uppercase tracking-wider shrink-0 disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/25 hover:scale-[1.02] active:scale-95"
                                        >
                                            {bidPlacing ? <Loader2 className="animate-spin" size={14} /> : <Coins size={14} />}
                                            Place Bid
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
                <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between space-y-2.5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/[0.06] pb-2 shrink-0">
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <Gavel className="text-[#FDB913]" size={18} />
                                {isOrganizer ? "Nominate Player To Gavel" : "Waiting For Nomination"}
                            </h3>
                            <p className="text-gray-400 text-[11px] mt-0.5">
                                {isOrganizer
                                    ? "Select an unsold player from pool to open real-time bidding."
                                    : "The auctioneer is selecting the next player for live bidding."}
                            </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                            <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Pool: <span className="text-[#FDB913] font-black">{unsoldPlayers.length}</span> Unsold
                            </span>
                        </div>
                    </div>

                    {isOrganizer ? (
                        unsoldPlayers.length === 0 ? (
                            <div className="text-center py-12 bg-white/[0.01] border border-white/[0.06] rounded-3xl">
                                <User size={36} className="mx-auto text-gray-500 mb-2" />
                                <p className="text-sm font-extrabold text-gray-200 uppercase">All Players Auctioned!</p>
                                <p className="text-xs text-gray-500 mt-1">There are no remaining unsold players in this tournament pool.</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePutPlayerOnAuction} className="flex-1 min-h-0 flex flex-col justify-between space-y-2.5">
                                {/* Search & Filters Bar */}
                                <div className="flex-1 min-h-0 flex flex-col space-y-2.5 bg-black/40 border border-white/[0.06] rounded-2xl p-2.5 sm:p-3 shadow-inner overflow-hidden">
                                    {/* Search Bar */}
                                    <div className="relative shrink-0">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search players by name..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-20 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/30 transition"
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                            {searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchTerm("")}
                                                    className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition"
                                                    title="Clear search"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                            <span className="text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md">
                                                {filteredUnsold.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Role Filter Chips Bar */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent shrink-0 w-full touch-pan-x select-none">
                                        {[
                                            { label: "All", roleKey: "All", count: unsoldPlayers.length },
                                            { label: "Batsman", roleKey: "Batsman", count: batterCount },
                                            { label: "Bowler", roleKey: "Bowler", count: bowlerCount },
                                            { label: "All-Rounder", roleKey: "All-Rounder", count: allRounderCount },
                                            { label: "Wicket-Keeper", roleKey: "Wicket-Keeper", count: wkCount }
                                        ].map(({ label, roleKey, count }) => {
                                            const isCurrent = roleFilter === roleKey;
                                            const cfg = getRoleConfig(roleKey);
                                            return (
                                                <button
                                                    key={roleKey}
                                                    type="button"
                                                    onClick={() => setRoleFilter(roleKey)}
                                                    className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 border ${isCurrent
                                                        ? "bg-gradient-to-r from-[#FDB913] to-amber-500 text-black border-yellow-400 shadow-md shadow-yellow-500/20"
                                                        : "bg-white/[0.04] text-gray-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/20"
                                                        }`}
                                                >
                                                    {cfg?.icon && (
                                                        <img
                                                            src={cfg.icon}
                                                            alt={label}
                                                            className={`w-3.5 h-3.5 object-contain ${isCurrent ? "brightness-0" : ""}`}
                                                        />
                                                    )}
                                                    <span>{label}</span>
                                                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${isCurrent
                                                        ? "bg-black/25 text-black"
                                                        : "bg-white/10 text-gray-300"
                                                        }`}>
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Unsold Players Grid List (Scrollable, takes available height) */}
                                    <div className="flex-1 min-h-0 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent overscroll-contain">
                                        {filteredUnsold.length === 0 ? (
                                            <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center py-8 text-gray-500 text-xs italic gap-1.5">
                                                <User size={24} className="opacity-30" />
                                                <p>No unsold players match "{roleFilter}" filter {searchTerm ? `and "${searchTerm}"` : ""}.</p>
                                                {(roleFilter !== "All" || searchTerm) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRoleFilter("All");
                                                            setSearchTerm("");
                                                        }}
                                                        className="text-[10px] text-[#FDB913] hover:underline font-bold mt-1"
                                                    >
                                                        Reset filters
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-0.5 pb-2">
                                                {filteredUnsold.map((p) => {
                                                    const isSelected = nextPlayerId === p.id;
                                                    const initials = getInitials(p.name);
                                                    const avatarBg = getAvatarStyle(p.name);
                                                    const roleCfg = getRoleConfig(p.role);

                                                    return (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setNextPlayerId(null);
                                                                    socketRef?.current?.emit("nominate-player", {
                                                                        tournamentId,
                                                                        player: null
                                                                    });
                                                                } else {
                                                                    setNextPlayerId(p.id);
                                                                    socketRef?.current?.emit("nominate-player", {
                                                                        tournamentId,
                                                                        player: p
                                                                    });
                                                                }
                                                            }}
                                                            className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 select-none relative ${isSelected
                                                                ? "bg-[#FDB913]/15 border-[#FDB913] ring-1 ring-[#FDB913]/50 shadow-md shadow-yellow-500/10"
                                                                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/15"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 relative"
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
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        {roleCfg ? (
                                                                            <span className={`text-[9px] font-bold ${roleCfg.color}`}>
                                                                                {p.role}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[9px] text-gray-400 font-semibold">{p.role || "Player"}</span>
                                                                        )}
                                                                        {p.district && (
                                                                            <span className="text-[8px] text-gray-500">• {p.district}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-xs font-black text-emerald-400 font-mono">{formatINR(p.basePrice)}</p>
                                                                <p className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">Base</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pinned Selection Summary + Timer + Submit Gavel Button */}
                                <div className="space-y-2 pt-2 border-t border-white/[0.08] shrink-0">
                                    {selectedPlayerObj ? (
                                        <div className="bg-gradient-to-br from-[#0e1b3d] via-[#09132d] to-[#050b1d] border border-[#FDB913]/35 rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-black/50 relative overflow-hidden transition-all duration-300">
                                            {/* Golden accent glow in top right */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDB913]/10 rounded-full blur-2xl pointer-events-none" />

                                            {/* Main Card Row: Avatar + Details + Price + Deselect */}
                                            <div className="flex items-center justify-between gap-2.5 relative z-10">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {/* Avatar with initials & check badge */}
                                                    <div
                                                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-black shrink-0 relative border border-white/15 shadow-md overflow-hidden"
                                                        style={getAvatarStyle(selectedPlayerObj.name)}
                                                    >
                                                        {getInitials(selectedPlayerObj.name)}
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/15 via-transparent to-transparent pointer-events-none" />
                                                    </div>

                                                    {/* Name + Role + District */}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                                Selected
                                                            </span>
                                                            {selectedRoleCfg && (
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${selectedRoleCfg.bg}`}>
                                                                    {selectedRoleCfg.icon && (
                                                                        <img src={selectedRoleCfg.icon} alt="" className="w-2.5 h-2.5 object-contain" />
                                                                    )}
                                                                    {selectedPlayerObj.role}
                                                                </span>
                                                            )}
                                                            {selectedPlayerObj.district && (
                                                                <span className="text-[9px] text-gray-400 hidden sm:inline">
                                                                    • {selectedPlayerObj.district}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate mt-0.5">
                                                            {selectedPlayerObj.name}
                                                        </h4>
                                                    </div>
                                                </div>

                                                {/* Base price + Deselect button */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Base Reserve</span>
                                                        <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tracking-tight">
                                                            {formatINR(selectedPlayerObj.basePrice)}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setNextPlayerId(null);
                                                            socketRef?.current?.emit("nominate-player", {
                                                                tournamentId,
                                                                player: null
                                                            });
                                                        }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                                                        title="Clear selection"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sub-row: Round Timer Selector */}
                                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.08] relative z-10">
                                                <div className="flex items-center gap-1.5 text-gray-300">
                                                    <Clock size={12} className="text-[#FDB913]" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Round Duration:</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.08]">
                                                    {[15, 30, 45, 60].map((sec) => (
                                                        <button
                                                            key={sec}
                                                            type="button"
                                                            onClick={() => setBidDuration && setBidDuration(sec)}
                                                            className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black transition-all cursor-pointer ${bidDuration === sec
                                                                ? "bg-[#FDB913] text-black shadow-md shadow-yellow-500/20 font-extrabold"
                                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                                                }`}
                                                        >
                                                            {sec}s
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-black/30 border border-dashed border-white/15 rounded-2xl p-2.5 sm:p-3 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 shrink-0">
                                                        <User size={15} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-extrabold text-gray-300 text-xs truncate">No Player Selected</p>
                                                        <p className="text-[10px] text-gray-500 truncate">Click any player from the pool above to nominate</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timer duration bar */}
                                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.06]">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Clock size={11} className="text-[#FDB913]" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Round Duration:</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.08]">
                                                    {[15, 30, 45, 60].map((sec) => (
                                                        <button
                                                            key={sec}
                                                            type="button"
                                                            onClick={() => setBidDuration && setBidDuration(sec)}
                                                            className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black transition-all cursor-pointer ${bidDuration === sec
                                                                ? "bg-[#FDB913] text-black shadow-md shadow-yellow-500/20 font-extrabold"
                                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                                                }`}
                                                        >
                                                            {sec}s
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Gavel Button */}
                                    <button
                                        type="submit"
                                        disabled={controlLoading || !nextPlayerId}
                                        className={`w-full py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-xl cursor-pointer ${selectedPlayerObj && !controlLoading
                                            ? "bg-gradient-to-r from-[#FDB913] via-[#F59E0B] to-[#FDB913] bg-[length:200%_auto] hover:bg-right text-black shadow-yellow-500/25 hover:scale-[1.01] active:scale-98"
                                            : "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed opacity-60"
                                            }`}
                                    >
                                        {controlLoading ? (
                                            <Loader2 className="animate-spin shrink-0" size={15} />
                                        ) : (
                                            <Gavel size={15} className={`shrink-0 ${selectedPlayerObj ? "text-black" : "text-gray-500"}`} />
                                        )}
                                        <span className="truncate">
                                            {selectedPlayerObj
                                                ? `Put ${selectedPlayerObj.name} Under The Gavel • ${bidDuration}s`
                                                : "Select A Player To Put Under The Gavel"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        )
                    ) : nominatedPlayer ? (
                        <div className="backdrop-blur-xl bg-[#FDB913]/[0.02] border border-[#FDB913]/25 rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-2xl shadow-yellow-500/[0.01]">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FDB913]/5 rounded-full blur-2xl pointer-events-none animate-pulse" />

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 border-2 border-white/10 relative z-10 overflow-hidden"
                                        style={getAvatarStyle(nominatedPlayer.name)}
                                    >
                                        {getInitials(nominatedPlayer.name)}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
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
                                <div className="backdrop-blur-md bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 font-semibold uppercase text-[10px]">Role</p>
                                        <p className="font-bold text-white mt-0.5">{nominatedPlayer.role}</p>
                                    </div>
                                </div>
                                <div className="backdrop-blur-md bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl">
                                    <p className="text-gray-500 font-semibold uppercase text-[10px]">Base Reserve Price</p>
                                    <p className="font-bold text-emerald-400 mt-0.5 font-mono">{formatINR(nominatedPlayer.basePrice)}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 flex flex-col justify-center space-y-3 py-4 sm:py-6 px-1 sm:px-4">
                            {lastPurchased && (
                                <div className={`p-3.5 sm:p-4 rounded-2xl border text-xs relative overflow-hidden shadow-xl transition-all ${lastPurchased.wasBoughtByMe
                                    ? "bg-gradient-to-br from-emerald-950/70 via-[#0B1530] to-black/80 border-emerald-500/50 shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                                    : "bg-gradient-to-br from-[#FDB913]/10 via-[#0B1530] to-black/80 border-[#FDB913]/30 shadow-yellow-500/10"
                                    }`}>
                                    <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${lastPurchased.wasBoughtByMe
                                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                            : "bg-[#FDB913]/20 text-[#FDB913] border-[#FDB913]/40"
                                            }`}>
                                            <Trophy size={10} />
                                            {lastPurchased.wasBoughtByMe ? "🎉 Just Signed To Your Squad" : "Recent Hammer Outcome"}
                                        </span>
                                        <span className={`font-mono font-black text-xs sm:text-sm ${lastPurchased.wasBoughtByMe ? "text-emerald-400" : "text-[#FDB913]"
                                            }`}>
                                            {formatINR(lastPurchased.price)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2.5">
                                        {lastPurchased.player?.image ? (
                                            <img
                                                src={lastPurchased.player.image}
                                                alt={lastPurchased.player.name}
                                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-white/20 shrink-0 shadow"
                                            />
                                        ) : (
                                            <div
                                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-white text-sm sm:text-base border border-white/20 shrink-0 shadow"
                                                style={getAvatarStyle(lastPurchased.player?.name)}
                                            >
                                                {getInitials(lastPurchased.player?.name)}
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-black text-xs sm:text-sm text-white uppercase truncate">
                                                {lastPurchased.player?.name}
                                            </h4>
                                            <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 truncate">
                                                Purchased by <strong className="text-gray-200 font-extrabold">{lastPurchased.teamName}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-gray-400">
                                        <span className="flex items-center gap-1 text-gray-400">
                                            <Clock size={11} className="text-[#FDB913]" />
                                            <span>Waiting for next nomination...</span>
                                        </span>
                                        <span className="font-mono text-gray-500">
                                            Pool: {unsoldPlayers.length} Unsold
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="text-center py-6 sm:py-8 bg-white/[0.01] border border-white/[0.04] rounded-2xl relative overflow-hidden shadow-inner">
                                <Gavel className="mx-auto text-gray-500 mb-2 animate-bounce" size={24} />
                                <p className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">Gavel At Rest</p>
                                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                    The auctioneer is preparing the next player for the floor.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default IPLPlayerPodium;
