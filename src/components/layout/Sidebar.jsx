import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Trophy,
    Users,
    User,
    Gavel,
    LogOut,
    ChevronRight,
    Menu,
    X,
    AlertTriangle,
    Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { logoutUser } from "../../services/dashboardService";
import { toast } from "react-hot-toast";

const NAV_ITEMS = [
    { to: "/organizer-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tournaments", label: "Tournaments", icon: Trophy },
    { to: "/teams", label: "Teams", icon: Users },
    { to: "/players", label: "Players", icon: User },
    { to: "/auctions", label: "Auctions", icon: Gavel },
    { to: "/settings", label: "Settings", icon: Settings },
];

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [teamTournamentId, setTeamTournamentId] = useState(null);

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

    useEffect(() => {
        if (user?.role === "TEAM_OWNER") {
            const fetchTeam = async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) return;
                    const res = await axios.get("http://localhost:5000/api/teams/owner/my-team", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (res.data?.data?.tournamentId) {
                        setTeamTournamentId(res.data.data.tournamentId);
                    }
                } catch (err) {
                    console.error("Sidebar team fetch error:", err);
                }
            };
            fetchTeam();
        }
    }, [user?.role]);

    const handleLogout = async () => {
        await logoutUser();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    const SidebarContent = () => {
        const menuItems = user?.role === "TEAM_OWNER"
            ? [
                { to: "/owner-dashboard", label: "Overview", icon: LayoutDashboard },
                ...(teamTournamentId ? [{ to: `/auctions/live/${teamTournamentId}`, label: "Live Auction", icon: Gavel }] : []),
                { to: "/settings", label: "Settings", icon: Settings }
              ]
            : NAV_ITEMS;

        return (
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-7 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Gavel size={18} className="text-black" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tight">
                        Bid<span className="text-[#FDB913]">Arena</span>
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3">
                        Main Menu
                    </p>
                    {menuItems.map(({ to, label, icon: Icon }) => {
                        const active =
                            location.pathname === to ||
                            (to !== "/organizer-dashboard" &&
                                to !== "/owner-dashboard" &&
                                location.pathname.startsWith(to));
                        return (
                        <Link
                            key={to}
                            to={to}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${active
                                ? "bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/20"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Icon
                                size={18}
                                className={
                                    active
                                        ? "text-[#FDB913]"
                                        : "text-gray-500 group-hover:text-white"
                                }
                            />
                            <span className="flex-1">{label}</span>
                            {active && (
                                <ChevronRight size={14} className="text-[#FDB913]/60" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Profile + Logout */}
            <div className="px-4 py-4 border-t border-white/5 space-y-2">
                {user && (
                    <Link
                        to="/settings"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#FDB913]/30 transition group cursor-pointer"
                        title="Open Account Settings"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center text-black text-xs font-black shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-[#FDB913] transition truncate">
                                {user.name || "User"}
                            </p>
                            <p className="text-[10px] text-gray-500 capitalize truncate">
                                {user.role?.toLowerCase() || "organizer"}
                            </p>
                        </div>
                        <ChevronRight size={14} className="text-gray-500 group-hover:text-[#FDB913] transition shrink-0" />
                    </Link>
                )}

                <button
                    onClick={() => setConfirmOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    Logout
                </button>
            </div>
        </div>
    );
};

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-[#080E27] border-r border-white/5 hidden md:flex flex-col min-h-screen sticky top-0 h-screen">
                <SidebarContent />
            </aside>

            {/* Mobile Hamburger */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="bg-[#0F1E4D] border border-white/10 p-2.5 rounded-xl text-white shadow-lg"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#080E27] border-r border-white/5 flex flex-col">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* ── Logout Confirmation Modal ── */}
            {confirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black/60 relative overflow-hidden">
                        {/* Red top accent */}
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
                                onClick={() => setConfirmOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setConfirmOpen(false); handleLogout(); }}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition shadow-lg shadow-red-500/20"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;