import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    Trophy,
    Users,
    User,
    Search,
    Award,
    TrendingUp,
    Coins,
    BarChart3,
    Check,
    X,
    ChevronRight,
    Gavel,
    Volume2,
    VolumeX,
    Bell,
    Clock,
    Flame,
    Sparkles,
    Shield,
    SlidersHorizontal,
    Share2,
    Calendar,
    Target,
    Zap,
    MapPin,
    AlertCircle,
    UserCheck,
    RefreshCw,
    Play,
    Pause,
    Plus,
    Minus,
    HelpCircle
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

// ==========================================
// MOCK DATA GENERATORS & CONSTANTS
// ==========================================

const DISTRICTS = ["Mumbai", "Pune", "Thane", "Kolhapur", "Nagpur", "Nashik", "Satara"];

const MOCK_TEAMS = [
    {
        id: "t1",
        name: "Mumbai Monarchs",
        shortName: "MM",
        logo: "👑",
        owner: "Rohan Singhania",
        coach: "Amol Muzumdar",
        captain: "Prithvi Shaw",
        color: "from-blue-600 to-indigo-800",
        bgHex: "#2563EB",
        totalPurse: 10000000,
        remainingPurse: 6800000,
        playersBoughtCount: 8,
        activeBid: 0
    },
    {
        id: "t2",
        name: "Pune Warriors",
        shortName: "PW",
        logo: "⚔️",
        owner: "Abhay Patil",
        coach: "Kedar Jadhav",
        captain: "Ruturaj Gaikwad",
        color: "from-orange-500 to-red-700",
        bgHex: "#F97316",
        totalPurse: 10000000,
        remainingPurse: 5400000,
        playersBoughtCount: 9,
        activeBid: 0
    },
    {
        id: "t3",
        name: "Thane Titans",
        shortName: "TT",
        logo: "🔱",
        owner: "Vikram Seth",
        coach: "Pravin Amre",
        captain: "Shardul Thakur",
        color: "from-yellow-500 to-amber-600",
        bgHex: "#D4AF37",
        totalPurse: 10000000,
        remainingPurse: 7100000,
        playersBoughtCount: 6,
        activeBid: 0
    },
    {
        id: "t4",
        name: "Kolhapur Kings",
        shortName: "KK",
        logo: "🦁",
        owner: "Yuvraj Bhosale",
        coach: "Ramesh Powar",
        captain: "Ankit Bhosale",
        color: "from-purple-600 to-fuchsia-800",
        bgHex: "#8B5CF6",
        totalPurse: 10000000,
        remainingPurse: 4800000,
        playersBoughtCount: 11,
        activeBid: 0
    },
    {
        id: "t5",
        name: "Nagpur Ninjas",
        shortName: "NN",
        logo: "🎯",
        owner: "Sanjay Agrawal",
        coach: "Vidarbha Coach",
        captain: "Akshay Wadkar",
        color: "from-emerald-600 to-teal-800",
        bgHex: "#10B981",
        totalPurse: 10000000,
        remainingPurse: 8200000,
        playersBoughtCount: 5,
        activeBid: 0
    }
];

