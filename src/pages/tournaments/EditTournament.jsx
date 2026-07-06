import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { 
    getTournamentById, 
    updateTournament 
} from "../../services/tournamentService";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
    Trophy, 
    MapPin, 
    Calendar, 
    IndianRupee, 
    Users, 
    ArrowLeft, 
    Sparkles, 
    Loader2,
    AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

const EditTournament = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [form, setForm] = useState({
        name: "",
        location: "",
        date: "",
        purseAmount: "",
        maxTeams: ""
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getTournamentById(id);
                
                // Format date to YYYY-MM-DD for date input
                let formattedDate = "";
                if (data.date) {
                    formattedDate = new Date(data.date).toISOString().split('T')[0];
                }
                
                setForm({
                    name: data.name || "",
                    location: data.location || "",
                    date: formattedDate,
                    purseAmount: data.purseAmount || "",
                    maxTeams: data.maxTeams || ""
                });
            } catch (err) {
                console.error(err);
                toast.error("Failed to load tournament details.");
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchDetails();
    }, [id]);

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
                    tempErrors.date = "Warning: The selected date is in the past.";
                } else {
                    delete tempErrors.date;
                }
            }
        }
        if (name === "purseAmount") {
            if (value && Number(value) <= 0) {
                tempErrors.purseAmount = "Purse amount must be greater than 0.";
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
        setForm({
            ...form,
            [name]: value
        });
        validateField(name, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final validation check
        if (Object.keys(errors).some(key => errors[key] && !errors[key].startsWith("Warning"))) {
            toast.error("Please resolve form errors before submitting.");
            return;
        }

        setUpdating(true);
        try {
            await updateTournament(id, {
                name: form.name,
                location: form.location,
                date: form.date,
                purseAmount: Number(form.purseAmount),
                maxTeams: form.maxTeams ? Number(form.maxTeams) : 0
            });
            toast.success("Tournament updated successfully!");
            navigate(`/tournaments/${id}`);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update tournament");
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set yet";
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatCurrency = (amount) => {
        if (!amount) return "₹0";
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loadingDetails) {
        return (
            <div className="min-h-screen flex bg-[#0A0F2C] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm">Loading tournament details...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* BACK NAVIGATION */}
                    <Link to={`/tournaments/${id}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Details</span>
                    </Link>

                    {/* HEADER */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-[#FDB913]/10 p-2 rounded-lg border border-[#FDB913]/20">
                            <Trophy className="text-[#FDB913]" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                Edit Tournament
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Modify tournament details, adjust the total budget structure, or change the registered teams limit.
                            </p>
                        </div>
                    </div>

                    {/* CONTENT CONTAINER */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* FORM CARD */}
                        <div className="lg:col-span-7 bg-[#0F1E4D]/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* NAME */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-300">
                                        Tournament Name <span className="text-[#FDB913]">*</span>
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
                                            placeholder="e.g. Champions Premier League"
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

                                {/* LOCATION */}
                                <div className="space-y-2">
                                    <label htmlFor="location" className="block text-sm font-semibold text-gray-300">
                                        Location / Venue <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <MapPin size={18} />
                                        </div>
                                        <input
                                            id="location"
                                            name="location"
                                            type="text"
                                            required
                                            value={form.location}
                                            placeholder="e.g. Mumbai, India (or 'Online')"
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#001F54]/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#FDB913] transition text-white placeholder-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* DATE */}
                                    <div className="space-y-2">
                                        <label htmlFor="date" className="block text-sm font-semibold text-gray-300">
                                            Event Date <span className="text-[#FDB913]">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <Calendar size={18} />
                                            </div>
                                            <input
                                                id="date"
                                                name="date"
                                                type="date"
                                                required
                                                value={form.date}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#001F54]/50 border ${errors.date ? 'border-yellow-500/70 focus:ring-yellow-500' : 'border-white/10 focus:ring-[#FDB913]'} focus:outline-none focus:ring-2 transition text-white`}
                                            />
                                        </div>
                                        {errors.date && (
                                            <p className="text-yellow-400 text-xs flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} /> {errors.date}
                                            </p>
                                        )}
                                    </div>

                                    {/* MAX TEAMS */}
                                    <div className="space-y-2">
                                        <label htmlFor="maxTeams" className="block text-sm font-semibold text-gray-300">
                                            Max Teams
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <Users size={18} />
                                            </div>
                                            <input
                                                id="maxTeams"
                                                name="maxTeams"
                                                type="number"
                                                min="2"
                                                max="100"
                                                value={form.maxTeams}
                                                placeholder="e.g. 12"
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#001F54]/50 border ${errors.maxTeams ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FDB913]'} focus:outline-none focus:ring-2 transition text-white placeholder-gray-500`}
                                            />
                                        </div>
                                        {errors.maxTeams ? (
                                            <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} /> {errors.maxTeams}
                                            </p>
                                        ) : (
                                            <p className="text-gray-500 text-xs mt-1">Leave empty for no limit.</p>
                                        )}
                                    </div>
                                </div>

                                {/* PURSE AMOUNT */}
                                <div className="space-y-2">
                                    <label htmlFor="purseAmount" className="block text-sm font-semibold text-gray-300">
                                        Total Purse Budget (INR) <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <IndianRupee size={18} />
                                        </div>
                                        <input
                                            id="purseAmount"
                                            name="purseAmount"
                                            type="number"
                                            required
                                            value={form.purseAmount}
                                            placeholder="e.g. 1000000"
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#001F54]/50 border ${errors.purseAmount ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FDB913]'} focus:outline-none focus:ring-2 transition text-white placeholder-gray-500`}
                                        />
                                    </div>
                                    {form.purseAmount && form.maxTeams && (
                                        <p className="text-[#FDB913] text-xs font-semibold flex items-center gap-1 mt-1">
                                            <Sparkles size={12} /> Each team starts with: {formatCurrency(Math.floor(Number(form.purseAmount) / (Number(form.maxTeams) || 1)))}
                                        </p>
                                    )}
                                    {errors.purseAmount && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.purseAmount}
                                        </p>
                                    )}
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button
                                    type="submit"
                                    disabled={updating || Object.keys(errors).some(key => errors[key] && !errors[key].startsWith("Warning"))}
                                    className="bg-gradient-to-r from-[#FDB913] to-[#e09e07] hover:from-[#fec435] hover:to-[#f0ac11] px-6 py-3.5 rounded-lg text-black font-bold w-full transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Updating Tournament...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* LIVE PREVIEW CARD */}
                        <div className="lg:col-span-5 space-y-4">
                            <span className="text-xs font-bold tracking-widest text-[#FDB913] block">
                                LIVE CARD PREVIEW
                            </span>

                            <div className="bg-gradient-to-br from-[#0F1E4D] to-[#08163A] rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden group">
                                {/* Accent lights */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-colors duration-500" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />

                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2 bg-[#001F54]/80 px-3 py-1.5 rounded-full border border-white/5">
                                        <Trophy size={14} className="text-[#FDB913]" />
                                        <span className="text-xs font-semibold text-gray-300">
                                            TOURNAMENT CARD
                                        </span>
                                    </div>
                                    <span className="text-xs bg-[#FDB913]/10 text-[#FDB913] px-2.5 py-1 rounded font-bold uppercase tracking-wider border border-[#FDB913]/20">
                                        EDITING
                                    </span>
                                </div>

                                {/* Tournament Name */}
                                <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-[#FDB913] mb-4 tracking-tight uppercase line-clamp-2">
                                    {form.name.trim() || "Tournament Title"}
                                </h3>

                                <hr className="border-white/5 my-4" />

                                {/* Details */}
                                <div className="space-y-3.5 text-sm text-gray-300">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#001F54] p-1.5 rounded text-blue-400 border border-white/5">
                                            <MapPin size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Location</p>
                                            <p className="font-medium text-gray-200">
                                                {form.location.trim() || "Not set yet"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#001F54] p-1.5 rounded text-amber-400 border border-white/5">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Event Date</p>
                                            <p className="font-medium text-gray-200">
                                                {formatDate(form.date)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="bg-[#001F54]/40 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <IndianRupee size={10} /> Purse Budget
                                            </p>
                                            <p className="text-base font-extrabold text-green-400 mt-0.5">
                                                {formatCurrency(form.purseAmount)}
                                            </p>
                                        </div>

                                        <div className="bg-[#001F54]/40 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Users size={10} /> Max Teams
                                            </p>
                                            <p className="text-base font-bold text-gray-200 mt-0.5">
                                                {form.maxTeams ? `${form.maxTeams} Teams` : "No Limit"}
                                            </p>
                                        </div>
                                    </div>

                                    {form.purseAmount && form.maxTeams && (
                                        <div className="mt-3.5 bg-[#FDB913]/5 border border-[#FDB913]/10 rounded-lg p-2.5 text-center text-xs">
                                            <span className="text-gray-400">Team Starting Purse: </span>
                                            <span className="font-extrabold text-[#FDB913]">
                                                {formatCurrency(Math.floor(Number(form.purseAmount) / (Number(form.maxTeams) || 1)))}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pro tip card */}
                            <div className="bg-[#0F1E4D]/20 rounded-xl border border-white/5 p-4 text-xs text-gray-400 flex gap-2.5">
                                <Sparkles className="text-[#FDB913] shrink-0" size={16} />
                                <div>
                                    <span className="font-semibold text-gray-300">Design tip:</span> Modifying the purse budget or teams limit here will immediately propagate across dashboard charts and individual team remaining purses.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EditTournament;
