import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const RegisterForm = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        organizerName: "",
        email: "",
        password: "",
        role: "ORGANIZER",
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validate = () => {
        let newErrors = {};

        if (!formData.organizerName.trim())
            newErrors.organizerName = "Organizer name is required";

        if (!formData.email)
            newErrors.email = "Email is required";
        else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
        )
            newErrors.email = "Invalid email address";

        if (!formData.password)
            newErrors.password = "Password is required";
        else if (formData.password.length < 6)
            newErrors.password = "Minimum 6 characters required";

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length !== 0) return;

        try {
            setLoading(true);

            await api.post("/auth/register", formData);

            toast.success("Organizer Registered Successfully");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-center mb-2">
                Organizer Registration
            </h2>

            <p className="text-gray-400 text-center mb-8">
                Create your management account
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Organizer Name */}
                <div>
                    <label className="text-sm text-gray-400">
                        Organizer Name
                    </label>
                    <input
                        type="text"
                        name="organizerName"
                        value={formData.organizerName}
                        onChange={handleChange}
                        placeholder="Enter organizer name"
                        className={`w-full mt-2 px-4 py-3 bg-[#0B1120] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition
              ${errors.organizerName
                                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                                : "border-white/10 focus:ring-2 focus:ring-[#FACC15]"
                            }`}
                    />
                    {errors.organizerName && (
                        <p className="text-red-400 text-xs mt-2">
                            {errors.organizerName}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="text-sm text-gray-400">
                        Email Address
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        className={`w-full mt-2 px-4 py-3 bg-[#0B1120] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition
              ${errors.email
                                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                                : "border-white/10 focus:ring-2 focus:ring-[#FACC15]"
                            }`}
                    />
                    {errors.email && (
                        <p className="text-red-400 text-xs mt-2">
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="relative">
                    <label className="text-sm text-gray-400">
                        Password
                    </label>

                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        className={`w-full mt-2 px-4 py-3 pr-12 bg-[#0B1120] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition
              ${errors.password
                                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                                : "border-white/10 focus:ring-2 focus:ring-[#FACC15]"
                            }`}
                    />

                    <div
                        className="absolute right-4 top-[46px] cursor-pointer text-gray-400 hover:text-[#FACC15]"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>

                    {errors.password && (
                        <p className="text-red-400 text-xs mt-2">
                            {errors.password}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold transition duration-300 flex items-center justify-center gap-2
            ${loading
                            ? "bg-gray-700 cursor-not-allowed"
                            : "bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-black hover:opacity-90 shadow-lg shadow-yellow-500/20"
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Creating Account...
                        </>
                    ) : (
                        "Create Organizer Account"
                    )}
                </button>
            </form>

            <p className="text-gray-400 text-center mt-6 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-[#FACC15] hover:underline">
                    Login
                </Link>
            </p>
        </div>
    );
};

export default RegisterForm;