const MOCK_PLAYERS = [
    {
        id: "p1",
        name: "Ajinkya Deshmukh",
        jerseyNumber: "17",
        age: 26,
        role: "All-Rounder",
        style: "Right-hand Bat / Right-arm Fast Medium",
        district: "Pune",
        club: "Deccan Gymkhana",
        basePrice: 150000,
        currentBid: 320000,
        status: "ACTIVE",
        isCaptainMaterial: true,
        isEmerging: false,
        isStar: true,
        photo: "🏏",
        stats: {
            matches: 48,
            runs: 1120,
            avg: 32.5,
            sr: 142.8,
            wickets: 54,
            econ: 7.25,
            bestBowled: "4/18",
            highestScore: "82*"
        },
        history: [
            { year: "2024", team: "Pune Warriors", price: 280000 },
            { year: "2025", team: "Pune Warriors", price: 300000 }
        ]
    },
    {
        id: "p2",
        name: "Siddhesh Salunkhe",
        jerseyNumber: "45",
        age: 23,
        role: "Batter",
        style: "Right-hand Bat",
        district: "Mumbai",
        club: "Shivaji Park Gymkhana",
        basePrice: 100000,
        currentBid: 0,
        status: "AVAILABLE",
        isCaptainMaterial: false,
        isEmerging: true,
        isStar: false,
        photo: "🏏",
        stats: {
            matches: 32,
            runs: 840,
            avg: 28.0,
            sr: 135.2,
            wickets: 0,
            econ: 0,
            bestBowled: "—",
            highestScore: "74"
        },
        history: []
    },
    {
        id: "p3",
        name: "Karan Bhandari",
        jerseyNumber: "08",
        age: 28,
        role: "Bowler",
        style: "Right-arm Offbreak",
        district: "Thane",
        club: "Golden Star Academy",
        basePrice: 120000,
        currentBid: 280000,
        status: "SOLD",
        soldTo: "t3",
        isCaptainMaterial: false,
        isEmerging: false,
        isStar: true,
        photo: "🥎",
        stats: {
            matches: 60,
            runs: 150,
            avg: 12.0,
            sr: 110.0,
            wickets: 82,
            econ: 6.45,
            bestBowled: "5/12",
            highestScore: "24*"
        },
        history: [
            { year: "2025", team: "Thane Titans", price: 180000 }
        ]
    },
    {
        id: "p4",
        name: "Aditya Raje",
        jerseyNumber: "99",
        age: 29,
        role: "Wicketkeeper",
        style: "Right-hand Bat / Wicketkeeper",
        district: "Kolhapur",
        club: "Shahu Maharaj Club",
        basePrice: 150000,
        currentBid: 0,
        status: "UNSOLD",
        isCaptainMaterial: true,
        isEmerging: false,
        isStar: false,
        photo: "🧤",
        stats: {
            matches: 55,
            runs: 1420,
            avg: 38.4,
            sr: 138.9,
            wickets: 0,
            econ: 0,
            catches: 38,
            stumpings: 12,
            highestScore: "95*"
        },
        history: []
    },
    {
        id: "p5",
        name: "Nikhil Joshi",
        jerseyNumber: "07",
        age: 21,
        role: "All-Rounder",
        style: "Left-hand Bat / Slow Left-arm Orthodox",
        district: "Nashik",
        club: "Nashik Warriors",
        basePrice: 80000,
        currentBid: 0,
        status: "AVAILABLE",
        isCaptainMaterial: false,
        isEmerging: true,
        isStar: false,
        photo: "🏏",
        stats: {
            matches: 18,
            runs: 290,
            avg: 22.3,
            sr: 124.6,
            wickets: 15,
            econ: 6.80,
            bestBowled: "3/22",
            highestScore: "42"
        },
        history: []
    },
    {
        id: "p6",
        name: "Rohan Deshpande",
        jerseyNumber: "22",
        age: 25,
        role: "Bowler",
        style: "Left-arm Fast",
        district: "Nagpur",
        club: "Nagpur Colts",
        basePrice: 120000,
        currentBid: 0,
        status: "AVAILABLE",
        isCaptainMaterial: false,
        isEmerging: false,
        isStar: true,
        photo: "🥎",
        stats: {
            matches: 42,
            runs: 80,
            avg: 8.5,
            sr: 98.0,
            wickets: 64,
            econ: 7.10,
            bestBowled: "4/20",
            highestScore: "18"
        },
        history: []
    }
];

const MOCK_MEMBER_ACTIVITIES = [
    { id: 1, text: "Thane Titans raised bid to ₹3,50,000", time: "10s ago", type: "bid" },
    { id: 2, text: "Pune Warriors raised bid to ₹3,20,000", time: "25s ago", type: "bid" },
    { id: 3, text: "Kolhapur Kings withdrew from bid wars", time: "45s ago", type: "withdraw" },
    { id: 4, text: "Player Karan Bhandari SOLD to Thane Titans for ₹2,80,000", time: "2m ago", type: "sold" },
    { id: 5, text: "Mumbai Monarchs placed starting bid ₹1,50,000", time: "3m ago", type: "bid" }
];

