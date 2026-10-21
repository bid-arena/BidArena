import React, { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import {
    User,
    Shield,
    Bell,
    Sliders,
    AlertTriangle,
    Save,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    Smartphone,
    Laptop,
    Download,
    Trash2,
    RefreshCw,
    Mail,
    Phone,
    Building2,
    FileText,
    Volume2,
    VolumeX,
    Gavel,
    Clock,
    DollarSign,
    Check,
    Loader2,
    Sparkles,
    ShieldAlert,
    ExternalLink,
    Coins
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    getUserPreferences,
    updateUserPreferences,
    getUserSessions,
    revokeUserSession,
    deactivateUserAccount
} from "../services/settingsService";
import { logoutUser } from "../services/dashboardService";
import { clearAuthSession, getJwtPayload } from "../utils/auth";
import { disconnectUserSocket } from "../services/socketService";
import { useNavigate } from "react-router-dom";

const TABS = [
    { id: "profile", label: "Profile", icon: User, desc: "Personal info & organization details" },
    { id: "security", label: "Security", icon: Shield, desc: "Password, 2FA & active sessions" },
    // { id: "notifications", label: "Notifications", icon: Bell, desc: "Email & live auction sound alerts" },
    // { id: "auction", label: "Auction Preferences", icon: Sliders, desc: "Bidding defaults & display units" },
    // { id: "danger", label: "Account & Data", icon: AlertTriangle, desc: "Export data or deactivate account" },
];

const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile state
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        organization: "",
        bio: "",
        role: "ORGANIZER",
        avatar: "",
    });

    // Password state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwdUpdating, setPwdUpdating] = useState(false);

    // Preferences state
    const [preferences, setPreferences] = useState({
        notifications: {
            emailAlerts: true,
            bidOutbidAlerts: true,
            auctionReminders: true,
            systemAnnouncements: false,
            soundEffects: true,
            countdownChime: true,
            hammerSound: true,
        },
        auction: {
            confirmBeforeBid: true,
            currencyFormat: "Pts",
            autoRefreshInterval: 5,
            defaultBidIncrement: 50000,
            showLiveSpectators: true,
        },
        security: {
            twoFactorAuth: false,
        }
    });

    // Sessions state
    const [sessions, setSessions] = useState([]);
    const [revokingId, setRevokingId] = useState(null);
    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [sessionToRevoke, setSessionToRevoke] = useState(null);

    // Danger zone modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
    const [deleteReason, setDeleteReason] = useState("");
    const [deleting, setDeleting] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadSettingsData = async () => {
            try {
                setLoading(true);
                const [profData, prefData, sessData] = await Promise.all([
                    getUserProfile(),
                    getUserPreferences(),
                    getUserSessions(),
                ]);

                if (profData) {
                    setProfile({
                        name: profData.name || profData.organizerName || "",
                        email: profData.email || "",
                        phone: profData.phone || "+91 98765 43210",
                        organization: profData.organization || profData.leagueName || "Cricket Premier League",
                        bio: profData.bio || "Premier tournament organizer & auctioneer at BidArena.",
                        role: profData.role || "ORGANIZER",
                        avatar: profData.avatar || "",
                    });
                }

                if (prefData) {
                    setPreferences((prev) => ({
                        notifications: { ...prev.notifications, ...prefData.notifications },
                        auction: { ...prev.auction, ...prefData.auction },
                        security: { ...prev.security, ...prefData.security },
                    }));
                }

                if (sessData) {
                    let sessList = [];
                    if (Array.isArray(sessData)) {
                        sessList = sessData;
                    } else if (sessData.sessions && Array.isArray(sessData.sessions)) {
                        sessList = sessData.sessions;
                    } else if (sessData.session) {
                        sessList = [sessData.session];
                    } else if (sessData.device || sessData.id || sessData._id) {
                        sessList = [sessData];
                    }

                    const payload = getJwtPayload();
                    const currentSessionId = payload?.sessionId || payload?.session_id;

                    const normalizedSessions = sessList.map((s, index) => {
                        const sId = s.id || s._id || `sess-${index}`;
                        const isCurrent = Boolean(
                            s.isCurrent ||
                            s.current ||
                            (currentSessionId && sId === currentSessionId) ||
                            (sessList.length === 1) // With single active device, this is the current device
                        );
                        return {
                            ...s,
                            id: sId,
                            device: s.device || "Current Web Browser",
                            ip: s.ip || "127.0.0.1",
                            location: s.location || "Active Location",
                            lastActive: s.lastActive || "Active Now",
                            isCurrent,
                        };
                    });
                    setSessions(normalizedSessions);
                }
            } catch (err) {
                console.error("Failed to load settings:", err);
            } finally {
                setLoading(false);
            }
        };

        loadSettingsData();
    }, []);

    // Save profile handler
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await updateUserProfile(profile);
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // Save preferences handler
    const handleSavePreferences = async (updatedPrefs) => {
        const toSave = updatedPrefs || preferences;
        try {
            setSaving(true);
            await updateUserPreferences(toSave);
            toast.success("Preferences saved successfully!");
        } catch (error) {
            console.error("Preferences save error:", error);
            toast.error(error.response?.data?.message || "Failed to save preferences");
        } finally {
            setSaving(false);
        }
    };

    // Password change handler
    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New password and confirm password do not match.");
            return;
        }

        try {
            setPwdUpdating(true);
            await changeUserPassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });

            toast.success("Password changed successfully!");
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            console.error("Password change error:", error);
            toast.error(error.response?.data?.message || "Failed to change password. Please verify your current password.");
        } finally {
            setPwdUpdating(false);
        }
    };

    // Open confirmation modal before revoking session
    const confirmRevokeSession = (sess) => {
        setSessionToRevoke(sess);
        setRevokeModalOpen(true);
    };

    // Execute session revocation after user confirmation
    const handleExecuteRevoke = async () => {
        if (!sessionToRevoke) return;
        const sessionId = sessionToRevoke.id || sessionToRevoke._id;
        const payload = getJwtPayload();
        const currentSessionId = payload?.sessionId || payload?.session_id;

        // Check if the user is revoking their active device/session
        const isTargetCurrent = Boolean(
            sessionToRevoke?.isCurrent ||
            sessionToRevoke?.current ||
            (currentSessionId && sessionId === currentSessionId) ||
            sessions.length <= 1
        );

        try {
            setRevokingId(sessionId);
            const res = await revokeUserSession(sessionId);

            // Determine if the revoked session was the current user session
            const isCurrentSession = Boolean(
                isTargetCurrent ||
                res?.isCurrentSession === true ||
                res?.data?.isCurrentSession === true ||
                res?.isCurrent === true ||
                res?.data?.isCurrent === true
            );

            if (isCurrentSession) {
                const logoutMsg = res?.message || "Session revoked successfully. Please sign in again.";
                // Store flash message in sessionStorage so it reliably displays on /login screen
                sessionStorage.setItem("auth_toast", logoutMsg);
                sessionStorage.setItem("auth_toast_type", "success");
                toast.success(logoutMsg, { id: "auth-flash", duration: 5000 });
                disconnectUserSocket();
                clearAuthSession();
                setRevokeModalOpen(false);
                setTimeout(() => {
                    navigate("/login", { state: { message: logoutMsg } });
                }, 400);
                return;
            }

            // Remote device revoked
            setSessions((prev) => prev.filter((s) => (s.id !== sessionId && s._id !== sessionId)));
            toast.success(res?.message || "Device session revoked successfully");
            setRevokeModalOpen(false);
            setSessionToRevoke(null);
        } catch (error) {
            // If the server responded with 401 Unauthorized (session was invalidated on backend)
            if (error.response?.status === 401) {
                const logoutMsg = "Session revoked successfully. Please sign in again.";
                sessionStorage.setItem("auth_toast", logoutMsg);
                sessionStorage.setItem("auth_toast_type", "error");
                toast.success(logoutMsg, { id: "auth-flash", duration: 5000 });
                disconnectUserSocket();
                clearAuthSession();
                setRevokeModalOpen(false);
                navigate("/login", { state: { message: logoutMsg } });
                return;
            }
            toast.error(error.response?.data?.message || "Failed to revoke session");
        } finally {
            setRevokingId(null);
        }
    };

    // Export user data
    const handleExportData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
            JSON.stringify(
                {
                    exportDate: new Date().toISOString(),
                    profile,
                    preferences,
                    sessions,
                    note: "BidArena User Data Export"
                },
                null,
                2
            )
        );
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `bid-arena-data-${profile.name.toLowerCase().replace(/\s+/g, "-") || "user"}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("Account data exported to JSON");
    };

    // Deactivate account
    const handleDeleteAccount = async () => {
        if (!deleteConfirmPassword) {
            toast.error("Please enter your password to confirm");
            return;
        }

        try {
            setDeleting(true);
            await deactivateUserAccount({
                password: deleteConfirmPassword,
                reason: deleteReason,
            });
            toast.success("Account deactivated");
            await logoutUser();
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to deactivate account. Check your password.");
        } finally {
            setDeleting(false);
        }
    };

    // Calculate password strength
    const passwordStrength = () => {
        const p = passwordForm.newPassword;
        if (!p) return 0;
        let score = 0;
        if (p.length >= 6) score += 25;
        if (p.length >= 10) score += 25;
        if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 25;
        if (/[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p)) score += 25;
        return score;
    };

    const initials = profile.name
        ? profile.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "BA";

    return (
        <div className="min-h-screen bg-[#050B1A] text-white flex">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F1B3D] via-[#0B1530] to-[#080E27] border border-white/10 p-6 sm:p-8 shadow-2xl">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#FDB913]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-yellow-500/20 border-2 border-white/20 shrink-0">
                                {initials}
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                        Account Settings
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FDB913]/15 text-[#FDB913] border border-[#FDB913]/30">
                                        {profile.role}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm mt-1">
                                    Manage your profile details, security credentials, notification channels, and auction preferences.
                                </p>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportData}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold transition"
                            >
                                <Download size={15} />
                                Export Data
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-1 border-t border-white/10 pt-4 custom-scrollbar">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${isActive
                                            ? "bg-[#FDB913] text-black shadow-lg shadow-yellow-500/20"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Icon size={16} className={isActive ? "text-black" : "text-gray-400"} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Contents */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <Loader2 className="animate-spin text-[#FDB913]" size={36} />
                        <p className="text-gray-400 text-sm">Loading your settings...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* ─── TAB 1: PROFILE ────────────────────────────────────────── */}
                        {activeTab === "profile" && (
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Personal Information</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Update your identity, organization affiliations, and public bio.
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                            <CheckCircle2 size={13} className="text-emerald-400" />
                                            Verified Account
                                        </span>
                                    </div>

                                    {/* Avatar Selection Card */}
                                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center text-black font-black text-3xl shadow-lg shadow-yellow-500/20">
                                            {initials}
                                        </div>
                                        <div className="flex-1 text-center sm:text-left space-y-1">
                                            <h4 className="text-sm font-bold text-white">Profile Avatar</h4>
                                            <p className="text-xs text-gray-400">
                                                Your initials are used automatically based on your full name. Custom avatar upload will sync across live auction tables.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toast("Avatar upload configured to your storage bucket", { icon: "📸" })}
                                                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition border border-white/10"
                                            >
                                                Upload Photo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Grid Inputs */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
                                                <User size={14} className="text-[#FDB913]" /> Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                placeholder="e.g. John Doe"
                                                required
                                                className="w-full bg-[#080E27] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
                                                <Mail size={14} className="text-[#FDB913]" /> Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                                title="Email cannot be changed directly for security reasons"
                                                className="w-full bg-[#080E27]/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1">Managed via authentication provider</p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
                                                <Phone size={14} className="text-[#FDB913]" /> Contact Number
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                placeholder="+91 98765 43210"
                                                className="w-full bg-[#080E27] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
                                                <Building2 size={14} className="text-[#FDB913]" /> Organization / League Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.organization}
                                                disabled
                                                title="Organization / League Name cannot be changed"
                                                className="w-full bg-[#080E27]/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1">Organization name is fixed and cannot be changed</p>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
                                                <FileText size={14} className="text-[#FDB913]" /> Bio & Description
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={profile.bio}
                                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                placeholder="Tell other organizers and teams about yourself or your auction house..."
                                                className="w-full bg-[#080E27] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="flex justify-end pt-4 border-t border-white/10">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FDB913] hover:bg-amber-500 text-black font-bold text-sm shadow-lg shadow-yellow-500/20 transition disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Saving Changes...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    Save Profile Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* ─── TAB 2: SECURITY ────────────────────────────────────────── */}
                        {activeTab === "security" && (
                            <div className="space-y-6">
                                {/* Change Password Card */}
                                <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                                    <div className="border-b border-white/10 pb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <KeyRound size={20} className="text-[#FDB913]" /> Change Password
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Ensure your account is protected with a secure and unique password.
                                        </p>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrent ? "text" : "password"}
                                                    value={passwordForm.currentPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                    required
                                                    placeholder="Enter current password"
                                                    className="w-full bg-[#080E27] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrent(!showCurrent)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                                >
                                                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNew ? "text" : "password"}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    required
                                                    placeholder="At least 6 characters"
                                                    className="w-full bg-[#080E27] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNew(!showNew)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                                >
                                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>

                                            {/* Password Strength Bar */}
                                            {passwordForm.newPassword && (
                                                <div className="mt-2 space-y-1.5">
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${passwordStrength() <= 25
                                                                    ? "w-1/4 bg-red-500"
                                                                    : passwordStrength() <= 50
                                                                        ? "w-2/4 bg-amber-500"
                                                                        : passwordStrength() <= 75
                                                                            ? "w-3/4 bg-blue-500"
                                                                            : "w-full bg-emerald-500"
                                                                }`}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[11px] text-gray-400">
                                                        <span>Strength</span>
                                                        <span>
                                                            {passwordStrength() <= 25
                                                                ? "Weak"
                                                                : passwordStrength() <= 50
                                                                    ? "Fair"
                                                                    : passwordStrength() <= 75
                                                                        ? "Good"
                                                                        : "Strong"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirm ? "text" : "password"}
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    required
                                                    placeholder="Re-enter new password"
                                                    className="w-full bg-[#080E27] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirm(!showConfirm)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                                >
                                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={pwdUpdating}
                                            className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition disabled:opacity-50"
                                        >
                                            {pwdUpdating ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Updating Password...
                                                </>
                                            ) : (
                                                "Update Password"
                                            )}
                                        </button>
                                    </form>
                                </div>

                                {/* Active Login Sessions */}
                                <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Laptop size={20} className="text-[#FDB913]" /> Active Devices & Sessions
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Single-device login enforcement is active. Only one device can be logged in at a time.
                                            </p>
                                        </div>
                                        <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Single-Device Active
                                        </span>
                                    </div>

                                    {/* Real-time single device policy banner */}
                                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                        <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                        <div className="text-xs text-amber-200/90 leading-relaxed">
                                            <span className="font-bold text-amber-300">Single Device Policy:</span> For account security, signing in from another device or browser will automatically log out this current session in real time.
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {sessions.length === 0 ? (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-gray-400">
                                                No active external sessions found. You are connected via this device.
                                            </div>
                                        ) : (
                                            sessions.map((sess) => (
                                                <div
                                                    key={sess.id}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition"
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FDB913] shrink-0">
                                                            {sess.device?.includes("iPhone") || sess.device?.includes("Mobile") || sess.device?.includes("Android") ? (
                                                                <Smartphone size={20} />
                                                            ) : (
                                                                <Laptop size={20} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold text-white">{sess.device}</p>
                                                                {sess.isCurrent && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                                                        This Device
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {sess.location} • <span className="font-mono text-gray-500">{sess.ip}</span> • {sess.lastActive}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => confirmRevokeSession(sess)}
                                                        disabled={revokingId === sess.id}
                                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition self-start sm:self-auto ${sess.isCurrent
                                                                ? "text-amber-400 hover:bg-amber-500/10 border border-amber-500/30"
                                                                : "text-red-400 hover:bg-red-500/10 border border-red-500/20"
                                                            }`}
                                                        title={sess.isCurrent ? "Revoke session and log out of this device" : "Revoke session from this device"}
                                                    >
                                                        {revokingId === sess.id
                                                            ? "Revoking..."
                                                            : sess.isCurrent
                                                                ? "Log Out / Revoke"
                                                                : "Revoke Access"}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 3: NOTIFICATIONS (COMMENTED OUT) ──────────────────── */}
                        {/* activeTab === "notifications" && (
                            <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                                <div className="border-b border-white/10 pb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Bell size={20} className="text-[#FDB913]" /> Notification Preferences
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Control which alerts you receive via email and what sounds play during live auctions.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                            Email Notifications
                                        </h4>
                                        <div className="space-y-3">
                                            {[
                                                {
                                                    key: "emailAlerts",
                                                    title: "Tournament Registration Alerts",
                                                    desc: "Get notified when a new team registers for your tournaments.",
                                                },
                                                {
                                                    key: "bidOutbidAlerts",
                                                    title: "Player Outbid & Sale Updates",
                                                    desc: "Receive real-time notifications when a player is sold or high bid changes.",
                                                },
                                                {
                                                    key: "auctionReminders",
                                                    title: "Upcoming Auction Schedules",
                                                    desc: "Reminders 1 hour and 15 minutes before an auction goes live.",
                                                },
                                                {
                                                    key: "systemAnnouncements",
                                                    title: "Platform News & Feature Updates",
                                                    desc: "Stay informed about newly released features and platform improvements.",
                                                },
                                            ].map((item) => (
                                                <div
                                                    key={item.key}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                                                >
                                                    <div>
                                                        <h5 className="text-sm font-bold text-white">{item.title}</h5>
                                                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={preferences.notifications[item.key]}
                                                            onChange={(e) => {
                                                                const updated = {
                                                                    ...preferences,
                                                                    notifications: {
                                                                        ...preferences.notifications,
                                                                        [item.key]: e.target.checked,
                                                                    },
                                                                };
                                                                setPreferences(updated);
                                                                handleSavePreferences(updated);
                                                            }}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FDB913]"></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Volume2 size={14} className="text-[#FDB913]" /> Live Auction Sound Effects
                                        </h4>
                                        <div className="space-y-3">
                                            {[
                                                {
                                                    key: "soundEffects",
                                                    title: "New Bid Sound Effect",
                                                    desc: "Play sound chime whenever a new bid is placed by any team.",
                                                },
                                                {
                                                    key: "countdownChime",
                                                    title: "10-Second Clock Warning",
                                                    desc: "Urgent ticking sound effect as the timer runs below 10 seconds.",
                                                },
                                                {
                                                    key: "hammerSound",
                                                    title: "Gavel & Sold Climax Audio",
                                                    desc: "Auction gavel strike sound when a player is confirmed SOLD or UNSOLD.",
                                                },
                                            ].map((item) => (
                                                <div
                                                    key={item.key}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                                                >
                                                    <div>
                                                        <h5 className="text-sm font-bold text-white">{item.title}</h5>
                                                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={preferences.notifications[item.key]}
                                                            onChange={(e) => {
                                                                const updated = {
                                                                    ...preferences,
                                                                    notifications: {
                                                                        ...preferences.notifications,
                                                                        [item.key]: e.target.checked,
                                                                    },
                                                                };
                                                                setPreferences(updated);
                                                                handleSavePreferences(updated);
                                                            }}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FDB913]"></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) */}

                        {/* ─── TAB 4: AUCTION PREFERENCES (COMMENTED OUT) ────────────── */}
                        {/* activeTab === "auction" && (
                            <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                                <div className="border-b border-white/10 pb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Gavel size={20} className="text-[#FDB913]" /> Auction & Bidding Controls
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Configure display formats, default bid increments, and bid safety protections.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                <Coins size={16} className="text-[#FDB913]" /> Default Currency / Bidding Unit
                                            </h5>
                                            <p className="text-xs text-gray-400">
                                                The bidding unit across all player valuations, purse pools, and live auctions is set to Point (Pts).
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#FDB913]/15 border border-[#FDB913]/30 text-[#FDB913] text-xs font-bold w-fit">
                                            <Coins size={13} />
                                            <span>Point (Pts)</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div>
                                                <h5 className="text-sm font-bold text-white">Bid Confirmation Popup</h5>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Show a quick confirmation dialog before submitting a bid to prevent accidental button taps.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.auction.confirmBeforeBid}
                                                    onChange={(e) => {
                                                        const updated = {
                                                            ...preferences,
                                                            auction: {
                                                                    ...preferences.auction,
                                                                    confirmBeforeBid: e.target.checked,
                                                            },
                                                        };
                                                        setPreferences(updated);
                                                        handleSavePreferences(updated);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FDB913]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div>
                                                <h5 className="text-sm font-bold text-white">Show Live Spectators Count</h5>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Display the number of team owners and viewers active in the live auction room.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.auction.showLiveSpectators}
                                                    onChange={(e) => {
                                                        const updated = {
                                                            ...preferences,
                                                            auction: {
                                                                    ...preferences.auction,
                                                                    showLiveSpectators: e.target.checked,
                                                            },
                                                        };
                                                        setPreferences(updated);
                                                        handleSavePreferences(updated);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FDB913]"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) */}

                        {/* ─── TAB 5: DANGER ZONE & DATA (COMMENTED OUT) ─────────────── */}
                        {/* activeTab === "danger" && (
                            <div className="space-y-6">
                                <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Download size={20} className="text-blue-400" /> Export Personal Data
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Download a complete archive of your tournaments, registered teams, players, and auction history in standard JSON format.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleExportData}
                                            className="px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold transition flex items-center gap-2"
                                        >
                                            <Download size={14} /> Download Archive
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-red-500" />

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-red-400">Deactivate or Delete Account</h3>
                                            <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
                                                Once your account is deactivated, all active auctions will be paused. Your tournament rosters, team allotments, and historical records will be locked. This action cannot be immediately undone without administrator review.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-red-500/10">
                                        <button
                                            onClick={() => setDeleteModalOpen(true)}
                                            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition shadow-lg shadow-red-500/20 flex items-center gap-2"
                                        >
                                            <Trash2 size={14} /> Deactivate Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) */}
                    </div>
                )}
            </main>

            {/* ── Deactivate Account Confirmation Modal ── */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#0F1B3D] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-red-500" />

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-base">Confirm Account Deactivation</h4>
                                <p className="text-xs text-gray-400">Please verify your identity to proceed</p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                            Are you absolutely sure you want to deactivate your account? All live tournament actions will be suspended.
                        </p>

                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Account Password</label>
                                <input
                                    type="password"
                                    value={deleteConfirmPassword}
                                    onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full bg-[#080E27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-400"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Reason (Optional)</label>
                                <input
                                    type="text"
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="Why are you deactivating?"
                                    className="w-full bg-[#080E27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                {deleting ? "Deactivating..." : "Yes, Deactivate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Revoke Session Confirmation Modal ── */}
            {revokeModalOpen && sessionToRevoke && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`bg-[#0F1B3D] border ${sessionToRevoke.isCurrent ? 'border-amber-500/30' : 'border-red-500/30'} rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden`}>
                        {/* Top Accent Strip */}
                        <div className={`absolute top-0 inset-x-0 h-1 ${sessionToRevoke.isCurrent ? 'bg-amber-500' : 'bg-red-500'}`} />

                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-11 h-11 rounded-xl ${sessionToRevoke.isCurrent ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} border flex items-center justify-center shrink-0`}>
                                {sessionToRevoke.isCurrent ? <AlertTriangle size={22} /> : <ShieldAlert size={22} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-base">
                                    {sessionToRevoke.isCurrent ? "Revoke Current Session & Log Out" : "Revoke Device Access"}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {sessionToRevoke.isCurrent ? "Confirm logout from this device" : "Terminate active login session"}
                                </p>
                            </div>
                        </div>

                        {/* Device Info Card */}
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 mb-5 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Device:</span>
                                <span className="font-semibold text-white">{sessionToRevoke.device || "Unknown Device"}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">IP & Location:</span>
                                <span className="text-gray-300">{sessionToRevoke.location || "Unknown"} ({sessionToRevoke.ip || "—"})</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Last Active:</span>
                                <span className="text-gray-300">{sessionToRevoke.lastActive || "Recently"}</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                            {sessionToRevoke.isCurrent
                                ? "Are you sure you want to revoke this session? You will be immediately logged out of this browser and redirected to the login screen."
                                : "Are you sure you want to revoke access for this device? This session will be terminated and prevented from making any further requests."
                            }
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setRevokeModalOpen(false);
                                    setSessionToRevoke(null);
                                }}
                                disabled={revokingId !== null}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteRevoke}
                                disabled={revokingId !== null}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-lg flex items-center justify-center gap-1.5 ${sessionToRevoke.isCurrent
                                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                                        : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                    } disabled:opacity-50`}
                            >
                                {revokingId ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        Revoking...
                                    </>
                                ) : sessionToRevoke.isCurrent ? (
                                    "Yes, Revoke & Log Out"
                                ) : (
                                    "Yes, Revoke Access"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
