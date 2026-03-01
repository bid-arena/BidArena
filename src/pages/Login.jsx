import LoginForm from "../features/auth/LoginForm";

const Login = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1220] to-black flex items-center justify-center px-6">

            <div className="w-full max-w-7xl bg-gradient-to-br from-[#0b1220] to-[#111827] rounded-3xl shadow-2xl border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2">

                {/* LEFT SIDE */}
                <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-[#0b1220] to-[#0f172a] relative overflow-hidden">

                    {/* Decorative Blur Circle */}
                    <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#FACC15]/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-[#FACC15]/5 rounded-full blur-3xl"></div>

                    <h1 className="text-5xl font-bold leading-tight text-white mb-6 relative z-10">
                        Manage Your <br />
                        <span className="text-[#FACC15]">
                            Dashboard
                        </span>
                    </h1>

                    <p className="text-gray-400 text-lg leading-relaxed max-w-md mb-8 relative z-10">
                        Access your personalized dashboard based on your role.
                        Organizers manage tournaments, captains lead teams,
                        players track performance, and admins oversee the system.
                    </p>

                    {/* Role Tags */}
                    <div className="flex flex-wrap gap-3 relative z-10">
                        {/* <span className="px-4 py-2 text-sm bg-[#1f2937] text-gray-300 rounded-full border border-white/10">
                            Admin Access
                        </span> */}
                        <span className="px-4 py-2 text-sm bg-[#1f2937] text-gray-300 rounded-full border border-white/10">
                            Organizer Panel
                        </span>
                        <span className="px-4 py-2 text-sm bg-[#1f2937] text-gray-300 rounded-full border border-white/10">
                            Team Captain
                        </span>
                        <span className="px-4 py-2 text-sm bg-[#1f2937] text-gray-300 rounded-full border border-white/10">
                            Player Dashboard
                        </span>
                    </div>

                </div>

                {/* RIGHT SIDE */}
                <div className="p-12 flex items-center justify-center bg-[#1f2937]/40 backdrop-blur-xl">
                    <div className="w-full max-w-md">
                        <LoginForm />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Login;