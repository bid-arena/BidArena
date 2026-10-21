import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { getTeamById, updateTeam } from "../../services/teamService";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
    Users,
    Trophy,
    User,
    Upload,
    ArrowLeft,
    Sparkles,
    Loader2,
    AlertCircle,
    Coins,
    Mail,
    Image as ImageIcon,
    Edit,
    X,
    Wallet,
    Shield
} from "lucide-react";
import toast from "react-hot-toast";

/* ─── Format Points Helper ────────────────────────────────── */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0) + " Pts";
};

/* ─── Dynamic Avatar Gradient Helper ──────────────────────── */
const getTeamAvatarStyle = (name) => {
    const hue = ((name?.charCodeAt(0) || 65) * 47) % 360;
    return {
        background: `linear-gradient(135deg, hsl(${hue}, 85%, 60%), hsl(${(hue + 45) % 360}, 90%, 45%))`,
    };
};

/* ══════════════════════════════════════════════════════════ */
const EditTeam = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loadingDetails, setLoadingDetails] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [teamData, setTeamData] = useState(null);
    const [preview, setPreview] = useState(null);

    const [form, setForm] = useState({
        name: "",
        ownerName: "",
        ownerEmail: "",
        logo: null
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getTeamById(id);
                setTeamData(data);
                setForm({
                    name: data.name || "",
                    ownerName: data.ownerName || "",
                    ownerEmail: data.ownerEmail || "",
                    logo: null
                });
                if (data.logo) {
                    setPreview(data.logo);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load team details.");
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchDetails();
    }, [id]);

    const validateField = (name, value) => {
        let tempErrors = { ...errors };
        if (name === "name") {
            if (!value || value.trim().length < 3) {
                tempErrors.name = "Team name must be at least 3 characters.";
            } else {
                delete tempErrors.name;
            }
        }
        if (name === "ownerName") {
            if (!value || value.trim().length < 3) {
                tempErrors.ownerName = "Owner name must be at least 3 characters.";
            } else {
                delete tempErrors.ownerName;
            }
        }
        if (name === "ownerEmail") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                tempErrors.ownerEmail = "Please enter a valid email address.";
            } else {
                delete tempErrors.ownerEmail;
            }
        }
        setErrors(tempErrors);
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (files && files[0]) {
            const file = files[0];

            if (file.size > 2 * 1024 * 1024) {
                toast.error("Logo file size must be less than 2MB.");
                return;
            }

            setForm((prev) => ({ ...prev, logo: file }));
            setPreview(URL.createObjectURL(file));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
            validateField(name, value);
        }
    };

    const handleRemoveLogo = () => {
        setForm((prev) => ({ ...prev, logo: null }));
        setPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = {};
        if (!form.name || form.name.trim().length < 3) {
            validationErrors.name = "Team name must be at least 3 characters.";
        }
        if (!form.ownerName || form.ownerName.trim().length < 3) {
            validationErrors.ownerName = "Owner name must be at least 3 characters.";
        }
        if (form.ownerEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.ownerEmail)) {
                validationErrors.ownerEmail = "Please enter a valid email address.";
            }
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Please fill all required team details.");
            return;
        }

        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name.trim());
            formData.append("ownerName", form.ownerName.trim());
            formData.append("ownerEmail", form.ownerEmail.trim());

            if (form.logo) {
                formData.append("logo", form.logo);
            }

            await updateTeam(id, formData);
            toast.success("Team profile updated successfully! ✅");
            navigate(`/teams/${id}`);
        } catch (error) {
            console.error("Team update error:", error);
            toast.error(error.response?.data?.message || "Failed to update team profile.");
        } finally {
            setUpdating(false);
        }
    };

    if (loadingDetails) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 size={24} className="animate-spin text-[#FDB913]" />
                        <span className="text-sm font-semibold">Loading franchise details…</span>
                    </div>
                </main>
            </div>
        );
    }

    const startingPurse = teamData?.purseAmount || 0;
    const remainingPurse = teamData?.remainingPurse || 0;
    const spentPurse = Math.max(0, startingPurse - remainingPurse);
    const spentPercent = startingPurse > 0 ? (spentPurse / startingPurse) * 100 : 0;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white selection:bg-[#FDB913] selection:text-black">
            <Sidebar />

            <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
                    {/* ── BACK NAVIGATION & HEADER ── */}
                    <div>
                        <Link
                            to={`/teams/${id}`}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#FDB913] transition mb-4 group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Franchise Squad</span>
                        </Link>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDB913]/20 to-amber-600/10 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shadow-lg shadow-yellow-500/10">
                                    <Edit size={22} />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                                        Edit Franchise Profile
                                    </h1>
                                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                                        Update branding, owner contacts, and logo artwork for{" "}
                                        <span className="text-[#FDB913] font-bold">{form.name || "Franchise"}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── CONTENT GRID: FORM (LEFT 7 COLS) + LIVE CARD (RIGHT 5 COLS) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                        {/* ── FORM CONTAINER (7 COLS) ── */}
                        <div className="lg:col-span-7 bg-[#080E27] border border-white/10 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-72 h-72 bg-[#FDB913]/5 rounded-full blur-3xl pointer-events-none" />

                            <form onSubmit={handleSubmit} noValidate className="space-y-6 relative z-10">
                                {/* FRANCHISE NAME */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label
                                            htmlFor="name"
                                            className="block text-xs font-bold text-gray-300 uppercase tracking-wider"
                                        >
                                            Franchise Team Name <span className="text-[#FDB913]">*</span>
                                        </label>
                                        <span className="text-[10px] text-gray-500 font-mono">Min 3 characters</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Trophy size={17} />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={form.name}
                                            placeholder="Franchise Name"
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

                                {/* OWNER NAME */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="ownerName"
                                        className="block text-xs font-bold text-gray-300 uppercase tracking-wider"
                                    >
                                        Owner / Captain Name <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <User size={17} />
                                        </div>
                                        <input
                                            id="ownerName"
                                            name="ownerName"
                                            type="text"
                                            required
                                            value={form.ownerName}
                                            placeholder="Owner Name"
                                            onChange={handleChange}
                                            maxLength={80}
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B1A] border ${
                                                errors.ownerName
                                                    ? "border-red-500 focus:ring-red-500/20"
                                                    : "border-white/10 focus:border-[#FDB913] focus:ring-[#FDB913]/15"
                                            } focus:outline-none focus:ring-1 transition text-white placeholder-gray-500 text-sm`}
                                        />
                                    </div>
                                    {errors.ownerName && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1 font-medium">
                                            <AlertCircle size={12} /> {errors.ownerName}
                                        </p>
                                    )}
                                </div>

                                {/* OWNER EMAIL */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="ownerEmail"
                                        className="block text-xs font-bold text-gray-300 uppercase tracking-wider"
                                    >
                                        Owner Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Mail size={17} />
                                        </div>
                                        <input
                                            id="ownerEmail"
                                            name="ownerEmail"
                                            type="email"
                                            value={form.ownerEmail}
                                            placeholder="Owner Email"
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B1A] border ${
                                                errors.ownerEmail
                                                    ? "border-red-500 focus:ring-red-500/20"
                                                    : "border-white/10 focus:border-[#FDB913] focus:ring-[#FDB913]/15"
                                            } focus:outline-none focus:ring-1 transition text-white placeholder-gray-500 text-sm`}
                                        />
                                    </div>
                                    {errors.ownerEmail && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1 font-medium">
                                            <AlertCircle size={12} /> {errors.ownerEmail}
                                        </p>
                                    )}
                                </div>

                                {/* TOURNAMENT (LOCKED / READ-ONLY) */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Assigned Tournament
                                    </label>
                                    <div className="flex items-center justify-between px-4 py-3 bg-[#050B1A] border border-white/10 rounded-xl">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Trophy size={16} className="text-[#FDB913] shrink-0" />
                                            <span className="text-sm font-semibold text-white truncate">
                                                {teamData?.tournament?.name || "League Competition"}
                                            </span>
                                            {teamData?.tournament?.purseAmount && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 font-mono hidden sm:inline">
                                                    Purse: {formatCurrency(teamData.tournament.purseAmount)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider shrink-0">
                                            Locked
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        Tournament assignment is fixed once a franchise is enrolled to protect league purse allocations.
                                    </p>
                                </div>

                                {/* TEAM LOGO UPLOAD */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Team Logo Artwork
                                    </label>

                                    {preview ? (
                                        <div className="p-4 rounded-2xl bg-[#050B1A] border border-white/10 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <img
                                                    src={preview}
                                                    alt="Preview Logo"
                                                    className="w-14 h-14 rounded-2xl object-cover border border-[#FDB913]/40 shadow-lg shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">
                                                        {form.logo ? form.logo.name : "Current Team Logo"}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                                                        {form.logo ? "New logo staged" : "Active on roster"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white border border-white/10 transition cursor-pointer">
                                                    Change
                                                    <input
                                                        type="file"
                                                        name="logo"
                                                        accept="image/*"
                                                        onChange={handleChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                                                    title="Remove Logo"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 hover:border-[#FDB913]/40 rounded-2xl cursor-pointer bg-[#050B1A]/50 hover:bg-[#050B1A] transition group">
                                            <div className="flex flex-col items-center justify-center p-4 text-center">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-[#FDB913]/10 text-gray-400 group-hover:text-[#FDB913] border border-white/10 flex items-center justify-center mb-2 transition">
                                                    <Upload size={18} />
                                                </div>
                                                <p className="text-xs text-gray-300 font-semibold">
                                                    <span className="text-[#FDB913] underline font-bold">Click to upload</span> or drag and drop logo
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, or SVG (Max 2MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                name="logo"
                                                accept="image/*"
                                                onChange={handleChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* FORM ACTION BUTTONS */}
                                <div className="pt-3 flex flex-col sm:flex-row gap-3">
                                    <Link
                                        to={`/teams/${id}`}
                                        className="py-3 px-5 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition text-center"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        id="submit-edit-team"
                                        type="submit"
                                        disabled={updating}
                                        className="flex-1 py-3 px-6 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#FDB913] to-amber-500 hover:from-[#f5b30c] hover:to-amber-600 text-black transition-all duration-200 shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/30 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {updating ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Saving Changes…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Edit size={16} />
                                                <span>Save Franchise Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* ── REAL-TIME LIVE TEAM CARD PREVIEW (5 COLS, STICKY) ── */}
                        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-bold tracking-widest text-[#FDB913] flex items-center gap-1.5 uppercase">
                                    <Shield size={14} /> LIVE FRANCHISE CARD PREVIEW
                                </span>
                                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/5 font-mono">
                                    REAL-TIME
                                </span>
                            </div>

                            {/* MAIN FRANCHISE CARD */}
                            <div className="bg-[#080E27] rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
                                {/* Top Ambient Glow */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#FDB913]/10 rounded-full blur-3xl pointer-events-none" />

                                {/* Card Header */}
                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 max-w-[170px] truncate">
                                        <Trophy size={12} className="text-[#FDB913] shrink-0" />
                                        <span className="truncate">
                                            {teamData?.tournament?.name || "League"}
                                        </span>
                                    </div>

                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        ENROLLED FRANCHISE
                                    </span>
                                </div>

                                {/* Logo / Title Block */}
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Team Logo"
                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FDB913] shadow-xl shrink-0 bg-[#050B1A]"
                                        />
                                    ) : (
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-xl shrink-0 border border-white/20"
                                            style={getTeamAvatarStyle(form.name)}
                                        >
                                            {form.name ? form.name.substring(0, 2).toUpperCase() : "TM"}
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-xl font-black text-white truncate tracking-tight">
                                            {form.name.trim() || "Franchise Name"}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                                            <User size={12} className="text-gray-500 shrink-0" />
                                            <span className="truncate">
                                                Owner: <strong className="text-gray-300">{form.ownerName.trim() || "Not set yet"}</strong>
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate mt-0.5">
                                            <Mail size={11} className="text-gray-600 shrink-0" />
                                            <span className="truncate">{form.ownerEmail.trim() || "No email provided"}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Stats & Purse Breakdown */}
                                <div className="space-y-3 relative z-10">
                                    <div className="bg-[#050B1A] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                                                <Wallet size={12} className="text-emerald-400" /> Remaining Points
                                            </p>
                                            <p className="text-2xl font-black text-emerald-400 mt-0.5">
                                                {formatCurrency(remainingPurse)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Starting</p>
                                            <p className="text-xs font-bold text-gray-200 mt-0.5">
                                                {formatCurrency(startingPurse)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Purse Burn Progress Bar */}
                                    <div className="bg-[#050B1A] p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-400 font-bold uppercase tracking-wider">
                                                Purse Spent: {formatCurrency(spentPurse)}
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

                            {/* PRO TIP BOX */}
                            <div className="bg-[#080E27] rounded-2xl border border-white/5 p-4 text-xs text-gray-400 flex gap-3 shadow-lg">
                                <Sparkles className="text-[#FDB913] shrink-0 mt-0.5" size={16} />
                                <div className="leading-relaxed">
                                    <span className="font-bold text-white">Roster Tip:</span> Updating franchise branding will reflect immediately across live auction rooms, participant cards, and team roster leaderboards.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EditTeam;
