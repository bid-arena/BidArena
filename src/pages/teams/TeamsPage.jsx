import React, { useEffect, useState, useMemo, useRef } from "react";
import { getTeams, deleteTeam } from "../../services/teamService";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import {
    Users,
    Trophy,
    Coins,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Plus,
    User,
    AlertTriangle,
    RotateCcw,
    LayoutGrid,
    List,
    RefreshCw,
    ChevronDown,
    Check,
    ArrowUpDown,
    SlidersHorizontal,
    TrendingUp,
    Shield,
    Sparkles,
    X,
    Wallet
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

/* ─── Format Currency / Points Helper ─────────────────────── */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0) + " Pts";
};

/* ─── Dynamic Team Avatar Helper ──────────────────────────── */
const getTeamAvatarStyle = (name) => {
    const hue = ((name?.charCodeAt(0) || 65) * 47) % 360;
    return {
        background: `linear-gradient(135deg, hsl(${hue}, 85%, 60%), hsl(${(hue + 45) % 360}, 90%, 45%))`,
    };
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
                    {/* Search inside dropdown if there are 5+ options */}
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
                                placeholder="Filter options..."
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
const TeamsPage = () => {
    const [teams, setTeams] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters and controls
    const [search, setSearch] = useState("");
    const [selectedTournament, setSelectedTournament] = useState("ALL");
    const [sortBy, setSortBy] = useState("name-asc");
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    // Delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    /* Fetch teams and tournament registry */
    const loadData = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [teamsData, tournamentsRes] = await Promise.all([
                getTeams(),
                api.get("/tournaments/organizer").catch(() => ({ data: { data: [] } })),
            ]);

            setTeams(teamsData || []);
            setTournaments(tournamentsRes.data?.data || []);
        } catch (error) {
            console.error("Teams fetch error:", error);
            toast.error("Failed to load teams registry.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openDeleteModal = (team) => {
        setTeamToDelete(team);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!teamToDelete) return;
        setDeleting(true);
        try {
            await deleteTeam(teamToDelete.id);
            setTeams((prev) => prev.filter((team) => team.id !== teamToDelete.id));
            toast.success(`"${teamToDelete.name}" deleted successfully!`);
        } catch (error) {
            console.error("Delete team error:", error);
            toast.error(error.response?.data?.message || "Failed to delete team.");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
            setTeamToDelete(null);
        }
    };

    /* Build tournament filter options with team counts */
    const tournamentOptions = useMemo(() => {
        const counts = {};
        teams.forEach((t) => {
            const tId = t.tournament?.id || t.tournamentId;
            if (tId) counts[tId] = (counts[tId] || 0) + 1;
        });

        // Combined unique tournaments
        const list = [{ value: "ALL", label: "All Tournaments", count: teams.length, icon: Trophy }];

        // Prioritize loaded tournaments
        const seenIds = new Set();
        tournaments.forEach((t) => {
            seenIds.add(t.id);
            list.push({
                value: String(t.id),
                label: t.name,
                count: counts[t.id] || 0,
                icon: Trophy,
            });
        });

        // Check if teams have tournaments not in organizer list
        teams.forEach((tm) => {
            const tid = tm.tournament?.id;
            if (tid && !seenIds.has(tid)) {
                seenIds.add(tid);
                list.push({
                    value: String(tid),
                    label: tm.tournament.name,
                    count: counts[tid] || 0,
                    icon: Trophy,
                });
            }
        });

        return list;
    }, [teams, tournaments]);

    /* Sort options */
    const sortOptions = [
        { value: "name-asc", label: "Team Name (A → Z)", icon: ArrowUpDown },
        { value: "name-desc", label: "Team Name (Z → A)", icon: ArrowUpDown },
        { value: "purse-desc", label: "Starting Purse (High → Low)", icon: Coins },
        { value: "purse-asc", label: "Starting Purse (Low → High)", icon: Coins },
        { value: "remaining-desc", label: "Remaining Points (High → Low)", icon: TrendingUp },
        { value: "spent-desc", label: "Purse Burn Rate (% Spent)", icon: TrendingUp },
    ];

    /* Page size options */
    const pageSizeOptions = [
        { value: "6", label: "6 per page" },
        { value: "9", label: "9 per page" },
        { value: "18", label: "18 per page" },
        { value: "36", label: "36 per page" },
    ];

    /* Filter & Sort logic */
    const filteredAndSortedTeams = useMemo(() => {
        let list = [...teams];

        // Search filter (team name, owner name, tournament name)
        if (search.trim()) {
            const query = search.trim().toLowerCase();
            list = list.filter((team) => {
                const nameMatch = team.name?.toLowerCase().includes(query);
                const ownerMatch = team.ownerName?.toLowerCase().includes(query);
                const tournamentMatch = team.tournament?.name?.toLowerCase().includes(query);
                return nameMatch || ownerMatch || tournamentMatch;
            });
        }

        // Tournament filter
        if (selectedTournament !== "ALL") {
            list = list.filter((team) => {
                const tid = team.tournament?.id || team.tournamentId;
                return String(tid) === String(selectedTournament);
            });
        }

        // Sorting
        list.sort((a, b) => {
            const purseA = a.purseAmount || 0;
            const purseB = b.purseAmount || 0;
            const remA = a.remainingPurse || 0;
            const remB = b.remainingPurse || 0;

            const spentRatioA = purseA > 0 ? (purseA - remA) / purseA : 0;
            const spentRatioB = purseB > 0 ? (purseB - remB) / purseB : 0;

            switch (sortBy) {
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "name-desc":
                    return b.name.localeCompare(a.name);
                case "purse-desc":
                    return purseB - purseA;
                case "purse-asc":
                    return purseA - purseB;
                case "remaining-desc":
                    return remB - remA;
                case "spent-desc":
                    return spentRatioB - spentRatioA;
                default:
                    return 0;
            }
        });

        return list;
    }, [teams, search, selectedTournament, sortBy]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedTournament, sortBy, pageSize]);

    // Pagination slice
    const totalItems = filteredAndSortedTeams.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedTeams = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSortedTeams.slice(start, start + pageSize);
    }, [filteredAndSortedTeams, currentPage, pageSize]);

    /* KPI Stats Calculations */
    const totalPurse = useMemo(() => teams.reduce((a, b) => a + (b.purseAmount || 0), 0), [teams]);
    const totalRemaining = useMemo(() => teams.reduce((a, b) => a + (b.remainingPurse || 0), 0), [teams]);
    const totalSpent = totalPurse - totalRemaining;
    const overallBurnRate = totalPurse > 0 ? ((totalSpent / totalPurse) * 100).toFixed(0) : "0";

    const uniqueTournamentsCount = useMemo(() => {
        const s = new Set(teams.map((t) => t.tournament?.name || t.tournament?.id).filter(Boolean));
        return s.size;
    }, [teams]);

    const activeFiltersCount = (search.trim() ? 1 : 0) + (selectedTournament !== "ALL" ? 1 : 0);

    const handleResetFilters = () => {
        setSearch("");
        setSelectedTournament("ALL");
        setSortBy("name-asc");
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white selection:bg-[#FDB913] selection:text-black">
            <Sidebar />

            <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 w-full overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                    {/* ── TOP HEADER ── */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/25 flex items-center gap-1.5">
                                    <Shield size={12} /> FRANCHISE ROSTERS
                                </span>
                                <span className="text-gray-500 text-xs">•</span>
                                <span className="text-xs text-gray-400 font-mono">
                                    {teams.length} {teams.length === 1 ? "Team" : "Teams"} Enrolled
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                                Teams Management
                            </h1>
                            <p className="text-gray-400 text-xs sm:text-sm">
                                Register franchises, track live purse balance limits, and supervise league rosters.
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
                                title="Refresh Teams List"
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

                            {/* Register Team Button */}
                            <Link
                                to="/teams/add"
                                id="add-team-btn"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDB913] to-amber-500 hover:from-[#f5b30c] hover:to-amber-600 text-black px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-yellow-500/20 active:scale-95 cursor-pointer"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span>Add Team</span>
                            </Link>
                        </div>
                    </div>

                    {/* ── KPI METRICS CARDS ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                        {/* TOTAL TEAMS */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-[#FDB913]/30 transition shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Total Franchises
                                </span>
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Users size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                                    {teams.length}
                                </h3>
                                <p className="text-[11px] text-gray-500 truncate">
                                    Across all competitions
                                </p>
                            </div>
                        </div>

                        {/* ACTIVE TOURNAMENTS */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-[#FDB913]/30 transition shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Tournaments
                                </span>
                                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                    <Trophy size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                                    {uniqueTournamentsCount}
                                </h3>
                                <p className="text-[11px] text-gray-500 truncate">
                                    Host league pools
                                </p>
                            </div>
                        </div>

                        {/* TOTAL POINTS ALLOCATED */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-[#FDB913]/30 transition shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Allocated Purse
                                </span>
                                <div className="p-2 rounded-xl bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/20">
                                    <Coins size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white truncate">
                                    {formatCurrency(totalPurse)}
                                </h3>
                                <p className="text-[11px] text-gray-500 truncate">
                                    Total starting purse
                                </p>
                            </div>
                        </div>

                        {/* TOTAL POINTS REMAINING */}
                        <div className="bg-[#080E27] border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-[#FDB913]/30 transition shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Remaining Capital
                                </span>
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Wallet size={16} />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-emerald-400 truncate">
                                    {formatCurrency(totalRemaining)}
                                </h3>
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                                    <span>Burn rate:</span>
                                    <span className={`font-bold ${Number(overallBurnRate) >= 80 ? "text-red-400" : "text-amber-400"}`}>
                                        {overallBurnRate}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── SEARCH & FILTER CONTROLS BAR ── */}
                    <div className="bg-[#080E27] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                            {/* Live Search Input */}
                            <div className="relative flex-1">
                                <Search
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                                <input
                                    id="team-search"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by franchise name, owner, or tournament..."
                                    className="w-full bg-[#050B1A] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/20 transition"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Filters Group */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Tournament Filter Custom Dropdown */}
                                <CustomDropdown
                                    id="tournament-filter"
                                    icon={Trophy}
                                    label="Tournament:"
                                    value={selectedTournament}
                                    onChange={setSelectedTournament}
                                    options={tournamentOptions}
                                    minWidth="w-64"
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
                                    Showing <strong className="text-white">{filteredAndSortedTeams.length}</strong> of{" "}
                                    <strong className="text-white">{teams.length}</strong> teams
                                </span>
                                {selectedTournament !== "ALL" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDB913]/10 text-[#FDB913] text-[10px] font-bold border border-[#FDB913]/20">
                                        <Trophy size={10} />
                                        {tournamentOptions.find((o) => o.value === selectedTournament)?.label}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTournament("ALL")}
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
                                        <div className="w-14 h-14 rounded-2xl bg-white/5" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-white/10 rounded w-3/4" />
                                            <div className="h-3 bg-white/5 rounded w-1/2" />
                                        </div>
                                    </div>
                                    <div className="h-20 bg-white/5 rounded-xl" />
                                    <div className="h-9 bg-white/5 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── EMPTY STATE ── */}
                    {!loading && filteredAndSortedTeams.length === 0 && (
                        <div className="bg-[#080E27] border border-white/10 rounded-3xl p-10 sm:p-16 text-center space-y-4 shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-[#FDB913]/10 border border-[#FDB913]/20 text-[#FDB913] flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/10">
                                <Users size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-white">No Franchises Found</h3>
                                <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
                                    {teams.length === 0
                                        ? "There are no teams registered in the system yet. Register your first franchise to start assigning players."
                                        : "No franchises match your current search and filter criteria. Try clearing or relaxing the filters."}
                                </p>
                            </div>
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                                {teams.length === 0 ? (
                                    <Link
                                        to="/teams/add"
                                        className="inline-flex items-center gap-2 bg-[#FDB913] hover:bg-[#FDB913]/90 text-black px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-yellow-500/20 transition active:scale-95"
                                    >
                                        <Plus size={16} />
                                        <span>Register First Team</span>
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

                    {/* ── TEAMS GRID VIEW ── */}
                    {!loading && filteredAndSortedTeams.length > 0 && viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                            {paginatedTeams.map((team) => {
                                const startingPurse = team.purseAmount || 0;
                                const remainingPurse = team.remainingPurse || 0;
                                const spentPurse = Math.max(0, startingPurse - remainingPurse);
                                const spentPercent =
                                    startingPurse > 0 ? (spentPurse / startingPurse) * 100 : 0;

                                return (
                                    <div
                                        key={team.id}
                                        className="bg-[#080E27] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between hover:border-[#FDB913]/40 transition-all duration-300 group relative overflow-hidden"
                                    >
                                        {/* Subtle top ambient glow */}
                                        <div className="absolute top-0 right-0 w-36 h-36 bg-[#FDB913]/5 rounded-full blur-2xl group-hover:bg-[#FDB913]/10 transition-colors pointer-events-none" />

                                        <div>
                                            {/* Card Header: Logo, Name, Owner */}
                                            <div className="flex items-center gap-3.5 mb-4">
                                                {team.logo ? (
                                                    <img
                                                        src={team.logo}
                                                        alt={team.name}
                                                        className="w-14 h-14 rounded-2xl object-cover border border-white/15 shadow-xl shrink-0 bg-[#050B1A]"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-black font-black text-lg shadow-xl shrink-0 border border-white/20"
                                                        style={getTeamAvatarStyle(team.name)}
                                                    >
                                                        {team.name ? team.name.substring(0, 2).toUpperCase() : "TM"}
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-black text-base sm:text-lg text-white group-hover:text-[#FDB913] transition line-clamp-1">
                                                        {team.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                                                        <User size={12} className="text-gray-500 shrink-0" />
                                                        <span className="truncate">
                                                            Owner: <strong className="text-gray-300 font-semibold">{team.ownerName || "Unassigned"}</strong>
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Tournament Badge */}
                                            <div className="mb-4">
                                                {team.tournament ? (
                                                    <div className="inline-flex items-center gap-1.5 bg-[#050B1A] border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 max-w-full">
                                                        <Trophy size={12} className="text-[#FDB913] shrink-0" />
                                                        <span className="truncate font-semibold">{team.tournament.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-500">
                                                        <span>No Tournament</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Purse Breakdown Box */}
                                            <div className="space-y-3 mb-5 bg-[#050B1A] rounded-2xl p-4 border border-white/5">
                                                <div className="flex justify-between items-baseline text-xs">
                                                    <span className="text-gray-400 flex items-center gap-1">
                                                        <Wallet size={12} className="text-emerald-400" /> Remaining Points
                                                    </span>
                                                    <span className="font-black text-sm text-emerald-400">
                                                        {formatCurrency(remainingPurse)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-400 flex items-center gap-1">
                                                        <Coins size={12} className="text-[#FDB913]" /> Total Starting Purse
                                                    </span>
                                                    <span className="font-semibold text-gray-300">
                                                        {formatCurrency(startingPurse)}
                                                    </span>
                                                </div>

                                                {/* Purse Burn Progress Bar */}
                                                <div className="space-y-1.5 pt-1 border-t border-white/5">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="text-gray-400 font-bold uppercase tracking-wider">
                                                            Purse Spent ({formatCurrency(spentPurse)})
                                                        </span>
                                                        <span
                                                            className={`font-black font-mono ${
                                                                spentPercent >= 80
                                                                    ? "text-red-400"
                                                                    : spentPercent >= 50
                                                                    ? "text-amber-400"
                                                                    : "text-emerald-400"
                                                            }`}
                                                        >
                                                            {spentPercent.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-[#080E27] rounded-full h-2 overflow-hidden border border-white/5">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                                spentPercent >= 80
                                                                    ? "bg-gradient-to-r from-red-500 to-rose-600"
                                                                    : spentPercent >= 50
                                                                    ? "bg-gradient-to-r from-amber-400 to-[#FDB913]"
                                                                    : "bg-gradient-to-r from-emerald-500 to-teal-400"
                                                            }`}
                                                            style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Action Buttons */}
                                        <div className="flex items-center gap-2 border-t border-white/5 pt-4">
                                            <Link
                                                to={`/teams/${team.id}`}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
                                            >
                                                <Eye size={14} />
                                                <span>View Squad</span>
                                            </Link>
                                            <Link
                                                to={`/teams/edit/${team.id}`}
                                                className="inline-flex items-center justify-center p-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/40 text-[#FDB913] rounded-xl transition active:scale-95"
                                                title="Edit Team Details"
                                            >
                                                <Edit size={14} />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => openDeleteModal(team)}
                                                className="inline-flex items-center justify-center p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl transition active:scale-95 cursor-pointer"
                                                title="Delete Franchise"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── TEAMS TABLE VIEW ── */}
                    {!loading && filteredAndSortedTeams.length > 0 && viewMode === "table" && (
                        <div className="bg-[#080E27] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-[#050B1A]/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="py-4 px-4 sm:px-6">Franchise Team</th>
                                            <th className="py-4 px-4">Tournament</th>
                                            <th className="py-4 px-4">Owner</th>
                                            <th className="py-4 px-4">Total Purse</th>
                                            <th className="py-4 px-4">Remaining</th>
                                            <th className="py-4 px-4 min-w-[140px]">Utilization</th>
                                            <th className="py-4 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                                        {paginatedTeams.map((team) => {
                                            const startingPurse = team.purseAmount || 0;
                                            const remainingPurse = team.remainingPurse || 0;
                                            const spentPurse = Math.max(0, startingPurse - remainingPurse);
                                            const spentPercent =
                                                startingPurse > 0 ? (spentPurse / startingPurse) * 100 : 0;

                                            return (
                                                <tr
                                                    key={team.id}
                                                    className="hover:bg-white/[0.02] transition-colors group"
                                                >
                                                    {/* Franchise Team */}
                                                    <td className="py-3.5 px-4 sm:px-6">
                                                        <div className="flex items-center gap-3">
                                                            {team.logo ? (
                                                                <img
                                                                    src={team.logo}
                                                                    alt={team.name}
                                                                    className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0 bg-[#050B1A]"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black text-xs shadow shrink-0"
                                                                    style={getTeamAvatarStyle(team.name)}
                                                                >
                                                                    {team.name ? team.name.substring(0, 2).toUpperCase() : "TM"}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <Link
                                                                    to={`/teams/${team.id}`}
                                                                    className="font-bold text-white group-hover:text-[#FDB913] transition hover:underline line-clamp-1"
                                                                >
                                                                    {team.name}
                                                                </Link>
                                                                <span className="text-[10px] text-gray-500 font-mono">
                                                                    ID: #{String(team.id).slice(-4)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Tournament */}
                                                    <td className="py-3.5 px-4">
                                                        {team.tournament ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-gray-300 text-xs border border-white/5">
                                                                <Trophy size={12} className="text-[#FDB913] shrink-0" />
                                                                <span className="truncate max-w-[130px] font-semibold">
                                                                    {team.tournament.name}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs italic">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Owner */}
                                                    <td className="py-3.5 px-4 font-medium text-gray-300">
                                                        <div className="flex items-center gap-1.5">
                                                            <User size={13} className="text-gray-500 shrink-0" />
                                                            <span>{team.ownerName || "—"}</span>
                                                        </div>
                                                    </td>

                                                    {/* Total Purse */}
                                                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-300">
                                                        {formatCurrency(startingPurse)}
                                                    </td>

                                                    {/* Remaining */}
                                                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                                                        {formatCurrency(remainingPurse)}
                                                    </td>

                                                    {/* Utilization */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-center text-[10px] font-mono">
                                                                <span className="text-gray-400">
                                                                    {spentPercent.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-[#050B1A] rounded-full h-1.5 overflow-hidden border border-white/5">
                                                                <div
                                                                    className={`h-1.5 rounded-full ${
                                                                        spentPercent >= 80
                                                                            ? "bg-red-500"
                                                                            : spentPercent >= 50
                                                                            ? "bg-amber-400"
                                                                            : "bg-emerald-400"
                                                                    }`}
                                                                    style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <Link
                                                                to={`/teams/${team.id}`}
                                                                className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                                                                title="View Team Squad"
                                                            >
                                                                <Eye size={13} />
                                                            </Link>
                                                            <Link
                                                                to={`/teams/edit/${team.id}`}
                                                                className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FDB913] border border-yellow-500/20 transition"
                                                                title="Edit Details"
                                                            >
                                                                <Edit size={13} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(team)}
                                                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                                                                title="Delete Franchise"
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
                                <strong className="text-white">{totalPages}</strong> ({totalItems} total teams)
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
                                    // Show first, last, and window around current page
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

            {/* ── DELETE SAFETY MODAL ── */}
            {deleteModalOpen && teamToDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#080E27] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Red visual alert accent */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />

                        <div className="flex items-center gap-3 text-red-400">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Delete Franchise?</h3>
                                <p className="text-xs text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs sm:text-sm text-gray-300">
                            <div className="p-3.5 rounded-2xl bg-[#050B1A] border border-white/10 flex items-center gap-3">
                                {teamToDelete.logo ? (
                                    <img
                                        src={teamToDelete.logo}
                                        alt={teamToDelete.name}
                                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                                    />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black text-xs shrink-0"
                                        style={getTeamAvatarStyle(teamToDelete.name)}
                                    >
                                        {teamToDelete.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white truncate">{teamToDelete.name}</h4>
                                    <p className="text-xs text-gray-400 truncate">
                                        Owner: {teamToDelete.ownerName || "Unassigned"}
                                    </p>
                                </div>
                            </div>

                            <p className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-300 text-xs flex gap-2.5 leading-relaxed">
                                <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
                                <span>
                                    <strong>WARNING:</strong> Deleting this franchise will release all assigned players back into the draft pool and forfeit any active auction bids.
                                </span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteModalOpen(false)}
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

export default TeamsPage;
