import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
    ChevronDown,
    Search,
    Check,
    X,
    Wallet,
    Shield,
    Lock
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

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

/* ─── Custom Glassmorphic Tournament Dropdown ─────────────── */
const TournamentDropdown = ({
    tournaments,
    selectedId,
    onSelect,
    error,
    isLocked = false
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

    const selectedTournament = tournaments.find((t) => String(t.id) === String(selectedId));

    if (isLocked) {
        return (
            <div className="relative">
                <div className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#050B1A]/80 flex items-center justify-between text-sm select-none cursor-not-allowed">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Trophy
                            size={17}
                            className="text-[#FDB913] shrink-0"
                        />
                        <span className="font-bold text-white truncate">
                            {selectedTournament ? selectedTournament.name : "Assigned Tournament"}
                        </span>
                        {selectedTournament && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 font-mono hidden sm:inline shrink-0">
                                Purse: {formatCurrency(selectedTournament.purseAmount)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-lg shrink-0">
                        <Lock size={12} />
                        <span className="text-[10px] uppercase tracking-wider">Locked</span>
                    </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5">
                    <Lock size={12} className="text-amber-400 shrink-0" />
                    <span>Assigned from tournament details page. Cannot be changed.</span>
                </p>
            </div>
        );
    }

    const filteredTournaments = tournaments.filter((t) =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                id="tournament-select-btn"
                onClick={() => {
                    setOpen((prev) => !prev);
                    setSearchTerm("");
                }}
                className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between text-sm transition-all duration-200 cursor-pointer ${
                    open
                        ? "bg-[#0F1B3D] border-[#FDB913] text-white shadow-lg ring-1 ring-[#FDB913]/30"
                        : error
                        ? "bg-[#050B1A] border-red-500/50 text-gray-200"
                        : "bg-[#050B1A] border-white/10 text-gray-200 hover:border-white/20 hover:bg-[#080E27]"
                }`}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <Trophy
                        size={17}
                        className={open ? "text-[#FDB913]" : "text-amber-400 shrink-0"}
                    />
                    <span className="font-semibold truncate">
                        {selectedTournament ? selectedTournament.name : "Select League / Tournament…"}
                    </span>
                    {selectedTournament && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 font-mono hidden sm:inline shrink-0">
                            Purse: {formatCurrency(selectedTournament.purseAmount)}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        open ? "rotate-180 text-[#FDB913]" : ""
                    }`}
                />
            </button>

            {open && (
                <div className="absolute left-0 right-0 mt-2 bg-[#0A122C]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1.5">
                    {tournaments.length >= 4 && (
                        <div className="relative mb-2 px-1 pt-1">
                            <Search
                                size={14}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search tournaments..."
                                className="w-full bg-[#050B1A] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#FDB913]"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                        {filteredTournaments.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-gray-500 text-center">
                                No tournaments found
                            </div>
                        ) : (
                            filteredTournaments.map((t) => {
                                const isSelected = String(t.id) === String(selectedId);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(t.id);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                                            isSelected
                                                ? "bg-[#FDB913]/15 text-[#FDB913] border border-[#FDB913]/30"
                                                : "text-gray-300 hover:bg-white/5 hover:text-white border border-transparent"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Trophy
                                                size={14}
                                                className={isSelected ? "text-[#FDB913]" : "text-gray-500 shrink-0"}
                                            />
                                            <div className="truncate">
                                                <p className="font-bold truncate text-white">{t.name}</p>
                                                <p className="text-[10px] text-gray-500">
                                                    Max Teams: {t.maxTeams || "No Limit"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded-md">
                                                {formatCurrency(t.purseAmount)}
                                            </span>
                                            {isSelected && (
                                                <Check
                                                    size={14}
                                                    className="text-[#FDB913]"
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
const AddTeam = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlTournamentId = searchParams.get("tournamentId");
    const isTournamentLocked = Boolean(urlTournamentId);

    const [loading, setLoading] = useState(false);
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournamentData, setSelectedTournamentData] = useState(null);
    const [preview, setPreview] = useState(null);

    const [form, setForm] = useState({
        name: "",
        ownerName: "",
        ownerEmail: "",
        tournamentId: urlTournamentId || "",
        logo: null
    });

    const [errors, setErrors] = useState({});

    /* Load tournaments via centralized API client */
    useEffect(() => {
        const loadTournaments = async () => {
            try {
                const res = await api.get("/tournaments/organizer");
                const list = res.data.data || [];
                setTournaments(list);
                if (list.length > 0) {
                    const matched = urlTournamentId
                        ? list.find((t) => String(t.id) === String(urlTournamentId))
                        : null;
                    const activeId = matched ? matched.id : (urlTournamentId || list[0].id);
                    setForm((prev) => ({ ...prev, tournamentId: activeId }));
                    setSelectedTournamentData(matched || list[0]);
                }
            } catch (error) {
                console.error("Tournaments load error:", error);
                toast.error("Failed to load tournaments");
            }
        };
        loadTournaments();
    }, [urlTournamentId]);

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
        if (name === "tournamentId") {
            if (!value) {
                tempErrors.tournamentId = "Please select a tournament.";
            } else {
                delete tempErrors.tournamentId;
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

    const handleTournamentSelect = (tournamentId) => {
        setForm((prev) => ({ ...prev, tournamentId }));
        const matched = tournaments.find((t) => t.id === tournamentId);
        setSelectedTournamentData(matched || null);
        if (errors.tournamentId) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next.tournamentId;
                return next;
            });
        }
    };

    const handleRemoveLogo = () => {
        setForm((prev) => ({ ...prev, logo: null }));
        setPreview(null);
    };

    // Calculate individual team starting purse based on divisor logic
    const calculateStartingPurse = () => {
        if (!selectedTournamentData) return 0;
        const totalPurse = selectedTournamentData.purseAmount || 0;
        const divisor = selectedTournamentData.maxTeams > 0 ? selectedTournamentData.maxTeams : 1;
        return Math.floor(totalPurse / divisor);
    };

    const teamStartingPurse = calculateStartingPurse();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all required fields
        const validationErrors = {};
        if (!form.name || form.name.trim().length < 3) {
            validationErrors.name = "Team name must be at least 3 characters.";
        }
        if (!form.ownerName || form.ownerName.trim().length < 3) {
            validationErrors.ownerName = "Owner name must be at least 3 characters.";
        }
        if (!form.tournamentId) {
            validationErrors.tournamentId = "Please select a tournament.";
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

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name.trim());
            formData.append("ownerName", form.ownerName.trim());
            formData.append("ownerEmail", form.ownerEmail.trim());
            formData.append("tournamentId", form.tournamentId);

            if (form.logo) {
                formData.append("logo", form.logo);
            }

            await api.post("/teams/create", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            toast.success(`"${form.name.trim()}" franchise created successfully! 🎉`);
            if (urlTournamentId) {
                navigate(`/tournaments/${urlTournamentId}`);
            } else {
                navigate("/teams");
            }
        } catch (error) {
            console.error("Team create error:", error);
            toast.error(error.response?.data?.message || "Failed to create team.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#050B1A] text-white selection:bg-[#FDB913] selection:text-black">
            <Sidebar />

            <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
                    {/* ── BACK NAVIGATION & HEADER ── */}
                    <div>
                        <Link
                            to={urlTournamentId ? `/tournaments/${urlTournamentId}` : "/teams"}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#FDB913] transition mb-4 group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>{urlTournamentId ? "Back to Tournament Details" : "Back to Teams Management"}</span>
                        </Link>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDB913]/20 to-amber-600/10 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shadow-lg shadow-yellow-500/10">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                                        Register Franchise Team
                                    </h1>
                                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                                        Create a franchise roster, assign to league competitions, and determine purse budget.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── CONTENT GRID: FORM (LEFT 7 COLS) + LIVE CARD (RIGHT 5 COLS) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                        {/* ── FORM CONTAINER (7 COLS) ── */}
                        <div className="lg:col-span-7 bg-[#080E27] border border-white/10 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden">
                            {/* Subtle ambient lighting */}
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
                                            placeholder="e.g. Mumbai Mavericks, Chennai Champions"
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
                                            placeholder="e.g. Rajesh Kumar"
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
                                            placeholder="e.g. owner@franchise.com"
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

                                {/* TOURNAMENT ASSIGNMENT (CUSTOM DROPDOWN) */}
                                <div className="space-y-2.5">
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Assign to Tournament <span className="text-[#FDB913]">*</span>
                                    </label>

                                    <TournamentDropdown
                                        tournaments={tournaments}
                                        selectedId={form.tournamentId}
                                        onSelect={handleTournamentSelect}
                                        error={errors.tournamentId}
                                        isLocked={isTournamentLocked}
                                    />

                                    {/* Purse calculation breakdown card */}
                                    {selectedTournamentData && (
                                        <div className="p-3.5 rounded-2xl bg-[#050B1A] border border-white/5 space-y-2 text-xs">
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span>Total Tournament Purse:</span>
                                                <span className="font-mono text-gray-200">
                                                    {formatCurrency(selectedTournamentData.purseAmount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span>Max Franchises Allowed:</span>
                                                <span className="font-mono text-gray-200">
                                                    {selectedTournamentData.maxTeams || "No Limit"}
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-white/5 flex justify-between items-baseline">
                                                <span className="text-xs font-bold text-gray-300">
                                                    Initial Starting Purse Budget:
                                                </span>
                                                <span className="text-base font-black text-emerald-400">
                                                    {formatCurrency(teamStartingPurse)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {tournaments.length === 0 && (
                                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                                            <span>No active tournaments available.</span>
                                            <Link
                                                to="/tournaments/add"
                                                className="underline font-bold text-[#FDB913]"
                                            >
                                                Create Tournament First
                                            </Link>
                                        </div>
                                    )}

                                    {errors.tournamentId && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1 font-medium">
                                            <AlertCircle size={12} /> {errors.tournamentId}
                                        </p>
                                    )}
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
                                                        {form.logo?.name || "logo.png"}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                                                        Ready for upload
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                                                title="Remove Logo"
                                            >
                                                <X size={16} />
                                            </button>
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
                                        to="/teams"
                                        className="py-3 px-5 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition text-center"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        id="submit-team"
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 px-6 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#FDB913] to-amber-500 hover:from-[#f5b30c] hover:to-amber-600 text-black transition-all duration-200 shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/30 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Registering Team…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                <span>Create Franchise Team</span>
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
                                            {selectedTournamentData ? selectedTournamentData.name : "Select Tournament"}
                                        </span>
                                    </div>

                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-blue-500/30 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                        DRAFT FRANCHISE
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
                                                <Wallet size={12} className="text-emerald-400" /> Starting Purse Budget
                                            </p>
                                            <p className="text-2xl font-black text-emerald-400 mt-0.5">
                                                {formatCurrency(teamStartingPurse)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Status</p>
                                            <p className="text-xs font-bold text-gray-200 mt-0.5">
                                                Unspent (100%)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-[#050B1A] p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Coins size={11} className="text-[#FDB913]" /> Spent Points
                                            </p>
                                            <p className="font-bold text-gray-200 mt-0.5">
                                                0 Pts
                                            </p>
                                        </div>

                                        <div className="bg-[#050B1A] p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Users size={11} className="text-blue-400" /> Squad Size
                                            </p>
                                            <p className="font-bold text-gray-200 mt-0.5">
                                                0 Players
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PRO TIP BOX */}
                            <div className="bg-[#080E27] rounded-2xl border border-white/5 p-4 text-xs text-gray-400 flex gap-3 shadow-lg">
                                <Sparkles className="text-[#FDB913] shrink-0 mt-0.5" size={16} />
                                <div className="leading-relaxed">
                                    <span className="font-bold text-white">Purse Divisor Rule:</span> Each team's bidding budget is automatically calculated from the tournament's total purse divided by the max team quota. If tournament settings are updated, starting purse balances adjust synchronously.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddTeam;