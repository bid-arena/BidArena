import React, { useEffect, useState, useMemo, useRef } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import {
    Trophy,
    MapPin,
    Calendar,
    Coins,
    Users,
    Edit,
    Trash2,
    Eye,
    Plus,
    Search,
    AlertCircle,
    ChevronDown,
    RefreshCw,
    SlidersHorizontal,
    LayoutGrid,
    List,
    Check,
    ArrowUpDown,
    RotateCcw,
    X,
    Sparkles,
    Shield,
    Activity
} from "lucide-react";
import { getTournaments, deleteTournament } from "../../services/tournamentService";
import { toast } from "react-hot-toast";

/* ─── Format Currency / Points Helper ─────────────────────── */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0) + " Pts";
};

/* ─── Format Date Helper ──────────────────────────────────── */
const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
};

/* ─── Tournament Status Helper ────────────────────────────── */
const getTournamentStatus = (dateString) => {
    if (!dateString) return "DRAFT";
    const tournamentDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tournamentDate.setHours(0, 0, 0, 0);

    if (tournamentDate.getTime() === today.getTime()) {
        return "ONGOING";
    } else if (tournamentDate.getTime() > today.getTime()) {
        return "UPCOMING";
    } else {
        return "COMPLETED";
    }
};

const getStatusBadge = (status) => {
    switch (status) {
        case "UPCOMING":
            return {
                label: "Upcoming",
                color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                dot: "bg-blue-400"
            };
        case "ONGOING":
            return {
                label: "Live Today",
                color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10",
                dot: "bg-emerald-400 animate-ping"
            };
        case "COMPLETED":
            return {
                label: "Concluded",
                color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
                dot: "bg-gray-400"
            };
        case "DRAFT":
        default:
            return {
                label: "Draft",
                color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                dot: "bg-amber-400"
            };
    }
};

