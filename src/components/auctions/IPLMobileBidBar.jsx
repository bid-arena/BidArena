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
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-[#02050E]/85 border-t border-white/[0.08] p-3 shadow-[0_-4px_25px_rgba(0,0,0,0.7)] space-y-2 animate-in slide-in-from-bottom duration-300">
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
                <div className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30 py-2.5 rounded-xl text-center text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse shadow-lg shadow-emerald-500/5">
                    <Check size={14} /> You Hold Leading Bid!
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2">
                    <button
                        disabled={bidPlacing || remainingPurse < nextMinBid}
                        onClick={() => handlePlaceBidAmount(nextMinBid)}
                        className="bg-gradient-to-r from-[#FDB913] to-amber-500 hover:from-[#fec435] hover:to-amber-400 text-black font-black py-2.5 rounded-xl text-[11px] truncate shadow-lg active:scale-95 disabled:opacity-40 transition-all duration-200"
                    >
                        Min Bid
                    </button>
                    <button
                        disabled={bidPlacing || remainingPurse < (nextMinBid + 50000)}
                        onClick={() => handlePlaceBidAmount(nextMinBid + 50000)}
                        className="backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-extrabold py-2.5 rounded-xl text-[11px] truncate active:scale-95 disabled:opacity-40 transition-all duration-200"
                    >
                        + 50k
                    </button>
                    <button
                        disabled={bidPlacing || remainingPurse < (nextMinBid + 100000)}
                        onClick={() => handlePlaceBidAmount(nextMinBid + 100000)}
                        className="backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-extrabold py-2.5 rounded-xl text-[11px] truncate active:scale-95 disabled:opacity-40 transition-all duration-200"
                    >
                        + 100k
                    </button>
                    <button
                        disabled={bidPlacing || remainingPurse < (nextMinBid + 250000)}
                        onClick={() => handlePlaceBidAmount(nextMinBid + 250000)}
                        className="backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-extrabold py-2.5 rounded-xl text-[11px] truncate active:scale-95 disabled:opacity-40 transition-all duration-200"
                    >
                        + 250k
                    </button>
                </div>
            )}
        </div>
    );
};

export default IPLMobileBidBar;
