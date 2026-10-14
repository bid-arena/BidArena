import React from "react";
import { Activity, Gavel, TrendingUp, Trophy, Clock, Radio } from "lucide-react";

const IPLBidFeed = ({ bidHistory = [], myTeam, formatINR, allTeams = [], activePlayer }) => {
    const getTeamData = (bid) => {
        if (!allTeams || allTeams.length === 0) return null;
        return allTeams.find(t => (bid.teamId && t.id === bid.teamId) || t.name === bid.teamName) || null;
    };

    const getTeamInitials = (name) => {
        if (!name) return "T";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getTeamBadgeStyle = (name) => {
        const palettes = [
            "bg-blue-500/15 text-blue-400 border-blue-500/30",
            "bg-amber-500/15 text-amber-400 border-amber-500/30",
            "bg-purple-500/15 text-purple-400 border-purple-500/30",
            "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
            "bg-rose-500/15 text-rose-400 border-rose-500/30",
            "bg-teal-500/15 text-teal-400 border-teal-500/30"
        ];
        let hash = 0;
        for (let i = 0; i < (name || "").length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return palettes[Math.abs(hash) % palettes.length];
    };

    const leadingBid = bidHistory[0];
    const prevLeadingBid = bidHistory[1];
    const leadingDelta = prevLeadingBid ? leadingBid.amount - prevLeadingBid.amount : 0;
    const isMyLeadingBid = myTeam && leadingBid && ((leadingBid.teamId && leadingBid.teamId === myTeam.id) || leadingBid.teamName === myTeam.name);
    const leadingTeamData = leadingBid ? getTeamData(leadingBid) : null;
    const totalBidsCount = bidHistory.length;

    // Price hike metrics
    const basePrice = activePlayer?.basePrice || 0;
    const priceHike = leadingBid && basePrice > 0 ? leadingBid.amount - basePrice : 0;
    const hikePercentage = basePrice > 0 && priceHike > 0 ? Math.round((priceHike / basePrice) * 100) : 0;

    // Unique participating franchises
    const uniqueBiddersCount = React.useMemo(() => {
        if (!bidHistory || bidHistory.length === 0) return 0;
        const teamIdentifiers = new Set();
        bidHistory.forEach(b => {
            if (b.teamId) teamIdentifiers.add(b.teamId);
            else if (b.teamName) teamIdentifiers.add(b.teamName);
        });
        return teamIdentifiers.size;
    }, [bidHistory]);

    return (
        <div className="backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-3 sm:p-3.5 lg:p-4 shadow-2xl flex flex-col w-full h-full min-h-[360px] lg:min-h-0 space-y-2.5 shadow-black/40 min-h-0 relative overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FDB913]/[0.04] rounded-full blur-2xl pointer-events-none" />

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-[#FDB913]/10 border border-[#FDB913]/25 flex items-center justify-center text-[#FDB913] shrink-0 shadow-sm">
                        <Activity size={14} className="animate-pulse" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
                            Live Bid Feed
                        </h3>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                            {totalBidsCount > 0 ? (
                                <span>
                                    <strong className="text-[#FDB913] font-bold">{totalBidsCount}</strong> {totalBidsCount === 1 ? "Bid" : "Bids"} Recorded
                                </span>
                            ) : (
                                "Standing By • Awaiting Bids"
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>LIVE</span>
                    </span>
                </div>
            </div>

            {/* ── BIDS FEED STREAM ── */}
            <div className="flex-1 min-h-[140px] overflow-y-auto space-y-2 px-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent overscroll-contain">
                {bidHistory.length === 0 ? (
                    /* 0 BIDS: BROADCAST STANDBY STATE */
                    <div className="text-center py-8 sm:py-12 text-gray-500 text-xs space-y-3 flex flex-col items-center justify-center h-full select-none px-2">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center relative z-10 shadow-inner">
                                <Gavel size={22} className="text-[#FDB913] animate-bounce" />
                            </div>
                            <div className="absolute inset-0 rounded-2xl bg-[#FDB913]/10 blur-md pointer-events-none" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-extrabold text-gray-200 uppercase tracking-wider text-xs">
                                Bidding Floor Open
                            </p>
                            <p className="text-[10px] text-gray-400 max-w-[220px] leading-relaxed">
                                {activePlayer ? (
                                    <span>
                                        Place the opening bid to take early round control for <strong className="text-white">{activePlayer.name}</strong>.
                                    </span>
                                ) : (
                                    "Place the opening bid at reserve price to take the lead."
                                )}
                            </p>
                        </div>
                        {activePlayer && (
                            <div className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-full font-mono text-[10px] text-gray-300 flex items-center gap-2 shadow-sm">
                                <span className="text-gray-500 uppercase text-[9px] font-bold">Base Reserve:</span>
                                <span className="text-[#FDB913] font-black">{formatINR(activePlayer.basePrice)}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* 1. SPOTLIGHT HIGH BIDDER CARD (PROMINENT BROADCAST TOP) */}
                        {leadingBid && (
                            <div
                                className={`p-3 rounded-2xl border text-xs transition-all duration-300 relative overflow-hidden shadow-xl ${isMyLeadingBid
                                    ? "bg-gradient-to-br from-emerald-950/70 via-[#0B1530] to-black/70 border-emerald-500/50 shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                                    : "bg-gradient-to-br from-amber-500/[0.12] via-[#0B1530] to-black/70 border-[#FDB913]/50 shadow-yellow-500/10 ring-1 ring-[#FDB913]/40"
                                    }`}
                            >
                                {/* Ambient Corner Glow */}
                                <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-xl pointer-events-none ${isMyLeadingBid ? "bg-emerald-500/10" : "bg-[#FDB913]/10"
                                    }`} />

                                {/* Header Row: Team Identity + Leader Badge */}
                                <div className="flex items-center justify-between gap-2 relative z-10">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {leadingTeamData?.logo ? (
                                            <img
                                                src={leadingTeamData.logo}
                                                alt={leadingBid.teamName}
                                                className="w-7 h-7 rounded-xl object-cover shrink-0 border border-white/20 shadow-sm"
                                            />
                                        ) : (
                                            <div className={`w-7 h-7 rounded-xl border flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm ${getTeamBadgeStyle(leadingBid.teamName)}`}>
                                                {getTeamInitials(leadingBid.teamName)}
                                            </div>
                                        )}

                                        <div className="min-w-0 flex items-center gap-1.5">
                                            <h4 className="font-black text-xs sm:text-sm text-white uppercase tracking-tight truncate">
                                                {leadingBid.teamName}
                                            </h4>
                                            {isMyLeadingBid && (
                                                <span className="text-[8px] bg-emerald-500/30 text-emerald-300 font-black px-1.5 py-0.5 rounded uppercase border border-emerald-500/50 shrink-0">
                                                    YOU
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* High Bidder Status Pill */}
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${isMyLeadingBid
                                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20"
                                        : "bg-[#FDB913]/25 text-[#FDB913] border border-[#FDB913]/50 shadow-sm shadow-yellow-500/20"
                                        }`}>
                                        <Trophy size={10} className={isMyLeadingBid ? "text-emerald-300" : "text-[#FDB913]"} />
                                        <span>HIGH BID</span>
                                    </span>
                                </div>

                                {/* Main Highlight Row: Winning Amount + Raise / Hike Info */}
                                <div className="my-2.5 pt-2 border-t border-white/[0.08] flex items-end justify-between gap-2 relative z-10">
                                    <div className="min-w-0">
                                        <p className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400">
                                            Current Winning Bid
                                        </p>
                                        <p className={`font-black font-mono tracking-tight text-lg sm:text-xl truncate ${isMyLeadingBid
                                            ? "text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
                                            : "text-[#FDB913] drop-shadow-[0_2px_8px_rgba(253,185,19,0.35)]"
                                            }`}>
                                            {formatINR(leadingBid.amount)}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0 gap-1">
                                        {leadingDelta > 0 && (
                                            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                                                ▲ +{formatINR(leadingDelta)}
                                            </span>
                                        )}
                                        {hikePercentage > 0 && (
                                            <span className="text-[8px] font-mono text-gray-400 bg-white/[0.04] border border-white/10 px-1.5 py-0.5 rounded">
                                                +{hikePercentage}% over base
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Row: Timestamp + Sequence */}
                                <div className="flex items-center justify-between text-[9px] text-gray-400 pt-1.5 border-t border-white/[0.06] relative z-10">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Clock size={10} className="text-gray-500 shrink-0" />
                                        <span className="font-mono text-gray-400">{leadingBid.time}</span>
                                    </div>
                                    <span className="font-mono text-[9px] text-gray-500">
                                        Bid #{totalBidsCount} of {totalBidsCount}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 2. BID TRAIL SECTION (PREVIOUS BIDS) */}
                        {bidHistory.length > 1 ? (
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center gap-2 py-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest select-none">
                                    <div className="h-px bg-white/[0.08] flex-1" />
                                    <span>Bid History Trail ({bidHistory.length - 1})</span>
                                    <div className="h-px bg-white/[0.08] flex-1" />
                                </div>

                                {bidHistory.slice(1).map((bid, trailIdx) => {
                                    const actualIndex = trailIdx + 1;
                                    const isMyBid = myTeam && ((bid.teamId && bid.teamId === myTeam.id) || bid.teamName === myTeam.name);
                                    const teamData = getTeamData(bid);
                                    const nextBidInHistory = bidHistory[actualIndex + 1];
                                    const delta = nextBidInHistory ? bid.amount - nextBidInHistory.amount : 0;
                                    const bidSequenceNumber = totalBidsCount - actualIndex;

                                    return (
                                        <div
                                            key={actualIndex}
                                            className="p-2 sm:p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-xs"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[9px] font-mono font-bold text-gray-500 bg-black/40 border border-white/5 rounded px-1 min-w-[22px] text-center shrink-0">
                                                        #{bidSequenceNumber}
                                                    </span>

                                                    {teamData?.logo ? (
                                                        <img
                                                            src={teamData.logo}
                                                            alt={bid.teamName}
                                                            className="w-5 h-5 rounded-lg object-cover shrink-0 border border-white/10"
                                                        />
                                                    ) : (
                                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center font-black text-[8px] shrink-0 ${getTeamBadgeStyle(bid.teamName)}`}>
                                                            {getTeamInitials(bid.teamName)}
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex items-center gap-1.5">
                                                        <span className="font-extrabold text-xs text-gray-300 truncate">
                                                            {bid.teamName}
                                                        </span>
                                                        {isMyBid && (
                                                            <span className="text-[7px] bg-emerald-500/20 text-emerald-400 font-black px-1 rounded uppercase border border-emerald-500/30 shrink-0">
                                                                YOU
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[11px] sm:text-xs font-black font-mono text-gray-200 tracking-tight">
                                                        {formatINR(bid.amount)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/[0.04] text-[9px] text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={10} className="text-gray-600 shrink-0" />
                                                    <span className="font-mono text-gray-400">{bid.time}</span>
                                                </div>
                                                {delta > 0 ? (
                                                    <span className="font-mono text-emerald-400/90 font-bold bg-emerald-500/10 px-1 rounded">
                                                        +{formatINR(delta)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600 font-mono">Opening Bid</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Only 1 Bid Placed so far: Clean Live Standby Guidance */
                            <div className="p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-1 my-1">
                                <div className="flex items-center justify-center gap-1.5 text-gray-400 text-[10px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913] animate-pulse" />
                                    <span>Opening bid confirmed</span>
                                </div>
                                <p className="text-[10px] text-gray-500">Awaiting counter-bids from competing franchises.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── BOTTOM ROUND AUDIT TAPE ── */}
            <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between text-[10px] text-gray-400 font-semibold shrink-0 gap-2">
                <div className="flex items-center gap-1.5 text-gray-400 min-w-0">
                    <TrendingUp size={11} className="text-[#FDB913] shrink-0" />
                    <span className="truncate">
                        <strong className="text-white font-bold">{totalBidsCount}</strong> {totalBidsCount === 1 ? "Bid" : "Bids"}
                        {uniqueBiddersCount > 1 && (
                            <span className="text-gray-500 hidden sm:inline"> • {uniqueBiddersCount} Teams Active</span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px] text-gray-500 shrink-0">
                    <Clock size={10} className="text-gray-600" />
                    <span className="text-gray-300 font-semibold">{leadingBid?.time || "--:--:--"}</span>
                </div>
            </div>
        </div>
    );
};

export default IPLBidFeed;
