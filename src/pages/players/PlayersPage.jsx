import React, { useEffect, useState, useMemo, useRef } from "react";
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
    Eye,
    LayoutGrid,
    List,
    RefreshCw,
    UploadCloud,
    FileSpreadsheet,
    CheckCircle2,
    Clock,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Sparkles,
    Check
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getPlayers, deletePlayer } from "../../services/playerService";
import { getTournaments } from "../../services/tournamentService";
import PlayerDetailsModal from "../../components/players/PlayerDetailsModal";
import BulkPlayerUploadModal from "../../components/players/BulkPlayerUploadModal";

import batsmanIcon from "../../assets/icons/batsman-rb.png";
import bowlerIcon from "../../assets/icons/bowler-rb.png";
import allRounderIcon from "../../assets/icons/all-rounder-rb.png";
import wicketkeeperIcon from "../../assets/icons/wicketkeeper-rb.png";

/* ── helpers ─────────────────────────────────────────────── */
const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN").format(n || 0) + " Pts";

const ROLE_CONFIG = {
    Batsman: {
        color: "bg-blue-500/10 text-blue-400 border-blue-500/25",
        badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        accent: "#38bdf8",
        icon: Target,
        image: batsmanIcon,
        label: "Batsman",
    },
    Bowler: {
        color: "bg-red-500/10 text-red-400 border-red-500/25",
        badge: "bg-red-500/15 text-red-300 border-red-500/30",
        accent: "#f87171",
        icon: Zap,
        image: bowlerIcon,
        label: "Bowler",
    },
    "All-Rounder": {
        color: "bg-purple-500/10 text-purple-400 border-purple-500/25",
        badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        accent: "#c084fc",
        icon: ShieldCheck,
        image: allRounderIcon,
        label: "All-Rounder",
    },
    "Wicket-Keeper": {
        color: "bg-amber-500/10 text-amber-400 border-amber-500/25",
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        accent: "#fbbf24",
        icon: Users,
        image: wicketkeeperIcon,
        label: "Wicket-Keeper",
    },
    Wicketkeeper: {
        color: "bg-amber-500/10 text-amber-400 border-amber-500/25",
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        accent: "#fbbf24",
        icon: Users,
        image: wicketkeeperIcon,
        label: "Wicketkeeper",
    },
    default: {
        color: "bg-gray-500/10 text-gray-400 border-gray-500/25",
        badge: "bg-gray-500/15 text-gray-300 border-gray-500/30",
        accent: "#9ca3af",
        icon: User,
        image: null,
        label: "Player",
    },
};

const getRoleConfig = (role) => {
    if (!role) return ROLE_CONFIG.default;
    return ROLE_CONFIG[role] || ROLE_CONFIG.default;
};

