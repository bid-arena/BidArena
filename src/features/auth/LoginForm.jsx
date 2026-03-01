import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LoginForm = () => {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const res = await axios.post(
                "http://localhost:5000/api/auth/login",
                formData
            );

            const { user, token } = res.data.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            // Role-based Redirect
            switch (user.role) {
                case "ADMIN":
                    navigate("/admin-dashboard");
                    break;
                case "ORGANIZER":
                    navigate("/organizer-dashboard");
                    break;
                case "CAPTAIN":
                    navigate("/captain-dashboard");
                    break;
                case "PLAYER":
                    navigate("/player-dashboard");
                    break;
                default:
                    navigate("/");
            }

        } catch (error) {
            alert(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>

            <h2 className="text-4xl font-bold text-white mb-2 text-center">
                Welcome Back
            </h2>

            <p className="text-gray-400 text-center mb-8">
                Login to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

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
                        required
                        className="w-full mt-2 px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition"
                    />
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
                        required
                        className="w-full mt-2 px-4 py-3 pr-12 bg-[#0B1120] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition"
                    />

                    <div
                        className="absolute right-4 top-[46px] cursor-pointer text-gray-400 hover:text-[#FACC15]"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
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
                            Logging in...
                        </>
                    ) : (
                        "Login"
                    )}
                </button>

            </form>

        </div>
    );
};

export default LoginForm;