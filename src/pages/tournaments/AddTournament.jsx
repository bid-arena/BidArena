import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { createTournament } from "../../services/tournamentService";
import { useNavigate, Link } from "react-router-dom";
import {
    Trophy,
    MapPin,
    Calendar,
    Coins,
    Users,
    ArrowLeft,
    Sparkles,
    Loader2,
    AlertCircle,
    ChevronDown,
    Check,
    Plus,
    RotateCcw,
    Building2,
    Shield,
    Globe,
    Flame
} from "lucide-react";
import { toast } from "react-hot-toast";

/* ─── Format Points Helper ────────────────────────────────── */
const formatCurrency = (amount) => {
    if (!amount) return "0 Pts";
    return new Intl.NumberFormat("en-IN").format(amount) + " Pts";
};

/* ─── Format Date Helper ──────────────────────────────────── */
const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-IN", options);
};

/* ─── Venue Presets ───────────────────────────────────────── */
const VENUE_PRESETS = [
    { label: "Online / Virtual Auction Room", icon: Globe },
    { label: "Wankhede Stadium, Mumbai", icon: Building2 },
    { label: "M. Chinnaswamy Stadium, Bengaluru", icon: Building2 },
    { label: "Eden Gardens, Kolkata", icon: Building2 },
    { label: "Narendra Modi Stadium, Ahmedabad", icon: Building2 },
    { label: "Arun Jaitley Stadium, Delhi", icon: Building2 },
    { label: "MA Chidambaram Stadium, Chennai", icon: Building2 },
    { label: "Rajiv Gandhi Stadium, Hyderabad", icon: Building2 },
    { label: "Dubai International Stadium, UAE", icon: Globe },
    { label: "Lord's Cricket Ground, London", icon: Globe }
];

/* ─── Purse Budget Presets ────────────────────────────────── */
const PURSE_PRESETS = [
    { label: "5 Lakhs (500,000 Pts)", value: 500000, desc: "Mini Community League" },
    { label: "10 Lakhs (1,000,000 Pts)", value: 1000000, desc: "Standard Club Tourney" },
    { label: "25 Lakhs (2,500,000 Pts)", value: 2500000, desc: "State Level Cup" },
    { label: "50 Lakhs (5,000,000 Pts)", value: 5000000, desc: "Premier Invitational" },
    { label: "1 Crore (10,000,000 Pts)", value: 10000000, desc: "Franchise Auction" },
    { label: "2.5 Crores (25,000,000 Pts)", value: 25000000, desc: "Super League Mega Cup" },
    { label: "5 Crores (50,000,000 Pts)", value: 50000000, desc: "Grand National Auction" }
];

/* ─── Max Teams Presets ───────────────────────────────────── */
const TEAMS_PRESETS = [
    { label: "4 Teams (Quadrangular)", value: 4 },
    { label: "6 Teams (Standard Division)", value: 6 },
    { label: "8 Teams (Franchise Classic)", value: 8 },
    { label: "10 Teams (Expanded League)", value: 10 },
    { label: "12 Teams (Major Championship)", value: 12 },
    { label: "16 Teams (Super 16 Cup)", value: 16 },
    { label: "No Limit (Open Roster)", value: "" }
];

/* ─── Generic Dropdown Component ──────────────────────────── */
const GlassDropdown = ({
    id,
    label,
    icon: Icon,
    selectedText,
    children,
    badge
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

    return (
        <div ref={ref} className="relative inline-block text-left w-full sm:w-auto">
            <button
                type="button"
                id={id}
                onClick={() => setOpen((prev) => !prev)}
                className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    open
                        ? "bg-[#0F1B3D] border-[#FDB913] text-white shadow-lg ring-1 ring-[#FDB913]/30"
                        : "bg-[#050B1A]/80 border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-[#0c1435]"
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && (
                        <Icon
                            size={14}
                            className={open ? "text-[#FDB913]" : "text-amber-400 shrink-0"}
                        />
                    )}
                    {label && <span className="text-gray-400 font-normal">{label}:</span>}
                    <span className="font-bold text-white truncate max-w-[170px] sm:max-w-[210px]">
                        {selectedText || "Select"}
                    </span>
                    {badge && (
                        <span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded font-mono">
                            {badge}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        open ? "rotate-180 text-[#FDB913]" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#0A122C]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto space-y-1"
                >
                    {children}
                </div>
            )}
        </div>
    );
};

