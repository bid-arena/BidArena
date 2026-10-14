import React, { useState, useEffect } from "react";
import { Users, Trophy, UserCheck, Search, X, Gavel, Sparkles, TrendingUp, Shield } from "lucide-react";

const normalizeRole = (role) => {
    if (!role) return "Player";
    const norm = role.trim().toLowerCase();
    if (norm === "batsman" || norm === "batter" || norm.includes("bat")) return "Batsman";
    if (norm === "bowler" || norm.includes("bowl")) return "Bowler";
    if (norm === "all-rounder" || norm === "all rounder" || norm === "allrounder" || norm.includes("round")) return "All-Rounder";
    if (norm === "wicket-keeper" || norm === "wicketkeeper" || norm === "wicket keeper" || norm === "wk" || norm.includes("keeper")) return "Wicket-Keeper";
    return role;
};

const getRoleBadgeStyle = (role) => {
    const norm = normalizeRole(role);
    if (norm === "Batsman") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    if (norm === "Bowler") return "bg-red-500/15 text-red-300 border-red-500/30";
    if (norm === "All-Rounder") return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    if (norm === "Wicket-Keeper") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    return "bg-white/10 text-gray-300 border-white/10";
};

const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarStyle = (name) => {
    const gradients = [
        "linear-gradient(135deg, #2563eb, #1d4ed8)",
        "linear-gradient(135deg, #d97706, #b45309)",
        "linear-gradient(135deg, #7c3aed, #6d28d9)",
        "linear-gradient(135deg, #059669, #047857)",
        "linear-gradient(135deg, #dc2626, #b91c1c)",
        "linear-gradient(135deg, #0891b2, #0e7490)",
    ];
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return { background: gradients[Math.abs(hash) % gradients.length] };
};

