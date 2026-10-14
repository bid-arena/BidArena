import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    getTeamById,
    deleteTeam
} from "../../services/teamService";
import {
    getPlayersByTournament,
    getPlayers
} from "../../services/playerService";
import PlayerDetailsModal from "../../components/players/PlayerDetailsModal";
import {
    Trophy,
    User,
    Coins,
    Users,
    ArrowLeft,
    Edit,
    Trash2,
    AlertTriangle,
    ShieldAlert,
    Clock,
    Plus,
    Tag,
    Mail,
    Eye,
    Target,
    Zap,
    ShieldCheck
} from "lucide-react";
import { toast } from "react-hot-toast";

const ROLE_CONFIG = {
    Batsman: { color: "bg-blue-500/15 text-blue-400 border border-blue-500/25", icon: Target },
    Bowler: { color: "bg-red-500/15 text-red-400 border border-red-500/25", icon: Zap },
    "All-Rounder": { color: "bg-purple-500/15 text-purple-400 border border-purple-500/25", icon: ShieldCheck },
    "Wicket-Keeper": { color: "bg-amber-500/15 text-amber-400 border border-amber-500/25", icon: Users },
    Wicketkeeper: { color: "bg-amber-500/15 text-amber-400 border border-amber-500/25", icon: Users },
    default: { color: "bg-gray-500/15 text-gray-400 border border-gray-500/25", icon: User },
};

const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.default;
    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}
        >
            <Icon size={11} />
            {role || "Player"}
        </span>
    );
};

const TeamDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playersMap, setPlayersMap] = useState({});
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState("roster"); // tabs: roster, bids

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getTeamById(id);
                setTeam(data);

                // Fetch players to ensure player names are always resolved even if not nested in team object
                try {
                    let playersList = [];
                    if (data?.tournamentId) {
                        playersList = await getPlayersByTournament(data.tournamentId);
                    } else {
                        playersList = await getPlayers();
                    }
                    const map = {};
                    (playersList || []).forEach((p) => {
                        if (p.id) map[p.id] = p;
                        if (p._id) map[p._id] = p;
                    });
                    setPlayersMap(map);
                } catch (pErr) {
                    console.warn("Could not load players map for team details:", pErr);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load team details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const getPlayerData = (record) => {
        if (!record) return { name: "Unknown Player", role: "Player", id: null, image: null };
        const p = record.player;
        if (p && (p.name || p.playerName)) {
            return {
                name: p.name || p.playerName,
                role: p.role || "Player",
                basePrice: p.basePrice,
                image: p.image,
                id: p.id || p._id || record.playerId
            };
        }
        if (record.name || record.playerName) {
            return {
                name: record.name || record.playerName,
                role: record.role || "Player",
                basePrice: record.basePrice,
                image: record.image,
                id: record.playerId || record.id
            };
        }
        const pId = record.playerId || record.id;
        const found = playersMap[pId] || (pId ? playersMap[String(pId)] : null);
        if (found) {
            return {
                name: found.name,
                role: found.role || "Player",
                basePrice: found.basePrice,
                image: found.image,
                id: found.id || found._id || pId
            };
        }
        return {
            name: pId ? `Player #${pId.substring(0, 8).toUpperCase()}` : "Unknown Player",
            role: "Player",
            basePrice: null,
            image: null,
            id: pId
        };
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteTeam(id);
            toast.success("Team deleted successfully!");
            navigate("/teams");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete team.");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN').format(amount || 0) + " Pts";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex bg-[#0A0F2C] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm">Loading team details...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex bg-[#0A0F2C] text-white">
                <Sidebar />
                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <ShieldAlert size={48} className="text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
                    <p className="text-gray-400 max-w-md mb-6">
                        The team details could not be retrieved. It may have been deleted or the ID is incorrect.
                    </p>
                    <Link to="/teams" className="inline-flex items-center gap-2 bg-[#FDB913] text-black px-5 py-2.5 rounded-lg font-bold">
                        <ArrowLeft size={16} /> Back to Teams
                    </Link>
                </main>
            </div>
        );
    }

    // Calculating Stats
    const totalPurse = team.purseAmount || 0;
    const remainingPurse = team.remainingPurse || 0;
    const spentPurse = totalPurse - remainingPurse;
    const spentPercent = totalPurse > 0 ? (spentPurse / totalPurse) * 100 : 0;
    const rosterCount = team.playersWon?.length || 0;
    const bidsCount = team.bids?.length || 0;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* BACK NAVIGATION */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <Link to="/teams" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Teams</span>
                        </Link>

                        {/* QUICK ACTIONS */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Link
                                to={`/teams/edit/${team.id}`}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FDB913] border border-[#FDB913]/30 px-4 py-2.5 rounded-lg transition font-semibold text-sm"
                            >
                                <Edit size={16} />
                                <span>Edit Profile</span>
                            </Link>

                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-lg transition font-semibold text-sm"
                            >
                                <Trash2 size={16} />
                                <span>Delete Team</span>
                            </button>
                        </div>
                    </div>

                    {/* HERO HEADER */}
                    <div className="bg-[#0F1E4D]/30 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {team.logo ? (
                                <img
                                    src={team.logo}
                                    alt={team.name}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[#FDB913] shadow-xl shrink-0"
                                />
                            ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FDB913]/10 border-2 border-[#FDB913]/30 flex items-center justify-center font-black text-2xl text-[#FDB913] shrink-0">
                                    {team.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}

                            <div className="space-y-3.5 text-center sm:text-left">
                                <div className="inline-flex items-center gap-2 bg-[#FDB913]/10 px-3 py-1 rounded-full border border-[#FDB913]/20">
                                    <Users size={12} className="text-[#FDB913]" />
                                    <span className="text-[10px] font-bold text-[#FDB913] uppercase tracking-wider">Team Arena</span>
                                </div>

                                <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-[#FDB913] bg-clip-text text-transparent uppercase tracking-tight">
                                    {team.name}
                                </h1>

                                <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <User size={16} className="text-blue-400 shrink-0" />
                                        Owner: <strong className="text-gray-200">{team.ownerName}</strong>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Mail size={16} className="text-[#FDB913] shrink-0" />
                                        Email: <strong className="text-gray-200">{team.ownerEmail}</strong>
                                    </span>
                                    {team.tournament && (
                                        <Link
                                            to={`/tournaments/${team.tournament.id}`}
                                            className="flex items-center gap-1.5 hover:text-white transition group"
                                        >
                                            <Trophy size={16} className="text-amber-400 shrink-0" />
                                            <span>League: <strong className="text-gray-200 border-b border-dashed border-gray-500 group-hover:border-white transition-colors">{team.tournament.name}</strong></span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STATS TILES GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* TOTAL PURSE */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Allocated Points</span>
                                <div className="bg-[#FDB913]/10 p-1.5 rounded-lg border border-[#FDB913]/20 text-[#FDB913]">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {formatCurrency(totalPurse)}
                                </h3>
                            </div>
                        </div>

                        {/* REMAINING PURSE */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Remaining Points</span>
                                <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20 text-blue-400">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className={`text-2xl font-black ${remainingPurse < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                    {formatCurrency(remainingPurse)}
                                </h3>
                            </div>
                        </div>

                        {/* SPENT PURSE */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Points Spent</span>
                                <div className="bg-green-500/10 p-1.5 rounded-lg border border-green-500/20 text-green-400">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {formatCurrency(spentPurse)} <span className="text-xs font-semibold text-gray-500">({spentPercent.toFixed(0)}%)</span>
                                </h3>
                                <div className="w-full bg-[#001F54] rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div
                                        className={`h-1.5 rounded-full ${spentPercent >= 80 ? 'bg-red-500' : 'bg-green-400'}`}
                                        style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* WON PLAYERS COUNT */}
                        <div className="bg-[#0F1E4D]/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roster Size</span>
                                <div className="bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20 text-purple-400">
                                    <Users size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {rosterCount}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Purchased squad players</p>
                            </div>
                        </div>
                    </div>

                    {/* DETAIL TABS */}
                    <div className="bg-[#0F1E4D]/20 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        {/* Tab Headers */}
                        <div className="flex border-b border-white/10 bg-[#001F54]/30">
                            <button
                                onClick={() => setActiveTab("roster")}
                                className={`flex-1 py-4 px-6 font-bold text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "roster" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/30" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <Users size={16} />
                                <span>Squad Roster ({rosterCount})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("bids")}
                                className={`flex-1 py-4 px-6 font-bold text-sm border-b-2 transition flex items-center justify-center gap-2 ${activeTab === "bids" ? "border-[#FDB913] text-[#FDB913] bg-[#0F1E4D]/30" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                <Clock size={16} />
                                <span>Bidding Logs ({bidsCount})</span>
                            </button>
                        </div>

                        {/* Tab Body */}
                        <div className="p-6">
                            {/* ROSTER TAB */}
                            {activeTab === "roster" && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-gray-300">Squad Roster</h2>

                                    {rosterCount === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No players purchased during live bidding yet.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-white/5">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#001F54]/50 text-gray-400 font-semibold text-xs border-b border-white/5">
                                                    <tr>
                                                        <th className="p-4">Player Name</th>
                                                        <th className="p-4">Role</th>
                                                        <th className="p-4 text-right">Winning Price</th>
                                                        <th className="p-4 text-right">Sold At</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 bg-[#001F54]/10">
                                                    {team.playersWon.map((player) => {
                                                        const pData = getPlayerData(player);
                                                        const initials = pData.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().slice(0, 2).toUpperCase() || "P";
                                                        return (
                                                            <tr
                                                                key={player.id}
                                                                onClick={() => pData.id && setSelectedPlayerId(pData.id)}
                                                                className="hover:bg-[#001F54]/30 transition-colors cursor-pointer group"
                                                            >
                                                                <td className="p-4 font-semibold text-gray-200">
                                                                    <div className="flex items-center gap-3">
                                                                        {pData.image ? (
                                                                            <img
                                                                                src={pData.image}
                                                                                alt={pData.name}
                                                                                className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                                                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                            />
                                                                        ) : (
                                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-black text-xs font-black flex items-center justify-center shrink-0 shadow">
                                                                                {initials}
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <span className="font-bold text-white text-sm group-hover:text-[#FDB913] transition-colors block">
                                                                                {pData.name}
                                                                            </span>
                                                                            {player.playerId && (
                                                                                <span className="text-[10px] text-gray-500 font-mono">
                                                                                    #{player.playerId.substring(0, 8).toUpperCase()}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <RoleBadge role={pData.role} />
                                                                </td>
                                                                <td className="p-4 text-right text-green-400 font-extrabold text-sm">
                                                                    {formatCurrency(player.price)}
                                                                </td>
                                                                <td className="p-4 text-right text-gray-400 text-xs">
                                                                    {new Date(player.soldAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BIDS TAB */}
                            {activeTab === "bids" && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-gray-300">Bidding History</h2>

                                    {bidsCount === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-sm">
                                            No bids placed by this team yet.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-white/5">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#001F54]/50 text-gray-400 font-semibold text-xs border-b border-white/5">
                                                    <tr>
                                                        <th className="p-4">Bid ID</th>
                                                        <th className="p-4">Player Name</th>
                                                        <th className="p-4 text-right">Bid Amount</th>
                                                        <th className="p-4 text-right">Timestamp</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 bg-[#001F54]/10">
                                                    {team.bids.map((bid) => {
                                                        const pData = getPlayerData(bid);
                                                        return (
                                                            <tr
                                                                key={bid.id}
                                                                onClick={() => pData.id && setSelectedPlayerId(pData.id)}
                                                                className="hover:bg-[#001F54]/30 transition-colors cursor-pointer group"
                                                            >
                                                                <td className="p-4 font-semibold text-gray-400 font-mono text-xs">
                                                                    #{bid.id.substring(0, 8).toUpperCase()}
                                                                </td>
                                                                <td className="p-4 font-semibold text-gray-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <User size={14} className="text-[#FDB913]" />
                                                                        <span className="group-hover:text-[#FDB913] transition-colors">{pData.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-right text-[#FDB913] font-extrabold">
                                                                    {formatCurrency(bid.amount)}
                                                                </td>
                                                                <td className="p-4 text-right text-gray-400 text-xs">
                                                                    {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* DELETE MODAL */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0F1E4D] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />

                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle size={28} className="shrink-0" />
                            <h3 className="text-xl font-bold">Delete Team Profile?</h3>
                        </div>

                        <div className="space-y-3.5 text-sm text-gray-300">
                            <p>
                                Are you absolutely sure you want to delete <span className="font-extrabold text-white">"{team.name}"</span>?
                            </p>
                            <p className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-200 text-xs flex gap-2">
                                <ShieldAlert size={16} className="shrink-0 text-red-400" />
                                <span>
                                    <strong>CRITICAL WARNING:</strong> Deleting this team will remove it from the registered tournament and delete any bids it made. All winning roster allocations for this team will be lost.
                                </span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-lg font-bold transition text-sm text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                {deleting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Confirm Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PLAYER DETAILS MODAL */}
            {selectedPlayerId && (
                <PlayerDetailsModal
                    playerId={selectedPlayerId}
                    onClose={() => setSelectedPlayerId(null)}
                />
            )}
        </div>
    );
};

export default TeamDetails;
