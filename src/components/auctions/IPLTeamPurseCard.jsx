import React from "react";
import { Users, Coins, Trophy, UserCheck, Shield, ChevronRight, User } from "lucide-react";

// import batsmanIcon from "../../assets/icons/batsman.png";
// import bowlerIcon from "../../assets/icons/bowler.png";
// import allRounderIcon from "../../assets/icons/all-rounder.png";
// import wicketkeeperIcon from "../../assets/icons/wicketkeeper.png";

import batsmanIcon from "../../assets/icons/batsman-rb.png";
import bowlerIcon from "../../assets/icons/bowler-rb.png";
import allRounderIcon from "../../assets/icons/all-rounder-rb.png";
import wicketkeeperIcon from "../../assets/icons/wicketkeeper-rb.png";

const ROLE_CONFIG = {
    Batsman: { icon: batsmanIcon, bg: "bg-blue-500/10 border-blue-500/30 text-blue-300" },
    Bowler: { icon: bowlerIcon, bg: "bg-red-500/10 border-red-500/30 text-red-300" },
    "All-Rounder": { icon: allRounderIcon, bg: "bg-purple-500/10 border-purple-500/30 text-purple-300" },
    "Wicket-Keeper": { icon: wicketkeeperIcon, bg: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
    Wicketkeeper: { icon: wicketkeeperIcon, bg: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
};

const IPLTeamPurseCard = ({
    allTeams = [],
    soldPlayers = [],
    unsoldPlayers = [],
    activeTab,
    setActiveTab,
    myTeam,
    formatINR,
    setSelectedPlayerId
}) => {
    return (
        <div className="bg-[#0B1120] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 flex flex-col w-full xl:h-[640px]">
            {/* Tab Selection Navigation */}
            <div className="flex border-b border-white/8 p-1 bg-white/3 rounded-2xl">
                <button
                    onClick={() => setActiveTab("teams")}
                    className={`flex-1 py-2 px-1 text-center font-extrabold text-[11px] rounded-xl transition-all ${activeTab === "teams" ? "bg-[#FDB913] text-black shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                >
                    Teams ({allTeams.length})
                </button>
                <button
                    onClick={() => setActiveTab("sold")}
                    className={`flex-1 py-2 px-1 text-center font-extrabold text-[11px] rounded-xl transition-all ${activeTab === "sold" ? "bg-[#FDB913] text-black shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                >
                    Sold ({soldPlayers.length})
                </button>
                <button
                    onClick={() => setActiveTab("unsold")}
                    className={`flex-1 py-2 px-1 text-center font-extrabold text-[11px] rounded-xl transition-all ${activeTab === "unsold" ? "bg-[#FDB913] text-black shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                >
                    Pool ({unsoldPlayers.length})
                </button>
            </div>

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto max-h-[380px] xl:max-h-none space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {activeTab === "teams" && (
                    allTeams.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 text-xs">No teams registered in tournament.</div>
                    ) : (
                        allTeams.map((team) => {
                            const totalSpent = team.playersWon?.reduce((sum, p) => sum + p.price, 0) || 0;
                            const purseTotal = team.purseAmount || 10000000;
                            const displayRemaining = team.remainingPurse !== undefined ? team.remainingPurse : (purseTotal - totalSpent);
                            const isSelfTeam = myTeam && team.id === myTeam.id;

                            // Purse Percentage
                            const spentPct = Math.min(100, Math.max(0, Math.round((totalSpent / purseTotal) * 100)));
                            const playersCount = team.playersWon?.length || 0;

                            return (
                                <div
                                    key={team.id}
                                    className={`p-3.5 rounded-2xl border transition-all ${isSelfTeam
                                        ? "bg-[#FDB913]/10 border-[#FDB913]/40 shadow-lg shadow-yellow-500/5"
                                        : "bg-white/3 border-white/5 hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {team.logo ? (
                                                <img
                                                    src={team.logo}
                                                    alt={team.name}
                                                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-white/10"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center font-black text-xs shrink-0">
                                                    <Users size={16} />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-xs text-white truncate flex items-center gap-1.5">
                                                    {team.name}
                                                    {isSelfTeam && (
                                                        <span className="text-[8px] bg-[#FDB913]/20 text-[#FDB913] border border-[#FDB913]/40 px-1.5 py-0.2 rounded font-black uppercase">
                                                            YOU
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                                    Squad: <span className="text-white font-bold">{playersCount} Players</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-black text-xs text-emerald-400 font-mono">{formatINR(displayRemaining)}</span>
                                            <p className="text-[9px] text-gray-500 uppercase">Purse Left</p>
                                        </div>
                                    </div>

                                    {/* Visual Budget Progress Bar */}
                                    <div className="mt-2.5">
                                        <div className="flex justify-between items-center text-[9px] text-gray-400 mb-1">
                                            <span>Spent: {spentPct}%</span>
                                            <span>Spent: {formatINR(totalSpent)}</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-[#FDB913] h-full rounded-full transition-all duration-500"
                                                style={{ width: `${spentPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}

                {activeTab === "sold" && (
                    soldPlayers.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 text-xs">No players sold yet in this auction.</div>
                    ) : (
                        soldPlayers.map((player) => {
                            const buyerTeam = allTeams.find(t => t.id === player.soldRecord?.teamId);
                            const isBoughtByMe = myTeam && buyerTeam?.id === myTeam.id;
                            return (
                                <div
                                    key={player.id}
                                    onClick={() => setSelectedPlayerId(player.id)}
                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${isBoughtByMe
                                        ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                                        : "bg-white/3 border-white/5 hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <h4 className="font-extrabold text-xs text-white truncate">{player.name}</h4>
                                                {ROLE_CONFIG[player.role] ? (
                                                    <span
                                                        title={player.role}
                                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full border shrink-0 p-0.5 overflow-hidden ${ROLE_CONFIG[player.role].bg}`}
                                                    >
                                                        <img src={ROLE_CONFIG[player.role].icon} alt={player.role} className="w-full h-full object-contain scale-[1.6]" />
                                                    </span>
                                                ) : (
                                                    <span title={player.role} className="inline-flex items-center justify-center w-9 h-9 bg-white/5 rounded-full border border-white/10 text-gray-300 shrink-0">
                                                        <User size={14} />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                To: <span className="text-[#FDB913] font-bold">{buyerTeam?.name || "Team"}</span>
                                                {isBoughtByMe && <span className="text-[9px] text-emerald-400 font-extrabold ml-1">(YOU)</span>}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-black text-xs text-emerald-400 font-mono">{formatINR(player.soldRecord?.price)}</span>
                                            <p className="text-[9px] text-gray-500 uppercase">Hammer Price</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}

                {activeTab === "unsold" && (
                    unsoldPlayers.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 text-xs">No unsold players in the pool.</div>
                    ) : (
                        unsoldPlayers.map((player) => (
                            <div
                                key={player.id}
                                onClick={() => setSelectedPlayerId(player.id)}
                                className="p-3 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/5 transition cursor-pointer flex items-center justify-between gap-2"
                            >
                                <div className="min-w-0">
                                    <h4 className="font-extrabold text-xs text-white truncate">{player.name}</h4>
                                    <div className="mt-1">
                                        {ROLE_CONFIG[player.role] ? (
                                            <span
                                                title={player.role}
                                                className={`inline-flex items-center justify-center w-10 h-10 rounded-full border shadow-sm p-0.5 overflow-hidden ${ROLE_CONFIG[player.role].bg}`}
                                            >
                                                <img src={ROLE_CONFIG[player.role].icon} alt={player.role} className="w-full h-full object-contain scale-[1.6]" />
                                            </span>
                                        ) : (
                                            <span title={player.role} className="inline-flex items-center justify-center w-10 h-10 bg-white/5 rounded-full border border-white/10 text-gray-300">
                                                <User size={18} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="font-black text-xs text-gray-300 font-mono">{formatINR(player.basePrice)}</span>
                                    <p className="text-[9px] text-gray-500 uppercase">Base Reserve</p>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

export default IPLTeamPurseCard;
