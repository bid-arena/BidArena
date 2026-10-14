import React, { useEffect, useState, useRef } from "react";
import {
    Trophy,
    Gavel,
    X,
    Sparkles,
    Coins,
    Users,
    Wallet,
    ArrowRight,
    CheckCircle2,
    Shield
} from "lucide-react";

import batsmanIcon from "../../assets/icons/batsman-rb.png";
import bowlerIcon from "../../assets/icons/bowler-rb.png";
import allRounderIcon from "../../assets/icons/all-rounder-rb.png";
import wicketkeeperIcon from "../../assets/icons/wicketkeeper-rb.png";

const ROLE_CONFIG = {
    Batsman: { icon: batsmanIcon, label: "Batsman", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30 text-blue-300" },
    Bowler: { icon: bowlerIcon, label: "Bowler", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30 text-red-300" },
    "All-Rounder": { icon: allRounderIcon, label: "All-Rounder", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30 text-purple-300" },
    "Wicket-Keeper": { icon: wicketkeeperIcon, label: "Wicket-Keeper", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30 text-amber-300" },
    Wicketkeeper: { icon: wicketkeeperIcon, label: "Wicket-Keeper", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30 text-amber-300" },
};

const normalizeRole = (role) => {
    if (!role) return "Player";
    const norm = role.trim().toLowerCase();
    if (norm === "batsman" || norm === "batter" || norm.includes("bat")) return "Batsman";
    if (norm === "bowler" || norm.includes("bowl")) return "Bowler";
    if (norm === "all-rounder" || norm === "all rounder" || norm === "allrounder" || norm.includes("round")) return "All-Rounder";
    if (norm === "wicket-keeper" || norm === "wicketkeeper" || norm === "wicket keeper" || norm === "wk" || norm.includes("keeper")) return "Wicket-Keeper";
    return role;
};

const getRoleConfig = (role) => {
    const normalized = normalizeRole(role);
    return ROLE_CONFIG[normalized] || ROLE_CONFIG[role] || {
        icon: null,
        label: role || "Player",
        color: "text-yellow-400",
        bg: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300"
    };
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

const PlayerPurchasedModal = ({
    data,
    onClose,
    onViewSquad,
    formatINR,
    durationMs = 9000
}) => {
    if (!data || !data.player) return null;

    const {
        player,
        price,
        teamName,
        wasBoughtByMe,
        winningTeam,
        myTeam
    } = data;

    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);
    const progressRef = useRef(100);
    const roleConfig = getRoleConfig(player.role);

    // Auto-dismiss countdown timer
    useEffect(() => {
        const intervalTime = 50;
        const decrement = (intervalTime / durationMs) * 100;

        const timer = setInterval(() => {
            if (!isPaused) {
                progressRef.current -= decrement;
                if (progressRef.current <= 0) {
                    clearInterval(timer);
                    onClose();
                } else {
                    setProgress(progressRef.current);
                }
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [durationMs, isPaused, onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Calculations
    const basePrice = player.basePrice || 0;
    const priceHike = price && basePrice > 0 ? price - basePrice : 0;
    const hikePercentage = basePrice > 0 && priceHike > 0 ? Math.round((priceHike / basePrice) * 100) : 0;

    // Remaining purse for my team
    const updatedPurse = wasBoughtByMe && myTeam
        ? Math.max(0, (myTeam.remainingPurse ?? 0) - (price || 0))
        : null;

    // Updated squad count
    const updatedSquadCount = wasBoughtByMe && myTeam
        ? ((myTeam.playersWon?.length || 0) + 1)
        : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
            onClick={onClose}
        >
            <div
                className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 border my-auto ${wasBoughtByMe
                    ? "bg-gradient-to-b from-[#062419] via-[#0B1530] to-[#040916] border-emerald-500/50 shadow-emerald-500/20 ring-1 ring-emerald-500/30"
                    : "bg-gradient-to-b from-[#1C170A] via-[#0B1530] to-[#040916] border-[#FDB913]/40 shadow-yellow-500/10 ring-1 ring-[#FDB913]/25"
                    }`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Ambient Glows */}
                <div
                    className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 ${wasBoughtByMe ? "bg-emerald-500" : "bg-[#FDB913]"
                        }`}
                />

                {/* ── HEADER BANNER ── */}
                <div className="relative z-10 px-4 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${wasBoughtByMe
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
                                : "bg-[#FDB913]/20 border-[#FDB913]/40 text-[#FDB913] shadow-yellow-500/20"
                                }`}
                        >
                            {wasBoughtByMe ? (
                                <Trophy size={22} className="animate-bounce" />
                            ) : (
                                <Gavel size={22} className="animate-pulse" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${wasBoughtByMe
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                        : "bg-[#FDB913]/20 text-[#FDB913] border-[#FDB913]/40"
                                        }`}
                                >
                                    {wasBoughtByMe ? "🎉 SQUAD ACQUISITION SUCCESSFUL" : "HAMMER DOWN • SOLD"}
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mt-0.5 truncate">
                                {wasBoughtByMe
                                    ? `Signed to ${myTeam?.name || "Your Squad"}!`
                                    : `Acquired by ${teamName}`}
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition border border-white/5 shrink-0"
                        title="Dismiss (Esc)"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── BODY: PLAYER CARD & PRICE BREAKDOWN ── */}
                <div className="relative z-10 p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                    {/* Player Info Box */}
                    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 sm:p-4 flex items-center gap-3.5 relative overflow-hidden shadow-inner">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            {player.image ? (
                                <img
                                    src={player.image}
                                    alt={player.name}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                                />
                            ) : (
                                <div
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-white text-xl sm:text-2xl border-2 border-white/20 shadow-md"
                                    style={getAvatarStyle(player.name)}
                                >
                                    {getInitials(player.name)}
                                </div>
                            )}
                            {wasBoughtByMe && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-full border-2 border-[#0B1530] shadow-sm">
                                    <CheckCircle2 size={12} className="stroke-[3]" />
                                </div>
                            )}
                        </div>

                        {/* Player Details */}
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {roleConfig && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${roleConfig.bg}`}>
                                        {roleConfig.icon && (
                                            <img src={roleConfig.icon} alt={roleConfig.label} className="w-3.5 h-3.5 object-contain" />
                                        )}
                                        {roleConfig.label}
                                    </span>
                                )}
                                {player.country && (
                                    <span className="text-[10px] font-semibold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                        {player.country}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate">
                                {player.name}
                            </h2>

                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                                <span>Reserve: <strong className="text-gray-300 font-bold">{formatINR(basePrice)}</strong></span>
                                {hikePercentage > 0 && (
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                        ▲ +{hikePercentage}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Winning Hammer Price Banner */}
                    <div
                        className={`rounded-2xl p-3.5 sm:p-4 border text-center relative overflow-hidden shadow-xl ${wasBoughtByMe
                            ? "bg-emerald-950/40 border-emerald-500/40 shadow-emerald-500/10"
                            : "bg-amber-950/40 border-[#FDB913]/40 shadow-yellow-500/10"
                            }`}
                    >
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Final Hammer Price
                        </span>
                        <div
                            className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-0.5 ${wasBoughtByMe
                                ? "text-emerald-400 drop-shadow-[0_2px_12px_rgba(16,185,129,0.4)]"
                                : "text-[#FDB913] drop-shadow-[0_2px_12px_rgba(253,185,19,0.4)]"
                                }`}
                        >
                            {formatINR(price)}
                        </div>
                        {priceHike > 0 && (
                            <p className="text-[10px] text-gray-400 mt-1 font-mono">
                                Raised by <span className="text-white font-bold">{formatINR(priceHike)}</span> from reserve
                            </p>
                        )}
                    </div>

                    {/* Franchise Details (Specifically for Team Owners) */}
                    {wasBoughtByMe ? (
                        <div className="space-y-2">
                            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Shield size={12} className="text-emerald-400" />
                                <span>Updated Franchise Ledger</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 sm:p-3 space-y-0.5">
                                    <div className="flex items-center gap-1 text-gray-400 text-[10px] font-semibold">
                                        <Wallet size={11} className="text-[#FDB913]" />
                                        <span>Remaining Purse</span>
                                    </div>
                                    <div className="text-xs sm:text-sm font-black font-mono text-white truncate">
                                        {formatINR(updatedPurse)}
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 sm:p-3 space-y-0.5">
                                    <div className="flex items-center gap-1 text-gray-400 text-[10px] font-semibold">
                                        <Users size={11} className="text-blue-400" />
                                        <span>Squad Strength</span>
                                    </div>
                                    <div className="text-xs sm:text-sm font-black text-white">
                                        {updatedSquadCount} Players
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                                {winningTeam?.logo ? (
                                    <img
                                        src={winningTeam.logo}
                                        alt={teamName}
                                        className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                                        {getInitials(teamName)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Purchased By</span>
                                    <p className="font-extrabold text-white text-xs truncate">{teamName}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
                                Round Concluded
                            </span>
                        </div>
                    )}
                </div>

                {/* ── FOOTER ACTIONS ── */}
                <div className="relative z-10 px-4 sm:px-6 pb-4 pt-2 border-t border-white/[0.08] flex items-center gap-2.5">
                    {wasBoughtByMe && onViewSquad && (
                        <button
                            onClick={() => {
                                onViewSquad();
                                onClose();
                            }}
                            className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition hover:scale-[1.01] active:scale-98 cursor-pointer"
                        >
                            <Trophy size={14} />
                            <span>View My Squad</span>
                            <ArrowRight size={14} />
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className={`py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition hover:scale-[1.01] active:scale-98 cursor-pointer ${wasBoughtByMe
                            ? "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
                            : "w-full bg-[#FDB913] hover:bg-amber-400 text-black shadow-lg shadow-yellow-500/20 font-black"
                            }`}
                    >
                        {wasBoughtByMe ? "Back to Floor" : "Continue Live Auction"}
                    </button>
                </div>

                {/* ── AUTO-DISMISS TIMER PROGRESS BAR ── */}
                <div className="w-full h-1 bg-white/[0.06] overflow-hidden">
                    <div
                        className={`h-full transition-all duration-75 ease-linear ${wasBoughtByMe ? "bg-emerald-400" : "bg-[#FDB913]"
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PlayerPurchasedModal;
