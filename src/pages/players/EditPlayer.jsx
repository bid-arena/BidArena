import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    User,
    ArrowLeft,
    Trophy,
    Coins,
    ShieldCheck,
    Loader2,
    Edit,
    Target,
    Zap,
    Users,
    AlertCircle,
    CheckCircle2,
    Award,
    Activity,
    Flame,
    Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getPlayerById, updatePlayer } from "../../services/playerService";

import batsmanIcon from "../../assets/icons/batsman-rb.png";
import bowlerIcon from "../../assets/icons/bowler-rb.png";
import allRounderIcon from "../../assets/icons/all-rounder-rb.png";
import wicketkeeperIcon from "../../assets/icons/wicketkeeper-rb.png";

const ROLES = [
    {
        id: "Batsman",
        label: "Batsman",
        desc: "Top-order & power hitter",
        icon: Target,
        image: batsmanIcon,
        color: "text-blue-400",
        accent: "#38bdf8",
        activeBg: "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/15",
        badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        glow: "radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.25), transparent 70%)",
    },
    {
        id: "Bowler",
        label: "Bowler",
        desc: "Pace & spin specialist",
        icon: Zap,
        image: bowlerIcon,
        color: "text-red-400",
        accent: "#f87171",
        activeBg: "bg-red-500/15 border-red-500/40 text-red-300 shadow-lg shadow-red-500/15",
        badgeBg: "bg-red-500/20 text-red-300 border-red-500/30",
        glow: "radial-gradient(circle at 50% 30%, rgba(248, 113, 113, 0.25), transparent 70%)",
    },
    {
        id: "All-Rounder",
        label: "All-Rounder",
        desc: "Batting & bowling asset",
        icon: ShieldCheck,
        image: allRounderIcon,
        color: "text-purple-400",
        accent: "#c084fc",
        activeBg: "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/15",
        badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        glow: "radial-gradient(circle at 50% 30%, rgba(192, 132, 252, 0.25), transparent 70%)",
    },
    {
        id: "Wicket-Keeper",
        label: "Wicket-Keeper",
        desc: "Gloveman & finisher",
        icon: Users,
        image: wicketkeeperIcon,
        color: "text-amber-400",
        accent: "#fbbf24",
        activeBg: "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/15",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        glow: "radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.25), transparent 70%)",
    },
];

const PRESET_PRICES = [100000, 200000, 500000, 1000000, 2000000];

const formatPoints = (n) => {
    if (!n || isNaN(n)) return "0 Pts";
    return new Intl.NumberFormat("en-IN").format(n) + " Pts";
};

