import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import {
    User,
    Plus,
    Search,
    Edit,
    Trash2,
    Coins,
    AlertTriangle,
    Trophy,
    ShieldCheck,
    Zap,
    Target,
    Users,
    Filter,
    RotateCcw,
    SlidersHorizontal,
    Eye
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getPlayers, deletePlayer } from "../../services/playerService";

/* ── helpers ─────────────────────────────────────────────── */
const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN").format(n || 0) + " Pts";

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
            {role || "—"}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const map = {
        UNSOLD: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
        SOLD: "bg-green-500/15 text-green-400 border border-green-500/25",
        PENDING: "bg-gray-500/15 text-gray-400 border border-gray-500/25",
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${map[status] || map.PENDING}`}
        >
            {status || "PENDING"}
        </span>
    );
};

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
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortBy, setSortBy] = useState("name-asc");

    // Deletion modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            const data = await getPlayers();
            setPlayers(data || []);
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

    // Calculate Dynamic Dashboard Stats
    const stats = React.useMemo(() => {
        const total = players.length;
        let sold = 0;
        let unsold = 0;
        let pending = 0;
        let totalSpent = 0;

        players.forEach(p => {
            if (p.status === "SOLD" || !!p.soldRecord) {
                sold++;
                totalSpent += (p.soldRecord?.price || 0);
            } else if (p.status === "UNSOLD") {
                unsold++;
            } else {
                pending++;
            }
        });

        return { total, sold, unsold, pending, totalSpent };
    }, [players]);

    // Sorting & filtering logic
    const filtered = React.useMemo(() => {
        let result = [...players];

        // Search filter
        if (search.trim() !== "") {
            const q = search.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.role && p.role.toLowerCase().includes(q)) ||
                (p.tournament?.name && p.tournament.name.toLowerCase().includes(q))
            );
        }

        // Role filter
        if (roleFilter !== "All") {
            result = result.filter(p => {
                if (roleFilter === "Wicketkeeper") {
                    return p.role === "Wicketkeeper" || p.role === "Wicket-Keeper";
                }
                return p.role === roleFilter;
            });
        }

        // Status filter
        if (statusFilter !== "All") {
            if (statusFilter === "SOLD") {
                result = result.filter(p => p.status === "SOLD" || !!p.soldRecord);
            } else if (statusFilter === "UNSOLD") {
                result = result.filter(p => p.status === "UNSOLD");
            } else if (statusFilter === "PENDING") {
                result = result.filter(p => p.status !== "SOLD" && !p.soldRecord && p.status !== "UNSOLD");
            }
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (sortBy === "basePrice-desc") {
                return (b.basePrice || 0) - (a.basePrice || 0);
            }
            if (sortBy === "basePrice-asc") {
                return (a.basePrice || 0) - (b.basePrice || 0);
            }
            if (sortBy === "soldPrice-desc") {
                const priceA = a.soldRecord?.price || 0;
                const priceB = b.soldRecord?.price || 0;
                return priceB - priceA;
            }
            return 0;
        });

        return result;
    }, [players, search, roleFilter, statusFilter, sortBy]);

    /* ─── skeleton ─────────────────────────────────────────── */
    const Skeleton = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/5" />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* ── Page Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Player Pool
                            </h1>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                Register and monitor players across your tournament auctions
                            </p>
                        </div>

                        <Link
                            to="/players/add"
                            id="add-player-btn"
                            className="group inline-flex items-center gap-2 bg-[#FDB913] hover:bg-[#e0a20f] active:scale-95 text-black font-bold px-5 py-2.5 rounded-xl transition duration-200 shadow-lg shadow-yellow-500/10 hover:scale-[1.01] self-start sm:self-auto"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>Add Player</span>
                        </Link>
                    </div>

                    {/* Stats Dashboard Tiles */}
                    {!loading && players.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Total Pool</span>
                                <h3 className="text-2xl font-black text-white">{stats.total}</h3>
                                <p className="text-xs text-gray-500 mt-1">Players registered</p>
                            </div>
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Sold</span>
                                <h3 className="text-2xl font-black text-green-400">{stats.sold}</h3>
                                <p className="text-xs text-gray-500 mt-1">Auctioned to teams</p>
                            </div>
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Unsold</span>
                                <h3 className="text-2xl font-black text-yellow-500">{stats.unsold}</h3>
                                <p className="text-xs text-gray-500 mt-1">Marked passed</p>
                            </div>
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Pending Pool</span>
                                <h3 className="text-2xl font-black text-blue-400">{stats.pending}</h3>
                                <p className="text-xs text-gray-500 mt-1">Awaiting bids</p>
                            </div>
                            <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow col-span-2 lg:col-span-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Winning Spending</span>
                                <h3 className="text-2xl font-black text-[#FDB913] truncate">{formatCurrency(stats.totalSpent)}</h3>
                                <p className="text-xs text-gray-500 mt-1">Winning auction bids</p>
                            </div>
                        </div>
                    )}

                    {/* Search and Filters Bar */}
                    <div className="bg-[#080E27] border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between shadow-xl">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                id="player-search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, role or tournament..."
                                className="w-full bg-white/3 border border-white/10 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition"
                            />
                        </div>

                        {/* Interactive Dropdowns */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            {/* Role Filter */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs text-gray-500 font-medium">Role:</span>
                                <select
                                    id="role-filter"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="bg-[#080E27] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-white/20 transition"
                                >
                                    <option value="All">All Roles</option>
                                    <option value="Batsman">Batsman</option>
                                    <option value="Bowler">Bowler</option>
                                    <option value="All-Rounder">All-Rounder</option>
                                    <option value="Wicketkeeper">Wicketkeeper</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs text-gray-500 font-medium">Status:</span>
                                <select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-[#080E27] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-white/20 transition"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="PENDING">Pending/Pool</option>
                                    <option value="SOLD">Sold</option>
                                    <option value="UNSOLD">Unsold</option>
                                </select>
                            </div>

                            {/* Sort Selector */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                    <SlidersHorizontal size={12} />
                                    Sort:
                                </span>
                                <select
                                    id="sort-by"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-[#080E27] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-white/20 transition"
                                >
                                    <option value="name-asc">Name (A-Z)</option>
                                    <option value="basePrice-desc">Base Price (High-Low)</option>
                                    <option value="basePrice-asc">Base Price (Low-High)</option>
                                    <option value="soldPrice-desc">Sold Price (High-Low)</option>
                                </select>
                            </div>

                            {(search || roleFilter !== "All" || statusFilter !== "All") && (
                                <button
                                    onClick={() => { setSearch(""); setRoleFilter("All"); setStatusFilter("All"); }}
                                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition"
                                >
                                    <RotateCcw size={12} />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Content View ── */}
                    {loading ? (
                        <Skeleton />
                    ) : filtered.length === 0 ? (
                        /* Empty state */
                        <div className="bg-[#080E27] border border-white/5 rounded-2xl py-16 px-6 text-center shadow-xl">
                            <div className="w-16 h-16 rounded-full bg-white/3 flex items-center justify-center text-gray-500 mx-auto mb-4">
                                <User size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No Players Found</h3>
                            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                                {players.length === 0
                                    ? "Add your first player to launch the registration draft pool."
                                    : "Try adjusting your search queries or drop down filter criteria."}
                            </p>

                            {players.length > 0 ? (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setRoleFilter("All");
                                        setStatusFilter("All");
                                        setSortBy("name-asc");
                                    }}
                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs font-semibold transition"
                                >
                                    Reset Filters
                                </button>
                            ) : (
                                <Link
                                    to="/players/add"
                                    className="bg-[#FDB913] hover:bg-[#e0a20f] text-black px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-yellow-500/10 inline-flex items-center gap-1.5 mx-auto"
                                >
                                    <Plus size={16} />
                                    <span>Add First Player</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* ── MOBILE CARDS ── */}
                            <div className="md:hidden space-y-3">
                                {filtered.map((player) => {
                                    const isSold = player.status === "SOLD" || !!player.soldRecord;
                                    const soldPriceVal = player.soldRecord?.price || 0;
                                    const soldTeamName = player.soldRecord?.team?.name || "Unknown Team";

                                    return (
                                        <div
                                            key={player.id}
                                            className="bg-[#080E27] border border-white/6 rounded-2xl p-4 hover:border-white/12 hover:bg-[#0F1B3D] transition-all duration-200"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={player.name} />
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-white text-sm truncate">{player.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                            <RoleBadge role={player.role} />
                                                            <StatusBadge status={isSold ? "SOLD" : (player.status || "PENDING")} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <Link
                                                        to={`/players/edit/${player.id}`}
                                                        className="p-1.5 rounded-lg border border-[#FDB913]/20 bg-[#FDB913]/5 text-[#FDB913] hover:bg-[#FDB913]/15 transition"
                                                    >
                                                        <Edit size={12} />
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(player)}
                                                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3.5 border-t border-white/5 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Base Points</p>
                                                    <span className="text-gray-300 font-bold flex items-center gap-1">
                                                        {formatCurrency(player.basePrice)}
                                                    </span>
                                                </div>
                                                {player.tournament?.name && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Tournament</p>
                                                        <p className="text-gray-300 truncate max-w-[130px] font-semibold">{player.tournament.name}</p>
                                                    </div>
                                                )}
                                                {isSold ? (
                                                    <>
                                                        <div>
                                                            <span className="text-[10px] text-gray-500 block uppercase font-medium">Purchased By</span>
                                                            <span className="text-gray-300 font-bold truncate block">{soldTeamName}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-500 block uppercase font-medium">Sold Price</span>
                                                            <span className="text-green-400 font-black">{formatCurrency(soldPriceVal)}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="col-span-2 text-gray-600 italic">Not sold yet</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── DESKTOP TABLE ── */}
                            <div className="hidden md:block">
                                <div className="bg-[#080E27] border border-white/5 rounded-2xl overflow-x-auto shadow-xl">
                                    <table className="w-full text-xs text-left border-collapse min-w-[950px]">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-[#001F54]/30">
                                                <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    Player
                                                </th>
                                                <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    Role
                                                </th>
                                                <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    Tournament
                                                </th>
                                                <th className="px-5 py-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    Base Points
                                                </th>
                                                <th className="px-5 py-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    Status
                                                </th>
                                                <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    Purchased By
                                                </th>
                                                <th className="px-5 py-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    Sold Price
                                                </th>
                                                <th className="px-5 py-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filtered.map((player) => {
                                                const isSold = player.status === "SOLD" || !!player.soldRecord;
                                                const soldPriceVal = player.soldRecord?.price || 0;
                                                const soldTeamName = player.soldRecord?.team?.name || "Unknown Team";

                                                return (
                                                    <tr
                                                        key={player.id}
                                                        className="group hover:bg-white/3 transition-colors duration-150"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar name={player.name} />
                                                                <div>
                                                                    <p className="font-semibold text-white text-[13px]">{player.name}</p>
                                                                    <p className="text-[10px] text-gray-500 mt-0.5">ID: {player.id?.slice(0, 8)}…</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <RoleBadge role={player.role} />
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {player.tournament?.name ? (
                                                                <Link
                                                                    to={`/tournaments/${player.tournament.id}`}
                                                                    className="inline-flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 border border-white/10 hover:border-[#FDB913]/30 hover:text-white px-2.5 py-1 rounded-lg transition"
                                                                >
                                                                    <Trophy size={11} className="text-[#FDB913]" />
                                                                    {player.tournament.name}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-600 text-xs">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-right font-medium text-gray-300">
                                                            {formatCurrency(player.basePrice)}
                                                        </td>
                                                         <td className="px-5 py-4 text-center">
                                                             <StatusBadge status={isSold ? "SOLD" : (player.status || "PENDING")} />
                                                         </td>
                                                        <td className="px-5 py-4">
                                                            {isSold ? (
                                                                <span className="text-gray-300 font-semibold truncate max-w-[120px] block" title={soldTeamName}>
                                                                    {soldTeamName}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-600">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            {isSold ? (
                                                                <span className="text-green-400 font-bold">
                                                                    {formatCurrency(soldPriceVal)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-600">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Link
                                                                    to={`/players/edit/${player.id}`}
                                                                    id={`edit-player-${player.id}`}
                                                                    className="p-1.5 rounded-lg border border-[#FDB913]/20 bg-[#FDB913]/5 text-[#FDB913] hover:bg-[#FDB913]/15 hover:text-white transition"
                                                                    title="Edit Player"
                                                                >
                                                                    <Edit size={12} />
                                                                </Link>
                                                                <button
                                                                    id={`delete-player-${player.id}`}
                                                                    onClick={() => openDeleteModal(player)}
                                                                    className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:text-white transition"
                                                                    title="Delete Player"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* table footer */}
                                    <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between bg-[#001F54]/10">
                                        <p className="text-xs text-gray-500">
                                            Showing <span className="text-gray-400 font-semibold">{filtered.length}</span> of{" "}
                                            <span className="text-gray-400 font-semibold">{players.length}</span> players
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* ── Delete Confirmation Modal ── */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

                        <p className="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed">
                            Are you sure you want to delete{" "}
                            <span className="font-bold text-white">{playerToDelete?.name}</span>?
                            All associated bids and records will also be removed.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteModalOpen(false); setPlayerToDelete(null); }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-1.5"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/35 border-t-transparent rounded-full animate-spin" />
                                        <span>Deleting…</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={13} />
                                        <span>Delete</span>
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
