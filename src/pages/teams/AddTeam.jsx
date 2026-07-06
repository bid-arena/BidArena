import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
    Users,
    Trophy,
    User,
    Upload,
    ArrowLeft,
    Sparkles,
    Loader2,
    AlertCircle,
    IndianRupee,
    Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";

const AddTeam = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournamentData, setSelectedTournamentData] = useState(null);
    const [preview, setPreview] = useState(null);

    const [form, setForm] = useState({
        name: "",
        captainName: "",
        tournamentId: "",
        logo: null
    });

    const [errors, setErrors] = useState({});

    const getToken = () => {
        return localStorage.getItem("token");
    };

    useEffect(() => {
        const loadTournaments = async () => {
            try {
                const res = await axios.get(
                    "http://localhost:5000/api/tournaments/organizer",
                    {
                        headers: {
                            Authorization: `Bearer ${getToken()}`
                        }
                    }
                );
                setTournaments(res.data.data || []);
            } catch (error) {
                console.error("Tournaments load error:", error);
                toast.error("Failed to load tournaments");
            }
        };
        loadTournaments();
    }, []);

    const validateField = (name, value) => {
        let tempErrors = { ...errors };
        if (name === "name") {
            if (value && value.trim().length < 3) {
                tempErrors.name = "Team name must be at least 3 characters.";
            } else {
                delete tempErrors.name;
            }
        }
        if (name === "captainName") {
            if (value && value.trim().length < 3) {
                tempErrors.captainName = "Captain name must be at least 3 characters.";
            } else {
                delete tempErrors.captainName;
            }
        }
        setErrors(tempErrors);
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (files && files[0]) {
            const file = files[0];

            // File size validation (limit to 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Logo file size must be less than 2MB.");
                return;
            }

            setForm({ ...form, logo: file });
            setPreview(URL.createObjectURL(file));
        } else {
            setForm({ ...form, [name]: value });
            validateField(name, value);

            if (name === "tournamentId") {
                const selected = tournaments.find((t) => t.id === value);
                setSelectedTournamentData(selected || null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(errors).length > 0) {
            toast.error("Please resolve all errors before submitting.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("captainName", form.captainName);
            formData.append("tournamentId", form.tournamentId);

            if (form.logo) {
                formData.append("logo", form.logo);
            }

            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:5000/api/teams/create",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            toast.success("Team created successfully!");
            setTimeout(() => {
                navigate("/teams");
            }, 1200);
        } catch (error) {
            console.error("Team create error:", error);
            toast.error(error.response?.data?.message || "Failed to create team");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Calculate individual team starting purse based on divisor logic
    const calculateStartingPurse = () => {
        if (!selectedTournamentData) return 0;
        const totalPurse = selectedTournamentData.purseAmount || 0;
        const divisor = selectedTournamentData.maxTeams > 0 ? selectedTournamentData.maxTeams : 1;
        return Math.floor(totalPurse / divisor);
    };

    const teamStartingPurse = calculateStartingPurse();

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* BACK NAVIGATION */}
                    <Link to="/teams" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Teams</span>
                    </Link>

                    {/* HEADER */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-[#FDB913]/10 p-2 rounded-lg border border-[#FDB913]/20">
                            <Users className="text-[#FDB913]" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                Register New Team
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Create a team profile, pick a tournament, upload a logo, and verify their allocated purse budget.
                            </p>
                        </div>
                    </div>

                    {/* CONTENT GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* FORM CARD */}
                        <div className="lg:col-span-7 bg-[#0F1E4D]/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* NAME */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-300">
                                        Team Name <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Trophy size={18} />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={form.name}
                                            placeholder="e.g. Mumbai Mavericks"
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#001F54]/50 border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FDB913]'} focus:outline-none focus:ring-2 transition text-white placeholder-gray-500`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* CAPTAIN NAME */}
                                <div className="space-y-2">
                                    <label htmlFor="captainName" className="block text-sm font-semibold text-gray-300">
                                        Captain Name <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User size={18} />
                                        </div>
                                        <input
                                            id="captainName"
                                            name="captainName"
                                            type="text"
                                            required
                                            value={form.captainName}
                                            placeholder="e.g. Virat Kohli"
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#001F54]/50 border ${errors.captainName ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FDB913]'} focus:outline-none focus:ring-2 transition text-white placeholder-gray-500`}
                                        />
                                    </div>
                                    {errors.captainName && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.captainName}
                                        </p>
                                    )}
                                </div>

                                {/* TOURNAMENT SELECT */}
                                <div className="space-y-2">
                                    <label htmlFor="tournamentId" className="block text-sm font-semibold text-gray-300">
                                        Select League / Tournament <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Trophy size={18} />
                                        </div>
                                        <select
                                            id="tournamentId"
                                            name="tournamentId"
                                            required
                                            value={form.tournamentId}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#001F54]/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#FDB913] transition text-white appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-[#0A0F2C]">Choose Tournament</option>
                                            {tournaments.map((t) => (
                                                <option key={t.id} value={t.id} className="bg-[#0A0F2C]">
                                                    {t.name} (Max Teams: {t.maxTeams || "No Limit"})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedTournamentData && (
                                        <div className="mt-2 bg-[#FDB913]/5 border border-[#FDB913]/10 rounded-xl p-3 text-xs text-[#FDB913] space-y-1">
                                            <div className="flex justify-between">
                                                <span>Total Tournament Purse:</span>
                                                <span className="font-bold">{formatCurrency(selectedTournamentData.purseAmount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Max Teams Limit:</span>
                                                <span className="font-bold">{selectedTournamentData.maxTeams || "No Limit"}</span>
                                            </div>
                                            <hr className="border-[#FDB913]/10 my-1" />
                                            <div className="flex justify-between text-sm font-black">
                                                <span>Your Team Starting Purse:</span>
                                                <span>{formatCurrency(teamStartingPurse)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* LOGO UPLOAD */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">Team Logo</label>

                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 hover:border-[#FDB913]/40 rounded-xl cursor-pointer bg-[#001F54]/20 hover:bg-[#001F54]/40 transition">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="text-gray-400 mb-2" size={24} />
                                                <p className="text-xs text-gray-400">
                                                    <span className="font-bold text-[#FDB913]">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-1">PNG, JPG or JPEG (Max 2MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                name="logo"
                                                accept="image/*"
                                                onChange={handleChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button
                                    type="submit"
                                    disabled={loading || Object.keys(errors).length > 0}
                                    className="bg-gradient-to-r from-[#FDB913] to-[#e09e07] hover:from-[#fec435] hover:to-[#f0ac11] px-6 py-3.5 rounded-lg text-black font-bold w-full transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Creating Team Profile...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            <span>Create Team</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* LIVE TEAM PREVIEW */}
                        <div className="lg:col-span-5 space-y-4">
                            <span className="text-xs font-bold tracking-widest text-[#FDB913] block">
                                LIVE TEAM CARD PREVIEW
                            </span>

                            <div className="bg-gradient-to-br from-[#0F1E4D] to-[#08163A] rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden group">
                                {/* Accent lights */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-colors duration-500" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />

                                {/* Card Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2 bg-[#001F54]/80 px-3 py-1.5 rounded-full border border-white/5">
                                        <Users size={14} className="text-[#FDB913]" />
                                        <span className="text-xs font-semibold text-gray-300">
                                            TEAM PROFILE
                                        </span>
                                    </div>
                                    <span className="text-xs bg-[#FDB913]/10 text-[#FDB913] px-2.5 py-1 rounded font-bold uppercase tracking-wider border border-[#FDB913]/20">
                                        DRAFT
                                    </span>
                                </div>

                                {/* Logo / Title Block */}
                                <div className="flex items-center gap-4 mb-6">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Team Logo"
                                            className="w-16 h-16 rounded-full object-cover border-2 border-[#FDB913] shadow-lg shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-[#001F54] border-2 border-white/10 flex items-center justify-center text-gray-500 shrink-0">
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-[#FDB913] tracking-tight uppercase line-clamp-1">
                                            {form.name.trim() || "Team Name"}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                            <User size={12} className="text-gray-500" />
                                            <span>Captain: {form.captainName.trim() || "Not set yet"}</span>
                                        </p>
                                    </div>
                                </div>

                                <hr className="border-white/5 my-4" />

                                {/* Details */}
                                <div className="space-y-4 text-sm text-gray-300">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Registered Tournament</p>
                                        <p className="font-semibold text-gray-200 mt-0.5 truncate flex items-center gap-1.5">
                                            <Trophy size={14} className="text-[#FDB913] shrink-0" />
                                            <span>
                                                {selectedTournamentData ? selectedTournamentData.name : "Choose a tournament"}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#001F54]/40 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <IndianRupee size={10} /> Starting Purse
                                            </p>
                                            <p className="text-base font-extrabold text-green-400 mt-0.5">
                                                {formatCurrency(teamStartingPurse)}
                                            </p>
                                        </div>

                                        <div className="bg-[#001F54]/40 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <IndianRupee size={10} /> Spent Purse
                                            </p>
                                            <p className="text-base font-bold text-gray-500 mt-0.5">
                                                {formatCurrency(0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pro tip card */}
                            <div className="bg-[#0F1E4D]/20 rounded-xl border border-white/5 p-4 text-xs text-gray-400 flex gap-2.5">
                                <Sparkles className="text-[#FDB913] shrink-0" size={16} />
                                <div>
                                    <span className="font-semibold text-gray-300">Divisor rule active:</span> Team purse budget is allocated automatically based on `Total Tournament Purse / Maximum Teams`. If the tournament configuration changes, this budget will adjust accordingly.
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