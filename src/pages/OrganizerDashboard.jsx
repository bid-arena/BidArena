import React, { useEffect, useRef, useState } from "react";
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
    TrendingUp,
    Calendar,
    Bell,
    LogOut,
    Settings,
    RefreshCw,
    Flame,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getDashboardStats, logoutUser } from "../services/dashboardService";

/* ─── helpers ─────────────────────────────────────────────── */
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

const STATUS_STYLES = {
    UPCOMING:
        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    ONGOING:
        "bg-green-500/10 text-green-400 border-green-500/20",
    COMPLETED:
        "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

/* ─── Stat Tile ────────────────────────────────────────────── */
const StatTile = ({ label, value, sub, icon: Icon, color, to }) => (
    <Link
        to={to || "#"}
        className="group bg-[#080E27] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 hover:bg-[#0F1B3D] transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
    >
        <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                {label}
            </span>
            <div
                className={`p-2 rounded-xl border ${color.bg} ${color.border} ${color.text}`}
            >
                <Icon size={16} />
            </div>
        </div>
        <div>
            <h3 className={`text-2xl font-black ${color.text}`}>{value}</h3>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
            View all <ChevronRight size={12} />
        </div>
    </Link>
);

/* ─── Quick Action Card ────────────────────────────────────── */
const ActionCard = ({ to, icon: Icon, label, desc, color }) => (
    <Link
        to={to}
        className={`group flex items-center gap-4 p-4 rounded-2xl border bg-[#080E27] hover:bg-[#0F1B3D] transition-all duration-300 border-white/5 hover:border-white/10`}
    >
        <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color.bg} ${color.border} ${color.text} border`}
        >
            <Icon size={20} />
        </div>
        <div className="min-w-0">
            <h4 className="font-bold text-sm text-white">{label}</h4>
            <p className="text-xs text-gray-500 truncate">{desc}</p>
        </div>
        <ChevronRight
            size={16}
            className="ml-auto text-gray-600 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all shrink-0"
        />
    </Link>
);

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
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#0F1B3D] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
            {/* User info */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center text-black font-black text-sm shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                            {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                            {user?.email || ""}
                        </p>
                        <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/20">
                            {user?.role || "ORGANIZER"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-2">
                <button
                    onClick={onClose}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                >
                    <Settings size={16} className="text-gray-500" />
                    Account Settings
                </button>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition mt-1"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════ */
const OrganizerDashboard = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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

    const load = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Opens confirm modal from profile dropdown
    const handleLogout = () => {
        setProfileOpen(false);
        setLogoutConfirmOpen(true);
    };

    // Runs actual logout after confirmation
    const confirmLogout = async () => {
        setLogoutConfirmOpen(false);
        await logoutUser();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="min-h-screen flex bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 text-sm">Loading dashboard…</p>
                    </div>
                </main>
            </div>
        );
    }

    const now = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                {/* ── TOP BAR ── */}
                <header className="sticky top-0 z-30 bg-[#050B1A]/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-10 py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg md:text-xl font-black text-white leading-none">
                            {getGreeting()},{" "}
                            <span className="text-[#FDB913]">
                                {user?.name?.split(" ")[0] || "Organizer"}
                            </span>{" "}
                            👋
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Calendar size={11} /> {now}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Refresh */}
                        <button
                            onClick={() => load(true)}
                            disabled={refreshing}
                            title="Refresh data"
                            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition"
                        >
                            <RefreshCw
                                size={16}
                                className={refreshing ? "animate-spin" : ""}
                            />
                        </button>

                        {/* Notifications placeholder */}
                        <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition">
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FDB913] rounded-full" />
                        </button>

                        {/* Profile avatar */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setProfileOpen((p) => !p)}
                                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/5 transition"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center text-black text-xs font-black">
                                    {initials}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-xs font-bold text-white leading-none">
                                        {user?.name?.split(" ")[0] || "User"}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-0.5 capitalize">
                                        {user?.role?.toLowerCase()}
                                    </p>
                                </div>
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

                <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
                    {/* ── STAT TILES ── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                Overview
                            </h2>
                            <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                                <TrendingUp size={11} /> Live Data
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatTile
                                label="Tournaments"
                                value={stats?.totalTournaments ?? 0}
                                sub="Total created"
                                icon={Trophy}
                                to="/tournaments"
                                color={{
                                    bg: "bg-yellow-500/10",
                                    border: "border-yellow-500/20",
                                    text: "text-yellow-400",
                                }}
                            />
                            <StatTile
                                label="Teams"
                                value={stats?.totalTeams ?? 0}
                                sub="Registered teams"
                                icon={Users}
                                to="/teams"
                                color={{
                                    bg: "bg-blue-500/10",
                                    border: "border-blue-500/20",
                                    text: "text-blue-400",
                                }}
                            />
                            <StatTile
                                label="Players"
                                value={stats?.totalPlayers ?? 0}
                                sub="In auction pool"
                                icon={User}
                                to="/players"
                                color={{
                                    bg: "bg-purple-500/10",
                                    border: "border-purple-500/20",
                                    text: "text-purple-400",
                                }}
                            />
                            <StatTile
                                label="Total Points"
                                value={formatCurrency(stats?.totalPurse)}
                                sub="Across all teams"
                                icon={Coins}
                                color={{
                                    bg: "bg-green-500/10",
                                    border: "border-green-500/20",
                                    text: "text-green-400",
                                }}
                            />
                        </div>
                    </section>

                    {/* ── QUICK ACTIONS ── */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <ActionCard
                                to="/tournaments/add"
                                icon={Trophy}
                                label="New Tournament"
                                desc="Create a tournament"
                                color={{
                                    bg: "bg-yellow-500/10",
                                    border: "border-yellow-500/20",
                                    text: "text-yellow-400",
                                }}
                            />
                            <ActionCard
                                to="/teams/add"
                                icon={Users}
                                label="Add Team"
                                desc="Register a new team"
                                color={{
                                    bg: "bg-blue-500/10",
                                    border: "border-blue-500/20",
                                    text: "text-blue-400",
                                }}
                            />
                            <ActionCard
                                to="/players/add"
                                icon={User}
                                label="Add Player"
                                desc="Add to auction pool"
                                color={{
                                    bg: "bg-purple-500/10",
                                    border: "border-purple-500/20",
                                    text: "text-purple-400",
                                }}
                            />
                            <ActionCard
                                to="/auctions"
                                icon={Gavel}
                                label="Start Auction"
                                desc="Launch live bidding"
                                color={{
                                    bg: "bg-red-500/10",
                                    border: "border-red-500/20",
                                    text: "text-red-400",
                                }}
                            />
                        </div>
                    </section>

                    {/* ── RECENT TABLES ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Recent Tournaments */}
                        <section className="bg-[#080E27] border border-white/5 rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Flame size={16} className="text-yellow-400" />
                                    Recent Tournaments
                                </h3>
                                <Link
                                    to="/tournaments"
                                    className="text-xs text-[#FDB913] hover:underline flex items-center gap-1"
                                >
                                    View all <ChevronRight size={12} />
                                </Link>
                            </div>

                            {!stats?.recentTournaments?.length ? (
                                <div className="py-12 text-center text-gray-600 text-sm">
                                    No tournaments yet.{" "}
                                    <Link
                                        to="/tournaments/add"
                                        className="text-[#FDB913] hover:underline"
                                    >
                                        Create one
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {stats.recentTournaments.map((t) => (
                                        <Link
                                            key={t.id}
                                            to={`/tournaments/${t.id}`}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                                                    <Trophy size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition">
                                                        {t.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={10} />
                                                        {formatDate(t.date || t.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[t.status] ||
                                                        STATUS_STYLES.UPCOMING
                                                        }`}
                                                >
                                                    {t.status || "UPCOMING"}
                                                </span>
                                                <p className="text-xs text-green-400 font-bold mt-1">
                                                    {formatCurrency(t.purseAmount)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Recent Teams */}
                        <section className="bg-[#080E27] border border-white/5 rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Users size={16} className="text-blue-400" />
                                    Recent Teams
                                </h3>
                                <Link
                                    to="/teams"
                                    className="text-xs text-[#FDB913] hover:underline flex items-center gap-1"
                                >
                                    View all <ChevronRight size={12} />
                                </Link>
                            </div>

                            {!stats?.recentTeams?.length ? (
                                <div className="py-12 text-center text-gray-600 text-sm">
                                    No teams yet.{" "}
                                    <Link
                                        to="/teams/add"
                                        className="text-[#FDB913] hover:underline"
                                    >
                                        Add one
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {stats.recentTeams.map((team) => (
                                        <div
                                            key={team.id}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                {team.logo ? (
                                                    <img
                                                        src={team.logo}
                                                        alt={team.name}
                                                        className="w-9 h-9 rounded-full object-cover border border-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-black">
                                                        {team.name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-200">
                                                        {team.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {team.captainName || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">
                                                    {team.tournament?.name || "No tournament"}
                                                </p>
                                                <p className="text-sm font-black text-green-400 mt-0.5">
                                                    {formatCurrency(team.purseAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ── FOOTER NOTE ── */}
                    <p className="text-center text-xs text-gray-700 pb-4">
                        BidArena &copy; {new Date().getFullYear()} — Organizer Portal
                    </p>
                </div>
            </main>

            {/* ── Logout Confirmation Modal (Dashboard) ── */}
            {logoutConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black/60 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-red-500 rounded-t-2xl" />

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">Confirm Logout</h3>
                                <p className="text-xs text-gray-400 mt-0.5">You will be signed out of your account.</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300 mb-6">
                            Are you sure you want to logout? Any unsaved changes will be lost.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setLogoutConfirmOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition shadow-lg shadow-red-500/20"
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
