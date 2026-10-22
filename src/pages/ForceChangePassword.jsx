import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldAlert, KeyRound, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const ForceChangePassword = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters.");
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            toast.error("New password and confirm password do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.put("/auth/change-password", {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });

            const newToken = res.data.token;
            if (newToken) {
                localStorage.setItem("token", newToken);
            }

            // Fetch the updated user profile
            const profileRes = await api.get("/auth/me", {
                headers: newToken ? { Authorization: `Bearer ${newToken}` } : {}
            });

            localStorage.setItem("user", JSON.stringify(profileRes.data.data));
            toast.success("Password updated successfully!");

            setTimeout(() => {
                navigate("/owner-dashboard");
            }, 1200);

        } catch (error) {
            console.error("Password update error:", error);
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1220] to-black flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-xl bg-[#080E27]/90 rounded-3xl shadow-2xl border border-white/10 p-8 sm:p-10 relative overflow-hidden">
                {/* Accent glow lights */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#FACC15]/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FACC15]/5 rounded-full blur-3xl" />
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#FACC15] to-amber-600 rounded-t-3xl" />

                <div className="flex flex-col items-center text-center mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-[#FACC15]/30 flex items-center justify-center text-[#FACC15] mb-4">
                        <KeyRound size={28} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                        Security Action Required
                    </h2>
                    <p className="text-gray-400 text-sm mt-2 max-w-sm">
                        Welcome, <span className="font-bold text-white">{user?.name || "Team Owner"}</span>. Since this is your first login, you must update your temporary password to secure your account.
                    </p>
                </div>

                <div className="bg-yellow-500/10 border border-[#FACC15]/20 rounded-2xl p-4 flex gap-3 text-xs text-yellow-200 mb-8 relative z-10">
                    <ShieldAlert size={18} className="text-[#FACC15] shrink-0" />
                    <div>
                        <span className="font-bold">Important security notice:</span> Your temporary auto-generated credentials cannot be used to browse the portal features until you define a personal password.
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {/* TEMPORARY PASSWORD */}
                    <div className="relative">
                        <label className="text-sm font-semibold text-gray-300 block mb-2">
                            Temporary Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type={showCurrent ? "text" : "password"}
                            name="currentPassword"
                            required
                            value={form.currentPassword}
                            onChange={handleChange}
                            placeholder="Enter the password received in your email"
                            className="w-full px-4 py-3 pr-12 bg-[#0B1120] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition"
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-10 cursor-pointer text-gray-400 hover:text-[#FACC15]"
                            onClick={() => setShowCurrent(!showCurrent)}
                        >
                            {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* NEW PASSWORD */}
                    <div className="relative">
                        <label className="text-sm font-semibold text-gray-300 block mb-2">
                            New Password <span className="text-[#FACC15]">*</span>
                        </label>
                        <input
                            type={showNew ? "text" : "password"}
                            name="newPassword"
                            required
                            value={form.newPassword}
                            onChange={handleChange}
                            placeholder="Must be at least 6 characters"
                            className="w-full px-4 py-3 pr-12 bg-[#0B1120] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition"
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-10 cursor-pointer text-gray-400 hover:text-[#FACC15]"
                            onClick={() => setShowNew(!showNew)}
                        >
                            {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* CONFIRM NEW PASSWORD */}
                    <div className="relative">
                        <label className="text-sm font-semibold text-gray-300 block mb-2">
                            Confirm New Password <span className="text-[#FACC15]">*</span>
                        </label>
                        <input
                            type={showConfirm ? "text" : "password"}
                            name="confirmPassword"
                            required
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-type new password"
                            className="w-full px-4 py-3 pr-12 bg-[#0B1120] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition"
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-10 cursor-pointer text-gray-400 hover:text-[#FACC15]"
                            onClick={() => setShowConfirm(!showConfirm)}
                        >
                            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl font-bold transition duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-[#FACC15] to-amber-600 text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 mt-8"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Saving New Password...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                <span>Save & Continue</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForceChangePassword;