export default function DemoAuction() {
    // Page navigation state
    const [activeView, setActiveView] = useState("live-auction"); // live-auction, players, player-profile, team-page, leaderboard, statistics, settings
    const [selectedPlayer, setSelectedPlayer] = useState(MOCK_PLAYERS[0]);
    const [selectedTeam, setSelectedTeam] = useState(MOCK_TEAMS[0]);

    // Live auction stats state
    const [activePlayer, setActivePlayer] = useState(MOCK_PLAYERS[0]);
    const [currentBidAmount, setCurrentBidAmount] = useState(150000);
    const [highestBidder, setHighestBidder] = useState(MOCK_TEAMS[0]);
    const [timerSecs, setTimerSecs] = useState(30);
    const [timerActive, setTimerActive] = useState(true);
    const [bidLogs, setBidLogs] = useState(MOCK_MEMBER_ACTIVITIES);
    const [teamsState, setTeamsState] = useState(MOCK_TEAMS);
    const [audioMuted, setAudioMuted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Filter states for players page
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [districtFilter, setDistrictFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // Notifications state
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Auction Started", text: "Round 3 has commenced. Active bidding is open.", time: "5m ago" },
        { id: 2, title: "Player Sold", text: "Karan Bhandari sold to Thane Titans for ₹2.8L.", time: "10m ago" }
    ]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Sound alert generator
    const playAlert = (type) => {
        if (audioMuted) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === "bid") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === "sold") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            } else if (type === "warning") {
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            }
        } catch (e) {
            console.error("Audio generation failed", e);
        }
    };

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 3500);
    };

    // Live countdown timer effect
    useEffect(() => {
        let interval = null;
        if (timerActive && !isPaused && timerSecs > 0) {
            interval = setInterval(() => {
                setTimerSecs((prev) => prev - 1);
            }, 1000);
        } else if (timerSecs === 0) {
            setTimerActive(false);
            playAlert("warning");
            triggerToast(`⚠️ Time has expired for ${activePlayer.name}!`);
        }
        return () => clearInterval(interval);
    }, [timerSecs, timerActive, isPaused]);

    // Simulated Socket.io events
    const simulateBid = (amountIncrement = 50000) => {
        if (timerSecs <= 0) {
            triggerToast("Cannot place bids. Timer has expired!");
            return;
        }

        const remainingTeams = teamsState.filter((t) => t.id !== highestBidder.id);
        const randomTeam = remainingTeams[Math.floor(Math.random() * remainingTeams.length)];
        const nextAmount = currentBidAmount + amountIncrement;

        if (randomTeam.remainingPurse < nextAmount) {
            triggerToast(`${randomTeam.name} has insufficient purse!`);
            return;
        }

        playAlert("bid");
        setCurrentBidAmount(nextAmount);
        setHighestBidder(randomTeam);
        setTimerSecs(30);
        setTimerActive(true);

        const logId = Date.now();
        const newLog = {
            id: logId,
            text: `${randomTeam.name} raised bid to ₹${(nextAmount / 100000).toFixed(2)} Lakhs`,
            time: "Just now",
            type: "bid"
        };
        setBidLogs((prev) => [newLog, ...prev]);
        triggerToast(`🔥 New Bid of ₹${newLog.text.split("₹")[1]}!`);
    };

    const handleOwnerBid = (increment) => {
        const nextAmount = currentBidAmount + increment;
        const mmTeam = teamsState.find((t) => t.id === "t1");

        if (mmTeam.remainingPurse < nextAmount) {
            triggerToast("Your team has insufficient purse balance!");
            return;
        }

        playAlert("bid");
        setCurrentBidAmount(nextAmount);
        setHighestBidder(mmTeam);
        setTimerSecs(30);
        setTimerActive(true);

        const logId = Date.now();
        const newLog = {
            id: logId,
            text: `${mmTeam.name} (You) raised bid to ₹${(nextAmount / 100000).toFixed(2)} Lakhs`,
            time: "Just now",
            type: "bid"
        };
        setBidLogs((prev) => [newLog, ...prev]);
        triggerToast("🚀 Your bid placed successfully!");
    };

    const sellActivePlayer = () => {
        playAlert("sold");
        const logId = Date.now();
        const newLog = {
            id: logId,
            text: `🔨 Hammer Down! ${activePlayer.name} SOLD to ${highestBidder.name} for ₹${(currentBidAmount / 100000).toFixed(2)} Lakhs`,
            time: "Just now",
            type: "sold"
        };
        setBidLogs((prev) => [newLog, ...prev]);
        triggerToast(`🎉 SOLD! ${activePlayer.name} is acquired by ${highestBidder.name}!`);

        setTeamsState((prev) =>
            prev.map((t) =>
                t.id === highestBidder.id
                    ? {
                        ...t,
                        remainingPurse: t.remainingPurse - currentBidAmount,
                        playersBoughtCount: t.playersBoughtCount + 1
                    }
                    : t
            )
        );

        setTimerActive(false);
    };

    const nextPlayerNomination = () => {
        const index = MOCK_PLAYERS.findIndex((p) => p.id === activePlayer.id);
        const nextIdx = (index + 1) % MOCK_PLAYERS.length;
        const nextP = MOCK_PLAYERS[nextIdx];

        setActivePlayer(nextP);
        setCurrentBidAmount(nextP.basePrice);
        setTimerSecs(30);
        setTimerActive(true);
        triggerToast(`Next Player nominated: ${nextP.name}`);
    };

    return (
        <div className="min-h-screen bg-[#0B1020] text-gray-100 flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2563EB]/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#F97316]/8 rounded-full blur-[140px] pointer-events-none animate-pulse" />
            <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── TOAST ALERT BLOCK ── */}
            {toastMessage && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="backdrop-blur-xl bg-[#0F1C3F]/95 border border-[#D4AF37]/40 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                        <Sparkles className="text-[#D4AF37] animate-spin" size={16} />
                        <span className="text-xs font-black uppercase text-white tracking-wider">{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* ── TOP NAVIGATION BAR ── */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0B1020]/80 border-b border-white/[0.08] px-4 lg:px-8 py-3.5 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#F97316] p-0.5 shadow-lg flex items-center justify-center text-white text-xl font-black">
                        🏏
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm lg:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                                <Trophy size={16} className="text-[#D4AF37]" />
                                MAHARASHTRA PREMIER LEAGUE
                            </h1>
                            <span className="bg-[#F97316] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 shadow-sm animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                LIVE
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Round 3: Premium All-Rounders & Batters</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-6">
                    <div className="relative hidden md:block">
                        <input
                            type="text"
                            placeholder="Quick lookup player..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (activeView !== "players") setActiveView("players");
                            }}
                            className="bg-black/35 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] w-52 focus:w-64 transition-all duration-300"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                    </div>

                    <button
                        onClick={() => setAudioMuted(!audioMuted)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white"
                        title={audioMuted ? "Unmute sounds" : "Mute sounds"}
                    >
                        {audioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white relative"
                        >
                            <Bell size={15} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316]" />
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 backdrop-blur-xl bg-[#0F1C3F]/95 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Broadcast Alerts</h4>
                                    <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="space-y-2.5">
                                    {notifications.map((n) => (
                                        <div key={n.id} className="bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-xl text-xs">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-[#D4AF37] mb-1">
                                                <span>{n.title}</span>
                                                <span className="text-gray-500 font-mono font-normal">{n.time}</span>
                                            </div>
                                            <p className="text-gray-300 leading-relaxed text-[11px]">{n.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
                        <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F97316] p-0.5 flex items-center justify-center font-bold text-xs text-black shrink-0">
                            RM
                        </div>
                        <div className="hidden lg:block text-left">
                            <span className="block text-[11px] font-black uppercase tracking-wider text-white">Rohan Mane</span>
                            <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest">Arena Admin</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── CORE LAYOUT FOR DESKTOP / TABLET ── */}
            <div className="flex-1 flex overflow-hidden">
                {/* ── LEFT SIDEBAR ── */}
                <aside className="w-64 border-r border-white/[0.08] bg-[#0B1020]/90 p-5 hidden lg:flex flex-col justify-between shrink-0 z-20">
                    <div className="space-y-6">
                        <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest pl-2">Navigation Deck</p>
                        <nav className="space-y-1">
                            {[
                                { id: "live-auction", label: "Live Auction", icon: Gavel },
                                { id: "players", label: "Players Pool", icon: User },
                                { id: "player-profile", label: "Player Profile", icon: Award },
                                { id: "team-page", label: "Franchise Squads", icon: Users },
                                { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                                { id: "statistics", label: "Analytics & Stats", icon: BarChart3 },
                                { id: "settings", label: "Simulation Console", icon: SlidersHorizontal }
                            ].map((item) => {
                                const Icon = item.icon;
                                const isActive = activeView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveView(item.id);
                                            if (item.id === "player-profile" && !selectedPlayer) {
                                                setSelectedPlayer(MOCK_PLAYERS[0]);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 uppercase tracking-wider hover:scale-[1.01] ${isActive
                                            ? "bg-[#2563EB]/15 border-l-4 border-[#2563EB] text-[#2563EB] shadow-lg shadow-blue-500/[0.04]"
                                            : "text-gray-400 hover:bg-white/[0.02] hover:text-white"
                                            }`}
                                    >
                                        <Icon size={14} className={isActive ? "text-[#2563EB]" : "text-gray-500"} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="border-t border-white/[0.06] pt-4 text-center">
                        <span className="text-[9px] text-gray-500 font-semibold tracking-wider block">SOCKET CONNECTION</span>
                        <span className="text-[10px] font-black text-emerald-400 flex items-center justify-center gap-1.5 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            MOCK_SOCKET_ACTIVE
                        </span>
                    </div>
                </aside>

                {/* ── MAIN WORKSPACE CONTENT ── */}
                <div className="flex-1 flex flex-col overflow-y-auto bg-[#0B1020]/40">
                    <div className="flex-1 p-4 lg:p-6">
                        
                        {/* 1. LIVE AUCTION PAGE VIEW */}
                        {activeView === "live-auction" && (
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
                                
                                {/* Spotlight card */}
                                <div className="xl:col-span-8 flex flex-col justify-between backdrop-blur-xl bg-[#0F1C3F]/90 border border-white/[0.08] rounded-3xl p-5 lg:p-7 relative overflow-hidden shadow-2xl min-h-[550px] xl:h-[620px] shadow-black/40">
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/[0.02] rounded-full blur-3xl pointer-events-none" />
                                    
                                    {/* Spotlight Header info */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/[0.06] pb-4 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#F97316] text-white flex items-center justify-center text-3xl font-black shadow-lg">
                                                {activePlayer.photo}
                                            </div>
                                            <div>
                                                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase truncate">{activePlayer.name}</h2>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="px-2.5 py-0.5 bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#2563EB] rounded-full text-[10px] font-black uppercase">
                                                        {activePlayer.role}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase">
                                                        {activePlayer.district}
                                                    </span>
                                                    {activePlayer.isStar && (
                                                        <span className="px-2 py-0.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full text-[10px] font-black text-[#D4AF37] uppercase tracking-wide flex items-center gap-1">
                                                            <Sparkles size={8} /> Star Player
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Countdown Clock */}
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-14 h-14 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.04)" strokeWidth="4" fill="transparent" />
                                                    <circle
                                                        cx="28"
                                                        cy="28"
                                                        r="24"
                                                        stroke={timerSecs <= 8 ? "#F97316" : "#D4AF37"}
                                                        strokeWidth="4"
                                                        fill="transparent"
                                                        strokeDasharray="150.7"
                                                        strokeDashoffset={150.7 - (150.7 * timerSecs) / 30}
                                                        className="transition-all duration-300"
                                                    />
                                                </svg>
                                                <span className={`absolute text-sm font-black font-mono ${timerSecs <= 8 ? "text-[#F97316] animate-pulse" : "text-white"}`}>
                                                    {timerSecs}s
                                                </span>
                                            </div>
                                            {isPaused && (
                                                <span className="bg-[#F97316]/20 border border-[#F97316]/30 text-[#F97316] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider animate-pulse">
                                                    PAUSED
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Central Bid Panel */}
                                    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Base price display */}
                                        <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col justify-between shadow-inner">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <Coins size={12} className="text-[#D4AF37]" /> Reserve Base Valuation
                                            </span>
                                            <div className="mt-3">
                                                <p className="text-xl font-mono font-black text-[#D4AF37]">
                                                    ₹{activePlayer.basePrice.toLocaleString("en-IN")}
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-semibold mt-0.5">Opening starting bid price</p>
                                            </div>
                                        </div>

                                        {/* Current bid display */}
                                        <div className="bg-[#2563EB]/5 border border-[#2563EB]/25 p-4 rounded-2xl flex flex-col justify-between shadow-lg shadow-blue-500/[0.02]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <TrendingUp size={12} className="text-blue-400" /> Current Highest Bid
                                                </span>
                                                {highestBidder && (
                                                    <span className="text-[9px] bg-blue-600/20 text-blue-300 border border-blue-500/35 px-2 py-0.5 rounded-full font-black uppercase">
                                                        {highestBidder.shortName}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-3xl font-mono font-black text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
                                                    ₹{currentBidAmount.toLocaleString("en-IN")}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-1 truncate">
                                                    Held by <span className="text-[#D4AF37] font-black">{highestBidder.name}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action bidding console */}
                                    <div className="border-t border-white/[0.06] pt-5 space-y-4">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Simulated Bidding Deck</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <button
                                                onClick={() => handleOwnerBid(20000)}
                                                className="bg-gradient-to-r from-[#2563EB] to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-black uppercase py-3 rounded-xl transition duration-200 hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/10"
                                            >
                                                Bid + ₹20k
                                            </button>
                                            <button
                                                onClick={() => handleOwnerBid(50000)}
                                                className="bg-gradient-to-r from-[#2563EB] to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-black uppercase py-3 rounded-xl transition duration-200 hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/10"
                                            >
                                                Bid + ₹50k
                                            </button>
                                            <button
                                                onClick={() => simulateBid(50000)}
                                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase py-3 rounded-xl transition duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                                <RefreshCw size={12} className="animate-spin-slow" /> Opponent Bid
                                            </button>
                                            <button
                                                onClick={sellActivePlayer}
                                                className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-black uppercase py-3 rounded-xl transition duration-200 hover:scale-[1.02] active:scale-95 shadow-md shadow-emerald-500/10"
                                            >
                                                🔨 Sold
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <button
                                                onClick={nextPlayerNomination}
                                                className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider hover:text-white transition flex items-center gap-1"
                                            >
                                                Skip / Nominate Next Player <ChevronRight size={12} />
                                            </button>

                                            <div className="text-[10px] text-gray-500 font-mono">
                                                ID: {activePlayer.id.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Teampurse card list */}
                                <div className="xl:col-span-4 backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-5 shadow-2xl flex flex-col justify-between xl:h-[620px] shadow-black/40">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 shrink-0">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                                                <Users size={14} className="text-[#D4AF37]" /> Franchise Purse Status
                                            </h3>
                                            <span className="text-[9px] bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full font-bold">
                                                5 Teams
                                            </span>
                                        </div>

                                        {/* Team Lists */}
                                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                            {teamsState.map((t) => {
                                                const spentPct = Math.round(((t.totalPurse - t.remainingPurse) / t.totalPurse) * 100);
                                                const isCurrentBidding = t.id === highestBidder.id;
                                                return (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => {
                                                            setSelectedTeam(t);
                                                            setActiveView("team-page");
                                                        }}
                                                        className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer hover:scale-[1.01] ${isCurrentBidding
                                                            ? "bg-[#2563EB]/10 border-[#2563EB]/60 shadow-lg shadow-blue-500/[0.02]"
                                                            : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]"
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-xl shrink-0">{t.logo}</span>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-black text-white truncate uppercase tracking-wide">{t.name}</p>
                                                                    <p className="text-[9px] text-gray-500 font-semibold">{t.playersBoughtCount} Bought • Captain: {t.captain}</p>
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <p className="text-[8px] text-gray-500 font-black uppercase">Purse Left</p>
                                                                <p className="text-xs font-mono font-black text-emerald-400">₹{(t.remainingPurse / 100000).toFixed(2)}L</p>
                                                            </div>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="w-full bg-black/45 h-1 rounded-full overflow-hidden mt-2">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-[#D4AF37]`}
                                                                style={{ width: `${spentPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="border-t border-white/[0.06] pt-4">
                                        <div className="bg-[#2563EB]/5 border border-[#2563EB]/25 rounded-2xl p-3 flex justify-between items-center text-xs">
                                            <div>
                                                <span className="block text-[8px] text-gray-500 font-black uppercase">Active Bidding Leader</span>
                                                <span className="font-extrabold text-white text-[11px] truncate block mt-0.5">{highestBidder.name}</span>
                                            </div>
                                            <span className="text-sm font-black font-mono text-[#D4AF37]">₹{currentBidAmount.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. PLAYERS GRID VIEW */}
                        {activeView === "players" && (
                            <div className="space-y-6">
                                {/* Filters Panel */}
                                <div className="backdrop-blur-xl bg-[#0F1C3F]/40 border border-white/[0.06] rounded-3xl p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Search player name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-black/45 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-3">
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#D4AF37]"
                                        >
                                            <option value="All">All Roles</option>
                                            <option value="Batter">Batters</option>
                                            <option value="Bowler">Bowlers</option>
                                            <option value="All-Rounder">All-Rounders</option>
                                            <option value="Wicketkeeper">Wicketkeepers</option>
                                        </select>

                                        <select
                                            value={districtFilter}
                                            onChange={(e) => setDistrictFilter(e.target.value)}
                                            className="bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#D4AF37]"
                                        >
                                            <option value="All">All Districts</option>
                                            {DISTRICTS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#D4AF37]"
                                        >
                                            <option value="All">All States</option>
                                            <option value="AVAILABLE">Available</option>
                                            <option value="SOLD">Sold</option>
                                            <option value="UNSOLD">Unsold</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Player list grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {MOCK_PLAYERS.filter((p) => {
                                        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                                        const matchesRole = roleFilter === "All" || p.role === roleFilter;
                                        const matchesDistrict = districtFilter === "All" || p.district === districtFilter;
                                        const matchesStatus = statusFilter === "All" || p.status === statusFilter;
                                        return matchesSearch && matchesRole && matchesDistrict && matchesStatus;
                                    }).map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPlayer(p);
                                                setActiveView("player-profile");
                                            }}
                                            className="backdrop-blur-md bg-[#0F1C3F]/40 border border-white/[0.04] hover:border-[#D4AF37]/35 rounded-3xl p-5 hover:bg-[#0F1C3F]/60 transition duration-200 hover:scale-[1.01] cursor-pointer flex flex-col justify-between space-y-4"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/25 text-white flex items-center justify-center text-xl font-bold">
                                                        {p.photo}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-white uppercase">{p.name}</h4>
                                                        <p className="text-[10px] text-gray-500 font-semibold uppercase">{p.role} • {p.district}</p>
                                                    </div>
                                                </div>

                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${p.status === "SOLD" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" :
                                                    p.status === "UNSOLD" ? "bg-red-500/10 text-red-400 border-red-500/25" :
                                                        "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 bg-black/25 p-3 rounded-2xl text-xs border border-white/[0.03]">
                                                <div>
                                                    <span className="text-[8px] text-gray-500 font-bold uppercase block">Base Reserve</span>
                                                    <span className="font-mono font-bold text-gray-300">₹{(p.basePrice / 100000).toFixed(2)}L</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] text-gray-500 font-bold uppercase block">Current Bid</span>
                                                    <span className="font-mono font-bold text-[#D4AF37]">₹{(p.currentBid / 100000).toFixed(2)}L</span>
                                                </div>
                                            </div>

                                            <button className="w-full bg-white/5 border border-white/10 hover:bg-[#D4AF37] hover:text-black transition duration-200 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                                View Profile Ledger
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. PLAYER PROFILE PAGE */}
                        {activeView === "player-profile" && selectedPlayer && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setActiveView("players")}
                                    className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider hover:text-white transition flex items-center gap-1"
                                >
                                    &larr; Back to Players Pool
                                </button>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-4 backdrop-blur-xl bg-[#0F1C3F]/90 border border-white/[0.08] rounded-3xl p-6 text-center space-y-5">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#2563EB] to-[#F97316] text-white flex items-center justify-center text-5xl font-black mx-auto shadow-xl">
                                            {selectedPlayer.photo}
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase">{selectedPlayer.name}</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Jersey #{selectedPlayer.jerseyNumber} • Age {selectedPlayer.age}</p>
                                        </div>

                                        <div className="flex justify-center gap-2">
                                            <span className="px-3 py-1 bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#2563EB] rounded-full text-xs font-black uppercase">
                                                {selectedPlayer.role}
                                            </span>
                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-400">
                                                {selectedPlayer.district}
                                            </span>
                                        </div>

                                        <div className="border-t border-white/[0.06] pt-4 space-y-2.5 text-left text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Style:</span>
                                                <span className="font-extrabold text-white">{selectedPlayer.style}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Current Club:</span>
                                                <span className="font-extrabold text-white">{selectedPlayer.club}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-8 space-y-5">
                                        <div className="backdrop-blur-md bg-[#0B1530]/90 border border-white/[0.06] rounded-3xl p-5 lg:p-6 space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Tournament Career Stats</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div className="bg-black/25 p-3 rounded-2xl border border-white/[0.03] text-center">
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold">Matches</span>
                                                    <p className="text-lg font-black text-white font-mono mt-0.5">{selectedPlayer.stats.matches}</p>
                                                </div>
                                                <div className="bg-black/25 p-3 rounded-2xl border border-white/[0.03] text-center">
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold">Runs Avg</span>
                                                    <p className="text-lg font-black text-white font-mono mt-0.5">{selectedPlayer.stats.avg}</p>
                                                </div>
                                                <div className="bg-black/25 p-3 rounded-2xl border border-white/[0.03] text-center">
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold">Strike Rate</span>
                                                    <p className="text-lg font-black text-white font-mono mt-0.5">{selectedPlayer.stats.sr}</p>
                                                </div>
                                                <div className="bg-black/25 p-3 rounded-2xl border border-white/[0.03] text-center">
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold">Wickets</span>
                                                    <p className="text-lg font-black text-white font-mono mt-0.5">{selectedPlayer.stats.wickets}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="backdrop-blur-md bg-[#0B1530]/90 border border-white/[0.06] rounded-3xl p-5 lg:p-6 space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Bidding Valuation Timeline</h3>
                                            <div className="h-44">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={[
                                                        { name: "Base", val: selectedPlayer.basePrice },
                                                        { name: "First Call", val: selectedPlayer.basePrice + 20000 },
                                                        { name: "Counter", val: selectedPlayer.basePrice + 60000 },
                                                        { name: "Peak", val: selectedPlayer.currentBid || selectedPlayer.basePrice + 120000 }
                                                    ]}>
                                                        <defs>
                                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis dataKey="name" stroke="#555" fontSize={10} />
                                                        <YAxis stroke="#555" fontSize={10} />
                                                        <Tooltip contentStyle={{ background: "#0F1C3F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "11px" }} />
                                                        <Area type="monotone" dataKey="val" stroke="#2563EB" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2.5} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. TEAM ROSTER VIEW */}
                        {activeView === "team-page" && selectedTeam && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-tr from-[#0F1C3F] to-[#0A1128] border border-white/[0.08] p-6 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#2563EB]/5 rounded-full blur-2xl pointer-events-none" />
                                    <div className="flex items-center gap-4">
                                        <span className="text-5xl">{selectedTeam.logo}</span>
                                        <div>
                                            <h2 className="text-xl sm:text-3xl font-black text-white uppercase">{selectedTeam.name}</h2>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Owner: {selectedTeam.owner} • Coach: {selectedTeam.coach}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/35 px-4 py-2.5 rounded-2xl text-center border border-white/[0.04]">
                                            <span className="text-[8px] text-gray-500 font-bold uppercase block">Purse Left</span>
                                            <span className="font-mono text-xs font-black text-[#D4AF37]">₹{(selectedTeam.remainingPurse / 100000).toFixed(2)}L</span>
                                        </div>
                                        <div className="bg-black/35 px-4 py-2.5 rounded-2xl text-center border border-white/[0.04]">
                                            <span className="text-[8px] text-gray-500 font-bold uppercase block">Squad Count</span>
                                            <span className="font-mono text-xs font-black text-white">{selectedTeam.playersBoughtCount} / 15</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Franchise Squad Division</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {["Batter", "Bowler", "All-Rounder", "Wicketkeeper"].map((role) => {
                                            const squadOfRole = MOCK_PLAYERS.filter((p) => p.role === role);
                                            return (
                                                <div key={role} className="backdrop-blur-md bg-[#0F1C3F]/40 border border-white/[0.06] rounded-3xl p-4 space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase text-white tracking-widest border-b border-white/5 pb-2">
                                                        {role}s ({squadOfRole.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {squadOfRole.length === 0 ? (
                                                            <p className="text-[10px] text-gray-600 italic py-4">No acquisitions in this slot.</p>
                                                        ) : (
                                                            squadOfRole.map((p) => (
                                                                <div key={p.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl text-xs border border-white/[0.03]">
                                                                    <span className="font-bold text-white uppercase">{p.name}</span>
                                                                    <span className="font-mono font-semibold text-emerald-400">₹{(p.basePrice / 100000).toFixed(2)}L</span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. LEADERBOARD VIEW */}
                        {activeView === "leaderboard" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="backdrop-blur-md bg-[#0F1C3F]/40 border border-white/[0.06] rounded-3xl p-5 flex flex-col justify-between">
                                        <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest">Most Expensive Player</span>
                                        <p className="text-base font-black text-white mt-2">AJINKYA DESHMUKH</p>
                                        <p className="text-xs text-gray-500 mt-1 font-mono font-bold">₹3,20,000 (Pune Warriors)</p>
                                    </div>
                                    <div className="backdrop-blur-md bg-[#0F1C3F]/40 border border-white/[0.06] rounded-3xl p-5 flex flex-col justify-between">
                                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Top Spending Franchise</span>
                                        <p className="text-base font-black text-white mt-2">KOLHAPUR KINGS</p>
                                        <p className="text-xs text-gray-500 mt-1 font-mono font-bold">Spent: ₹52.00 Lakhs</p>
                                    </div>
                                    <div className="backdrop-blur-md bg-[#0F1C3F]/40 border border-white/[0.06] rounded-3xl p-5 flex flex-col justify-between">
                                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Highest Purse Remaining</span>
                                        <p className="text-base font-black text-white mt-2">NAGPUR NINJAS</p>
                                        <p className="text-xs text-gray-500 mt-1 font-mono font-bold">Wallet: ₹82.00 Lakhs</p>
                                    </div>
                                </div>

                                <div className="backdrop-blur-xl bg-[#0B1530]/90 border border-white/[0.06] rounded-3xl p-5 shadow-2xl space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Comparative Franchise Ledger Standings</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left text-gray-300">
                                            <thead className="text-[9px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                                                <tr>
                                                    <th className="py-3 px-2">Team Rank</th>
                                                    <th className="py-3 px-2">Franchise</th>
                                                    <th className="py-3 px-2">Acquisitions Count</th>
                                                    <th className="py-3 px-2">Total Points Budget</th>
                                                    <th className="py-3 px-2">Spent Ledger</th>
                                                    <th className="py-3 px-2">Purse Remaining</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {teamsState.map((t, idx) => (
                                                    <tr key={t.id} className="hover:bg-white/[0.02] transition">
                                                        <td className="py-4 px-2 font-mono font-black">{idx + 1}</td>
                                                        <td className="py-4 px-2 font-extrabold text-white flex items-center gap-2">
                                                            <span>{t.logo}</span> {t.name}
                                                        </td>
                                                        <td className="py-4 px-2 font-mono font-semibold">{t.playersBoughtCount} / 15</td>
                                                        <td className="py-4 px-2 font-mono font-bold">₹{(t.totalPurse / 100000).toFixed(2)}L</td>
                                                        <td className="py-4 px-2 font-mono text-red-400 font-bold">₹{((t.totalPurse - t.remainingPurse) / 100000).toFixed(2)}L</td>
                                                        <td className="py-4 px-2 font-mono text-emerald-400 font-black">₹{(t.remainingPurse / 100000).toFixed(2)}L</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. STATISTICS VIEW */}
                        {activeView === "statistics" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    <div className="backdrop-blur-md bg-[#0F1C3F]/40 border border-white/[0.06] rounded-3xl p-5 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Roster Slot Distribution</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: "Batters", value: 35 },
                                                            { name: "Bowlers", value: 40 },
                                                            { name: "All-Rounders", value: 15 },
                                                            { name: "Wicketkeepers", value: 10 }
                                                        ]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        <Cell fill="#2563EB" />
                                                        <Cell fill="#F97316" />
                                                        <Cell fill="#D4AF37" />
                                                        <Cell fill="#8B5CF6" />
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="backdrop-blur-md bg-[#0F1C3F]/40 border border-white/[0.06] rounded-3xl p-5 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Franchise Point Spending Analytics</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={teamsState.map((t) => ({ name: t.shortName, spent: (t.totalPurse - t.remainingPurse) / 100000 }))}>
                                                    <XAxis dataKey="name" stroke="#555" fontSize={10} />
                                                    <YAxis stroke="#555" fontSize={10} />
                                                    <Tooltip />
                                                    <Bar dataKey="spent" fill="#2563EB" radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 7. SETTINGS / SIMULATION VIEW */}
                        {activeView === "settings" && (
                            <div className="space-y-6">
                                <div className="backdrop-blur-xl bg-[#0F1C3F]/90 border border-white/[0.08] rounded-3xl p-6 space-y-6">
                                    <div className="border-b border-white/5 pb-3">
                                        <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                                            <SlidersHorizontal size={16} className="text-[#D4AF37]" /> Mock Broadcaster Control Board
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">Control mock simulation events directly for display verification.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-300 uppercase">Interactive Simulation Hooks</h4>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => simulateBid(50000)}
                                                    className="w-full bg-[#2563EB]/10 border border-[#2563EB]/30 hover:bg-[#2563EB]/25 text-[#2563EB] text-xs font-black uppercase py-3 rounded-xl transition flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus size={14} /> Inject Random Opponent Bid (+₹50k)
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setTimerSecs(30);
                                                        setTimerActive(true);
                                                        triggerToast("Timer reset to 30 seconds!");
                                                    }}
                                                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase py-3 rounded-xl transition flex items-center justify-center gap-1.5"
                                                >
                                                    <Clock size={14} /> Restart Countdown Clock
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-300 uppercase">System Status Toggles</h4>
                                            <div className="bg-black/25 p-4 rounded-2xl border border-white/[0.04] space-y-3 text-xs">
                                                <div className="flex justify-between items-center">
                                                    <span>Mute Sound Alerts</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={audioMuted}
                                                        onChange={() => setAudioMuted(!audioMuted)}
                                                        className="w-4 h-4 rounded text-blue-600 focus:ring-0 focus:ring-offset-0 bg-transparent border-gray-700 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Show Live Badge Glow</span>
                                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ── BOTTOM TIMELINE UPDATES FEED ── */}
                    <footer className="border-t border-white/[0.06] bg-[#0A1020]/90 p-4 shrink-0 z-20">
                        <div className="max-w-[1750px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 shrink-0">
                                <Flame size={14} className="text-[#F97316]" /> Realtime Broadcast Commentary Ticker:
                            </div>

                            <div className="flex-1 overflow-x-auto whitespace-nowrap flex items-center gap-6 text-xs text-gray-300 scrollbar-none pl-2">
                                {bidLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${log.type === "sold" ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" :
                                            log.type === "withdraw" ? "bg-red-950/20 border-red-500/30 text-red-400" :
                                                "bg-white/[0.02] border-white/10 text-gray-300"
                                            }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        <span>{log.text}</span>
                                        <span className="text-[9px] text-gray-500 font-mono font-normal">({log.time})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </footer>
                </div>
            </div>

            {/* ── MOBILE BOTTOM NAVIGATION DECK ── */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0B1020]/95 backdrop-blur-xl border-t border-white/[0.08] grid grid-cols-5 p-2 gap-1">
                {[
                    { id: "live-auction", label: "Auction", icon: Gavel },
                    { id: "players", label: "Pool", icon: User },
                    { id: "team-page", label: "Teams", icon: Users },
                    { id: "leaderboard", label: "Board", icon: Trophy },
                    { id: "statistics", label: "Stats", icon: BarChart3 }
                ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${isActive ? "text-[#2563EB]" : "text-gray-500"}`}
                        >
                            <Icon size={16} className="mb-0.5" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
