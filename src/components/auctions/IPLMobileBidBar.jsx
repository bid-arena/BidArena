import React from "react";
import { Coins, Trophy, Check, Loader2, Sparkles, AlertTriangle } from "lucide-react";

const IPLMobileBidBar = ({
    activePlayer,
    isOwner,
    isPaused,
    amILeading,
    myTeam,
    highestBid,
    nextMinBid,
    bidPlacing,
    handlePlaceBidAmount,
    formatINR
}) => {
    if (!activePlayer || !isOwner || isPaused) return null;

    const remainingPurse = myTeam?.remainingPurse || 0;

    return (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#070C18]/95 backdrop-blur-xl border-t border-[#FDB913]/30 p-3 shadow-2xl space-y-2 animate-in slide-in-from-bottom duration-300">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase truncate">
                        Bidding for: <span className="text-white">{activePlayer.name}</span>
                    </p>
                    <p className="text-xs font-black text-[#FDB913] font-mono">
                        Current: {highestBid ? formatINR(highestBid) : formatINR(activePlayer.basePrice)}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-extrabold uppercase">Purse Left</p>
                    <p className="text-xs font-black text-emerald-400 font-mono">{formatINR(remainingPurse)}</p>
                </div>
            </div>

            {amILeading ? (
                <div className="bg-emerald-500/20 border border-emerald-500/50 py-2.5 rounded-xl text-center text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse">
                    <Check size={14} /> You Hold Leading Bid!
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2">
                    <button
                        disabled={bidPlacing || remainingPurse < nextMinBid}
                        onClick={() => handlePlaceBidAmount(nextMinBid)}
                        className="bg-[#FDB913] text-black font-black py-2.5 rounded-xl text-[11px] truncate shadow-lg active:scale-95 disabled:opacity-40"
                    >
                        Min Bid
                    </button>
                    <button
                        disabled={bidPlacing || remainingPurse < (nextMinBid + 50000)}
                        onClick={() => handlePlaceBidAmount(nextMinBid + 50000)}
                        className="bg-white/10 hover:bg-white/20 text-white font-extrabold py-2.5 rounded-xl text-[11px] truncate active:scale-95 disabled:opacity-40"
                    >
                        + 50k
                    </button>
                    <button
                        disabled={bidPlacing || remainingPurse < (nextMinBid + 100000)}
                        onClick={() => handlePlaceBidAmount(nextMinBid + 100000)}
                        className="bg-white/10 hover:bg-white/20 text-white font-extrabold py-2.5 rounded-xl text-[11px] truncate active:scale-95 disabled:opacity-40"
                    >
                        + 100k
                    </button>
                    <button
                        disabled={bidPlacing || remainingPurse < (nextMinBid + 250000)}
                        onClick={() => handlePlaceBidAmount(nextMinBid + 250000)}
                        className="bg-white/10 hover:bg-white/20 text-white font-extrabold py-2.5 rounded-xl text-[11px] truncate active:scale-95 disabled:opacity-40"
                    >
                        + 250k
                    </button>
                </div>
            )}
        </div>
    );
};

export default IPLMobileBidBar;