/* ─── Custom Glassmorphic Dropdown Component ──────────────── */
const CustomDropdown = ({
    id,
    label,
    icon: Icon,
    value,
    onChange,
    options,
    minWidth = "w-56",
    align = "left",
}) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
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

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={ref} className="relative inline-block text-left">
            <button
                type="button"
                id={id}
                onClick={() => {
                    setOpen((prev) => !prev);
                    setSearchTerm("");
                }}
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
                <span className="font-bold text-white truncate max-w-[130px] sm:max-w-[170px]">
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
                    } mt-2 ${minWidth} max-h-80 overflow-y-auto bg-[#0A122C]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1`}
                >
                    {options.length >= 5 && (
                        <div className="relative mb-1.5 px-1 pt-1">
                            <Search
                                size={12}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter..."
                                className="w-full bg-[#050B1A] border border-white/10 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#FDB913]"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                No matching options
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
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
                                                <Check
                                                    size={13}
                                                    className="text-[#FDB913] shrink-0"
                                                    strokeWidth={2.5}
                                                />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════ */
const TournamentsPage = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search, Filter, Sort States
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [sortBy, setSortBy] = useState("date-asc");
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    // Deletion Modal States
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tournamentToDelete, setTournamentToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await getTournaments();
            setTournaments(data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tournaments");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async () => {
        if (!tournamentToDelete) return;
        setDeleting(true);
        try {
            await deleteTournament(tournamentToDelete.id);
            toast.success(`"${tournamentToDelete.name}" deleted successfully!`);
            setTournaments((prev) => prev.filter((t) => t.id !== tournamentToDelete.id));
            setDeleteModalOpen(false);
            setTournamentToDelete(null);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete tournament");
        } finally {
            setDeleting(false);
        }
    };

    // Calculate dynamic stats
    const stats = useMemo(() => {
        const total = tournaments.length;
        let upcoming = 0;
        let ongoing = 0;
        let completed = 0;
        let draft = 0;
        let totalPurse = 0;

        tournaments.forEach((t) => {
            const status = getTournamentStatus(t.date);
            if (status === "UPCOMING") upcoming++;
            else if (status === "ONGOING") ongoing++;
            else if (status === "COMPLETED") completed++;
            else if (status === "DRAFT") draft++;

            totalPurse += t.purseAmount || 0;
        });

        return { total, upcoming, ongoing, completed, draft, totalPurse };
    }, [tournaments]);

    // Status Filter Options with counts
    const statusOptions = useMemo(() => [
        { value: "ALL", label: "All Seasons", count: tournaments.length, icon: Trophy },
        { value: "UPCOMING", label: "Upcoming", count: stats.upcoming, icon: Calendar },
        { value: "ONGOING", label: "Live Today", count: stats.ongoing, icon: Activity },
        { value: "COMPLETED", label: "Concluded", count: stats.completed, icon: Check },
        { value: "DRAFT", label: "Draft / Unscheduled", count: stats.draft, icon: Sparkles },
    ], [tournaments, stats]);

    // Sort Options
    const sortOptions = [
        { value: "date-asc", label: "Event Date (Soonest first)", icon: Calendar },
        { value: "date-desc", label: "Event Date (Latest first)", icon: Calendar },
        { value: "name-asc", label: "Tournament Name (A → Z)", icon: ArrowUpDown },
        { value: "name-desc", label: "Tournament Name (Z → A)", icon: ArrowUpDown },
        { value: "purse-desc", label: "Points Purse (High → Low)", icon: Coins },
        { value: "purse-asc", label: "Points Purse (Low → High)", icon: Coins },
    ];

    // Page size options
    const pageSizeOptions = [
        { value: "6", label: "6 per page" },
        { value: "9", label: "9 per page" },
        { value: "18", label: "18 per page" },
        { value: "36", label: "36 per page" },
    ];

    // Processed Tournaments: Search, Filter, Sort
    const processedTournaments = useMemo(() => {
        let result = [...tournaments];

        // Search filter (name, location)
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(
                (t) =>
                    (t.name && t.name.toLowerCase().includes(query)) ||
                    (t.location && t.location.toLowerCase().includes(query))
            );
        }

        // Status filter
        if (filterStatus !== "ALL") {
            result = result.filter((t) => getTournamentStatus(t.date) === filterStatus);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (sortBy === "name-desc") {
                return (b.name || "").localeCompare(a.name || "");
            }
            if (sortBy === "purse-desc") {
                return (b.purseAmount || 0) - (a.purseAmount || 0);
            }
            if (sortBy === "purse-asc") {
                return (a.purseAmount || 0) - (b.purseAmount || 0);
            }

            // Dates handling (missing dates go to end)
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;

            if (sortBy === "date-asc") {
                if (dateA === 0) return 1;
                if (dateB === 0) return -1;
                return dateA - dateB;
            }
            if (sortBy === "date-desc") {
                return dateB - dateA;
            }
            return 0;
        });

        return result;
    }, [tournaments, searchQuery, filterStatus, sortBy]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, sortBy, pageSize]);

    // Pagination Slicing
    const totalItems = processedTournaments.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedTournaments = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedTournaments.slice(start, start + pageSize);
    }, [processedTournaments, currentPage, pageSize]);

    const activeFiltersCount =
        (searchQuery.trim() ? 1 : 0) + (filterStatus !== "ALL" ? 1 : 0);

    const handleResetFilters = () => {
        setSearchQuery("");
        setFilterStatus("ALL");
        setSortBy("date-asc");
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white selection:bg-[#FDB913] selection:text-black">
            <Sidebar />

            <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 w-full overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                    {/* ── HEADER ── */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/25 flex items-center gap-1.5">
                                    <Trophy size={12} /> COMPETITION ARENA
                                </span>
                                <span className="text-gray-500 text-xs">•</span>
                                <span className="text-xs text-gray-400 font-mono">
                                    {tournaments.length} {tournaments.length === 1 ? "Season" : "Seasons"} Registered
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                                Tournament Hub
                            </h1>
                            <p className="text-gray-400 text-xs sm:text-sm">
                                Create, monitor, and coordinate your league seasons and live bidding arenas.
                            </p>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Refresh Button */}
                            <button
                                type="button"
                                onClick={() => loadData(true)}
                                disabled={refreshing || loading}
                                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer disabled:opacity-50"
                                title="Refresh Tournaments"
                            >
                                <RefreshCw size={16} className={refreshing ? "animate-spin text-[#FDB913]" : ""} />
                            </button>

                            {/* View Switcher: Grid vs Table */}
                            <div className="inline-flex items-center p-1 rounded-xl bg-[#080E27] border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                        viewMode === "grid"
                                            ? "bg-[#FDB913] text-black shadow-md font-bold"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                    title="Card Grid View"
                                >
                                    <LayoutGrid size={15} />
                                    <span className="hidden sm:inline">Grid</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("table")}
                                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                        viewMode === "table"
                                            ? "bg-[#FDB913] text-black shadow-md font-bold"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                    title="Data Table View"
                                >
                                    <List size={15} />
                                    <span className="hidden sm:inline">Table</span>
                                </button>
                            </div>

                            {/* Add Tournament CTA */}
                            <Link
                                to="/tournaments/add"
                                id="add-tournament-btn"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDB913] to-amber-500 hover:from-[#f5b30c] hover:to-amber-600 text-black px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-yellow-500/20 active:scale-95 cursor-pointer"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span>Add Tournament</span>
                            </Link>
                        </div>
                    </div>

                    {/* ── KPI METRICS CARDS ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                        {/* TOTAL SEASONS */}
                        <div
                            onClick={() => setFilterStatus("ALL")}
                            className={`bg-[#080E27] border p-4 sm:p-5 rounded-2xl relative overflow-hidden transition shadow-xl cursor-pointer ${
                                filterStatus === "ALL"
                                    ? "border-[#FDB913]/60 ring-1 ring-[#FDB913]/30"
                                    : "border-white/10 hover:border-white/20"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Total Seasons
                                </span>
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Trophy size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                                    {stats.total}
                                </h3>
                                <p className="text-[11px] text-gray-500 truncate">Registered leagues</p>
                            </div>
                        </div>

                        {/* UPCOMING */}
                        <div
                            onClick={() => setFilterStatus("UPCOMING")}
                            className={`bg-[#080E27] border p-4 sm:p-5 rounded-2xl relative overflow-hidden transition shadow-xl cursor-pointer ${
                                filterStatus === "UPCOMING"
                                    ? "border-blue-500/60 ring-1 ring-blue-500/30"
                                    : "border-white/10 hover:border-white/20"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Upcoming
                                </span>
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Calendar size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-400">
                                    {stats.upcoming}
                                </h3>
                                <p className="text-[11px] text-gray-500 truncate">Starting soon</p>
                            </div>
                        </div>

                        {/* LIVE ONGOING */}
                        <div
                            onClick={() => setFilterStatus("ONGOING")}
                            className={`bg-[#080E27] border p-4 sm:p-5 rounded-2xl relative overflow-hidden transition shadow-xl cursor-pointer ${
                                filterStatus === "ONGOING"
                                    ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
                                    : "border-white/10 hover:border-white/20"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Live Today
                                </span>
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Activity size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400 flex items-center gap-2">
                                    {stats.ongoing}
                                    {stats.ongoing > 0 && (
                                        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                                    )}
                                </h3>
                                <p className="text-[11px] text-gray-500 truncate">Active auction days</p>
                            </div>
                        </div>

                        {/* TOTAL PRIZE PURSE */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Combined Purse
                                </span>
                                <div className="p-2 rounded-xl bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/20">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#FDB913] truncate">
                                    {formatCurrency(stats.totalPurse)}
                                </h3>
                                <p className="text-[11px] text-gray-500 truncate">Total points budget</p>
                            </div>
                        </div>
                    </div>

                    {/* ── SEARCH & FILTERS CONTROLS BAR ── */}
                    <div className="bg-[#080E27] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                            {/* Live Search Input */}
                            <div className="relative flex-1">
                                <Search
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                                <input
                                    id="tournament-search"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by tournament name, venue, or city..."
                                    className="w-full bg-[#050B1A] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/20 transition"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Custom Dropdown Filters */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Status Custom Dropdown */}
                                <CustomDropdown
                                    id="status-filter"
                                    icon={Activity}
                                    label="Status:"
                                    value={filterStatus}
                                    onChange={setFilterStatus}
                                    options={statusOptions}
                                    minWidth="w-56"
                                />

                                {/* Sort Order Custom Dropdown */}
                                <CustomDropdown
                                    id="sort-by"
                                    icon={ArrowUpDown}
                                    label="Sort:"
                                    value={sortBy}
                                    onChange={setSortBy}
                                    options={sortOptions}
                                    minWidth="w-64"
                                    align="right"
                                />

                                {/* Reset Filter Button */}
                                {activeFiltersCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                                        title="Reset active filters"
                                    >
                                        <RotateCcw size={13} />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Filter Chips Bar */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-1 border-t border-white/5 gap-2">
                            <div className="flex items-center gap-2">
                                <span>
                                    Showing <strong className="text-white">{processedTournaments.length}</strong> of{" "}
                                    <strong className="text-white">{tournaments.length}</strong> tournaments
                                </span>
                                {filterStatus !== "ALL" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDB913]/10 text-[#FDB913] text-[10px] font-bold border border-[#FDB913]/20">
                                        Status: {filterStatus}
                                        <button
                                            type="button"
                                            onClick={() => setFilterStatus("ALL")}
                                            className="hover:text-white ml-0.5"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                )}
                            </div>

                            {/* Page size selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-500">Per page:</span>
                                <div className="inline-flex rounded-lg bg-[#050B1A] p-0.5 border border-white/10">
                                    {pageSizeOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setPageSize(Number(opt.value))}
                                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition ${
                                                pageSize === Number(opt.value)
                                                    ? "bg-[#FDB913] text-black font-bold shadow-sm"
                                                    : "text-gray-400 hover:text-white"
                                            }`}
                                        >
                                            {opt.value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── LOADING SKELETON ── */}
                    {loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-[#080E27] border border-white/10 rounded-2xl p-6 space-y-4 animate-pulse"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-white/10 rounded w-3/4" />
                                            <div className="h-3 bg-white/5 rounded w-1/2" />
                                        </div>
                                    </div>
                                    <div className="h-16 bg-white/5 rounded-xl" />
                                    <div className="h-9 bg-white/5 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── EMPTY STATE ── */}
                    {!loading && processedTournaments.length === 0 && (
                        <div className="bg-[#080E27] border border-white/10 rounded-3xl p-10 sm:p-16 text-center space-y-4 shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-[#FDB913]/10 border border-[#FDB913]/20 text-[#FDB913] flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/10">
                                <Trophy size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-white">No Tournaments Found</h3>
                                <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
                                    {tournaments.length === 0
                                        ? "There are no tournaments created yet. Launch your first tournament season to start drafting players."
                                        : "No tournaments match your current search and filter criteria. Try clearing or adjusting filters."}
                                </p>
                            </div>
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                                {tournaments.length === 0 ? (
                                    <Link
                                        to="/tournaments/add"
                                        className="inline-flex items-center gap-2 bg-[#FDB913] hover:bg-[#FDB913]/90 text-black px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-yellow-500/20 transition active:scale-95"
                                    >
                                        <Plus size={16} />
                                        <span>Create First Tournament</span>
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95"
                                    >
                                        <RotateCcw size={15} />
                                        <span>Reset Filters</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── GRID VIEW ── */}
                    {!loading && processedTournaments.length > 0 && viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                            {paginatedTournaments.map((t) => {
                                const status = getTournamentStatus(t.date);
                                const badge = getStatusBadge(status);
                                const totalTeams = t.maxTeams || 0;
                                const registeredCount = t.teams?.length || 0;
                                const progress = totalTeams ? Math.min(100, (registeredCount / totalTeams) * 100) : 100;

                                return (
                                    <div
                                        key={t.id}
                                        className="bg-[#080E27] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between hover:border-[#FDB913]/40 transition-all duration-300 group relative overflow-hidden"
                                    >
                                        {/* Subtle top ambient glow */}
                                        <div className="absolute top-0 right-0 w-36 h-36 bg-[#FDB913]/5 rounded-full blur-2xl group-hover:bg-[#FDB913]/10 transition-colors pointer-events-none" />

                                        <div>
                                            {/* Header Info */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDB913]/20 to-amber-600/10 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shadow-lg shadow-yellow-500/10 shrink-0">
                                                        <Trophy size={20} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-black text-base sm:text-lg text-white group-hover:text-[#FDB913] transition line-clamp-1">
                                                            <Link to={`/tournaments/${t.id}`}>{t.name}</Link>
                                                        </h3>
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-bold border ${badge.color}`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details Info List */}
                                            <div className="space-y-2.5 text-xs text-gray-400 mt-5 bg-[#050B1A] p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-gray-400">
                                                        <MapPin size={13} className="text-blue-400 shrink-0" /> Venue:
                                                    </span>
                                                    <span className="font-semibold text-gray-200 truncate max-w-[170px]">
                                                        {t.location || "Online / TBD"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-gray-400">
                                                        <Calendar size={13} className="text-amber-400 shrink-0" /> Date:
                                                    </span>
                                                    <span className="font-semibold text-gray-200">
                                                        {formatDate(t.date)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                                    <span className="flex items-center gap-1.5 text-gray-400">
                                                        <Coins size={13} className="text-[#FDB913] shrink-0" /> Points Purse:
                                                    </span>
                                                    <span className="font-black text-sm text-emerald-400">
                                                        {formatCurrency(t.purseAmount)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Team Slot Capacity */}
                                            <div className="mt-4 space-y-1.5">
                                                <div className="flex justify-between text-[11px] text-gray-400">
                                                    <span>Franchise Slots</span>
                                                    <span className="font-bold text-white">
                                                        {registeredCount} / {totalTeams || "∞"} Filled
                                                    </span>
                                                </div>
                                                <div className="w-full bg-[#050B1A] rounded-full h-2 overflow-hidden border border-white/5">
                                                    <div
                                                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-[#FDB913] transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-5">
                                            <Link
                                                to={`/tournaments/${t.id}`}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
                                            >
                                                <Eye size={14} />
                                                <span>View League</span>
                                            </Link>
                                            <Link
                                                to={`/tournaments/edit/${t.id}`}
                                                className="inline-flex items-center justify-center p-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/40 text-[#FDB913] rounded-xl transition active:scale-95"
                                                title="Edit Tournament"
                                            >
                                                <Edit size={14} />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTournamentToDelete(t);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="inline-flex items-center justify-center p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl transition active:scale-95 cursor-pointer"
                                                title="Delete Tournament"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── TABLE VIEW ── */}
                    {!loading && processedTournaments.length > 0 && viewMode === "table" && (
                        <div className="bg-[#080E27] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-[#050B1A]/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="py-4 px-4 sm:px-6">Tournament</th>
                                            <th className="py-4 px-4">Status</th>
                                            <th className="py-4 px-4">Date</th>
                                            <th className="py-4 px-4">Venue</th>
                                            <th className="py-4 px-4">Points Purse</th>
                                            <th className="py-4 px-4 min-w-[130px]">Team Slots</th>
                                            <th className="py-4 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                                        {paginatedTournaments.map((t) => {
                                            const status = getTournamentStatus(t.date);
                                            const badge = getStatusBadge(status);
                                            const totalTeams = t.maxTeams || 0;
                                            const registeredCount = t.teams?.length || 0;
                                            const progress = totalTeams ? Math.min(100, (registeredCount / totalTeams) * 100) : 100;

                                            return (
                                                <tr
                                                    key={t.id}
                                                    className="hover:bg-white/[0.02] transition-colors group"
                                                >
                                                    {/* Tournament */}
                                                    <td className="py-3.5 px-4 sm:px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center text-[#FDB913] shrink-0">
                                                                <Trophy size={16} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <Link
                                                                    to={`/tournaments/${t.id}`}
                                                                    className="font-bold text-white group-hover:text-[#FDB913] transition hover:underline line-clamp-1"
                                                                >
                                                                    {t.name}
                                                                </Link>
                                                                <span className="text-[10px] text-gray-500 font-mono">
                                                                    ID: #{String(t.id).slice(-4)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-3.5 px-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                            {badge.label}
                                                        </span>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="py-3.5 px-4 font-mono text-gray-300">
                                                        {formatDate(t.date)}
                                                    </td>

                                                    {/* Venue */}
                                                    <td className="py-3.5 px-4 text-gray-300 truncate max-w-[150px]">
                                                        {t.location || "Online"}
                                                    </td>

                                                    {/* Points Purse */}
                                                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                                                        {formatCurrency(t.purseAmount)}
                                                    </td>

                                                    {/* Slots */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-center text-[10px] font-mono">
                                                                <span className="text-gray-400">
                                                                    {registeredCount} / {totalTeams || "∞"}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-[#050B1A] rounded-full h-1.5 overflow-hidden border border-white/5">
                                                                <div
                                                                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-[#FDB913]"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <Link
                                                                to={`/tournaments/${t.id}`}
                                                                className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                                                                title="View Details"
                                                            >
                                                                <Eye size={13} />
                                                            </Link>
                                                            <Link
                                                                to={`/tournaments/edit/${t.id}`}
                                                                className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FDB913] border border-yellow-500/20 transition"
                                                                title="Edit Details"
                                                            >
                                                                <Edit size={13} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setTournamentToDelete(t);
                                                                    setDeleteModalOpen(true);
                                                                }}
                                                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                                                                title="Delete Tournament"
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

                    {/* ── PAGINATION CONTROLS ── */}
                    {!loading && totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                            <span className="text-xs text-gray-400">
                                Page <strong className="text-white">{currentPage}</strong> of{" "}
                                <strong className="text-white">{totalPages}</strong> ({totalItems} total tournaments)
                            </span>

                            <div className="inline-flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#080E27] text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    Previous
                                </button>

                                {[...Array(totalPages)].map((_, idx) => {
                                    const pageNum = idx + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        Math.abs(pageNum - currentPage) <= 1
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                type="button"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                                                    currentPage === pageNum
                                                        ? "bg-[#FDB913] text-black shadow-md shadow-yellow-500/20 font-black"
                                                        : "border border-white/10 bg-[#080E27] text-gray-400 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                        return (
                                            <span key={pageNum} className="text-gray-500 text-xs px-1">
                                                …
                                            </span>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#080E27] text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ── DELETE SAFETY CONFIRMATION MODAL ── */}
            {deleteModalOpen && tournamentToDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#080E27] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Red Accent Line */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />

                        <div className="flex items-center gap-3 text-red-400">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Delete Tournament Season?</h3>
                                <p className="text-xs text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs sm:text-sm text-gray-300">
                            <div className="p-3.5 rounded-2xl bg-[#050B1A] border border-white/10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center text-[#FDB913] shrink-0 font-black">
                                    <Trophy size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white truncate">{tournamentToDelete.name}</h4>
                                    <p className="text-xs text-gray-400 truncate">
                                        Venue: {tournamentToDelete.location || "Online"} • Date: {formatDate(tournamentToDelete.date)}
                                    </p>
                                </div>
                            </div>

                            <p className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-300 text-xs flex gap-2.5 leading-relaxed">
                                <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
                                <span>
                                    <strong>WARNING:</strong> Deleting this tournament will remove all affiliated teams, player allocations, and live bidding records permanently.
                                </span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setTournamentToDelete(null);
                                }}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-bold transition text-xs sm:text-sm text-gray-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-xl font-bold transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {deleting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        </div>
    );
};

export default TournamentsPage;
