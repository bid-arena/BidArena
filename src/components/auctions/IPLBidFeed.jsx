import React from "react";
import { Activity, Gavel, TrendingUp } from "lucide-react";

const IPLBidFeed = ({ bidHistory = [], myTeam, formatINR }) => {
    return (
        <div className="bg-[#0B1120] border border-white/10 rounded-3xl p-3.5 sm:p-5 shadow-2xl flex flex-col w-full h-full max-h-[500px] xl:max-h-none space-y-3 sm:space-y-4">
            {/* Ticker Header */}
            <div className="flex items-center justify-between border-b border-white/8 pb-3 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-200 flex items-center gap-2">
                    <Activity size={15} className="text-[#FDB913]" /> Live Bidding Commentary
                </h3>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> REALTIME
                </span>
            </div>

            {/* Bids List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {bidHistory.length === 0 ? (
                    <div className="text-center py-12 xl:py-24 text-gray-500 text-xs italic space-y-2">
                        <Gavel size={26} className="mx-auto text-gray-600 opacity-40" />
                        <p className="font-semibold text-gray-400">No bids placed in this round yet.</p>
                        <p className="text-[10px] text-gray-600">Bids placed by team owners will appear here live.</p>
                    </div>
                ) : (
                    bidHistory.map((bid, index) => {
                        const isMyLoggedBid = myTeam && bid.teamName === myTeam.name;
                        return (
                            <div
                                key={index}
                                className={`p-3 sm:p-3.5 rounded-2xl border text-xs transition-all duration-300 relative overflow-hidden ${
                                    index === 0
                                        ? isMyLoggedBid
                                            ? "bg-emerald-500/15 border-emerald-500/40 text-white shadow-lg shadow-emerald-500/10 animate-in slide-in-from-top-2"
                                            : "bg-[#FDB913]/15 border-[#FDB913]/40 text-white shadow-lg shadow-yellow-500/10 animate-in slide-in-from-top-2"
                                        : "bg-white/3 border-white/5 text-gray-300 hover:bg-white/5"
                                }`}
                            >
                                {index === 0 && (
                                    <div className={`absolute top-0 inset-x-0 h-0.5 ${isMyLoggedBid ? "bg-emerald-400" : "bg-[#FDB913]"}`} />
                                )}

                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <span className="font-extrabold text-gray-100 flex items-center gap-1.5 truncate">
                                        {bid.teamName}
                                        {isMyLoggedBid && (
                                            <span className="text-[8px] bg-emerald-500/25 text-emerald-400 font-extrabold px-1.5 py-0.2 rounded uppercase border border-emerald-500/40">
                                                YOU
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono shrink-0">{bid.time}</span>
                                </div>

                                <div className="flex justify-between items-end mt-2">
                                    <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center gap-1">
                                        <TrendingUp size={11} className={index === 0 ? "text-[#FDB913]" : "text-gray-500"} />
                                        {index === 0 ? "Latest High Bid" : "Bid Raised"}
                                    </span>
                                    <span className={`text-sm sm:text-base font-black font-mono ${index === 0 ? (isMyLoggedBid ? "text-emerald-400" : "text-[#FDB913]") : "text-gray-300"}`}>
                                        {formatINR(bid.amount)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default IPLBidFeed;