const AddTournament = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        location: "",
        date: "",
        purseAmount: "",
        maxTeams: ""
    });

    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        let tempErrors = { ...errors };
        if (name === "name") {
            if (value && value.trim().length < 3) {
                tempErrors.name = "Tournament name must be at least 3 characters.";
            } else {
                delete tempErrors.name;
            }
        }
        if (name === "date") {
            if (value) {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    tempErrors.date = "Notice: The selected date is in the past.";
                } else {
                    delete tempErrors.date;
                }
            }
        }
        if (name === "purseAmount") {
            if (value && Number(value) <= 0) {
                tempErrors.purseAmount = "Points budget must be greater than 0.";
            } else {
                delete tempErrors.purseAmount;
            }
        }
        if (name === "maxTeams") {
            if (value && (Number(value) < 2 || Number(value) > 100)) {
                tempErrors.maxTeams = "Teams limit must be between 2 and 100.";
            } else {
                delete tempErrors.maxTeams;
            }
        }
        setErrors(tempErrors);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
        validateField(name, value);
    };

    const handlePursePreset = (amount) => {
        setForm((prev) => ({
            ...prev,
            purseAmount: String(amount)
        }));
        validateField("purseAmount", amount);
    };

    const handlePurseStep = (increment) => {
        const current = Number(form.purseAmount) || 0;
        const next = Math.max(0, current + increment);
        setForm((prev) => ({
            ...prev,
            purseAmount: String(next)
        }));
        validateField("purseAmount", next);
    };

    const handleTeamsPreset = (teams) => {
        setForm((prev) => ({
            ...prev,
            maxTeams: teams === "" ? "" : String(teams)
        }));
        validateField("maxTeams", teams);
    };

    const handleVenuePreset = (venueName) => {
        setForm((prev) => ({
            ...prev,
            location: venueName
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation check (excluding non-fatal notice)
        if (
            Object.keys(errors).some(
                (key) => errors[key] && !errors[key].startsWith("Notice")
            )
        ) {
            toast.error("Please resolve highlighted form errors.");
            return;
        }

        setLoading(true);
        try {
            await createTournament({
                name: form.name.trim(),
                location: form.location.trim(),
                date: form.date,
                purseAmount: Number(form.purseAmount),
                maxTeams: form.maxTeams ? Number(form.maxTeams) : 0
            });
            toast.success("Tournament created successfully!");
            navigate("/tournaments");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to create tournament");
        } finally {
            setLoading(false);
        }
    };

    // Derived preview stats
    const perTeamAllocation =
        form.purseAmount && form.maxTeams && Number(form.maxTeams) > 0
            ? Math.floor(Number(form.purseAmount) / Number(form.maxTeams))
            : null;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* TOP BREADCRUMB & HEADER */}
                    <div>
                        <Link
                            to="/tournaments"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group text-xs font-semibold mb-4"
                        >
                            <ArrowLeft
                                size={14}
                                className="group-hover:-translate-x-1 transition-transform"
                            />
                            <span>Back to Tournaments</span>
                        </Link>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#FDB913]/10 border border-[#FDB913]/20 rounded-2xl shadow-lg shadow-[#FDB913]/5">
                                    <Trophy size={26} className="text-[#FDB913]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                            Create Tournament
                                        </h1>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/30 px-2 py-0.5 rounded-full">
                                            Draft Season
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                                        Configure league purse, venue, dates, and maximum teams capacity.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MAIN TWO-COLUMN LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* FORM COLUMN (7 cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            <form
                                onSubmit={handleSubmit}
                                className="bg-[#080E27]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
                            >
                                {/* SECTION: BASIC DETAILS */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                        <span className="text-xs font-bold tracking-widest text-[#FDB913] uppercase flex items-center gap-1.5">
                                            <Sparkles size={13} /> Basic Information
                                        </span>
                                        <span className="text-[11px] text-gray-400">* Required fields</span>
                                    </div>

                                    {/* TOURNAMENT NAME */}
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="name"
                                            className="block text-xs font-semibold text-gray-300"
                                        >
                                            Tournament Title <span className="text-[#FDB913]">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <Trophy size={16} />
                                            </div>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="e.g. Champions Premier League Season 4"
                                                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B1A] border ${
                                                    errors.name
                                                        ? "border-red-500/80 focus:ring-red-500"
                                                        : "border-white/10 focus:border-[#FDB913]"
                                                } focus:outline-none focus:ring-1 focus:ring-[#FDB913]/30 transition text-sm text-white placeholder-gray-500`}
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} /> {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* LOCATION / VENUE WITH PRESET DROPDOWN */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor="location"
                                                className="block text-xs font-semibold text-gray-300"
                                            >
                                                Venue / Location <span className="text-[#FDB913]">*</span>
                                            </label>

                                            {/* Venue Preset Dropdown Button */}
                                            <GlassDropdown
                                                id="venue-preset-btn"
                                                icon={MapPin}
                                                selectedText="Pick Stadium Preset"
                                            >
                                                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Popular Arenas & Stadiums
                                                </div>
                                                {VENUE_PRESETS.map((v) => {
                                                    const VIcon = v.icon;
                                                    return (
                                                        <button
                                                            key={v.label}
                                                            type="button"
                                                            onClick={() => handleVenuePreset(v.label)}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-gray-200 hover:text-white hover:bg-white/10 transition"
                                                        >
                                                            <VIcon size={14} className="text-[#FDB913] shrink-0" />
                                                            <span className="truncate">{v.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </GlassDropdown>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <MapPin size={16} />
                                            </div>
                                            <input
                                                id="location"
                                                name="location"
                                                type="text"
                                                required
                                                value={form.location}
                                                onChange={handleChange}
                                                placeholder="e.g. Wankhede Stadium, Mumbai (or 'Online')"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B1A] border border-white/10 focus:border-[#FDB913] focus:outline-none focus:ring-1 focus:ring-[#FDB913]/30 transition text-sm text-white placeholder-gray-500"
                                            />
                                        </div>
                                    </div>

                                    {/* EVENT DATE */}
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="date"
                                            className="block text-xs font-semibold text-gray-300"
                                        >
                                            Auction / Event Date <span className="text-[#FDB913]">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <Calendar size={16} />
                                            </div>
                                            <input
                                                id="date"
                                                name="date"
                                                type="date"
                                                required
                                                value={form.date}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B1A] border ${
                                                    errors.date
                                                        ? "border-amber-500/70 focus:ring-amber-500"
                                                        : "border-white/10 focus:border-[#FDB913]"
                                                } focus:outline-none focus:ring-1 focus:ring-[#FDB913]/30 transition text-sm text-white`}
                                            />
                                        </div>
                                        {errors.date && (
                                            <p className="text-amber-400 text-xs flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} /> {errors.date}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* SECTION: FINANCIALS & CAPACITY */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                        <span className="text-xs font-bold tracking-widest text-[#FDB913] uppercase flex items-center gap-1.5">
                                            <Coins size={13} /> Purse & Capacity Structure
                                        </span>
                                    </div>

                                    {/* PURSE AMOUNT WITH DROPDOWN & STEPPERS */}
                                    <div className="space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <label
                                                htmlFor="purseAmount"
                                                className="block text-xs font-semibold text-gray-300"
                                            >
                                                Total Points Budget (Purse) <span className="text-[#FDB913]">*</span>
                                            </label>

                                            {/* Purse Preset Dropdown Button */}
                                            <GlassDropdown
                                                id="purse-preset-btn"
                                                icon={Coins}
                                                selectedText="Budget Presets"
                                            >
                                                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Select Budget Tier
                                                </div>
                                                {PURSE_PRESETS.map((p) => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => handlePursePreset(p.value)}
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium text-gray-200 hover:text-white hover:bg-white/10 transition"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-[#FDB913]">{p.label}</p>
                                                            <p className="text-[10px] text-gray-400">{p.desc}</p>
                                                        </div>
                                                        <Check
                                                            size={14}
                                                            className={`shrink-0 ${
                                                                String(form.purseAmount) === String(p.value)
                                                                    ? "text-[#FDB913]"
                                                                    : "opacity-0"
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                            </GlassDropdown>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <Coins size={16} />
                                            </div>
                                            <input
                                                id="purseAmount"
                                                name="purseAmount"
                                                type="number"
                                                required
                                                min="1"
                                                value={form.purseAmount}
                                                onChange={handleChange}
                                                placeholder="e.g. 10000000"
                                                className={`w-full pl-10 pr-28 py-3 rounded-xl bg-[#050B1A] border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                    errors.purseAmount
                                                        ? "border-red-500/80 focus:ring-red-500"
                                                        : "border-white/10 focus:border-[#FDB913]"
                                                } focus:outline-none focus:ring-1 focus:ring-[#FDB913]/30 transition text-sm text-white placeholder-gray-500 font-mono`}
                                            />
                                            <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[#FDB913] pointer-events-none">
                                                POINTS
                                            </span>
                                        </div>

                                        {/* Quick Increment Steppers */}
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            <span className="text-[10px] font-semibold text-gray-400 mr-1">
                                                Quick Add:
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handlePurseStep(100000)}
                                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-mono text-gray-300 hover:text-white transition"
                                            >
                                                +100K
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePurseStep(500000)}
                                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-mono text-gray-300 hover:text-white transition"
                                            >
                                                +500K
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePurseStep(1000000)}
                                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-mono text-amber-300 hover:text-white transition"
                                            >
                                                +1M
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePurseStep(5000000)}
                                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-mono text-[#FDB913] hover:text-white transition"
                                            >
                                                +5M
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setForm((prev) => ({ ...prev, purseAmount: "" }));
                                                    validateField("purseAmount", "");
                                                }}
                                                className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[10px] text-red-400 flex items-center gap-1 ml-auto transition"
                                                title="Reset budget"
                                            >
                                                <RotateCcw size={10} /> Clear
                                            </button>
                                        </div>

                                        {errors.purseAmount && (
                                            <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} /> {errors.purseAmount}
                                            </p>
                                        )}
                                    </div>

                                    {/* MAX TEAMS WITH DROPDOWN */}
                                    <div className="space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <label
                                                htmlFor="maxTeams"
                                                className="block text-xs font-semibold text-gray-300"
                                            >
                                                Maximum Teams Limit
                                            </label>

                                            {/* Teams Preset Dropdown Button */}
                                            <GlassDropdown
                                                id="teams-preset-btn"
                                                icon={Users}
                                                selectedText="Teams Presets"
                                            >
                                                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Standard Tournament Formats
                                                </div>
                                                {TEAMS_PRESETS.map((t) => (
                                                    <button
                                                        key={t.label}
                                                        type="button"
                                                        onClick={() => handleTeamsPreset(t.value)}
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium text-gray-200 hover:text-white hover:bg-white/10 transition"
                                                    >
                                                        <span>{t.label}</span>
                                                        <Check
                                                            size={14}
                                                            className={`shrink-0 ${
                                                                String(form.maxTeams) === String(t.value)
                                                                    ? "text-[#FDB913]"
                                                                    : "opacity-0"
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                            </GlassDropdown>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <Users size={16} />
                                            </div>
                                            <input
                                                id="maxTeams"
                                                name="maxTeams"
                                                type="number"
                                                min="2"
                                                max="100"
                                                value={form.maxTeams}
                                                onChange={handleChange}
                                                placeholder="e.g. 8 (or leave empty for unlimited)"
                                                className={`w-full pl-10 pr-24 py-3 rounded-xl bg-[#050B1A] border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                    errors.maxTeams
                                                        ? "border-red-500/80 focus:ring-red-500"
                                                        : "border-white/10 focus:border-[#FDB913]"
                                                } focus:outline-none focus:ring-1 focus:ring-[#FDB913]/30 transition text-sm text-white placeholder-gray-500 font-mono`}
                                            />
                                            <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-gray-400 pointer-events-none">
                                                TEAMS
                                            </span>
                                        </div>

                                        {errors.maxTeams ? (
                                            <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} /> {errors.maxTeams}
                                            </p>
                                        ) : (
                                            <p className="text-gray-500 text-[11px]">
                                                Leave empty if the tournament has no cap on registered franchises.
                                            </p>
                                        )}
                                    </div>

                                    {/* DYNAMIC PER-TEAM PURSE CALCULATION CALLOUT */}
                                    {perTeamAllocation !== null && (
                                        <div className="bg-[#FDB913]/10 border border-[#FDB913]/25 rounded-xl p-3.5 flex items-start gap-3">
                                            <Sparkles size={18} className="text-[#FDB913] shrink-0 mt-0.5" />
                                            <div className="text-xs">
                                                <p className="font-bold text-white">
                                                    Equal Purse Allocation per Team
                                                </p>
                                                <p className="text-gray-300 mt-0.5">
                                                    With a {formatCurrency(Number(form.purseAmount))} purse divided across{" "}
                                                    {form.maxTeams} teams, each team will be allocated an equal budget of:
                                                </p>
                                                <p className="text-base font-black text-[#FDB913] mt-1 font-mono">
                                                    {formatCurrency(perTeamAllocation)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SUBMIT BUTTON */}
                                <div className="pt-4 border-t border-white/10">
                                    <button
                                        type="submit"
                                        disabled={
                                            loading ||
                                            Object.keys(errors).some(
                                                (key) => errors[key] && !errors[key].startsWith("Notice")
                                            )
                                        }
                                        className="w-full bg-gradient-to-r from-[#FDB913] to-[#e09e07] hover:from-[#fec435] hover:to-[#f0ac11] px-6 py-3.5 rounded-xl text-black font-extrabold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-[#FDB913]/20 cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin text-black" />
                                                <span>Creating Tournament Season...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                <span>Launch & Create Tournament</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* PREVIEW COLUMN (5 cols - Sticky) */}
                        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-widest text-[#FDB913] uppercase flex items-center gap-1.5">
                                    <Trophy size={13} /> Live Listing Card Preview
                                </span>
                                <span className="text-[10px] text-gray-400">Updates in real time</span>
                            </div>

                            {/* TOURNAMENT CARD PREVIEW (Matches TournamentsPage Grid Card) */}
                            <div className="relative rounded-2xl bg-[#080E27] border border-white/10 hover:border-[#FDB913]/50 transition-all duration-300 p-6 overflow-hidden shadow-2xl group">
                                {/* Accent gradient background lights */}
                                <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                                <div className="relative space-y-5">
                                    {/* Header Row: Category Pill & Status Badge */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-semibold text-gray-300">
                                            <Trophy size={12} className="text-[#FDB913]" />
                                            <span>TOURNAMENT</span>
                                        </div>

                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase bg-blue-500/10 text-blue-400 border-blue-500/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                            UPCOMING
                                        </span>
                                    </div>

                                    {/* Tournament Title */}
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-[#FDB913] transition-colors leading-snug line-clamp-2">
                                            {form.name.trim() || "Champions Premier League"}
                                        </h3>
                                    </div>

                                    {/* Meta info pills (Venue & Date) */}
                                    <div className="space-y-2 pt-1 text-xs text-gray-400">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-white/5 text-gray-400">
                                                <MapPin size={14} className="text-amber-400" />
                                            </div>
                                            <span className="truncate font-medium text-gray-300">
                                                {form.location.trim() || "Venue Not Set"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-white/5 text-gray-400">
                                                <Calendar size={14} className="text-blue-400" />
                                            </div>
                                            <span className="font-medium text-gray-300">
                                                {formatDate(form.date)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Financial & Team metrics cards */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="p-3 rounded-xl bg-[#050B1A] border border-white/5">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                                                <Coins size={10} className="text-[#FDB913]" /> Total Purse
                                            </span>
                                            <p className="text-sm sm:text-base font-extrabold text-[#FDB913] mt-1 font-mono truncate">
                                                {formatCurrency(Number(form.purseAmount))}
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-[#050B1A] border border-white/5">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                                                <Users size={10} className="text-blue-400" /> Capacity
                                            </span>
                                            <p className="text-sm sm:text-base font-bold text-white mt-1 truncate">
                                                {form.maxTeams ? `${form.maxTeams} Teams` : "Unlimited"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Live per-team calculation tag */}
                                    {perTeamAllocation !== null && (
                                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Points Per Team:</span>
                                            <span className="font-black text-[#FDB913] font-mono">
                                                {formatCurrency(perTeamAllocation)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Mock Card Action */}
                                    <div className="pt-2">
                                        <div className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-bold text-gray-300">
                                            View Tournament Dashboard →
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PRO TIP HELPER BOX */}
                            <div className="bg-[#080E27]/80 rounded-2xl border border-white/10 p-4 text-xs text-gray-400 space-y-1.5 shadow-lg">
                                <div className="flex items-center gap-2 font-bold text-gray-200">
                                    <Sparkles size={14} className="text-[#FDB913]" />
                                    <span>Organizer Pro-Tip</span>
                                </div>
                                <p className="leading-relaxed">
                                    Setting a clear Points Budget and Max Teams automatically balances the bidding economy. Teams will draw their starting budget from this allocation when creating their rosters.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddTournament;