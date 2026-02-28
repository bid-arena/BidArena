import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        organizerName: "",
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validation Function
    const validate = () => {
        let newErrors = {};

        if (!formData.organizerName.trim()) {
            newErrors.organizerName = "Organizer name is required";
        }

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
        ) {
            newErrors.email = "Invalid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length !== 0) return;

        setLoading(true);

        setTimeout(() => {
            console.log("Registered:", formData);
            setLoading(false);
        }, 2000);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white text-center mb-2">
                Organizer Registration
            </h2>

            <p className="text-[#B0B8D1] text-center mb-8">
                Create your auction management account
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Organizer Name */}
                <div>
                    <label className="text-sm text-[#B0B8D1]">Organizer Name</label>
                    <input
                        type="text"
                        name="organizerName"
                        value={formData.organizerName}
                        onChange={handleChange}
                        placeholder="Enter organizer name"
                        className={`w-full mt-2 px-4 py-3 bg-[#0A0F2C] border rounded-xl text-white placeholder-gray-400 focus:outline-none transition ${errors.organizerName
                            ? "border-red-500 focus:ring-2 focus:ring-red-500"
                            : formData.organizerName
                                ? "border-green-500"
                                : "border-white/10 focus:ring-2 focus:ring-[#FDB913]"
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
                    <label className="text-sm text-[#B0B8D1]">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        className={`w-full mt-2 px-4 py-3 bg-[#0A0F2C] border rounded-xl text-white placeholder-gray-400 focus:outline-none transition ${errors.email
                            ? "border-red-500 focus:ring-2 focus:ring-red-500"
                            : formData.email
                                ? "border-green-500"
                                : "border-white/10 focus:ring-2 focus:ring-[#FDB913]"
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
                    <label className="text-sm text-[#B0B8D1]">Password</label>

                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        className={`w-full mt-2 px-4 py-3 pr-12 bg-[#0A0F2C] border rounded-xl text-white placeholder-gray-400 focus:outline-none transition ${errors.password
                            ? "border-red-500 focus:ring-2 focus:ring-red-500"
                            : formData.password.length >= 6
                                ? "border-green-500"
                                : "border-white/10 focus:ring-2 focus:ring-[#FDB913]"
                            }`}
                    />

                    {/* Eye Icon */}
                    <div
                        className="absolute right-4 top-[46px] cursor-pointer text-gray-400 hover:text-[#FDB913]"
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

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-full font-semibold shadow-lg transition duration-300 flex items-center justify-center gap-2 ${loading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#00E676] to-[#00C853] hover:scale-105 text-black"
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Creating Account...
                        </>
                    ) : (
                        "Create Organizer Account"
                    )}
                </button>
            </form>

            <p className="text-[#B0B8D1] text-center mt-6 text-sm">
                Already registered?{" "}
                <Link to="/login" className="text-[#FDB913] hover:underline">
                    Login
                </Link>
            </p>
        </div>
    );
};

export default RegisterForm;