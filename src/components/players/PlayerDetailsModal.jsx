import React, { useEffect, useState } from "react";
import { getPlayerById } from "../../services/playerService";
import { 
    X, 
    User, 
    Coins, 
    Trophy, 
    TrendingUp, 
    AlertCircle,
    Target,
    Zap,
    ShieldCheck,
    Users,
    Loader2
} from "lucide-react";

const ROLE_CONFIG = {
    Batsman: { color: "bg-blue-500/10 text-blue-400 border border-blue-500/20", icon: Target },
    Bowler: { color: "bg-red-500/10 text-red-400 border border-red-500/20", icon: Zap },
    "All-Rounder": { color: "bg-purple-500/10 text-purple-400 border border-purple-500/20", icon: ShieldCheck },
    "Wicket-Keeper": { color: "bg-amber-500/10 text-amber-400 border border-amber-500/20", icon: Users },
    Wicketkeeper: { color: "bg-amber-500/10 text-amber-400 border border-amber-500/20", icon: Users },
    default: { color: "bg-gray-500/10 text-gray-400 border border-gray-500/20", icon: User },
};

const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.default;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
            <Icon size={12} />
            {role || "—"}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const map = {
        UNSOLD: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        SOLD: "bg-green-500/10 text-green-400 border border-green-500/20",
        AVAILABLE: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${map[status] || map.AVAILABLE}`}>
            {status || "AVAILABLE"}
        </span>
    );
};

const formatINR = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const PlayerDetailsModal = ({ playerId, onClose }) => {
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDetails = async () => {
            if (!playerId) return;
            setLoading(true);
            setError("");
            try {
                const data = await getPlayerById(playerId);
                setPlayer(data);
            } catch (err) {
                console.error("Failed to load player details:", err);
                setError("Could not retrieve player statistics and bidding history.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [playerId]);

    if (!playerId) return null;

    const initials = player?.name
        ? player.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "P";
    const hue = (player?.name?.charCodeAt(0) || 60) % 360;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#080E27] border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
                {/* Header Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition duration-150 z-10"
                >
                    <X size={18} />
                </button>

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-[#FDB913]" size={36} />
                        <p className="text-sm text-gray-400">Fetching Player Ledger...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center rounded-2xl">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="font-extrabold text-white text-lg uppercase">Error Occurred</h3>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{error}</p>
                        <button 
                            onClick={onClose}
                            className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition"
                        >
                            Close Modal
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Profile Hero Section */}
                        <div className="relative p-6 bg-gradient-to-br from-[#0F1E4D]/80 via-[#080E27] to-[#080E27] border-b border-white/5 flex items-center gap-5 pt-8">
                            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                            
                            <div 
                                className="w-20 h-20 rounded-2xl flex items-center justify-center text-black text-2xl font-black shrink-0 shadow-xl border border-white/10"
                                style={{
                                    background: `linear-gradient(135deg, hsl(${hue},85%,65%), hsl(${(hue + 45) % 360},80%,50%))`
                                }}
                            >
                                {initials}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase truncate">{player.name}</h2>
                                <p className="text-[10px] text-gray-500 font-semibold tracking-wider mt-0.5">ID: {player.id}</p>
                                
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <RoleBadge role={player.role} />
                                    <StatusBadge status={player.soldRecord ? "SOLD" : "AVAILABLE"} />
                                </div>
                            </div>
                        </div>

                        {/* Details Grid & Bids section */}
                        <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/3 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Coins size={12} className="text-gray-400" /> Base Price
                                    </span>
                                    <span className="text-lg font-black text-white mt-1.5">{formatINR(player.basePrice)}</span>
                                </div>
                                
                                {player.soldRecord ? (
                                    <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Trophy size={12} className="text-green-400" /> Sold Price
                                        </span>
                                        <span className="text-lg font-black text-green-400 mt-1.5">{formatINR(player.soldRecord.price)}</span>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-2xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <TrendingUp size={12} className="text-yellow-400" /> Auction Status
                                        </span>
                                        <span className="text-lg font-black text-yellow-400 mt-1.5">Unsold</span>
                                    </div>
                                )}
                            </div>

                            {/* Sold Details */}
                            {player.soldRecord && (
                                <div className="bg-[#001F54]/10 border border-[#FDB913]/25 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {player.soldRecord.team?.logo ? (
                                            <img 
                                                src={player.soldRecord.team.logo} 
                                                alt={player.soldRecord.team.name} 
                                                className="w-10 h-10 rounded-xl object-cover border border-white/10"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center font-bold text-xs text-[#FDB913]">
                                                {player.soldRecord.team?.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Acquired By</span>
                                            <span className="text-sm font-black text-white mt-0.5 block">{player.soldRecord.team?.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Hammer Date</span>
                                        <span className="text-xs font-semibold text-gray-300 mt-0.5 block">
                                            {new Date(player.soldRecord.createdAt || new Date()).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Bid Logs */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Bid Ledger History</h4>
                                {(!player.bids || player.bids.length === 0) ? (
                                    <div className="text-center py-6 bg-white/2 border border-white/5 rounded-2xl text-xs text-gray-500 italic">
                                        No bids have been logged for this player.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                        {player.bids.map((bid, i) => (
                                            <div key={bid.id || i} className="flex justify-between items-center bg-white/2 border border-white/5 rounded-xl px-4 py-2.5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-[#FDB913] rounded-full shrink-0" />
                                                    <span className="font-extrabold text-white">{bid.team?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-green-400">{formatINR(bid.amount)}</span>
                                                    <span className="text-[9px] text-gray-500">{new Date(bid.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-white/5 flex justify-end bg-white/1">
                            <button
                                onClick={onClose}
                                className="bg-[#FDB913] hover:bg-amber-500 text-black font-black px-6 py-2.5 rounded-xl text-xs transition duration-150 shadow-lg shadow-[#FDB913]/10"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerDetailsModal;
