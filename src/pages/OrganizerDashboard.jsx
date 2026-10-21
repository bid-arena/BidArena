import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Link, useNavigate } from "react-router-dom";
import {
    Trophy,
    Users,
    User,
    Coins,
    Plus,
    Gavel,
    ChevronRight,
    ChevronDown,
    TrendingUp,
    Calendar,
    Bell,
    LogOut,
    Settings,
    RefreshCw,
    Flame,
    Clock,
    AlertTriangle,
    Search,
    Check,
    MapPin,
    Sparkles,
    Shield,
    Activity,
    ArrowUpRight,
    BarChart3,
    Layers,
    ExternalLink,
    PieChart as PieIcon,
    Wallet
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    PieChart,
    Pie,
} from "recharts";
import { toast } from "react-hot-toast";
import { getDashboardStats, logoutUser } from "../services/dashboardService";
import { getTournaments } from "../services/tournamentService";
import { getTeams } from "../services/teamService";
import { getPlayers } from "../services/playerService";

/* ─── Helpers ─────────────────────────────────────────────── */
const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN").format(n || 0) + " Pts";

const formatDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : "—";

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
};

const getStatusBadge = (status) => {
    const s = (status || "UPCOMING").toUpperCase();
    switch (s) {
        case "LIVE":
        case "ONGOING":
            return {
                label: "Live Now",
                color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                dot: "bg-emerald-400 animate-pulse",
            };
        case "UPCOMING":
            return {
                label: "Upcoming",
                color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                dot: "bg-yellow-400",
            };
        case "COMPLETED":
        case "CONCLUDED":
            return {
                label: "Concluded",
                color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
                dot: "bg-gray-400",
            };
        case "DRAFT":
        default:
            return {
                label: "Draft",
                color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                dot: "bg-amber-400",
            };
    }
};