const getPlayerTier = (points) => {
    const val = Number(points) || 0;
    if (val >= 2000000)
        return { label: "Icon / Marquee", color: "text-amber-300 bg-amber-500/15 border-amber-500/30" };
    if (val >= 1000000)
        return { label: "Platinum", color: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30" };
    if (val >= 500000)
        return { label: "Gold", color: "text-yellow-300 bg-yellow-500/15 border-yellow-500/30" };
    if (val >= 200000)
        return { label: "Silver", color: "text-slate-300 bg-slate-500/15 border-slate-500/30" };
    return { label: "Standard", color: "text-blue-300 bg-blue-500/15 border-blue-500/30" };
};

const getAvatarStyle = (name) => {
    const hue = ((name?.charCodeAt(0) || 75) * 23) % 360;
    return {
        background: `linear-gradient(135deg, hsl(${hue}, 80%, 55%), hsl(${(hue + 45) % 360}, 85%, 45%))`,
    };
};

const getInitials = (name) => {
    if (!name || !name.trim()) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const EditPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [pageLoading, setPageLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // tournamentName is display-only — the API does not allow changing a player's tournament
    const [tournamentName, setTournamentName] = useState("");
    const [tournamentPurse, setTournamentPurse] = useState(null);

    const [form, setForm] = useState({
        name: "",
        role: "",
        basePrice: "",
    });

    const [errors, setErrors] = useState({});

    /* Load player by ID — response includes nested tournament object */
    useEffect(() => {
        const load = async () => {
            try {
                const player = await getPlayerById(id);

                if (!player) {
                    setNotFound(true);
                    return;
                }

                setForm({
                    name: player.name || "",
                    role: player.role || "",
                    basePrice: player.basePrice?.toString() || "",
                });

                // tournament is a nested object: { id, name, purseAmount }
                setTournamentName(player.tournament?.name || "");
                if (player.tournament?.purseAmount) {
                    setTournamentPurse(player.tournament.purseAmount);
                }
            } catch (err) {
                console.error("Load error:", err);
                if (err.response?.status === 404) {
                    setNotFound(true);
                } else {
                    toast.error("Failed to load player data.");
                }
            } finally {
                setPageLoading(false);
            }
        };
        load();
    }, [id]);

    const selectedRoleConfig = ROLES.find((r) => r.id === form.role);
    const tierInfo = getPlayerTier(form.basePrice);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Player name is required.";
        else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
        if (!form.role) e.role = "Please select a player specialty role.";
        if (!form.basePrice) e.basePrice = "Base points allocation is required.";
        else if (Number(form.basePrice) <= 0) e.basePrice = "Base points must be greater than 0.";
        return e;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleRoleSelect = (roleId) => {
        setForm((prev) => ({ ...prev, role: roleId }));
        if (errors.role) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next.role;
                return next;
            });
        }
    };

    const handlePresetPrice = (price) => {
        setForm((prev) => ({ ...prev, basePrice: String(price) }));
        if (errors.basePrice) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next.basePrice;
                return next;
            });
        }
    };

    const handleAdjustPrice = (delta) => {
        const current = Number(form.basePrice) || 0;
        const next = Math.max(10000, current + delta);
        setForm((prev) => ({ ...prev, basePrice: String(next) }));
        if (errors.basePrice) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next.basePrice;
                return next;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Please fill all required player details.");
            return;
        }

        setSubmitLoading(true);
        try {
            await updatePlayer(id, {
                name: form.name.trim(),
                role: form.role,
                basePrice: Number(form.basePrice),
            });
            toast.success("Player details updated successfully! ✅");
            navigate("/players");
        } catch (err) {
            console.error("Update player error:", err);
            toast.error(err.response?.data?.message || "Failed to update player.");
        } finally {
            setSubmitLoading(false);
        }
    };

    /* ── Loading skeleton ── */
    if (pageLoading) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 p-8 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 size={24} className="animate-spin text-[#FDB913]" />
                        <span className="text-sm font-semibold">Loading player details…</span>
                    </div>
                </main>
            </div>
        );
    }

    /* ── Not found ── */
    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertCircle size={32} className="text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Player Not Found</h2>
                    <p className="text-sm text-gray-500 max-w-sm">
                        This player profile cannot be found or was already removed from the roster.
                    </p>
                    <Link
                        to="/players"
                        className="mt-2 inline-flex items-center gap-2 bg-[#FDB913] hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-500/20"
                    >
                        <ArrowLeft size={16} />
                        Back to Players
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white selection:bg-[#FDB913] selection:text-black">
            <Sidebar />

            <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
                    {/* ── BACK NAVIGATION & HEADER ── */}
                    <div>
                        <Link
                            to="/players"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#FDB913] transition mb-4 group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Player Pool</span>
                        </Link>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDB913]/20 to-amber-600/10 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shadow-lg shadow-yellow-500/10">
                                    <Edit size={22} />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                                        Edit Player Profile
                                    </h1>
                                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                                        Modifying details for{" "}
                                        <span className="text-[#FDB913] font-bold">{form.name || "Player"}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── MAIN CONTENT GRID: FORM (LEFT) + REAL-TIME CARD PREVIEW (RIGHT) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                        {/* ── FORM CONTAINER (7 COLS) ── */}
                        <div className="lg:col-span-7 bg-[#080E27] border border-white/10 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-72 h-72 bg-[#FDB913]/5 rounded-full blur-3xl pointer-events-none" />

                            <form onSubmit={handleSubmit} noValidate className="space-y-6 relative z-10">
                                {/* PLAYER NAME */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label
                                            htmlFor="player-name"
                                            className="block text-xs font-bold text-gray-300 uppercase tracking-wider"
                                        >
                                            Player Full Name <span className="text-[#FDB913]">*</span>
                                        </label>
                                        <span className="text-[10px] text-gray-500 font-mono">Max 80 chars</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <User size={17} />
                                        </div>
                                        <input
                                            id="player-name"
                                            name="name"
                                            type="text"
                                            required
                                            value={form.name}
                                            placeholder="e.g. Virat Kohli"
                                            onChange={handleChange}
                                            maxLength={80}
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B1A] border ${
                                                errors.name
                                                    ? "border-red-500 focus:ring-red-500/20"
                                                    : "border-white/10 focus:border-[#FDB913] focus:ring-[#FDB913]/15"
                                            } focus:outline-none focus:ring-1 transition text-white placeholder-gray-500 text-sm`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1 font-medium">
                                            <AlertCircle size={12} /> {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* PLAYER ROLE SELECTION */}
                                <div className="space-y-2.5">
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Specialty Role <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {ROLES.map((r) => {
                                            const Icon = r.icon;
                                            const isActive = form.role === r.id;
                                            return (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    id={`role-${r.id.toLowerCase().replace(/\s+/g, "-")}`}
                                                    onClick={() => handleRoleSelect(r.id)}
                                                    className={`group relative p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 overflow-hidden cursor-pointer ${
                                                        isActive
                                                            ? `${r.activeBg} border-current ring-1 ring-white/10`
                                                            : "bg-[#050B1A] border-white/5 text-gray-400 hover:border-white/20 hover:text-white hover:bg-white/[0.02]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shrink-0 border transition-all ${
                                                            isActive
                                                                ? `${r.badgeBg}`
                                                                : "bg-white/5 border-white/10 text-gray-400 group-hover:text-white"
                                                        }`}
                                                    >
                                                        {r.image ? (
                                                            <img
                                                                src={r.image}
                                                                alt={r.label}
                                                                className="w-full h-full object-contain filter drop-shadow"
                                                            />
                                                        ) : (
                                                            <Icon size={18} />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span
                                                                className={`text-xs font-bold truncate ${
                                                                    isActive ? "text-white" : "text-gray-200"
                                                                }`}
                                                            >
                                                                {r.label}
                                                            </span>
                                                            {isActive && (
                                                                <CheckCircle2 size={13} className={r.color} />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                                            {r.desc}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.role && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1 font-medium">
                                            <AlertCircle size={12} /> {errors.role}
                                        </p>
                                    )}
                                </div>

                                {/* BASE POINTS ALLOCATION */}
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <label
                                            htmlFor="base-price"
                                            className="block text-xs font-bold text-gray-300 uppercase tracking-wider"
                                        >
                                            Base Bidding Points <span className="text-[#FDB913]">*</span>
                                        </label>
                                        {form.basePrice && Number(form.basePrice) > 0 && (
                                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                                <Coins size={12} /> {formatPoints(Number(form.basePrice))}
                                            </span>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Coins size={17} />
                                        </div>
                                        <input
                                            id="base-price"
                                            name="basePrice"
                                            type="number"
                                            min="1000"
                                            step="50000"
                                            required
                                            value={form.basePrice}
                                            placeholder="e.g. 200000"
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-28 py-3 rounded-xl bg-[#050B1A] border ${
                                                errors.basePrice
                                                    ? "border-red-500 focus:ring-red-500/20"
                                                    : "border-white/10 focus:border-[#FDB913] focus:ring-[#FDB913]/15"
                                            } focus:outline-none focus:ring-1 transition text-white placeholder-gray-500 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                        />

                                        {/* Quick stepper adjustments */}
                                        <div className="absolute inset-y-1 right-1 flex items-center gap-1 pr-1">
                                            <button
                                                type="button"
                                                onClick={() => handleAdjustPrice(100000)}
                                                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-gray-300 hover:text-white transition active:scale-95 cursor-pointer"
                                                title="Add 100,000 Points"
                                            >
                                                +100k
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleAdjustPrice(500000)}
                                                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-gray-300 hover:text-white transition active:scale-95 cursor-pointer"
                                                title="Add 500,000 Points"
                                            >
                                                +500k
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preset Pricing Chips */}
                                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">
                                            Presets:
                                        </span>
                                        {PRESET_PRICES.map((price) => (
                                            <button
                                                key={price}
                                                type="button"
                                                onClick={() => handlePresetPrice(price)}
                                                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                                    Number(form.basePrice) === price
                                                        ? "bg-[#FDB913]/15 border-[#FDB913]/40 text-[#FDB913] font-bold shadow-sm"
                                                        : "bg-[#050B1A] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                            >
                                                {price >= 1000000 ? `${price / 1000000}M` : `${price / 1000}k`} Pts
                                            </button>
                                        ))}
                                    </div>

                                    {errors.basePrice && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1 font-medium">
                                            <AlertCircle size={12} /> {errors.basePrice}
                                        </p>
                                    )}
                                </div>

                                {/* TOURNAMENT (READ-ONLY) */}
                                {tournamentName && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                            Assigned Tournament
                                        </label>
                                        <div className="flex items-center justify-between px-4 py-3 bg-[#050B1A] border border-white/10 rounded-xl">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Trophy size={16} className="text-[#FDB913] shrink-0" />
                                                <span className="text-sm font-semibold text-white truncate">
                                                    {tournamentName}
                                                </span>
                                                {tournamentPurse && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 font-mono hidden sm:inline">
                                                        Purse: {formatPoints(tournamentPurse)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider shrink-0">
                                                Locked
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500">
                                            Tournament assignment is fixed once a player is drafted to preserve auction integrity.
                                        </p>
                                    </div>
                                )}

                                {/* FORM ACTION BUTTONS */}
                                <div className="pt-3 flex flex-col sm:flex-row gap-3">
                                    <Link
                                        to="/players"
                                        className="py-3 px-5 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition text-center"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        id="submit-edit-player"
                                        type="submit"
                                        disabled={submitLoading}
                                        className="flex-1 py-3 px-6 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#FDB913] to-amber-500 hover:from-[#f5b30c] hover:to-amber-600 text-black transition-all duration-200 shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/30 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {submitLoading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Saving Changes…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Edit size={16} />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* ── REAL-TIME TRADING CARD PREVIEW (5 COLS) ── */}
                        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-bold tracking-widest text-[#FDB913] flex items-center gap-1.5 uppercase">
                                    <Activity size={14} /> LIVE AUCTION CARD PREVIEW
                                </span>
                                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/5 font-mono">
                                    REAL-TIME
                                </span>
                            </div>

                            {/* MAIN CRICKET PLAYER CARD */}
                            <div
                                className="bg-[#080E27] rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden transition-all duration-300"
                                style={{
                                    borderTopColor: selectedRoleConfig?.accent || "#FDB913",
                                    borderTopWidth: "3px",
                                }}
                            >
                                {/* Radial role ambient glow */}
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-40 transition-opacity"
                                    style={{
                                        background: selectedRoleConfig
                                            ? selectedRoleConfig.glow
                                            : "radial-gradient(circle at 50% 30%, rgba(253, 185, 19, 0.15), transparent 70%)",
                                    }}
                                />

                                {/* Card Header */}
                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 max-w-[170px] truncate">
                                        <Trophy size={12} className="text-[#FDB913] shrink-0" />
                                        <span className="truncate">
                                            {tournamentName || "Auction Pool"}
                                        </span>
                                    </div>

                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        REGISTERED
                                    </span>
                                </div>

                                {/* Hero Avatar & Role Illustration */}
                                <div className="flex flex-col items-center text-center relative z-10 mb-6">
                                    <div className="relative mb-3">
                                        {selectedRoleConfig?.image ? (
                                            <div
                                                className="w-24 h-24 rounded-3xl flex items-center justify-center p-3 border border-white/15 shadow-2xl relative overflow-hidden"
                                                style={{
                                                    background: `radial-gradient(circle at 50% 30%, ${selectedRoleConfig.accent}30, #050B1A 90%)`,
                                                }}
                                            >
                                                <img
                                                    src={selectedRoleConfig.image}
                                                    alt={selectedRoleConfig.label}
                                                    className="w-full h-full object-contain filter drop-shadow-xl"
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className="w-24 h-24 rounded-3xl flex items-center justify-center text-black font-black text-2xl shadow-2xl border-2 border-white/20"
                                                style={getAvatarStyle(form.name)}
                                            >
                                                {getInitials(form.name)}
                                            </div>
                                        )}

                                        <span
                                            className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierInfo.color}`}
                                        >
                                            {tierInfo.label}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-black text-white truncate max-w-full tracking-tight">
                                        {form.name.trim() || "Player Name"}
                                    </h3>

                                    <div className="mt-1.5 flex items-center gap-2">
                                        {selectedRoleConfig ? (
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${selectedRoleConfig.badgeBg}`}
                                            >
                                                <selectedRoleConfig.icon size={12} />
                                                {selectedRoleConfig.label}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-500 italic">No Role Selected</span>
                                        )}
                                    </div>
                                </div>

                                {/* Stats & Pricing Section */}
                                <div className="space-y-3 relative z-10">
                                    <div className="bg-[#050B1A] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                                                <Coins size={12} className="text-[#FDB913]" /> Base Bidding Points
                                            </p>
                                            <p className="text-2xl font-black text-emerald-400 mt-0.5">
                                                {formatPoints(Number(form.basePrice))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Tier</p>
                                            <p className="text-xs font-bold text-gray-200 mt-0.5">
                                                {tierInfo.label}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-[#050B1A] p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Award size={12} className="text-amber-400" /> Specialty
                                            </p>
                                            <p className="font-bold text-gray-200 mt-0.5 truncate">
                                                {form.role || "Pending Selection"}
                                            </p>
                                        </div>

                                        <div className="bg-[#050B1A] p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Flame size={12} className="text-red-400" /> Draft Status
                                            </p>
                                            <p className="font-bold text-gray-200 mt-0.5 truncate">
                                                Ready for Auction
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TIP BANNER */}
                            <div className="bg-[#080E27] rounded-2xl border border-white/5 p-4 text-xs text-gray-400 flex gap-3 shadow-lg">
                                <Sparkles className="text-[#FDB913] shrink-0 mt-0.5" size={16} />
                                <div className="leading-relaxed">
                                    <span className="font-bold text-white">Organizer Tip:</span> Base bidding points
                                    directly affect franchise purse management during the live auction room. Set realistic
                                    tiers to encourage competitive bidding wars.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EditPlayer;
