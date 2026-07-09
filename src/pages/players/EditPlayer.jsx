import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    User,
    ArrowLeft,
    Trophy,
    IndianRupee,
    ShieldCheck,
    Loader2,
    Edit,
    Target,
    Zap,
    Users,
    AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getPlayerById, updatePlayer } from "../../services/playerService";

const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];

const ROLE_ICONS = {
    Batsman: { icon: Target, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    Bowler: { icon: Zap, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    "All-Rounder": { icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    "Wicket-Keeper": { icon: Users, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

/* ══════════════════════════════════════════════════════════ */
const EditPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [pageLoading, setPageLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // tournamentName is display-only — the API does not allow changing a player's tournament
    const [tournamentName, setTournamentName] = useState("");

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

                if (!player) { setNotFound(true); return; }

                setForm({
                    name: player.name || "",
                    role: player.role || "",
                    basePrice: player.basePrice?.toString() || "",
                });

                // tournament is a nested object: { id, name }
                setTournamentName(player.tournament?.name || "");
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

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Player name is required.";
        else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
        if (!form.role) e.role = "Please select a role.";
        if (!form.basePrice) e.basePrice = "Base price is required.";
        else if (Number(form.basePrice) <= 0) e.basePrice = "Base price must be greater than 0.";
        return e;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    };

    const handleRoleSelect = (role) => {
        setForm((prev) => ({ ...prev, role }));
        if (errors.role) setErrors((prev) => { const next = { ...prev }; delete next.role; return next; });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Please fix the errors before submitting.");
            return;
        }

        setSubmitLoading(true);
        try {
            // API only accepts name, role, basePrice — not tournamentId
            await updatePlayer(id, {
                name: form.name.trim(),
                role: form.role,
                basePrice: Number(form.basePrice),
            });
            toast.success("Player updated successfully! ✅");
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
            <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] via-[#060C21] to-[#020617] text-white">
                <Sidebar />
                <main className="flex-1 p-8 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 size={22} className="animate-spin text-[#FDB913]" />
                        <span className="text-sm">Loading player…</span>
                    </div>
                </main>
            </div>
        );
    }

    /* ── Not found ── */
    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] via-[#060C21] to-[#020617] text-white">
                <Sidebar />
                <main className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertCircle size={28} className="text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Player Not Found</h2>
                    <p className="text-sm text-gray-500">This player doesn't exist or was already deleted.</p>
                    <Link to="/players" className="mt-2 inline-flex items-center gap-2 bg-[#FDB913] hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl transition-all">
                        <ArrowLeft size={16} />
                        Back to Players
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] via-[#060C21] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/players"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition mb-5 group"
                    >
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Players
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center">
                            <Edit size={20} className="text-[#FDB913]" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Edit Player
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Update the details for{" "}
                                <span className="text-white font-semibold">{form.name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="bg-[#080E27] border border-white/6 rounded-2xl overflow-hidden">
                            {/* Card header */}
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                                <Edit size={16} className="text-[#FDB913]" />
                                <p className="text-sm font-bold text-white">Player Details</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Player Name */}
                                <div>
                                    <label htmlFor="player-name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Player Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                            <User size={16} />
                                        </div>
                                        <input
                                            id="player-name"
                                            name="name"
                                            type="text"
                                            placeholder="e.g. Virat Kohli"
                                            value={form.name}
                                            onChange={handleChange}
                                            maxLength={80}
                                            className={`w-full bg-[#080E27] border ${errors.name ? "border-red-500/50 focus:border-red-500/70" : "border-white/8 focus:border-[#FDB913]/40"
                                                } rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 ${errors.name ? "focus:ring-red-500/20" : "focus:ring-[#FDB913]/15"
                                                } transition-all duration-200`}
                                        />
                                    </div>
                                    {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                                </div>

                                {/* Role selector */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Player Role
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {ROLES.map((role) => {
                                            const cfg = ROLE_ICONS[role];
                                            const Icon = cfg.icon;
                                            const active = form.role === role;
                                            return (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    id={`role-${role.toLowerCase().replace(/\s+/g, "-")}`}
                                                    onClick={() => handleRoleSelect(role)}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${active
                                                            ? `${cfg.bg} ${cfg.color} border-current shadow-lg`
                                                            : "bg-white/3 border-white/8 text-gray-500 hover:text-white hover:bg-white/6 hover:border-white/15"
                                                        }`}
                                                >
                                                    <Icon size={18} />
                                                    {role}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.role && (
                                        <p className="mt-1.5 text-xs text-red-400">{errors.role}</p>
                                    )}
                                </div>

                                {/* Base Price */}
                                <div>
                                    <label htmlFor="base-price" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Base Price (₹)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                            <IndianRupee size={16} />
                                        </div>
                                        <input
                                            id="base-price"
                                            name="basePrice"
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 200000"
                                            value={form.basePrice}
                                            onChange={handleChange}
                                            className={`w-full bg-[#080E27] border ${errors.basePrice ? "border-red-500/50 focus:border-red-500/70" : "border-white/8 focus:border-[#FDB913]/40"
                                                } rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 ${errors.basePrice ? "focus:ring-red-500/20" : "focus:ring-[#FDB913]/15"
                                                } transition-all duration-200`}
                                        />
                                    </div>
                                    {form.basePrice && Number(form.basePrice) > 0 && (
                                        <p className="mt-1.5 text-xs text-green-400 font-semibold">
                                            ≈ {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(form.basePrice))}
                                        </p>
                                    )}
                                    {errors.basePrice && <p className="mt-1.5 text-xs text-red-400">{errors.basePrice}</p>}
                                </div>

                                {/* Tournament — read-only, cannot be changed via this API */}
                                {tournamentName && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            Tournament
                                        </label>
                                        <div className="flex items-center gap-2.5 px-4 py-3 bg-white/3 border border-white/8 rounded-xl">
                                            <Trophy size={15} className="text-[#FDB913] shrink-0" />
                                            <span className="text-sm text-gray-300 font-medium">{tournamentName}</span>
                                            <span className="ml-auto text-[10px] text-gray-600 font-semibold uppercase tracking-wide">Read-only</span>
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-gray-600">
                                            Tournament assignment cannot be changed after creation.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Card footer */}
                            <div className="px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/players"
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition text-center"
                                >
                                    Cancel
                                </Link>
                                <button
                                    id="submit-edit-player"
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#FDB913] hover:bg-amber-400 disabled:opacity-60 text-black transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/35 hover:scale-[1.01] flex items-center justify-center gap-2"
                                >
                                    {submitLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            <Edit size={16} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditPlayer;