/* ─── Custom Glassmorphic Dropdown ────────────────────────── */
const CustomDropdown = ({
    id,
    label,
    icon: Icon,
    value,
    onChange,
    options,
    minWidth = "w-64",
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
        <div ref={ref} className="relative inline-block text-left w-full sm:w-auto">
            <button
                type="button"
                id={id}
                onClick={() => {
                    setOpen((prev) => !prev);
                    setSearchTerm("");
                }}
                className={`group w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                    open
                        ? "bg-[#0F1B3D] border-[#FDB913]/60 text-white shadow-lg shadow-black/40 ring-1 ring-[#FDB913]/30"
                        : "bg-[#080E27] border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-[#0c1435]"
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && (
                        <Icon
                            size={14}
                            className={`transition-colors shrink-0 ${
                                open ? "text-[#FDB913]" : "text-[#FDB913]/80 group-hover:text-[#FDB913]"
                            }`}
                        />
                    )}
                    {label && <span className="text-gray-400 font-medium shrink-0">{label}:</span>}
                    <span className="font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                        {selectedOption?.label || "Select"}
                    </span>
                </div>
                <ChevronDown
                    size={14}
                    className={`text-gray-400 group-hover:text-white transition-transform duration-200 shrink-0 ${
                        open ? "rotate-180 text-[#FDB913]" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    className={`absolute right-0 sm:left-0 sm:right-auto mt-2 ${minWidth} max-w-[90vw] bg-[#0F1B3D] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl`}
                >
                    {options.length > 4 && (
                        <div className="relative mb-2 px-1">
                            <Search
                                size={12}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter tournaments..."
                                className="w-full bg-[#050B1A] border border-white/10 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#FDB913]"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                No matching options
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
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
                                            {opt.dot && (
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                                            )}
                                            <span className="truncate">{opt.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {opt.badge && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-white/5 text-gray-400 border border-white/5">
                                                    {opt.badge}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <Check size={13} className="text-[#FDB913]" />
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

/* ─── Team Avatar Component ──────────────────────────────── */
const TeamAvatar = ({ team, size = "w-10 h-10" }) => {
    const [imgError, setImgError] = useState(false);
    const initials = team?.name
        ? team.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "TM";

    if (team?.logo && !imgError) {
        return (
            <img
                src={team.logo}
                alt={team.name}
                onError={() => setImgError(true)}
                className={`${size} rounded-xl object-cover border border-white/10 shrink-0 bg-white/5`}
            />
        );
    }

    return (
        <div
            className={`${size} rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-black shrink-0`}
        >
            {initials}
        </div>
    );
};

/* ─── Profile Dropdown ────────────────────────────────────── */
const ProfileDropdown = ({ user, onLogout, onClose }) => {
    const initials = user?.name
        ? user.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U";

    return (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#0F1B3D] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {/* User info */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center text-black font-black text-sm shrink-0 shadow-lg shadow-[#FDB913]/20">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                            {user?.name || "Organizer"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                            {user?.email || "organizer@bidarena.com"}
                        </p>
                        <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/20">
                            {user?.role || "ORGANIZER"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-2 space-y-1">
                <Link
                    to="/tournaments"
                    onClick={onClose}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition"
                >
                    <Trophy size={14} className="text-[#FDB913]" />
                    My Tournaments
                </Link>
                <Link
                    to="/auctions"
                    onClick={onClose}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition"
                >
                    <Gavel size={14} className="text-amber-400" />
                    Auction Rooms
                </Link>

                <div className="h-px bg-white/5 my-1" />

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                >
                    <LogOut size={14} />
                    Logout Account
                </button>
            </div>
        </div>
    );
};

/* ─── Stat Card Component ─────────────────────────────────── */
const StatCard = ({ label, value, sub, pills, icon: Icon, color, to }) => (
    <Link
        to={to || "#"}
        className="group relative bg-[#080E27] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-white/15 hover:bg-[#0F1B3D]/80 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 overflow-hidden"
    >
        {/* Subtle glow highlight on hover */}
        <div
            className={`absolute top-0 right-0 w-32 h-32 ${color.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none`}
        />

        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    {label}
                </span>
                <div
                    className={`w-9 h-9 rounded-xl border ${color.bg} ${color.border} ${color.text} flex items-center justify-center transition-transform group-hover:scale-110 duration-200`}
                >
                    <Icon size={16} />
                </div>
            </div>

            <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {value}
                </h3>
                {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
            </div>
        </div>

        {/* Dynamic breakdown pills */}
        {pills && pills.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 items-center">
                {pills.map((p, idx) => (
                    <span
                        key={idx}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${p.style}`}
                    >
                        {p.text}
                    </span>
                ))}
            </div>
        )}

        <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-gray-500 group-hover:text-gray-300 transition-colors">
            Manage section <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
    </Link>
);

/* ─── Quick Action Card ────────────────────────────────────── */
const ActionCard = ({ to, icon: Icon, label, desc, color, badge }) => (
    <Link
        to={to}
        className="group relative flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-[#080E27] hover:bg-[#0F1B3D] hover:border-white/15 transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
    >
        <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color.bg} ${color.border} ${color.text} border shadow-lg transition-transform group-hover:scale-105 duration-200`}
        >
            <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white group-hover:text-[#FDB913] transition-colors">
                    {label}
                </h4>
                {badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#FDB913]/20 text-[#FDB913] border border-[#FDB913]/30">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{desc}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-colors shrink-0">
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
    </Link>
);

/* ─── Custom Tooltip for Charts ────────────────────────────── */
const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0F1B3D] border border-white/10 px-3.5 py-2.5 rounded-xl shadow-2xl shadow-black/80 text-xs backdrop-blur-md">
                <p className="font-bold text-white mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FDB913]" />
                    <span className="text-gray-400">Purse:</span>
                    <span className="font-mono font-bold text-[#FDB913]">
                        {formatCurrency(payload[0].value)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

/* ═══════════════════════════════════════════════════════════ */
const OrganizerDashboard = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [stats, setStats] = useState(null);
    const [allTournaments, setAllTournaments] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    // Selected Tournament Filter for scoping stats ("ALL" or tournament.id)
    const [selectedTournamentId, setSelectedTournamentId] = useState("ALL");

    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const initials = user?.name
        ? user.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U";

    /* ─── Load Data ─────────────────────────────────────────── */
    const load = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const [statsRes, tourRes, teamRes, playerRes] = await Promise.allSettled([
                getDashboardStats(),
                getTournaments(),
                getTeams(),
                getPlayers(),
            ]);

            if (statsRes.status === "fulfilled") {
                setStats(statsRes.value);
            }

            if (tourRes.status === "fulfilled") {
                setAllTournaments(tourRes.value || []);
            }

            if (teamRes.status === "fulfilled") {
                setAllTeams(teamRes.value || []);
            }

            if (playerRes.status === "fulfilled") {
                setAllPlayers(playerRes.value || []);
            }
        } catch (err) {
            console.error("Dashboard data load error:", err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Logout actions
    const handleLogout = () => {
        setProfileOpen(false);
        setLogoutConfirmOpen(true);
    };

    const confirmLogout = async () => {
        setLogoutConfirmOpen(false);
        await logoutUser();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    /* ─── Filtered Data based on Selected Tournament ──────── */
    const currentTournament = useMemo(() => {
        if (selectedTournamentId === "ALL") return null;
        return allTournaments.find((t) => String(t.id) === String(selectedTournamentId)) || null;
    }, [selectedTournamentId, allTournaments]);

    const filteredTeams = useMemo(() => {
        if (selectedTournamentId === "ALL") return allTeams;
        return allTeams.filter(
            (t) =>
                String(t.tournamentId) === String(selectedTournamentId) ||
                String(t.tournament?.id) === String(selectedTournamentId)
        );
    }, [selectedTournamentId, allTeams]);

    const filteredPlayers = useMemo(() => {
        if (selectedTournamentId === "ALL") return allPlayers;
        return allPlayers.filter(
            (p) =>
                String(p.tournamentId) === String(selectedTournamentId) ||
                String(p.tournament?.id) === String(selectedTournamentId)
        );
    }, [selectedTournamentId, allPlayers]);

    // Live auction in progress banner detection
    const liveTournament = useMemo(() => {
        return allTournaments.find((t) => {
            const s = (t.status || "").toUpperCase();
            return s === "LIVE" || s === "ONGOING";
        });
    }, [allTournaments]);

    // Tournament Breakdown Stats
    const tournamentMetrics = useMemo(() => {
        const total = allTournaments.length;
        const live = allTournaments.filter((t) => {
            const s = (t.status || "").toUpperCase();
            return s === "LIVE" || s === "ONGOING";
        }).length;
        const upcoming = allTournaments.filter((t) => (t.status || "").toUpperCase() === "UPCOMING").length;
        const concluded = allTournaments.filter((t) => {
            const s = (t.status || "").toUpperCase();
            return s === "COMPLETED" || s === "CONCLUDED";
        }).length;
        return { total, live, upcoming, concluded };
    }, [allTournaments]);

    // Total Purse
    const totalPurseDisplay = useMemo(() => {
        if (currentTournament) {
            return currentTournament.purseAmount || 0;
        }
        if (filteredTeams.length > 0) {
            return filteredTeams.reduce((sum, t) => sum + (t.purseAmount || 0), 0);
        }
        return stats?.totalPurse || 0;
    }, [currentTournament, filteredTeams, stats]);

    // Tournament Selector Options for CustomDropdown
    const tournamentDropdownOptions = useMemo(() => {
        const globalOption = {
            value: "ALL",
            label: "All Tournaments (Global)",
            badge: `${allTournaments.length}`,
            dot: "bg-[#FDB913]",
        };
        const items = allTournaments.map((t) => {
            const badge = getStatusBadge(t.status);
            return {
                value: String(t.id),
                label: t.name,
                badge: badge.label,
                dot: badge.dot,
            };
        });
        return [globalOption, ...items];
    }, [allTournaments]);

    // Chart Data: Teams vs Purse
    const teamPurseChartData = useMemo(() => {
        if (!filteredTeams || filteredTeams.length === 0) return [];
        return [...filteredTeams]
            .sort((a, b) => (b.purseAmount || 0) - (a.purseAmount || 0))
            .slice(0, 8)
            .map((t) => ({
                name: t.name?.length > 12 ? t.name.substring(0, 10) + "…" : t.name,
                fullName: t.name,
                purse: t.purseAmount || 0,
            }));
    }, [filteredTeams]);

    // Chart Data: Player Role Distribution
    const roleChartData = useMemo(() => {
        if (!filteredPlayers || filteredPlayers.length === 0) return [];

        const counts = {
            Batsman: 0,
            Bowler: 0,
            "All-Rounder": 0,
            Wicketkeeper: 0,
        };

        filteredPlayers.forEach((p) => {
            const r = p.role || "Batsman";
            if (r.includes("Wicket")) counts["Wicketkeeper"]++;
            else if (r.includes("All")) counts["All-Rounder"]++;
            else if (r.includes("Bowl")) counts["Bowler"]++;
            else counts["Batsman"]++;
        });

        const total = filteredPlayers.length || 1;
        const colors = {
            Batsman: "#FDB913",
            Bowler: "#38BDF8",
            "All-Rounder": "#10B981",
            Wicketkeeper: "#A855F7",
        };

        return Object.entries(counts)
            .filter(([_, count]) => count > 0)
            .map(([role, count]) => ({
                name: role,
                value: count,
                percent: Math.round((count / total) * 100),
                fill: colors[role] || "#94A3B8",
            }));
    }, [filteredPlayers]);

    // Formatted current date
    const now = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    /* ─── Loading Skeleton ──────────────────────────────────── */
    if (loading) {
        return (
            <div className="min-h-screen flex bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-[#FDB913]/20 border-t-[#FDB913] rounded-full animate-spin" />
                            <Trophy
                                size={20}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FDB913]"
                            />
                        </div>
                        <div>
                            <p className="text-white font-bold text-base">Loading Organizer Dashboard</p>
                            <p className="text-gray-400 text-xs mt-1">Aggregating live tournament metrics & franchises…</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
            <Sidebar />

            <main className="flex-1 overflow-y-auto min-w-0">
                {/* ── TOP BAR / HEADER ── */}
                <header className="sticky top-0 z-30 bg-[#050B1A]/85 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 md:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-tight truncate">
                                    {getGreeting()},{" "}
                                    <span className="text-[#FDB913]">
                                        {user?.name?.split(" ")[0] || "Organizer"}
                                    </span>{" "}
                                    👋
                                </h1>
                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                                    System Active
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                <Calendar size={11} className="text-gray-500" /> {now}
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-400 font-medium">Organizer HQ</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 flex-wrap">
                        {/* Scope Tournament Filter */}
                        <CustomDropdown
                            id="dashboard-tournament-filter"
                            label="Scope"
                            icon={Trophy}
                            value={selectedTournamentId}
                            onChange={(val) => setSelectedTournamentId(val)}
                            options={tournamentDropdownOptions}
                            minWidth="w-72"
                        />

                        {/* Quick Live Auction Link */}
                        <Link
                            to="/auctions"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-[#FDB913] border border-amber-500/30 transition shadow-lg shadow-amber-500/10"
                        >
                            <Gavel size={14} />
                            <span className="hidden md:inline">Auction Arena</span>
                        </Link>

                        {/* Refresh */}
                        <button
                            onClick={() => load(true)}
                            disabled={refreshing}
                            title="Refresh data"
                            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition cursor-pointer"
                        >
                            <RefreshCw
                                size={15}
                                className={refreshing ? "animate-spin text-[#FDB913]" : ""}
                            />
                        </button>

                        {/* Profile Avatar Trigger */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setProfileOpen((p) => !p)}
                                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/5 transition cursor-pointer"
                            >
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center text-black text-xs font-black shrink-0">
                                    {initials}
                                </div>
                                <span className="hidden lg:block text-xs font-bold text-gray-200">
                                    {user?.name?.split(" ")[0] || "Account"}
                                </span>
                                <ChevronDown size={12} className="text-gray-400" />
                            </button>

                            {profileOpen && (
                                <ProfileDropdown
                                    user={user}
                                    onLogout={handleLogout}
                                    onClose={() => setProfileOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                    {/* ── LIVE AUCTION IN PROGRESS BANNER ── */}
                    {liveTournament && (
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/30 to-[#0F1B3D] border border-red-500/30 p-4 sm:p-5 shadow-2xl shadow-red-950/20 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                                        <Flame size={22} className="animate-bounce" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-ping" />
                                                Live Bidding War Active
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {liveTournament.venue || "Official Arena"}
                                            </span>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-black text-white mt-1">
                                            {liveTournament.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <Link
                                        to={`/auctions/live/${liveTournament.id}`}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
                                    >
                                        <Gavel size={15} />
                                        Enter Live Arena
                                    </Link>
                                    <Link
                                        to={`/tournaments/${liveTournament.id}`}
                                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition"
                                    >
                                        Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SCOPED TOURNAMENT FOCUS BANNER ── */}
                    {currentTournament && (
                        <div className="rounded-2xl bg-[#080E27] border border-[#FDB913]/30 p-4 sm:p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FDB913]/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center text-[#FDB913] shrink-0">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                Scoped Tournament Focus
                                            </span>
                                            {(() => {
                                                const badge = getStatusBadge(currentTournament.status);
                                                return (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`} />
                                                        {badge.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                                            {currentTournament.name}
                                        </h2>
                                        <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                                            {currentTournament.venue && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={11} className="text-[#FDB913]" />
                                                    {currentTournament.venue}
                                                </span>
                                            )}
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} />
                                                {formatDate(currentTournament.date || currentTournament.createdAt)}
                                            </span>
                                            <span>•</span>
                                            <span className="font-bold text-emerald-400 font-mono">
                                                {formatCurrency(currentTournament.purseAmount)}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
                                    <Link
                                        to={`/tournaments/${currentTournament.id}`}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition"
                                    >
                                        <ExternalLink size={13} />
                                        Full Details
                                    </Link>
                                    <Link
                                        to={`/teams/add?tournamentId=${currentTournament.id}`}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-bold text-blue-400 transition"
                                    >
                                        <Plus size={13} />
                                        Add Team
                                    </Link>
                                    <Link
                                        to={`/players/add?tournamentId=${currentTournament.id}`}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-xs font-bold text-purple-400 transition"
                                    >
                                        <Plus size={13} />
                                        Add Player
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTournamentId("ALL")}
                                        className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                                    >
                                        Clear Scope ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STATS / KPI SECTION ── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xs sm:text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-[#FDB913]" />
                                    Executive Highlights
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {selectedTournamentId === "ALL"
                                        ? "Aggregated metrics across all registered championships"
                                        : `Specific metrics for ${currentTournament?.name}`}
                                </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                <TrendingUp size={12} /> Real-Time Sync
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                label="Tournaments"
                                value={
                                    selectedTournamentId === "ALL"
                                        ? allTournaments.length || stats?.totalTournaments || 0
                                        : 1
                                }
                                sub={
                                    selectedTournamentId === "ALL"
                                        ? `${tournamentMetrics.live} Live • ${tournamentMetrics.upcoming} Upcoming`
                                        : currentTournament?.status || "Active"
                                }
                                pills={
                                    selectedTournamentId === "ALL"
                                        ? [
                                            { text: `${tournamentMetrics.live} Live`, style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                                            { text: `${tournamentMetrics.upcoming} Upcoming`, style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
                                            { text: `${tournamentMetrics.concluded} Concluded`, style: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
                                        ]
                                        : [
                                            { text: currentTournament?.venue || "Main Arena", style: "bg-white/5 text-gray-300 border-white/10" }
                                        ]
                                }
                                icon={Trophy}
                                to="/tournaments"
                                color={{
                                    bg: "bg-yellow-500/10",
                                    border: "border-yellow-500/20",
                                    text: "text-yellow-400",
                                }}
                            />

                            <StatCard
                                label="Franchises & Teams"
                                value={filteredTeams.length}
                                sub={
                                    selectedTournamentId === "ALL"
                                        ? "Registered team franchises"
                                        : `Teams in ${currentTournament?.name || "tournament"}`
                                }
                                pills={[
                                    {
                                        text: `${Math.round(filteredTeams.length ? filteredPlayers.length / filteredTeams.length : 0)} Avg Squad`,
                                        style: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                    },
                                    {
                                        text: "All Confirmed",
                                        style: "bg-white/5 text-gray-300 border-white/10",
                                    },
                                ]}
                                icon={Shield}
                                to="/teams"
                                color={{
                                    bg: "bg-blue-500/10",
                                    border: "border-blue-500/20",
                                    text: "text-blue-400",
                                }}
                            />

                            <StatCard
                                label="Player Pool"
                                value={filteredPlayers.length}
                                sub="Available in draft roster"
                                pills={[
                                    {
                                        text: `${filteredPlayers.filter(p => (p.role || "").includes("Bowl")).length} Bowlers`,
                                        style: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                    },
                                    {
                                        text: `${filteredPlayers.filter(p => !(p.role || "").includes("Bowl")).length} Batsmen/AR`,
                                        style: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                    },
                                ]}
                                icon={User}
                                to="/players"
                                color={{
                                    bg: "bg-purple-500/10",
                                    border: "border-purple-500/20",
                                    text: "text-purple-400",
                                }}
                            />

                            <StatCard
                                label="Total Purse Managed"
                                value={formatCurrency(totalPurseDisplay)}
                                sub={
                                    filteredTeams.length
                                        ? `~${formatCurrency(Math.round(totalPurseDisplay / filteredTeams.length))} avg/team`
                                        : "Points volume"
                                }
                                pills={[
                                    {
                                        text: "Bidding Budget",
                                        style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                    },
                                    {
                                        text: "100% Allocated",
                                        style: "bg-white/5 text-gray-300 border-white/10",
                                    },
                                ]}
                                icon={Coins}
                                color={{
                                    bg: "bg-emerald-500/10",
                                    border: "border-emerald-500/20",
                                    text: "text-emerald-400",
                                }}
                            />
                        </div>
                    </section>

                    {/* ── QUICK ACTIONS HUB ── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xs sm:text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={14} className="text-[#FDB913]" />
                                    Operations Hub
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">Quick shortcuts for daily tournament administration</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <ActionCard
                                to="/tournaments/add"
                                icon={Trophy}
                                label="New Tournament"
                                desc="Setup rules, venue & purse"
                                badge="Host"
                                color={{
                                    bg: "bg-yellow-500/10",
                                    border: "border-yellow-500/20",
                                    text: "text-yellow-400",
                                }}
                            />
                            <ActionCard
                                to={
                                    currentTournament
                                        ? `/teams/add?tournamentId=${currentTournament.id}`
                                        : "/teams/add"
                                }
                                icon={Shield}
                                label="Register Team"
                                desc="Assign owner & team purse"
                                color={{
                                    bg: "bg-blue-500/10",
                                    border: "border-blue-500/20",
                                    text: "text-blue-400",
                                }}
                            />
                            <ActionCard
                                to={
                                    currentTournament
                                        ? `/players/add?tournamentId=${currentTournament.id}`
                                        : "/players/add"
                                }
                                icon={User}
                                label="Add Player"
                                desc="Add cricketer to draft pool"
                                color={{
                                    bg: "bg-purple-500/10",
                                    border: "border-purple-500/20",
                                    text: "text-purple-400",
                                }}
                            />
                            <ActionCard
                                to="/auctions"
                                icon={Gavel}
                                label="Live Auction Arena"
                                desc="Control bids & hammer timers"
                                badge="Live"
                                color={{
                                    bg: "bg-red-500/10",
                                    border: "border-red-500/20",
                                    text: "text-red-400",
                                }}
                            />
                        </div>
                    </section>

                    {/* ── VISUAL ANALYTICS & CHARTS SECTION ── */}
                    <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Purse Allocation by Team BarChart (Takes 2 cols on XL) */}
                        <div className="xl:col-span-2 bg-[#080E27] border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                <div>
                                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                                        <BarChart3 size={17} className="text-[#FDB913]" />
                                        Franchise Purse Allocation
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Budget allocation across participating franchises
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                        Cap: {formatCurrency(totalPurseDisplay)}
                                    </span>
                                </div>
                            </div>

                            {teamPurseChartData.length === 0 ? (
                                <div className="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                    <Users size={32} className="text-gray-600 mb-2" />
                                    <p className="text-sm font-semibold text-gray-300">No team budget data available</p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                        Register teams in your tournaments to unlock visual franchise purse comparisons.
                                    </p>
                                    <Link
                                        to="/teams/add"
                                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FDB913]/10 hover:bg-[#FDB913]/20 text-[#FDB913] border border-[#FDB913]/30 text-xs font-bold transition"
                                    >
                                        <Plus size={13} />
                                        Add First Team
                                    </Link>
                                </div>
                            ) : (
                                <div className="h-64 sm:h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={teamPurseChartData}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                                        >
                                            <defs>
                                                <linearGradient id="purseGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#FDB913" stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor="#D97706" stopOpacity={0.4} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="name"
                                                stroke="#4B5563"
                                                fontSize={11}
                                                tickLine={false}
                                                interval={0}
                                                angle={-20}
                                                textAnchor="end"
                                            />
                                            <YAxis
                                                stroke="#4B5563"
                                                fontSize={11}
                                                tickLine={false}
                                                tickFormatter={(v) =>
                                                    v >= 100000 ? `${v / 100000}L` : `${v / 1000}k`
                                                }
                                            />
                                            <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                            <Bar
                                                dataKey="purse"
                                                fill="url(#purseGradient)"
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={48}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Player Roles Composition Pie/Donut Chart */}
                        <div className="bg-[#080E27] border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-white text-base flex items-center gap-2">
                                    <PieIcon size={17} className="text-purple-400" />
                                    Roster Specializations
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Player distribution by cricket role
                                </p>
                            </div>

                            {roleChartData.length === 0 ? (
                                <div className="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                    <User size={32} className="text-gray-600 mb-2" />
                                    <p className="text-sm font-semibold text-gray-300">No players registered yet</p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                                        Add players or bulk import cricketers to see role composition.
                                    </p>
                                    <Link
                                        to="/players/add"
                                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold transition"
                                    >
                                        <Plus size={13} />
                                        Add Player
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="h-48 sm:h-52 w-full my-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={roleChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={75}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {roleChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const item = payload[0];
                                                            return (
                                                                <div className="bg-[#0F1B3D] border border-white/10 px-3 py-2 rounded-xl shadow-xl text-xs">
                                                                    <p className="font-bold text-white">{item.name}</p>
                                                                    <p className="text-gray-300 font-mono mt-0.5">
                                                                        {item.value} players ({item.payload.percent}%)
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Custom Legend */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                        {roleChartData.map((r) => (
                                            <div key={r.name} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-white/[0.02]">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.fill }} />
                                                    <span className="text-gray-300 truncate">{r.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-white shrink-0">
                                                    {r.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    {/* ── RECENT TOURNAMENTS & FRANCHISES SECTION ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Recent Tournaments */}
                        <section className="bg-[#080E27] border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                                    <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                                        <Trophy size={16} className="text-yellow-400" />
                                        Recent Tournaments
                                    </h3>
                                    <Link
                                        to="/tournaments"
                                        className="text-xs text-[#FDB913] hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        View all ({allTournaments.length}) <ChevronRight size={13} />
                                    </Link>
                                </div>

                                {!allTournaments.length ? (
                                    <div className="py-16 text-center text-gray-500 text-sm">
                                        <Trophy size={32} className="mx-auto text-gray-600 mb-2" />
                                        <p className="text-gray-300 font-semibold">No tournaments created yet</p>
                                        <p className="text-xs text-gray-500 mt-1">Get started by launching your first season.</p>
                                        <Link
                                            to="/tournaments/add"
                                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FDB913] text-black font-bold text-xs hover:bg-[#e5a710] transition"
                                        >
                                            <Plus size={14} /> Create Tournament
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {allTournaments.slice(0, 5).map((t) => {
                                            const badge = getStatusBadge(t.status);
                                            return (
                                                <Link
                                                    key={t.id}
                                                    to={`/tournaments/${t.id}`}
                                                    className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.03] transition group"
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0 group-hover:scale-105 transition-transform">
                                                            <Trophy size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-200 group-hover:text-white transition truncate">
                                                                {t.name}
                                                            </p>
                                                            <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 truncate">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={11} className="text-gray-500" />
                                                                    {formatDate(t.date || t.createdAt)}
                                                                </span>
                                                                {t.venue && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="truncate">{t.venue}</span>
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0 ml-3">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`} />
                                                            {badge.label}
                                                        </span>
                                                        <p className="text-xs text-emerald-400 font-bold font-mono mt-1">
                                                            {formatCurrency(t.purseAmount)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {allTournaments.length > 0 && (
                                <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
                                    <Link
                                        to="/tournaments/add"
                                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
                                    >
                                        <Plus size={13} className="text-[#FDB913]" /> Add New Tournament
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Recent Teams */}
                        <section className="bg-[#080E27] border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                                    <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                                        <Shield size={16} className="text-blue-400" />
                                        Registered Franchises
                                    </h3>
                                    <Link
                                        to="/teams"
                                        className="text-xs text-[#FDB913] hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        View all ({allTeams.length}) <ChevronRight size={13} />
                                    </Link>
                                </div>

                                {!allTeams.length ? (
                                    <div className="py-16 text-center text-gray-500 text-sm">
                                        <Users size={32} className="mx-auto text-gray-600 mb-2" />
                                        <p className="text-gray-300 font-semibold">No franchises enrolled yet</p>
                                        <p className="text-xs text-gray-500 mt-1">Enroll teams to start assigning auction purses.</p>
                                        <Link
                                            to="/teams/add"
                                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
                                        >
                                            <Plus size={14} /> Register Team
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {allTeams.slice(0, 5).map((team) => (
                                            <Link
                                                key={team.id}
                                                to={`/teams/${team.id}`}
                                                className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.03] transition group"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <TeamAvatar team={team} size="w-10 h-10" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-200 group-hover:text-white transition truncate">
                                                            {team.name}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate">
                                                            {team.captainName
                                                                ? `Capt. ${team.captainName}`
                                                                : "Owner: Admin"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0 ml-3">
                                                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 max-w-[120px] truncate">
                                                        {team.tournament?.name || "Enrolled"}
                                                    </span>
                                                    <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
                                                        {formatCurrency(team.purseAmount)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {allTeams.length > 0 && (
                                <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
                                    <Link
                                        to="/teams/add"
                                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
                                    >
                                        <Plus size={13} className="text-blue-400" /> Register Another Team
                                    </Link>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ── FOOTER NOTE ── */}
                    <footer className="text-center text-xs text-gray-600 pt-6 pb-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <p>BidArena &copy; {new Date().getFullYear()} — Professional Cricket Auction Command Center</p>
                        <div className="flex items-center gap-4 text-gray-500">
                            <Link to="/tournaments" className="hover:text-gray-300">Tournaments</Link>
                            <Link to="/teams" className="hover:text-gray-300">Teams</Link>
                            <Link to="/players" className="hover:text-gray-300">Players</Link>
                            <Link to="/auctions" className="hover:text-gray-300">Auctions</Link>
                        </div>
                    </footer>
                </div>
            </main>

            {/* ── Logout Confirmation Modal ── */}
            {logoutConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black/80 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-red-500 rounded-t-2xl" />

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">Confirm Sign Out</h3>
                                <p className="text-xs text-gray-400 mt-0.5">You will be logged out of Organizer HQ.</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300 mb-6">
                            Are you sure you want to end your current organizer session?
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setLogoutConfirmOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogout}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition shadow-lg shadow-red-500/20 cursor-pointer"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;