const IPLTeamPurseCard = ({
    allTeams = [],
    soldPlayers = [],
    unsoldPlayers = [],
    activeTab = "teams",
    setActiveTab,
    myTeam,
    formatINR,
    setSelectedPlayerId
}) => {
    // Local tab state ensures instant, resilient tab switching
    const [selectedTab, setSelectedTab] = useState(activeTab || "teams");
    const [searchQuery, setSearchQuery] = useState("");

    // Sync from parent if external activeTab changes
    useEffect(() => {
        if (activeTab && activeTab !== selectedTab) {
            setSelectedTab(activeTab);
        }
    }, [activeTab]);

    const handleTabClick = (tabId) => {
        setSelectedTab(tabId);
        if (typeof setActiveTab === "function") {
            setActiveTab(tabId);
        }
        setSearchQuery("");
    };

    // Calculate aggregated totals
    const totalSpentAcrossTeams = allTeams.reduce((acc, t) => {
        const spent = t.playersWon?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
        return acc + spent;
    }, 0);

    const totalSoldValue = soldPlayers.reduce((acc, p) => acc + (p.soldRecord?.price || 0), 0);

    // Filter items based on selectedTab & search
    const filteredTeams = allTeams.filter((t) =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const filteredSold = soldPlayers.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const buyer = allTeams.find(t => t.id === p.soldRecord?.teamId);
        return p.name?.toLowerCase().includes(q) ||
            p.role?.toLowerCase().includes(q) ||
            buyer?.name?.toLowerCase().includes(q);
    });

    const filteredUnsold = unsoldPlayers.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return p.name?.toLowerCase().includes(q) ||
            p.role?.toLowerCase().includes(q) ||
            p.district?.toLowerCase().includes(q);
    });

    return (
        <div className="backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-3 sm:p-3.5 lg:p-4 shadow-2xl flex flex-col w-full h-full min-h-[360px] lg:min-h-0 min-h-0 shadow-black/40 relative overflow-hidden space-y-2.5">
            {/* Ambient Top Glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FDB913]/[0.03] rounded-full blur-2xl pointer-events-none" />

            {/* ── CARD HEADER ── */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#FDB913]/10 border border-[#FDB913]/25 flex items-center justify-center text-[#FDB913] shrink-0">
                        <Shield size={13} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
                            Franchise & Pool Deck
                        </h3>
                    </div>
                </div>
            </div>

            {/* ── TAB SELECTION SEGMENTS ── */}
            <div className="flex p-1 bg-black/50 border border-white/[0.08] rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] shrink-0 gap-1 select-none">
                {[
                    { id: "teams", label: "Teams", count: allTeams.length },
                    { id: "sold", label: "Sold", count: soldPlayers.length },
                    { id: "unsold", label: "Pool", count: unsoldPlayers.length }
                ].map(({ id, label, count }) => {
                    const isActive = selectedTab === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => handleTabClick(id)}
                            className={`flex-1 py-1.5 px-1 text-center font-black text-[11px] uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${isActive
                                ? "bg-gradient-to-r from-[#FDB913] to-amber-500 text-black shadow-md shadow-yellow-500/20 font-black"
                                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                                }`}
                        >
                            <span>{label}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive
                                ? "bg-black/25 text-black"
                                : "bg-white/10 text-gray-300"
                                }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── QUICK SEARCH INPUT ── */}
            <div className="relative shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                <input
                    type="text"
                    placeholder={
                        selectedTab === "teams"
                            ? "Search teams by name..."
                            : selectedTab === "sold"
                                ? "Search sold players..."
                                : "Search player pool..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-black/40 border border-white/[0.06] rounded-xl text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/30 transition"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 rounded transition"
                        title="Clear search"
                    >
                        <X size={11} />
                    </button>
                )}
            </div>

            {/* ── TAB CONTENT BODY ── */}
            <div className="flex-1 min-h-[140px] overflow-y-auto space-y-2 px-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent overscroll-contain">
                {/* 1. TEAMS TAB */}
                {selectedTab === "teams" && (
                    filteredTeams.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-xs italic space-y-1 flex flex-col items-center justify-center h-full">
                            <Users size={22} className="opacity-40" />
                            <p>{allTeams.length === 0 ? "No franchises registered in tournament." : `No teams match "${searchQuery}".`}</p>
                        </div>
                    ) : (
                        filteredTeams.map((team) => {
                            const totalSpent = team.playersWon?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
                            const purseTotal = team.purseAmount || 10000000;
                            const displayRemaining = team.remainingPurse !== undefined ? team.remainingPurse : (purseTotal - totalSpent);
                            const isSelfTeam = myTeam && team.id === myTeam.id;

                            // Purse Percentage
                            const spentPct = Math.min(100, Math.max(0, Math.round((totalSpent / purseTotal) * 100)));
                            const playersCount = team.playersWon?.length || 0;

                            return (
                                <div
                                    key={team.id}
                                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 ${isSelfTeam
                                        ? "bg-gradient-to-r from-[#FDB913]/[0.08] to-transparent border-[#FDB913]/40 shadow-md shadow-yellow-500/[0.03]"
                                        : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {team.logo ? (
                                                <img
                                                    src={team.logo}
                                                    alt={team.name}
                                                    className="w-7 h-7 rounded-xl object-cover shrink-0 border border-white/10"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center font-black text-xs shrink-0">
                                                    {getInitials(team.name)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-xs text-white truncate flex items-center gap-1.5">
                                                    {team.name}
                                                </h4>
                                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                                    Squad: <span className="text-white font-bold">{playersCount} Players</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-black text-xs text-emerald-400 font-mono">{formatINR(displayRemaining)}</span>
                                            <p className="text-[8px] text-gray-500 uppercase font-semibold">Purse Left</p>
                                        </div>
                                    </div>

                                    {/* Visual Budget Progress Bar */}
                                    <div className="mt-2 pt-1 border-t border-white/[0.04]">
                                        <div className="flex justify-between items-center text-[9px] text-gray-400 mb-1">
                                            <span>Spent: <span className="text-white font-semibold">{spentPct}%</span></span>
                                            <span>Used: <span className="text-gray-300 font-mono">{formatINR(totalSpent)}</span></span>
                                        </div>
                                        <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${spentPct > 85
                                                    ? "bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                                                    : "bg-gradient-to-r from-emerald-500 via-teal-500 to-[#FDB913] shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                                                    }`}
                                                style={{ width: `${spentPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}

                {/* 2. SOLD PLAYERS TAB */}
                {selectedTab === "sold" && (
                    filteredSold.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-xs italic space-y-1.5 flex flex-col items-center justify-center h-full select-none">
                            <Gavel size={24} className="opacity-40 animate-bounce" />
                            <p className="font-extrabold text-gray-300 uppercase text-[11px]">
                                {soldPlayers.length === 0 ? "No Players Sold Yet" : `No sold players match "${searchQuery}".`}
                            </p>
                            <p className="text-[10px] text-gray-500">Hammered players will appear here with final prices.</p>
                        </div>
                    ) : (
                        filteredSold.map((player) => {
                            const buyerTeam = allTeams.find(t => t.id === player.soldRecord?.teamId) ||
                                allTeams.find(t => t.name === player.soldRecord?.teamName);
                            const isBoughtByMe = myTeam && buyerTeam?.id === myTeam.id;
                            const initials = getInitials(player.name);
                            const avatarStyle = getAvatarStyle(player.name);
                            const roleStyle = getRoleBadgeStyle(player.role);

                            return (
                                <div
                                    key={player.id}
                                    onClick={() => setSelectedPlayerId && setSelectedPlayerId(player.id)}
                                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer duration-200 ${isBoughtByMe
                                        ? "bg-gradient-to-r from-emerald-950/40 to-[#0B1530] border-emerald-500/35 hover:border-emerald-500/50 shadow-md shadow-emerald-500/5"
                                        : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div
                                                className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 relative overflow-hidden"
                                                style={avatarStyle}
                                            >
                                                {initials}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-extrabold text-xs text-white truncate">{player.name}</h4>
                                                    {isBoughtByMe && (
                                                        <span className="text-[8px] bg-emerald-500/25 text-emerald-400 font-extrabold px-1.5 py-0.2 rounded uppercase border border-emerald-500/40 shrink-0">
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 truncate">
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${roleStyle}`}>
                                                        {player.role || "Player"}
                                                    </span>
                                                    <span>→</span>
                                                    <span className="text-[#FDB913] font-bold truncate">
                                                        {buyerTeam?.name || "Team"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-black text-xs text-emerald-400 font-mono">
                                                {formatINR(player.soldRecord?.price)}
                                            </span>
                                            <p className="text-[8px] text-gray-500 uppercase font-semibold">Hammered</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}

                {/* 3. AVAILABLE POOL TAB */}
                {selectedTab === "unsold" && (
                    filteredUnsold.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-xs italic space-y-1.5 flex flex-col items-center justify-center h-full select-none">
                            <Sparkles size={22} className="opacity-40 text-[#FDB913]" />
                            <p className="font-extrabold text-gray-300 uppercase text-[11px]">
                                {unsoldPlayers.length === 0 ? "Pool Empty" : `No players match "${searchQuery}".`}
                            </p>
                            <p className="text-[10px] text-gray-500">
                                {unsoldPlayers.length === 0 ? "All pool players have been auctioned." : "Try adjusting your search query."}
                            </p>
                        </div>
                    ) : (
                        filteredUnsold.map((player) => {
                            const initials = getInitials(player.name);
                            const avatarStyle = getAvatarStyle(player.name);
                            const roleStyle = getRoleBadgeStyle(player.role);

                            return (
                                <div
                                    key={player.id}
                                    onClick={() => setSelectedPlayerId && setSelectedPlayerId(player.id)}
                                    className="p-2.5 bg-white/[0.02] border border-white/[0.05] hover:border-white/15 rounded-2xl hover:bg-white/[0.04] transition cursor-pointer flex items-center justify-between gap-2 duration-200"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 relative overflow-hidden"
                                            style={avatarStyle}
                                        >
                                            {initials}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-extrabold text-xs text-white truncate">{player.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${roleStyle}`}>
                                                    {player.role || "Player"}
                                                </span>
                                                {player.district && (
                                                    <span className="text-[9px] text-gray-500">• {player.district}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="font-black text-xs text-gray-300 font-mono">
                                            {formatINR(player.basePrice)}
                                        </span>
                                        <p className="text-[8px] text-gray-500 uppercase font-semibold">Reserve</p>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>

            {/* ── BOTTOM DECK AUDIT SUMMARY STRIP ── */}
            <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between text-[10px] text-gray-400 font-semibold shrink-0">
                {selectedTab === "teams" ? (
                    <>
                        <span className="flex items-center gap-1 truncate text-gray-400">
                            <Users size={11} className="text-[#FDB913] shrink-0" />
                            Active Teams: <span className="text-white font-bold">{allTeams.length}</span>
                        </span>
                        <span className="font-mono text-[9px] text-gray-400 shrink-0">
                            Total Spent: <span className="text-emerald-400 font-bold">{formatINR(totalSpentAcrossTeams)}</span>
                        </span>
                    </>
                ) : selectedTab === "sold" ? (
                    <>
                        <span className="flex items-center gap-1 truncate text-gray-400">
                            <Trophy size={11} className="text-[#FDB913] shrink-0" />
                            Players Sold: <span className="text-white font-bold">{soldPlayers.length}</span>
                        </span>
                        <span className="font-mono text-[9px] text-gray-400 shrink-0">
                            Hammered: <span className="text-emerald-400 font-bold">{formatINR(totalSoldValue)}</span>
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex items-center gap-1 truncate text-gray-400">
                            <Sparkles size={11} className="text-[#FDB913] shrink-0" />
                            Pool Remaining: <span className="text-white font-bold">{unsoldPlayers.length}</span>
                        </span>
                        <span className="font-mono text-[9px] text-gray-400 shrink-0">
                            Live Auction Pool
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

export default IPLTeamPurseCard;
