import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    User,
    ArrowLeft,
    Trophy,
    Coins,
    ShieldCheck,
    Loader2,
    Sparkles,
    Target,
    Zap,
    Users,
    AlertCircle,
    CheckCircle2,
    Award,
    Activity,
    Flame,
    Plus,
    FileSpreadsheet
} from "lucide-react";
import { toast } from "react-hot-toast";
import { createPlayer } from "../../services/playerService";
import api from "../../services/api";
import BulkPlayerUploadModal from "../../components/players/BulkPlayerUploadModal";

const ROLES = [
    {
        id: "Batsman",
        label: "Batsman",
        desc: "Top-order & power hitter",
        icon: Target,
        color: "text-blue-400",
        activeBg: "bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/10",
        badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        glow: "from-blue-500/20 to-transparent"
    },
    {
        id: "Bowler",
        label: "Bowler",
        desc: "Pace & spin specialist",
        icon: Zap,
        color: "text-red-400",
        activeBg: "bg-red-500/15 border-red-500/40 text-red-400 shadow-lg shadow-red-500/10",
        badgeBg: "bg-red-500/20 text-red-300 border-red-500/30",
        glow: "from-red-500/20 to-transparent"
    },
    {
        id: "All-Rounder",
        label: "All-Rounder",
        desc: "Batting & bowling asset",
        icon: ShieldCheck,
        color: "text-purple-400",
        activeBg: "bg-purple-500/15 border-purple-500/40 text-purple-400 shadow-lg shadow-purple-500/10",
        badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        glow: "from-purple-500/20 to-transparent"
    },
    {
        id: "Wicket-Keeper",
        label: "Wicket-Keeper",
        desc: "Gloveman & finisher",
        icon: Users,
        color: "text-amber-400",
        activeBg: "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        glow: "from-amber-500/20 to-transparent"
    }
];

const PRESET_PRICES = [100000, 200000, 500000, 1000000, 2000000];

const formatPoints = (n) => {
    if (!n || isNaN(n)) return "0 Pts";
    return new Intl.NumberFormat("en-IN").format(n) + " Pts";
};

const getAvatarStyle = (name) => {
    const hue = (name?.charCodeAt(0) || 75) * 23 % 360;
    return {
        background: `linear-gradient(135deg, hsl(${hue}, 80%, 55%), hsl(${(hue + 45) % 360}, 85%, 45%))`
    };
};