const RoleBadge = ({ role, compact = false }) => {
    const cfg = getRoleConfig(role);
    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 font-bold border rounded-full ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
                } ${cfg.badge}`}
        >
            <Icon size={compact ? 10 : 12} />
            <span>{role || "—"}</span>
        </span>
    );
};

const StatusBadge = ({ status, compact = false }) => {
    if (status === "SOLD") {
        return (
            <span
                className={`inline-flex items-center gap-1 font-bold rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
                    }`}
            >
                <Check size={compact ? 10 : 12} />
                <span>SOLD</span>
            </span>
        );
    }
    if (status === "UNSOLD") {
        return (
            <span
                className={`inline-flex items-center gap-1 font-bold rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30 ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
                    }`}
            >
                <AlertTriangle size={compact ? 10 : 12} />
                <span>UNSOLD</span>
            </span>
        );
    }
    return (
        <span
            className={`inline-flex items-center gap-1 font-bold rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30 ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
                }`}
        >
            <Clock size={compact ? 10 : 12} />
            <span>POOL</span>
        </span>
    );
};

const PlayerAvatar = ({ name, role, size = "md" }) => {
    const cfg = getRoleConfig(role);
    const initials = name
        ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "P";
    const hue = (name?.charCodeAt(0) || 60) % 360;

    const sizeClasses = {
        sm: "w-8 h-8 text-[11px]",
        md: "w-11 h-11 text-xs",
        lg: "w-14 h-14 text-sm",
    };

    return (
        <div className="relative shrink-0">
            {cfg.image ? (
                <div
                    className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center p-1.5 border border-white/10 shadow-lg relative overflow-hidden`}
                    style={{
                        background: `radial-gradient(circle at 50% 30%, ${cfg.accent}25, #080E27 90%)`,
                    }}
                >
                    <img
                        src={cfg.image}
                        alt={role}
                        className="w-full h-full object-contain filter drop-shadow"
                    />
                </div>
            ) : (
                <div
                    className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center text-black font-black shadow-lg`}
                    style={{
                        background: `linear-gradient(135deg, hsl(${hue},80%,60%), hsl(${(hue + 40) % 360},80%,50%))`,
                    }}
                >
                    {initials}
                </div>
            )}
        </div>
    );
};

/* ─── Custom Dropdown Component ───────────────────────────── */
const CustomDropdown = ({
    id,
    label,
    icon: Icon,
    value,
    onChange,
    options,
    minWidth = "w-52",
    align = "left",
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption =
        options.find((opt) => String(opt.value) === String(value)) || options[0];

    return (
        <div ref={ref} className="relative inline-block text-left">
            <button
                type="button"
                id={id}
                onClick={() => setOpen((prev) => !prev)}
                className={`group inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                    open
                        ? "bg-[#0F1B3D] border-[#FDB913]/60 text-white shadow-lg shadow-black/40 ring-1 ring-[#FDB913]/30"
                        : "bg-[#050B1A] border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-[#0c1435]"
                }`}
            >
                {Icon && (
                    <Icon
                        size={14}
                        className={`transition-colors shrink-0 ${
                            open ? "text-[#FDB913]" : "text-[#FDB913]/80 group-hover:text-[#FDB913]"
                        }`}
                    />
                )}
                {label && <span className="text-gray-400 font-medium shrink-0">{label}</span>}
                <span className="font-bold text-white truncate max-w-[120px] sm:max-w-[150px]">
                    {selectedOption?.label || "Select"}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-gray-400 group-hover:text-white transition-transform duration-200 shrink-0 ${
                        open ? "rotate-180 text-[#FDB913]" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    className={`absolute ${
                        align === "right" ? "right-0" : "left-0"
                    } mt-2 ${minWidth} max-h-72 overflow-y-auto bg-[#0A122C]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1`}
                >
                    {options.map((opt) => {
                        const isSelected = String(opt.value) === String(value);
                        const OptIcon = opt.icon;
                        return (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                                    isSelected
                                        ? "bg-[#FDB913]/15 text-[#FDB913] font-bold border border-[#FDB913]/30"
                                        : "text-gray-300 hover:bg-white/5 hover:text-white border border-transparent"
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {OptIcon && (
                                        <OptIcon
                                            size={13}
                                            className={isSelected ? "text-[#FDB913]" : "text-gray-400"}
                                        />
                                    )}
                                    <span className="truncate">{opt.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {opt.count !== undefined && (
                                        <span
                                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                                                isSelected
                                                    ? "bg-[#FDB913]/25 text-[#FDB913]"
                                                    : "bg-white/5 text-gray-400"
                                            }`}
                                        >
                                            {opt.count}
                                        </span>
                                    )}
                                    {isSelected && (
                                        <Check size={13} className="text-[#FDB913] shrink-0" strokeWidth={2.5} />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════ */
const PlayersPage = () => {
    const [players, setPlayers] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters and controls
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [tournamentFilter, setTournamentFilter] = useState("All");
    const [sortBy, setSortBy] = useState("name-asc");
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Quick View Modal
    const [viewingPlayerId, setViewingPlayerId] = useState(null);

    // Bulk Upload Modal
    const [selectTournamentModalOpen, setSelectTournamentModalOpen] = useState(false);
    const [chosenTournamentId, setChosenTournamentId] = useState("");
    const [tournamentSearchQuery, setTournamentSearchQuery] = useState("");
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [selectedTournamentForBulk, setSelectedTournamentForBulk] = useState(null);

    // Deletion modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        try {
            const [playersData, tournamentsData] = await Promise.allSettled([
                getPlayers(),
                getTournaments(),
            ]);

            if (playersData.status === "fulfilled") {
                setPlayers(playersData.value || []);
            } else {
                toast.error("Failed to load players.");
            }

            if (tournamentsData.status === "fulfilled") {
                setTournaments(tournamentsData.value || []);
            }
        } catch (err) {
            console.error("Error loading player pool data:", err);
            toast.error("Network error while loading player pool.");
        } finally {
            setLoading(false);
            setRefreshing(false);
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
    const stats = useMemo(() => {
        const total = players.length;
        let sold = 0;
        let unsold = 0;
        let pending = 0;
        let totalSpent = 0;

        const roleCounts = {
            Batsman: 0,
            Bowler: 0,
            "All-Rounder": 0,
            Wicketkeeper: 0,
        };

        players.forEach((p) => {
            const isSold = p.status === "SOLD" || !!p.soldRecord;
            if (isSold) {
                sold++;
                totalSpent += p.soldRecord?.price || 0;
            } else if (p.status === "UNSOLD") {
                unsold++;
            } else {
                pending++;
            }

            // Role counter
            if (p.role === "Batsman" || p.role === "Batter") roleCounts.Batsman++;
            else if (p.role === "Bowler") roleCounts.Bowler++;
            else if (p.role === "All-Rounder" || p.role === "All Rounder") roleCounts["All-Rounder"]++;
            else if (p.role === "Wicketkeeper" || p.role === "Wicket-Keeper") roleCounts.Wicketkeeper++;
        });

        return { total, sold, unsold, pending, totalSpent, roleCounts };
    }, [players]);

    // Sorting & filtering logic
    const filtered = useMemo(() => {
        let result = [...players];

        // Search filter
        if (search.trim() !== "") {
            const q = search.toLowerCase();
            result = result.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.role && p.role.toLowerCase().includes(q)) ||
                    (p.tournament?.name && p.tournament.name.toLowerCase().includes(q)) ||
                    (p.soldRecord?.team?.name && p.soldRecord.team.name.toLowerCase().includes(q))
            );
        }

        // Tournament filter
        if (tournamentFilter !== "All") {
            result = result.filter(
                (p) =>
                    p.tournamentId === tournamentFilter ||
                    p.tournament?.id === tournamentFilter
            );
        }

        // Role filter
        if (roleFilter !== "All") {
            result = result.filter((p) => {
                if (roleFilter === "Wicketkeeper") {
                    return p.role === "Wicketkeeper" || p.role === "Wicket-Keeper";
                }
                if (roleFilter === "All-Rounder") {
                    return p.role === "All-Rounder" || p.role === "All Rounder";
                }
                if (roleFilter === "Batsman") {
                    return p.role === "Batsman" || p.role === "Batter";
                }
                return p.role === roleFilter;
            });
        }

        // Status filter
        if (statusFilter !== "All") {
            if (statusFilter === "SOLD") {
                result = result.filter((p) => p.status === "SOLD" || !!p.soldRecord);
            } else if (statusFilter === "UNSOLD") {
                result = result.filter((p) => p.status === "UNSOLD");
            } else if (statusFilter === "PENDING") {
                result = result.filter((p) => p.status !== "SOLD" && !p.soldRecord && p.status !== "UNSOLD");
            }
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (sortBy === "name-desc") {
                return (b.name || "").localeCompare(a.name || "");
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
    }, [players, search, roleFilter, statusFilter, tournamentFilter, sortBy]);

    // Reset pagination when filter query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, roleFilter, statusFilter, tournamentFilter, sortBy, pageSize]);

    // Paginated subset
    const paginatedPlayers = useMemo(() => {
        if (pageSize === -1) return filtered;
        const startIndex = (currentPage - 1) * pageSize;
        return filtered.slice(startIndex, startIndex + pageSize);
    }, [filtered, currentPage, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.ceil(filtered.length / pageSize) || 1;

    const hasActiveFilters =
        search.trim() !== "" ||
        roleFilter !== "All" ||
        statusFilter !== "All" ||
        tournamentFilter !== "All" ||
        sortBy !== "name-asc";

    const resetFilters = () => {
        setSearch("");
        setRoleFilter("All");
        setStatusFilter("All");
        setTournamentFilter("All");
        setSortBy("name-asc");
    };

    const handleOpenBulkUpload = () => {
        if (tournaments.length === 0) {
            toast.error("Please create a tournament first to upload players in bulk.");
            return;
        }

        // Pre-select tournament from active filter if present, otherwise default to first
        if (tournamentFilter !== "All") {
            setChosenTournamentId(tournamentFilter);
        } else if (tournaments.length > 0) {
            setChosenTournamentId(tournaments[0].id);
        }

        setTournamentSearchQuery("");
        setSelectTournamentModalOpen(true);
    };

    const handleConfirmTournamentForBulk = () => {
        if (!chosenTournamentId) {
            toast.error("Please select a tournament to proceed.");
            return;
        }

        setSelectedTournamentForBulk(chosenTournamentId);
        setSelectTournamentModalOpen(false);
        setBulkModalOpen(true);
    };

    /* ─── Skeleton Loading ─────────────────────────────────────────── */
    const SkeletonCards = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="h-64 rounded-2xl bg-[#080E27]/60 border border-white/5 p-5 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-2xl bg-white/5" />
                        <div className="w-16 h-6 rounded-full bg-white/5" />
                    </div>
                    <div className="space-y-2">
                        <div className="w-3/4 h-4 bg-white/5 rounded" />
                        <div className="w-1/2 h-3 bg-white/5 rounded" />
                    </div>
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                        <div className="w-20 h-4 bg-white/5 rounded" />
                        <div className="w-16 h-7 bg-white/5 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white selection:bg-[#FDB913] selection:text-black">
            <Sidebar />

            <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 w-full overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                    {/* ── Top Header Section ── */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-white/5 pb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FDB913]/20 to-amber-600/10 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shadow-lg shadow-yellow-500/10">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
                                        Player Pool
                                        {!loading && (
                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                                                {players.length}
                                            </span>
                                        )}
                                    </h1>
                                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                                        Browse draft categories, monitor bidding status, and manage registration records
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Top Action Bar */}
                        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                            <button
                                onClick={() => loadData(true)}
                                disabled={refreshing}
                                title="Refresh Player Pool"
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw size={17} className={refreshing ? "animate-spin text-[#FDB913]" : ""} />
                            </button>

                            {/* View Mode Toggle */}
                            <div className="inline-flex items-center bg-[#080E27] border border-white/10 rounded-xl p-1 gap-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${viewMode === "grid"
                                            ? "bg-[#FDB913] text-black shadow-md shadow-yellow-500/20"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                    title="Grid View"
                                >
                                    <LayoutGrid size={15} />
                                    <span className="hidden sm:inline">Grid</span>
                                </button>
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${viewMode === "table"
                                            ? "bg-[#FDB913] text-black shadow-md shadow-yellow-500/20"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                    title="Table View"
                                >
                                    <List size={15} />
                                    <span className="hidden sm:inline">Table</span>
                                </button>
                            </div>

                            {/* Bulk Upload Button */}
                            <button
                                onClick={handleOpenBulkUpload}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs sm:text-sm transition active:scale-95"
                            >
                                <UploadCloud size={16} className="text-[#FDB913]" />
                                <span>Bulk Upload</span>
                            </button>

                            {/* Add Player Primary Button */}
                            <Link
                                to="/players/add"
                                id="add-player-btn"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDB913] to-amber-500 hover:from-[#f5b30c] hover:to-amber-600 active:scale-95 text-black font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm transition duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30"
                            >
                                <Plus size={18} />
                                <span>Add Player</span>
                            </Link>
                        </div>
                    </div>

                    {/* ── KPI Metrics Cards ── */}
                    {!loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            {/* Total Pool */}
                            <button
                                onClick={() => setStatusFilter("All")}
                                className={`text-left p-4 rounded-2xl border transition-all duration-200 ${statusFilter === "All"
                                        ? "bg-[#0F1B3D] border-[#FDB913]/40 shadow-lg shadow-black/40"
                                        : "bg-[#080E27] border-white/5 hover:border-white/10 hover:bg-[#0B1437]"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Total Pool
                                    </span>
                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Users size={14} />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-white">{stats.total}</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                    {stats.roleCounts.Batsman} Bat · {stats.roleCounts.Bowler} Bowl · {stats.roleCounts["All-Rounder"]} AR
                                </p>
                            </button>

                            {/* Available/Pending */}
                            <button
                                onClick={() => setStatusFilter("PENDING")}
                                className={`text-left p-4 rounded-2xl border transition-all duration-200 ${statusFilter === "PENDING"
                                        ? "bg-[#0F1B3D] border-blue-500/40 shadow-lg shadow-black/40"
                                        : "bg-[#080E27] border-white/5 hover:border-white/10 hover:bg-[#0B1437]"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Available
                                    </span>
                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Clock size={14} />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-blue-400">{stats.pending}</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">Awaiting auction</p>
                            </button>

                            {/* Sold */}
                            <button
                                onClick={() => setStatusFilter("SOLD")}
                                className={`text-left p-4 rounded-2xl border transition-all duration-200 ${statusFilter === "SOLD"
                                        ? "bg-[#0F1B3D] border-emerald-500/40 shadow-lg shadow-black/40"
                                        : "bg-[#080E27] border-white/5 hover:border-white/10 hover:bg-[#0B1437]"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Sold
                                    </span>
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <CheckCircle2 size={14} />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-emerald-400">{stats.sold}</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">Assigned to squads</p>
                            </button>

                            {/* Unsold */}
                            <button
                                onClick={() => setStatusFilter("UNSOLD")}
                                className={`text-left p-4 rounded-2xl border transition-all duration-200 ${statusFilter === "UNSOLD"
                                        ? "bg-[#0F1B3D] border-amber-500/40 shadow-lg shadow-black/40"
                                        : "bg-[#080E27] border-white/5 hover:border-white/10 hover:bg-[#0B1437]"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Unsold
                                    </span>
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                        <AlertTriangle size={14} />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-amber-400">{stats.unsold}</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">Passed by franchises</p>
                            </button>

                            {/* Total Spend */}
                            <div className="p-4 rounded-2xl border bg-[#080E27] border-white/5 col-span-2 sm:col-span-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Total Spend
                                    </span>
                                    <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-[#FDB913]">
                                        <Coins size={14} />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-[#FDB913] truncate">
                                    {formatCurrency(stats.totalSpent)}
                                </h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">Winning bid volume</p>
                            </div>
                        </div>
                    )}

                    {/* ── Filters & Search Control Bar ── */}
                    <div className="bg-[#080E27] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                                <input
                                    id="player-search"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search player, role, team, or tournament..."
                                    className="w-full bg-[#050B1A]/80 border border-white/10 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Filters */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Tournament Filter */}
                                <CustomDropdown
                                    id="tournament-filter"
                                    icon={Trophy}
                                    label="Tourn:"
                                    value={tournamentFilter}
                                    onChange={setTournamentFilter}
                                    minWidth="w-64"
                                    options={[
                                        { value: "All", label: "All Tournaments", count: players.length, icon: Trophy },
                                        ...tournaments.map((t) => ({
                                            value: t.id,
                                            label: t.name,
                                            count: players.filter((p) => p.tournamentId === t.id || p.tournament?.id === t.id).length,
                                            icon: Trophy,
                                        })),
                                    ]}
                                />

                                {/* Sort Selector */}
                                <CustomDropdown
                                    id="sort-by"
                                    icon={SlidersHorizontal}
                                    label="Sort:"
                                    value={sortBy}
                                    onChange={setSortBy}
                                    minWidth="w-56"
                                    options={[
                                        { value: "name-asc", label: "Name (A-Z)" },
                                        { value: "name-desc", label: "Name (Z-A)" },
                                        { value: "basePrice-desc", label: "Base Price (High-Low)" },
                                        { value: "basePrice-asc", label: "Base Price (Low-High)" },
                                        { value: "soldPrice-desc", label: "Sold Price (High-Low)" },
                                    ]}
                                />

                                {/* Items per page */}
                                <div className="hidden sm:block">
                                    <CustomDropdown
                                        id="page-size"
                                        label="Show:"
                                        value={pageSize}
                                        onChange={(val) => setPageSize(Number(val))}
                                        minWidth="w-36"
                                        align="right"
                                        options={[
                                            { value: 12, label: "12 / page" },
                                            { value: 24, label: "24 / page" },
                                            { value: 48, label: "48 / page" },
                                            { value: -1, label: "All players" },
                                        ]}
                                    />
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-white transition cursor-pointer"
                                    >
                                        <RotateCcw size={13} />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Role & Status Pill Chips */}
                        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                            {/* Role Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1 shrink-0">
                                    Role:
                                </span>
                                {[
                                    { key: "All", label: "All" },
                                    { key: "Batsman", label: `Batsmen (${stats.roleCounts.Batsman})`, icon: Target },
                                    { key: "Bowler", label: `Bowlers (${stats.roleCounts.Bowler})`, icon: Zap },
                                    { key: "All-Rounder", label: `All-Rounders (${stats.roleCounts["All-Rounder"]})`, icon: ShieldCheck },
                                    { key: "Wicketkeeper", label: `Keepers (${stats.roleCounts.Wicketkeeper})`, icon: Users },
                                ].map((tab) => {
                                    const active = roleFilter === tab.key;
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => setRoleFilter(tab.key)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${active
                                                    ? "bg-[#FDB913]/15 text-[#FDB913] border border-[#FDB913]/30 shadow-sm"
                                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
                                                }`}
                                        >
                                            {Icon && <Icon size={12} />}
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Status Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1 shrink-0">
                                    Status:
                                </span>
                                {[
                                    { key: "All", label: "All" },
                                    { key: "PENDING", label: `Pool (${stats.pending})` },
                                    { key: "SOLD", label: `Sold (${stats.sold})` },
                                    { key: "UNSOLD", label: `Unsold (${stats.unsold})` },
                                ].map((tab) => {
                                    const active = statusFilter === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => setStatusFilter(tab.key)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${active
                                                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Player Pool Content Area ── */}
                    {loading ? (
                        <SkeletonCards />
                    ) : filtered.length === 0 ? (
                        /* Empty State */
                        <div className="bg-[#080E27] border border-white/5 rounded-3xl py-16 px-6 text-center shadow-xl">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FDB913]/10 to-amber-600/5 border border-[#FDB913]/20 flex items-center justify-center text-[#FDB913] mx-auto mb-4">
                                <User size={32} />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">No Players Match Criteria</h3>
                            <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
                                {players.length === 0
                                    ? "Your pool is currently empty. Add individual players or bulk upload an Excel/CSV roster to kick off your auction draft."
                                    : "We couldn't find any players matching your current search query or applied filters."}
                            </p>

                            {hasActiveFilters ? (
                                <button
                                    onClick={resetFilters}
                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs font-semibold transition"
                                >
                                    Clear All Filters
                                </button>
                            ) : (
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <Link
                                        to="/players/add"
                                        className="bg-[#FDB913] hover:bg-[#e0a20f] text-black px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-yellow-500/10 inline-flex items-center gap-1.5"
                                    >
                                        <Plus size={16} />
                                        <span>Add First Player</span>
                                    </Link>
                                    <button
                                        onClick={handleOpenBulkUpload}
                                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition inline-flex items-center gap-1.5"
                                    >
                                        <UploadCloud size={16} />
                                        <span>Bulk Import Excel</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : viewMode === "grid" ? (
                        /* ── GRID VIEW ── */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {paginatedPlayers.map((player) => {
                                const isSold = player.status === "SOLD" || !!player.soldRecord;
                                const soldPriceVal = player.soldRecord?.price || 0;
                                const soldTeamName = player.soldRecord?.team?.name || "Unknown Team";
                                const cfg = getRoleConfig(player.role);

                                return (
                                    <div
                                        key={player.id}
                                        className="group bg-[#080E27] border border-white/5 hover:border-white/15 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-0.5 relative overflow-hidden"
                                    >
                                        {/* Subtle role color accent top highlight */}
                                        <div
                                            className="absolute top-0 inset-x-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: cfg.accent }}
                                        />

                                        <div>
                                            {/* Header Row: Role & Status */}
                                            <div className="flex items-center justify-between gap-2 mb-4">
                                                <RoleBadge role={player.role} compact />
                                                <StatusBadge status={isSold ? "SOLD" : player.status || "PENDING"} compact />
                                            </div>

                                            {/* Player Identity Row */}
                                            <div className="flex items-start gap-3.5 mb-4">
                                                <PlayerAvatar name={player.name} role={player.role} size="md" />
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-extrabold text-white text-base truncate group-hover:text-[#FDB913] transition-colors">
                                                        {player.name}
                                                    </h3>
                                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                        ID: {player.id?.slice(0, 8)}…
                                                    </p>

                                                    {/* Tournament tag */}
                                                    {player.tournament?.name && (
                                                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/3 border border-white/5 text-[10px] text-gray-300 max-w-full truncate">
                                                            <Trophy size={10} className="text-[#FDB913] shrink-0" />
                                                            <span className="truncate">{player.tournament.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price / Ledger section */}
                                            <div className="bg-[#050B1A]/80 border border-white/5 rounded-xl p-3 space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                                                        <Coins size={12} className="text-yellow-400" />
                                                        Base Points
                                                    </span>
                                                    <span className="font-bold text-white">
                                                        {formatCurrency(player.basePrice)}
                                                    </span>
                                                </div>

                                                {isSold ? (
                                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                                        <div className="min-w-0 pr-2">
                                                            <span className="text-[10px] text-gray-400 block font-medium uppercase">
                                                                Won by
                                                            </span>
                                                            <span className="text-white font-bold truncate block" title={soldTeamName}>
                                                                {soldTeamName}
                                                            </span>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-[10px] text-gray-400 block font-medium uppercase">
                                                                Winning Bid
                                                            </span>
                                                            <span className="text-emerald-400 font-black text-sm">
                                                                {formatCurrency(soldPriceVal)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                                        <span className="text-gray-500 text-[11px]">Auction Status</span>
                                                        <span className="text-gray-400 font-semibold text-[11px]">
                                                            {player.status === "UNSOLD" ? "Passed" : "Awaiting Bids"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Action Footer */}
                                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => setViewingPlayerId(player.id)}
                                                className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                                                title="Quick View Details"
                                            >
                                                <Eye size={13} />
                                                <span>View</span>
                                            </button>

                                            <Link
                                                to={`/players/edit/${player.id}`}
                                                id={`edit-player-${player.id}`}
                                                className="p-2 rounded-xl bg-[#FDB913]/10 hover:bg-[#FDB913]/20 border border-[#FDB913]/20 text-[#FDB913] hover:text-white transition"
                                                title="Edit Player"
                                            >
                                                <Edit size={13} />
                                            </Link>

                                            <button
                                                onClick={() => openDeleteModal(player)}
                                                id={`delete-player-${player.id}`}
                                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition"
                                                title="Delete Player"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ── TABLE VIEW ── */
                        <div className="bg-[#080E27] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse min-w-[850px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-[#050B1A]/70 text-gray-400">
                                            <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest">
                                                Player
                                            </th>
                                            <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest">
                                                Role
                                            </th>
                                            <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest">
                                                Tournament
                                            </th>
                                            <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest">
                                                Base Price
                                            </th>
                                            <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest">
                                                Status
                                            </th>
                                            <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest">
                                                Purchased By
                                            </th>
                                            <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest">
                                                Sold Price
                                            </th>
                                            <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedPlayers.map((player) => {
                                            const isSold = player.status === "SOLD" || !!player.soldRecord;
                                            const soldPriceVal = player.soldRecord?.price || 0;
                                            const soldTeamName = player.soldRecord?.team?.name || "Unknown Team";

                                            return (
                                                <tr
                                                    key={player.id}
                                                    className="group hover:bg-white/[0.02] transition-colors duration-150"
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <PlayerAvatar name={player.name} role={player.role} size="sm" />
                                                            <div>
                                                                <p className="font-bold text-white text-[13px] group-hover:text-[#FDB913] transition-colors">
                                                                    {player.name}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                                    ID: {player.id?.slice(0, 8)}…
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <RoleBadge role={player.role} />
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        {player.tournament?.name ? (
                                                            <Link
                                                                to={`/tournaments/${player.tournament.id}`}
                                                                className="inline-flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 border border-white/10 hover:border-[#FDB913]/30 hover:text-white px-2.5 py-1 rounded-lg transition max-w-[170px] truncate"
                                                            >
                                                                <Trophy size={11} className="text-[#FDB913] shrink-0" />
                                                                <span className="truncate">{player.tournament.name}</span>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-gray-600 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-semibold text-gray-200">
                                                        {formatCurrency(player.basePrice)}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <StatusBadge status={isSold ? "SOLD" : player.status || "PENDING"} />
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        {isSold ? (
                                                            <span
                                                                className="text-white font-semibold truncate max-w-[130px] block"
                                                                title={soldTeamName}
                                                            >
                                                                {soldTeamName}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        {isSold ? (
                                                            <span className="text-emerald-400 font-black">
                                                                {formatCurrency(soldPriceVal)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => setViewingPlayerId(player.id)}
                                                                className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition"
                                                                title="View Details"
                                                            >
                                                                <Eye size={13} />
                                                            </button>
                                                            <Link
                                                                to={`/players/edit/${player.id}`}
                                                                id={`edit-player-${player.id}`}
                                                                className="p-1.5 rounded-lg border border-[#FDB913]/20 bg-[#FDB913]/5 text-[#FDB913] hover:bg-[#FDB913]/15 transition"
                                                                title="Edit Player"
                                                            >
                                                                <Edit size={13} />
                                                            </Link>
                                                            <button
                                                                id={`delete-player-${player.id}`}
                                                                onClick={() => openDeleteModal(player)}
                                                                className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition"
                                                                title="Delete Player"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Pagination Controls ── */}
                    {!loading && filtered.length > 0 && totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <p className="text-xs text-gray-400 order-2 sm:order-1">
                                Showing{" "}
                                <span className="text-white font-bold">
                                    {pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}
                                </span>{" "}
                                to{" "}
                                <span className="text-white font-bold">
                                    {pageSize === -1 ? filtered.length : Math.min(currentPage * pageSize, filtered.length)}
                                </span>{" "}
                                of <span className="text-white font-bold">{filtered.length}</span> filtered players
                            </p>

                            <div className="flex items-center gap-1.5 order-1 sm:order-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    title="Previous Page"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Only show close pages if many pages
                                    if (
                                        totalPages > 7 &&
                                        pageNum !== 1 &&
                                        pageNum !== totalPages &&
                                        Math.abs(pageNum - currentPage) > 1
                                    ) {
                                        if (pageNum === 2 || pageNum === totalPages - 1) {
                                            return (
                                                <span key={pageNum} className="px-1 text-gray-600 text-xs">
                                                    …
                                                </span>
                                            );
                                        }
                                        return null;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-xl text-xs font-bold transition ${currentPage === pageNum
                                                    ? "bg-[#FDB913] text-black shadow-md shadow-yellow-500/20"
                                                    : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    title="Next Page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Quick Player Details Modal ── */}
            {viewingPlayerId && (
                <PlayerDetailsModal
                    playerId={viewingPlayerId}
                    onClose={() => setViewingPlayerId(null)}
                />
            )}

            {/* ── Select Tournament Modal for Bulk Import ── */}
            {selectTournamentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0F1B3D] border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-black/80">
                        {/* Top gold bar */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FDB913] to-amber-600 rounded-t-3xl" />

                        {/* Close button */}
                        <button
                            onClick={() => setSelectTournamentModalOpen(false)}
                            className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition"
                        >
                            <X size={18} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#FDB913]/10 border border-[#FDB913]/25 flex items-center justify-center text-[#FDB913] shrink-0 shadow-lg shadow-yellow-500/10">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-white text-lg">Select Tournament</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Choose tournament for bulk player import
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed mb-4">
                            All players from your Excel or CSV file will be registered and categorized under this tournament's player pool.
                        </p>

                        {/* Tournament Search if >= 4 tournaments */}
                        {tournaments.length >= 4 && (
                            <div className="relative mb-3">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={tournamentSearchQuery}
                                    onChange={(e) => setTournamentSearchQuery(e.target.value)}
                                    placeholder="Search tournament name..."
                                    className="w-full bg-[#050B1A] border border-white/10 focus:border-[#FDB913] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
                                />
                            </div>
                        )}

                        {/* Tournament list */}
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 my-2">
                            {tournaments
                                .filter((t) =>
                                    t.name?.toLowerCase().includes(tournamentSearchQuery.toLowerCase())
                                )
                                .map((t) => {
                                    const isSelected = chosenTournamentId === t.id;
                                    const playerCount = players.filter(
                                        (p) => p.tournamentId === t.id || p.tournament?.id === t.id
                                    ).length;

                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => setChosenTournamentId(t.id)}
                                            className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${isSelected
                                                    ? "bg-[#FDB913]/10 border-[#FDB913]/50 shadow-md shadow-yellow-500/10"
                                                    : "bg-[#080E27] border-white/5 hover:border-white/15 hover:bg-white/[0.03]"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${isSelected
                                                            ? "bg-[#FDB913] text-black border-[#FDB913]"
                                                            : "bg-white/5 text-gray-400 border-white/10"
                                                        }`}
                                                >
                                                    <Trophy size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4
                                                        className={`font-bold text-sm truncate ${isSelected ? "text-[#FDB913]" : "text-white"
                                                            }`}
                                                    >
                                                        {t.name}
                                                    </h4>
                                                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                        {playerCount} {playerCount === 1 ? "player" : "players"} currently in pool
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                        ? "border-[#FDB913] bg-[#FDB913] text-black"
                                                        : "border-gray-600 bg-transparent"
                                                    }`}
                                            >
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
                            <button
                                onClick={() => setSelectTournamentModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmTournamentForBulk}
                                disabled={!chosenTournamentId}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#FDB913] hover:bg-[#e0a20f] disabled:opacity-40 text-black transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-1.5"
                            >
                                <span>Continue to Upload</span>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bulk Player Upload Modal ── */}
            {bulkModalOpen && (
                <BulkPlayerUploadModal
                    isOpen={bulkModalOpen}
                    onClose={() => setBulkModalOpen(false)}
                    tournamentId={selectedTournamentForBulk || tournaments[0]?.id}
                    tournamentName={
                        tournaments.find((t) => t.id === (selectedTournamentForBulk || tournaments[0]?.id))?.name ||
                        "Tournament"
                    }
                    onSuccess={() => {
                        loadData(true);
                    }}
                />
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-black/80">
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
                            All associated bids and tournament registration records will also be permanently removed.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setPlayerToDelete(null);
                                }}
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
