import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import {
    getTeamById,
    updateTeam
} from "../../services/teamService";
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
    Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";

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
            if (value && value.trim().length < 3) {
                tempErrors.name = "Team name must be at least 3 characters.";
            } else {
                delete tempErrors.name;
            }
        }
        if (name === "ownerName") {
            if (value && value.trim().length < 3) {
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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(errors).length > 0) {
            toast.error("Please resolve all errors before submitting.");
            return;
        }

        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("ownerName", form.ownerName);
            formData.append("ownerEmail", form.ownerEmail);

            if (form.logo) {
                formData.append("logo", form.logo);
            }

            await updateTeam(id, formData);
            toast.success("Team profile updated successfully!");

            setTimeout(() => {
                navigate(`/teams/${id}`);
            }, 1200);
        } catch (error) {
            console.error("Team update error:", error);
            toast.error(error.response?.data?.message || "Failed to update team profile");
        } finally {
            setUpdating(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN').format(amount || 0) + " Pts";
    };

    if (loadingDetails) {
        return (
            <div className="min-h-screen flex bg-[#0A0F2C] text-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm">Loading team details...</p>
                    </div>
                </main>
            </div>
        );
    }

    const startingPurse = teamData?.purseAmount || 0;
    const remainingPurse = teamData?.remainingPurse || 0;
    const spentPurse = startingPurse - remainingPurse;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* BACK NAVIGATION */}
                    <Link to={`/teams/${id}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Details</span>
                    </Link>

                    {/* HEADER */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-[#FDB913]/10 p-2 rounded-lg border border-[#FDB913]/20">
                            <Users className="text-[#FDB913]" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                Edit Team Profile
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Modify the team's branding, update the captain assignment, or change the logo artwork.
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
                                            placeholder="Team Name"
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

                                {/* OWNER NAME */}
                                <div className="space-y-2">
                                    <label htmlFor="ownerName" className="block text-sm font-semibold text-gray-300">
                                        Owner Name <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User size={18} />
                                        </div>
                                        <input
                                            id="ownerName"
                                            name="ownerName"
                                            type="text"
                                            required
                                            value={form.ownerName}
                                            placeholder="Owner Name"
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#001F54]/50 border ${errors.ownerName ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FDB913]'} focus:outline-none focus:ring-2 transition text-white placeholder-gray-500`}
                                        />
                                    </div>
                                    {errors.ownerName && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.ownerName}
                                        </p>
                                    )}
                                </div>

                                {/* OWNER EMAIL */}
                                <div className="space-y-2">
                                    <label htmlFor="ownerEmail" className="block text-sm font-semibold text-gray-300">
                                        Owner Email <span className="text-[#FDB913]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            id="ownerEmail"
                                            name="ownerEmail"
                                            type="email"
                                            required
                                            value={form.ownerEmail}
                                            placeholder="Owner Email"
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#001F54]/50 border ${errors.ownerEmail ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FDB913]'} focus:outline-none focus:ring-2 transition text-white placeholder-gray-500`}
                                        />
                                    </div>
                                    {errors.ownerEmail && (
                                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle size={12} /> {errors.ownerEmail}
                                        </p>
                                    )}
                                </div>

                                {/* READ-ONLY TOURNAMENT */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-400">Tournament (Read-only)</label>
                                    <div className="w-full p-3 rounded-lg bg-[#001F54]/30 border border-white/5 text-gray-400 text-sm flex items-center gap-2">
                                        <Trophy size={16} className="text-[#FDB913]" />
                                        <span>{teamData?.tournament?.name || "League"}</span>
                                    </div>
                                </div>

                                {/* LOGO UPLOAD */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-300">Update Logo</label>

                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 hover:border-[#FDB913]/40 rounded-xl cursor-pointer bg-[#001F54]/20 hover:bg-[#001F54]/40 transition">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="text-gray-400 mb-2" size={24} />
                                                <p className="text-xs text-gray-400">
                                                    <span className="font-bold text-[#FDB913]">Click to upload</span> new logo
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
                                    disabled={updating || Object.keys(errors).length > 0}
                                    className="bg-gradient-to-r from-[#FDB913] to-[#e09e07] hover:from-[#fec435] hover:to-[#f0ac11] px-6 py-3.5 rounded-lg text-black font-bold w-full transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Saving Team Profile...</span>
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
                                        EDITING
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
                                            <span>Owner: {form.ownerName.trim() || "Not set yet"}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Mail size={10} className="text-gray-600" />
                                            <span>{form.ownerEmail.trim() || "No email set"}</span>
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
                                                {teamData?.tournament?.name || "League"}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#001F54]/40 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Coins size={10} /> Allocated Points
                                            </p>
                                            <p className="text-base font-extrabold text-green-400 mt-0.5">
                                                {formatCurrency(startingPurse)}
                                            </p>
                                        </div>

                                        <div className="bg-[#001F54]/40 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
                                                <Coins size={10} /> Spent Points
                                            </p>
                                            <p className="text-base font-bold text-gray-200 mt-0.5">
                                                {formatCurrency(spentPurse)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pro tip card */}
                            <div className="bg-[#0F1E4D]/20 rounded-xl border border-white/5 p-4 text-xs text-gray-400 flex gap-2.5">
                                <Sparkles className="text-[#FDB913] shrink-0" size={16} />
                                <div>
                                    <span className="font-semibold text-gray-300">Branding update:</span> Uploading a new logo image will immediately replace it everywhere across league tables, auction arena dashboards, and bids logs.
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