const getInitials = (name) => {
    if (!name || !name.trim()) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AddPlayer = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlTournamentId = searchParams.get("tournamentId");

    const [loading, setLoading] = useState(false);
    const [tournaments, setTournaments] = useState([]);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);

    const [form, setForm] = useState({
        name: "",
        role: "",
        basePrice: "",
        tournamentId: urlTournamentId || "",
    });

    const [errors, setErrors] = useState({});

    /* Load tournaments */
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get("/tournaments/organizer");
                const list = res.data.data || [];
                setTournaments(list);
                if (list.length > 0) {
                    const matched = urlTournamentId ? list.find(t => String(t.id) === String(urlTournamentId)) : null;
                    setForm(prev => ({ ...prev, tournamentId: matched ? matched.id : prev.tournamentId || list[0].id }));
                }
            } catch (err) {
                console.error("Tournaments load error:", err);
                toast.error("Failed to load tournaments");
            }
        };
        load();
    }, [urlTournamentId]);

    const selectedTournament = tournaments.find(t => t.id === form.tournamentId);
    const selectedRoleConfig = ROLES.find(r => r.id === form.role);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Player name is required.";
        else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
        if (!form.role) e.role = "Please select a player role.";
        if (!form.basePrice) e.basePrice = "Base points allocation is required.";
        else if (Number(form.basePrice) <= 0) e.basePrice = "Base points must be greater than 0.";
        if (!form.tournamentId) e.tournamentId = "Please select a tournament.";
        return e;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    };

    const handleRoleSelect = (roleId) => {
        setForm((prev) => ({ ...prev, role: roleId }));
        if (errors.role) setErrors((prev) => { const next = { ...prev }; delete next.role; return next; });
    };

    const handlePresetPrice = (price) => {
        setForm((prev) => ({ ...prev, basePrice: String(price) }));
        if (errors.basePrice) setErrors((prev) => { const next = { ...prev }; delete next.basePrice; return next; });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Please resolve form errors before creating the player.");
            return;
        }

        setLoading(true);
        try {
            await createPlayer({
                name: form.name.trim(),
                role: form.role,
                basePrice: Number(form.basePrice),
                tournamentId: form.tournamentId,
            });
            toast.success("Player created successfully! 🎉");
            navigate("/players");
        } catch (err) {
            console.error("Create player error:", err);
            toast.error(err.response?.data?.message || "Failed to create player.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] via-[#060C21] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* BACK NAVIGATION */}
                    <Link
                        to="/players"
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-[#FDB913] transition mb-6 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Players Pool</span>
                    </Link>

                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-[#FDB913]/10 border border-[#FDB913]/25 flex items-center justify-center shadow-lg shadow-yellow-500/5">
                                <User size={24} className="text-[#FDB913]" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                                    Add New Player
                                </h1>
                                <p className="text-gray-400 text-sm mt-0.5">
                                    Register players and define base bidding points for live tournament auctions
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setBulkModalOpen(true)}
                                className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer"
                            >
                                <FileSpreadsheet size={14} className="text-emerald-400" />
                                <span>Bulk Import Spreadsheet</span>
                            </button>
                            <div className="flex items-center gap-2 bg-[#001F54]/50 border border-white/10 px-3.5 py-1.5 rounded-full">
                                <Sparkles size={14} className="text-[#FDB913]" />
                                <span className="text-xs font-semibold text-gray-300">
                                    Single Player Registration
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT GRID: FORM (LEFT) + LIVE PREVIEW (RIGHT) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* FORM CONTAINER */}
                        <div className="lg:col-span-7 bg-[#0F1E4D]/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                            {/* Subtle Ambient Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                            <form onSubmit={handleSubmit} noValidate className="space-y-6 relative z-10">
                                {/* PLAYER NAME */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="player-name" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                            Player Full Name <span className="text-[#FDB913]">*</span>
                                        </label>
                                        <span className="text-[10px] text-gray-500">Max 80 chars</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <User size={18} />
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
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#080E27]/80 border ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#FDB913]/60 focus:ring-[#FDB913]/15'
                                                } focus:outline-none focus:ring-2 transition text-white placeholder-gray-600 text-sm`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* PLAYER ROLE SELECTION */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Select Player Specialty / Role <span className="text-[#FDB913]">*</span>
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
                                                    className={`group relative p-3.5 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 overflow-hidden ${isActive
                                                            ? `${r.activeBg} border-current`
                                                            : 'bg-[#080E27]/60 border-white/8 text-gray-400 hover:border-white/20 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className={`p-2 rounded-lg ${isActive ? r.badgeBg : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-200'}`}>
                                                                {r.label}
                                                            </span>
                                                            {isActive && (
                                                                <CheckCircle2 size={14} className={r.color} />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                            {r.desc}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.role && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.role}
                                        </p>
                                    )}
                                </div>

                                {/* BASE POINTS & PRESETS */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="base-price" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                            Base Bidding Points <span className="text-[#FDB913]">*</span>
                                        </label>
                                        {form.basePrice && Number(form.basePrice) > 0 && (
                                            <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                                                <Coins size={12} /> {formatPoints(Number(form.basePrice))}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Coins size={18} />
                                        </div>
                                        <input
                                            id="base-price"
                                            name="basePrice"
                                            type="number"
                                            min="1"
                                            required
                                            value={form.basePrice}
                                            placeholder="e.g. 200000"
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#080E27]/80 border ${errors.basePrice ? 'border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#FDB913]/60 focus:ring-[#FDB913]/15'
                                                } focus:outline-none focus:ring-2 transition text-white placeholder-gray-600 text-sm`}
                                        />
                                    </div>

                                    {/* Quick Preset Buttons */}
                                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] text-gray-500 font-semibold mr-1">Quick Select:</span>
                                        {PRESET_PRICES.map((price) => (
                                            <button
                                                key={price}
                                                type="button"
                                                onClick={() => handlePresetPrice(price)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${Number(form.basePrice) === price
                                                        ? 'bg-[#FDB913]/20 border-[#FDB913]/50 text-[#FDB913]'
                                                        : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8 hover:text-white'
                                                    }`}
                                            >
                                                {price >= 1000000 ? `${price / 1000000}M` : `${price / 1000}k`} Pts
                                            </button>
                                        ))}
                                    </div>

                                    {errors.basePrice && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.basePrice}
                                        </p>
                                    )}
                                </div>

                                {/* TOURNAMENT SELECTOR */}
                                <div className="space-y-2">
                                    <label htmlFor="tournament-select" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Assign to Tournament <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Trophy size={18} />
                                        </div>
                                        <select
                                            id="tournament-select"
                                            name="tournamentId"
                                            value={form.tournamentId}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-10 py-3 rounded-xl bg-[#080E27]/80 border ${errors.tournamentId ? 'border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#FDB913]/60 focus:ring-[#FDB913]/15'
                                                } focus:outline-none focus:ring-2 transition text-white text-sm appearance-none cursor-pointer`}
                                        >
                                            <option value="" disabled className="bg-[#080E27]">Select a tournament…</option>
                                            {tournaments.map((t) => (
                                                <option key={t.id} value={t.id} className="bg-[#080E27]">
                                                    {t.name} ({formatPoints(t.purseAmount)})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                                            ▼
                                        </div>
                                    </div>

                                    {tournaments.length === 0 && (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                                            <span>No active tournaments available.</span>
                                            <Link to="/tournaments/add" className="underline font-bold text-[#FDB913]">
                                                Create Tournament
                                            </Link>
                                        </div>
                                    )}

                                    {errors.tournamentId && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.tournamentId}
                                        </p>
                                    )}
                                </div>

                                {/* FORM BUTTONS */}
                                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                    <Link
                                        to="/players"
                                        className="py-3.5 px-5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition text-center"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        id="submit-player"
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3.5 px-6 rounded-xl text-sm font-extrabold bg-gradient-to-r from-[#FDB913] via-amber-400 to-yellow-500 hover:from-[#fec435] hover:to-[#f0ac11] text-black transition-all duration-300 shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Creating Player Profile…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={18} />
                                                <span>Register Player</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* LIVE PLAYER CARD PREVIEW (RIGHT) */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-bold tracking-widest text-[#FDB913] flex items-center gap-1.5 uppercase">
                                    <Activity size={14} /> LIVE AUCTION CARD PREVIEW
                                </span>
                                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5">
                                    REAL-TIME
                                </span>
                            </div>

                            {/* MAIN PLAYER CARD */}
                            <div className="bg-gradient-to-b from-[#0F1E4D] to-[#080E27] rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden group">
                                {/* Ambient Lights inside Card */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-2 bg-[#001F54]/80 px-3 py-1.5 rounded-full border border-white/10">
                                        <Trophy size={13} className="text-[#FDB913]" />
                                        <span className="text-[11px] font-semibold text-gray-300 truncate max-w-[140px]">
                                            {selectedTournament ? selectedTournament.name : "Select Tournament"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] bg-yellow-500/10 text-[#FDB913] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-[#FDB913]/25 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913] animate-pulse" />
                                        UNSOLD POOL
                                    </span>
                                </div>

                                {/* Avatar & Role Header */}
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    {/* DYNAMIC AVATAR */}
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-xl border-2 border-white/20 shrink-0"
                                        style={getAvatarStyle(form.name)}
                                    >
                                        {getInitials(form.name)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-xl font-black text-white truncate tracking-tight">
                                            {form.name.trim() || "Player Name"}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            {selectedRoleConfig ? (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${selectedRoleConfig.badgeBg}`}>
                                                    <selectedRoleConfig.icon size={12} />
                                                    {selectedRoleConfig.label}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500 italic">No Role Selected</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-white/5 my-4" />

                                {/* STATS / PRICING GRID */}
                                <div className="space-y-3.5 relative z-10 text-sm">
                                    <div className="bg-[#001F54]/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                                                <Coins size={12} className="text-[#FDB913]" /> Base Points
                                            </p>
                                            <p className="text-xl font-black text-green-400 mt-0.5">
                                                {formatPoints(Number(form.basePrice))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Tier</p>
                                            <p className="text-xs font-bold text-gray-300">
                                                {Number(form.basePrice) >= 1000000 ? "Marquee" : Number(form.basePrice) >= 500000 ? "Gold" : "Standard"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-[#001F54]/30 p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Award size={12} className="text-amber-400" /> Category
                                            </p>
                                            <p className="font-bold text-gray-200 mt-0.5">
                                                {form.role || "TBD"}
                                            </p>
                                        </div>

                                        <div className="bg-[#001F54]/30 p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Flame size={12} className="text-red-400" /> Bidding Status
                                            </p>
                                            <p className="font-bold text-gray-200 mt-0.5">
                                                Ready for Auction
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PRO TIP CARD */}
                            <div className="bg-[#0F1E4D]/20 rounded-xl border border-white/5 p-4 text-xs text-gray-400 flex gap-3">
                                <Sparkles className="text-[#FDB913] shrink-0 mt-0.5" size={16} />
                                <div>
                                    <span className="font-semibold text-gray-200">Auction Setup Tip:</span> Setting fair base points ensures smooth team purse calculations and prevents bidding standstills during live rounds.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* BULK PLAYER UPLOAD MODAL */}
            <BulkPlayerUploadModal
                isOpen={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                tournamentId={form.tournamentId || (tournaments[0]?.id)}
                tournamentName={selectedTournament?.name || "Tournament"}
                onSuccess={() => {
                    if (form.tournamentId) {
                        navigate(`/tournaments/${form.tournamentId}`);
                    }
                }}
            />
        </div>
    );
};

export default AddPlayer;
