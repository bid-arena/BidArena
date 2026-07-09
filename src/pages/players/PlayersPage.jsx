import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import {
    User,
    Plus,
    Search,
    Edit,
    Trash2,
    IndianRupee,
    AlertTriangle,
    Trophy,
    ShieldCheck,
    Zap,
    Target,
    Users,
    Filter,
    RotateCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getPlayers, deletePlayer } from "../../services/playerService";

/* ── helpers ─────────────────────────────────────────────── */
const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(n || 0);

const ROLE_CONFIG = {
    Batsman: { color: "bg-blue-500/15 text-blue-400 border-blue-500/25", icon: Target },
    Bowler: { color: "bg-red-500/15 text-red-400 border-red-500/25", icon: Zap },
    "All-Rounder": { color: "bg-purple-500/15 text-purple-400 border-purple-500/25", icon: ShieldCheck },
    "Wicket-Keeper": { color: "bg-amber-500/15 text-amber-400 border-amber-500/25", icon: Users },
    default: { color: "bg-gray-500/15 text-gray-400 border-gray-500/25", icon: User },
};

const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.default;
    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}
        >
            <Icon size={11} />
            {role || "—"}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const map = {
        UNSOLD: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
        SOLD: "bg-green-500/15 text-green-400 border-green-500/25",
        PENDING: "bg-gray-500/15 text-gray-400 border-gray-500/25",
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${map[status] || map.PENDING}`}
        >
            {status || "PENDING"}
        </span>
    );
};

/* ── Avatar initials ─────────────────────────────────────── */
const Avatar = ({ name }) => {
    const initials = name
        ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "P";
    const hue = (name?.charCodeAt(0) || 60) % 360;
    return (
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-black text-xs font-black shrink-0 shadow-md"
            style={{
                background: `linear-gradient(135deg, hsl(${hue},80%,60%), hsl(${(hue + 40) % 360},80%,50%))`,
            }}
        >
            {initials}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════ */
const PlayersPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            const data = await getPlayers();
            setPlayers(data);
        } catch (err) {
            console.error("Error fetching players", err);
            toast.error("Failed to load players.");
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (player) => {
        setPlayerToDelete(player);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!playerToDelete) return;
        setDeleting(true);
        try {
            await deletePlayer(playerToDelete.id);
            setPlayers((prev) => prev.filter((p) => p.id !== playerToDelete.id));
            toast.success(`${playerToDelete.name} deleted successfully!`);
        } catch (err) {
            console.error("Delete error:", err);
            toast.error(err.response?.data?.message || "Failed to delete player.");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
            setPlayerToDelete(null);
        }
    };

    /* unique roles for filter */
    const allRoles = ["All", ...new Set(players.map((p) => p.role).filter(Boolean))];

    const filtered = players.filter((p) => {
        const q = search.toLowerCase();
        const matchSearch =
            p.name?.toLowerCase().includes(q) ||
            p.role?.toLowerCase().includes(q) ||
            p.tournament?.name?.toLowerCase().includes(q);
        const matchRole = roleFilter === "All" || p.role === roleFilter;
        return matchSearch && matchRole;
    });

    /* ─── skeleton ─────────────────────────────────────────── */
    const Skeleton = () => (
        <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5" />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] via-[#060C21] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
                {/* ── Page Header ── */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center">
                                    <User size={20} className="text-[#FDB913]" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                    Players
                                </h1>
                            </div>
                            <p className="text-sm text-gray-500 ml-[52px]">
                                Manage all players across your tournaments
                            </p>
                        </div>

                        <Link
                            to="/players/add"
                            id="add-player-btn"
                            className="group inline-flex items-center gap-2 bg-[#FDB913] hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:scale-[1.02] self-start sm:self-auto"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
                            Add Player
                        </Link>
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap gap-3 mt-5">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-400">
                            <Users size={13} className="text-[#FDB913]" />
                            <span className="text-white font-bold">{players.length}</span> total players
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-400">
                            <Trophy size={13} className="text-green-400" />
                            <span className="text-white font-bold">{players.filter(p => p.status === "SOLD").length}</span> sold
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-400">
                            <Target size={13} className="text-yellow-400" />
                            <span className="text-white font-bold">{players.filter(p => p.status !== "SOLD").length}</span> available
                        </div>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            id="player-search"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search players, roles, tournaments…"
                            className="w-full bg-[#080E27] border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FDB913]/40 focus:ring-1 focus:ring-[#FDB913]/20 transition"
                        />
                    </div>

                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        <select
                            id="role-filter"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-[#080E27] border border-white/8 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#FDB913]/40 focus:ring-1 focus:ring-[#FDB913]/20 transition appearance-none cursor-pointer"
                        >
                            {allRoles.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {(search || roleFilter !== "All") && (
                        <button
                            onClick={() => { setSearch(""); setRoleFilter("All"); }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/8 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
                        >
                            <RotateCcw size={13} />
                            Clear
                        </button>
                    )}
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <Skeleton />
                ) : filtered.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center mb-4">
                            <User size={28} className="text-[#FDB913]/60" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">
                            {players.length === 0 ? "No players yet" : "No results found"}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                            {players.length === 0
                                ? "Add your first player to get started with auctions."
                                : "Try adjusting your search or filter criteria."}
                        </p>
                        {players.length === 0 && (
                            <Link
                                to="/players/add"
                                className="mt-5 inline-flex items-center gap-2 bg-[#FDB913] hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl transition-all"
                            >
                                <Plus size={16} />
                                Add First Player
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── MOBILE CARDS ── */}
                        <div className="md:hidden space-y-3">
                            {filtered.map((player) => (
                                <div
                                    key={player.id}
                                    className="bg-[#080E27] border border-white/6 rounded-2xl p-4 hover:border-white/12 hover:bg-[#0F1B3D] transition-all duration-200"
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar name={player.name} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-sm truncate">{player.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <RoleBadge role={player.role} />
                                                <StatusBadge status={player.status} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Base Price</p>
                                            <span className="text-green-400 font-bold text-sm flex items-center gap-1">
                                                <IndianRupee size={12} />
                                                {formatCurrency(player.basePrice).replace("₹", "")}
                                            </span>
                                        </div>
                                        {player.tournament?.name && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Tournament</p>
                                                <p className="text-xs text-gray-300 truncate max-w-[130px]">{player.tournament.name}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <Link
                                            to={`/players/edit/${player.id}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#FDB913]/20 bg-[#FDB913]/8 text-[#FDB913] text-xs font-semibold hover:bg-[#FDB913]/15 transition"
                                        >
                                            <Edit size={13} />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => openDeleteModal(player)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-500/20 bg-red-500/8 text-red-400 text-xs font-semibold hover:bg-red-500/15 transition"
                                        >
                                            <Trash2 size={13} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── DESKTOP TABLE ── */}
                        <div className="hidden md:block">
                            <div className="bg-[#080E27] border border-white/6 rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/6">
                                            <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                Player
                                            </th>
                                            <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                Role
                                            </th>
                                            <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                Tournament
                                            </th>
                                            <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                Base Price
                                            </th>
                                            <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                Status
                                            </th>
                                            <th className="px-5 py-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/4">
                                        {filtered.map((player) => (
                                            <tr
                                                key={player.id}
                                                className="group hover:bg-white/3 transition-colors duration-150"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={player.name} />
                                                        <div>
                                                            <p className="font-semibold text-white text-[13px]">{player.name}</p>
                                                            <p className="text-[11px] text-gray-500">ID: {player.id?.slice(0, 8)}…</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <RoleBadge role={player.role} />
                                                </td>
                                                <td className="px-5 py-4">
                                                    {player.tournament?.name ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg">
                                                            <Trophy size={11} className="text-[#FDB913]" />
                                                            {player.tournament.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-bold text-green-400 text-[13px] flex items-center gap-1">
                                                        <IndianRupee size={12} />
                                                        {formatCurrency(player.basePrice).replace("₹", "")}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge status={player.status} />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            to={`/players/edit/${player.id}`}
                                                            id={`edit-player-${player.id}`}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FDB913]/20 bg-[#FDB913]/8 text-[#FDB913] text-xs font-semibold hover:bg-[#FDB913]/20 hover:border-[#FDB913]/30 transition-all"
                                                        >
                                                            <Edit size={12} />
                                                            Edit
                                                        </Link>
                                                        <button
                                                            id={`delete-player-${player.id}`}
                                                            onClick={() => openDeleteModal(player)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/8 text-red-400 text-xs font-semibold hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* table footer */}
                                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                                    <p className="text-xs text-gray-600">
                                        Showing <span className="text-gray-400 font-semibold">{filtered.length}</span> of{" "}
                                        <span className="text-gray-400 font-semibold">{players.length}</span> players
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* ── Delete Confirmation Modal ── */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black/60 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-0 inset-x-0 h-1 bg-red-500 rounded-t-2xl" />

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">Delete Player</h3>
                                <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone.</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300 mb-6">
                            Are you sure you want to delete{" "}
                            <span className="font-bold text-white">{playerToDelete?.name}</span>?
                            All associated bids and records will also be removed.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteModalOpen(false); setPlayerToDelete(null); }}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting…
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        Yes, Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayersPage;
