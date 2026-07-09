import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Sidebar from "../components/layout/Sidebar";
import {
    FaArrowLeft,
    FaGavel,
    FaClock,
    FaVolumeUp,
    FaPlay,
    FaPause,
    FaCheck,
    FaTimes,
    FaSpinner,
    FaUser,
    FaUsers,
    FaWallet,
    FaExclamationTriangle,
    FaSync,
    FaCoins,
    FaTrophy
} from "react-icons/fa";
import { getTournamentById } from "../services/tournamentService";
import { getPlayers } from "../services/playerService";
import {
    getAuctionState,
    getAuctionByTournamentId,
    startPlayerAuction,
    pausePlayerAuction,
    resumePlayerAuction,
    sellPlayerAuction,
    unsoldPlayerAuction,
    endAuction,
    startAuction,
    placeBid
} from "../services/auctionService";
import { toast } from "react-hot-toast";

const LiveAuction = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null);

    // Custom Dialog Modal State
    const [dialog, setDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: null,
        onCancel: null,
        showCancel: true,
        type: "info"
    });

    const showConfirmDialog = ({ title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel = null, showCancel = true, type = "info" }) => {
        setDialog({
            isOpen: true,
            title,
            message,
            confirmText,
            cancelText,
            onConfirm: () => {
                setDialog(prev => ({ ...prev, isOpen: false }));
                if (onConfirm) onConfirm();
            },
            onCancel: () => {
                setDialog(prev => ({ ...prev, isOpen: false }));
                if (onCancel) onCancel();
            },
            showCancel,
            type
        });
    };

    // User Roles
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const isOrganizer = user?.role === "ORGANIZER";
    const isOwner = user?.role === "TEAM_OWNER";

    // Initial Loading states
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState(null);
    const [dbAuction, setDbAuction] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    // Team Owner context
    const [myTeam, setMyTeam] = useState(null);

    // Bidding states
    const [activePlayer, setActivePlayer] = useState(null);
    const [highestBid, setHighestBid] = useState(null);
    const [highestBidderTeamId, setHighestBidderTeamId] = useState(null);
    const [highestBidderTeamName, setHighestBidderTeamName] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [bidDuration, setBidDuration] = useState(15);
    const [customBidAmount, setCustomBidAmount] = useState("");
    const [bidPlacing, setBidPlacing] = useState(false);

    // Data lists
    const [allTeams, setAllTeams] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [bidHistory, setBidHistory] = useState([]);
    const [activeTab, setActiveTab] = useState("teams"); // teams, sold, unsold

    // Action loaders
    const [controlLoading, setControlLoading] = useState(false);
    const [nextPlayerId, setNextPlayerId] = useState("");

    // Load initial tournament, players, teams, and active session details
    const loadInitialData = async () => {
        try {
            setLoading(true);
            const tourney = await getTournamentById(tournamentId);
            setTournament(tourney);
            setAllTeams(tourney.teams || []);

            // Load auction details from DB
            const auctionDetails = await getAuctionByTournamentId(tournamentId);
            setDbAuction(auctionDetails);

            // Load team owner context if applicable
            if (isOwner) {
                try {
                    const teamRes = await apiGetMyTeam();
                    setMyTeam(teamRes);
                } catch (err) {
                    console.error("Error fetching my team context:", err);
                }
            }

            // Load all players to filter sold/unsold status accurately
            const playersList = await getPlayers();
            const filteredPlayers = playersList.filter(p => p.tournamentId === tournamentId);
            setAllPlayers(filteredPlayers);

            // Fetch live in-memory state
            const liveState = await getAuctionState(tournamentId);
            if (liveState && liveState.active) {
                setActivePlayer(liveState.player);
                setHighestBid(liveState.highestBid);
                setHighestBidderTeamId(liveState.highestBidderTeamId);
                setHighestBidderTeamName(liveState.highestBidderTeamName);
                setTimeLeft(liveState.timeLeft);
                setIsPaused(liveState.isPaused);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load initial auction arena data");
        } finally {
            setLoading(false);
        }
    };

    // Axios helper to fetch team details (since we did not write a custom module in teamService)
    const apiGetMyTeam = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/teams/owner/my-team", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const json = await res.json();
        return json.data;
    };

    // Load dynamic lists of teams and players (e.g. after a player is sold)
    const refreshLists = async () => {
        try {
            const tourney = await getTournamentById(tournamentId);
            setAllTeams(tourney.teams || []);

            const playersList = await getPlayers();
            const filteredPlayers = playersList.filter(p => p.tournamentId === tournamentId);
            setAllPlayers(filteredPlayers);

            if (isOwner) {
                const teamRes = await apiGetMyTeam();
                setMyTeam(teamRes);
            }
        } catch (err) {
            console.error("Error refreshing lists:", err);
        }
    };

    useEffect(() => {
        loadInitialData();

        // Connect to Socket.io server
        const socketUrl = "http://localhost:5000";
        const socket = io(socketUrl);
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketConnected(true);
            console.log("Connected to live socket stream");
            // Join the specific tournament auction room
            socket.emit("join-auction", tournamentId);
        });

        socket.on("disconnect", () => {
            setSocketConnected(false);
            console.log("Disconnected from live socket stream");
        });

        // ─── Socket Event Listeners ──────────────────────────────────

        // Timer countdown tick
        socket.on("auction-timer-tick", (data) => {
            setTimeLeft(data.timeLeft);
        });

        // Countdown timer paused
        socket.on("auction-timer-paused", () => {
            setIsPaused(true);
            toast("Timer paused by organizer", { icon: "⏸️" });
        });

        // Countdown timer resumed
        socket.on("auction-timer-resumed", (data) => {
            setIsPaused(false);
            setTimeLeft(data.timeLeft);
            toast("Timer resumed", { icon: "▶️" });
        });

        // Bidding started for a player
        socket.on("auction-player-started", (data) => {
            setActivePlayer(data.player);
            setHighestBid(data.basePrice);
            setHighestBidderTeamId(null);
            setHighestBidderTeamName(null);
            setTimeLeft(data.timeLeft);
            setIsPaused(false);
            setBidHistory([]);
            setCustomBidAmount("");
            toast.success(`Bidding started for ${data.player.name}!`);
        });

        // New higher bid placed
        socket.on("new-bid", (data) => {
            setHighestBid(data.amount);
            setHighestBidderTeamId(data.teamId);
            setHighestBidderTeamName(data.teamName);
            setTimeLeft(data.timeLeft);

            // Add to bid feed history
            setBidHistory(prev => [
                {
                    teamName: data.teamName,
                    amount: data.amount,
                    time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                },
                ...prev
            ]);

            // Check if my team placed this bid
            const isMyBid = myTeam && data.teamId === myTeam.id;
            if (isMyBid) {
                toast.success(`Your bid of ₹${data.amount.toLocaleString("en-IN")} is leading!`, { icon: "🔥" });
            } else {
                toast(`New bid of ₹${data.amount.toLocaleString("en-IN")} by ${data.teamName}!`, { icon: "💰" });
            }
            refreshLists();
        });

        // Player sold
        socket.on("player-sold", (data) => {
            setActivePlayer(null);
            setHighestBid(null);
            setHighestBidderTeamId(null);
            setHighestBidderTeamName(null);
            setTimeLeft(0);
            setBidHistory([]);
            setCustomBidAmount("");

            // Update players list locally
            setAllPlayers(prev => prev.map(p => {
                if (p.id === data.playerId) {
                    return {
                        ...p,
                        soldRecord: {
                            teamId: data.teamId,
                            price: data.price
                        }
                    };
                }
                return p;
            }));

            // Update teams list locally
            setAllTeams(prev => prev.map(t => {
                if (t.id === data.teamId) {
                    const existingPlayersWon = t.playersWon || [];
                    return {
                        ...t,
                        remainingPurse: t.remainingPurse - data.price,
                        playersWon: [
                            ...existingPlayersWon,
                            {
                                playerId: data.playerId,
                                teamId: data.teamId,
                                price: data.price
                            }
                        ]
                    };
                }
                return t;
            }));

            const wasBoughtByMe = myTeam && data.teamId === myTeam.id;
            if (wasBoughtByMe) {
                setMyTeam(prev => {
                    if (!prev) return prev;
                    const existingPlayersWon = prev.playersWon || [];
                    return {
                        ...prev,
                        remainingPurse: prev.remainingPurse - data.price,
                        playersWon: [
                            ...existingPlayersWon,
                            {
                                playerId: data.playerId,
                                teamId: data.teamId,
                                price: data.price
                            }
                        ]
                    };
                });
                toast.success(`🎉 SUCCESS! You won the bid for ${data.player.name} at ₹${data.price.toLocaleString("en-IN")}!`, {
                    duration: 8000,
                    icon: "🏆"
                });
            } else {
                toast.success(`${data.player.name} sold to ${data.teamName} for ₹${data.price.toLocaleString("en-IN")}.`, {
                    duration: 5000,
                    icon: "🤝"
                });
            }
            refreshLists();
        });

        // Player marked unsold
        socket.on("player-unsold", (data) => {
            setActivePlayer(null);
            setHighestBid(null);
            setHighestBidderTeamId(null);
            setHighestBidderTeamName(null);
            setTimeLeft(0);
            setBidHistory([]);
            setCustomBidAmount("");

            toast.error(`${data.player.name} went unsold.`, {
                duration: 5000,
                icon: "❌"
            });
            refreshLists();
        });

        // Organizer closed/ended the auction session
        socket.on("auction-ended", () => {
            setActivePlayer(null);
            setHighestBid(null);
            setHighestBidderTeamId(null);
            setHighestBidderTeamName(null);
            setTimeLeft(0);
            setBidHistory([]);
            setCustomBidAmount("");

            showConfirmDialog({
                title: "Auction Completed",
                message: "The tournament organizer has closed this live auction session. You will be redirected back to the dashboard.",
                confirmText: "Back to Dashboard",
                showCancel: false,
                type: "warning",
                onConfirm: () => {
                    navigate(isOrganizer ? "/organizer-dashboard" : "/owner-dashboard");
                }
            });
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [tournamentId, myTeam?.id]);

    // Format Indian Rupees
    const formatINR = (amount) => {
        if (amount === null || amount === undefined) return "—";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate dynamic increments depending on bid value (realistic scale)
    const getNextIncrement = (currentBid) => {
        if (!currentBid) return 10000;
        if (currentBid < 200000) return 10000;
        if (currentBid < 500000) return 20000;
        if (currentBid < 1000000) return 50000;
        return 100000;
    };

    const nextMinBid = activePlayer
        ? (highestBidderTeamId ? highestBid + getNextIncrement(highestBid) : activePlayer.basePrice)
        : 0;

    // Team Owner place bid handler
    const handlePlaceBidAmount = async (amount) => {
        if (!activePlayer) return;
        if (!amount || isNaN(amount)) {
            toast.error("Please enter a valid bid amount");
            return;
        }

        const bidVal = Number(amount);
        if (bidVal < nextMinBid) {
            toast.error(`Minimum bid required is ${formatINR(nextMinBid)}`);
            return;
        }

        if (myTeam && myTeam.remainingPurse < bidVal) {
            toast.error(`Insufficient budget! Your remaining purse is ${formatINR(myTeam.remainingPurse)}`);
            return;
        }

        setBidPlacing(true);
        try {
            await placeBid({
                playerId: activePlayer.id,
                amount: bidVal
            });
            setCustomBidAmount("");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to place bid");
        } finally {
            setBidPlacing(false);
        }
    };

    // Organizer actions handlers
    const handleStartSession = async () => {
        if (!dbAuction) return;
        setControlLoading(true);
        try {
            await startAuction({ auctionId: dbAuction.id });
            toast.success("Auction session is now ACTIVE!");
            loadInitialData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to start auction session");
        } finally {
            setControlLoading(false);
        }
    };

    const handleEndSession = () => {
        if (!dbAuction) return;
        showConfirmDialog({
            title: "Complete Session",
            message: "Are you sure you want to end this auction session? This will finalize the auction and lock team rosters.",
            confirmText: "Yes, Complete",
            cancelText: "Cancel",
            type: "danger",
            showCancel: true,
            onConfirm: async () => {
                setControlLoading(true);
                try {
                    await endAuction({ auctionId: dbAuction.id });
                    toast.success("Auction session completed!");
                    loadInitialData();
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to end auction session");
                } finally {
                    setControlLoading(false);
                }
            }
        });
    };

    const handlePutPlayerOnAuction = async (e) => {
        e.preventDefault();
        if (!nextPlayerId) {
            toast.error("Please select a player");
            return;
        }

        setControlLoading(true);
        try {
            await startPlayerAuction({
                tournamentId,
                playerId: nextPlayerId,
                durationSeconds: bidDuration
            });
            setNextPlayerId("");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to start player auction");
        } finally {
            setControlLoading(false);
        }
    };

    const handlePause = async () => {
        try {
            await pausePlayerAuction({ tournamentId });
        } catch (err) {
            console.error(err);
            toast.error("Failed to pause auction");
        }
    };

    const handleResume = async () => {
        try {
            await resumePlayerAuction({ tournamentId });
        } catch (err) {
            console.error(err);
            toast.error("Failed to resume auction");
        }
    };

    const handleSell = () => {
        if (!highestBidderTeamId) {
            toast.error("Cannot sell player: No bids placed yet!");
            return;
        }

        showConfirmDialog({
            title: "Confirm Player Sale",
            message: `Are you sure you want to sell ${activePlayer.name} to ${highestBidderTeamName} for ${formatINR(highestBid)}?`,
            confirmText: "Confirm Sale",
            cancelText: "Cancel",
            type: "success",
            showCancel: true,
            onConfirm: async () => {
                setControlLoading(true);
                try {
                    await sellPlayerAuction({ tournamentId });
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to execute manual sell");
                } finally {
                    setControlLoading(false);
                }
            }
        });
    };

    const handleMarkUnsold = () => {
        showConfirmDialog({
            title: "Confirm Player Unsold",
            message: `Are you sure you want to mark ${activePlayer.name} as unsold?`,
            confirmText: "Mark Unsold",
            cancelText: "Cancel",
            type: "warning",
            showCancel: true,
            onConfirm: async () => {
                setControlLoading(true);
                try {
                    await unsoldPlayerAuction({ tournamentId });
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to mark player as unsold");
                } finally {
                    setControlLoading(false);
                }
            }
        });
    };

    // Filter lists
    const unsoldPlayers = allPlayers.filter(p => !p.soldRecord);
    const soldPlayers = allPlayers.filter(p => !!p.soldRecord);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#020617] text-white">
                <Sidebar />
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <FaSpinner className="animate-spin text-4xl text-[#FDB913]" />
                    <span className="text-gray-400">Syncing with Auction Arena...</span>
                </div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#020617] text-white">
                <Sidebar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <FaExclamationTriangle className="text-red-500 text-5xl mb-4" />
                    <h2 className="text-xl font-bold">Tournament Not Found</h2>
                    <Link to={isOrganizer ? "/auctions" : "/owner-dashboard"} className="mt-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const sessionStatus = dbAuction ? dbAuction.status : "NO_SESSION";
    const amILeading = myTeam && highestBidderTeamId === myTeam.id;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">
            <Sidebar />

            <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto">
                {/* HEAD BAR */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to={isOrganizer ? "/auctions" : "/owner-dashboard"}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl md:text-2xl font-black tracking-tight">{tournament.name}</h1>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${socketConnected ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-400 animate-pulse" : "bg-yellow-500 animate-bounce"}`} />
                                    {socketConnected ? "Live Room" : "Connecting..."}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {isOrganizer ? "Organizer Live Control Panel" : `Team Owner Portal: ${myTeam?.name}`}
                            </p>
                        </div>
                    </div>

                    {/* Stats & Session Control */}
                    <div className="flex flex-wrap items-center gap-4">
                        {isOwner && myTeam && (
                            <div className="bg-[#080E27] border border-white/5 px-4 py-2.5 rounded-xl text-center shrink-0">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">My Available Purse</p>
                                <p className="text-sm font-black text-green-400 mt-0.5">
                                    {formatINR(myTeam.remainingPurse)}
                                </p>
                            </div>
                        )}

                        {isOrganizer && (
                            <>
                                {sessionStatus === "PENDING" && (
                                    <button
                                        disabled={controlLoading}
                                        onClick={handleStartSession}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm"
                                    >
                                        {controlLoading ? <FaSpinner className="animate-spin" /> : <FaPlay size={12} />}
                                        Activate Session
                                    </button>
                                )}

                                {sessionStatus === "ACTIVE" && (
                                    <button
                                        disabled={controlLoading}
                                        onClick={handleEndSession}
                                        className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm"
                                    >
                                        {controlLoading ? <FaSpinner className="animate-spin" /> : <FaTimes size={12} />}
                                        Complete Session
                                    </button>
                                )}
                            </>
                        )}

                        {sessionStatus === "COMPLETED" && (
                            <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 font-bold px-5 py-2.5 rounded-xl text-sm uppercase">
                                Auction Finished
                            </span>
                        )}

                        <button
                            onClick={refreshLists}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white"
                            title="Force Sync"
                        >
                            <FaSync size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* ERROR/INACTIVE BANNER */}
                {sessionStatus === "PENDING" && (
                    <div className="bg-[#0F1E4D]/30 border border-yellow-500/20 rounded-2xl p-6 mb-6 text-center max-w-xl mx-auto flex flex-col items-center gap-3">
                        <FaExclamationTriangle className="text-yellow-500 text-3xl" />
                        <h3 className="font-bold text-lg">Auction Session is Pending</h3>
                        <p className="text-sm text-gray-400">
                            {isOrganizer
                                ? 'The database session has not been activated. Click "Activate Session" above or below to open bidding.'
                                : 'The tournament organizer has not activated the auction session yet. Please wait for the host.'}
                        </p>
                        {isOrganizer && (
                            <button
                                disabled={controlLoading}
                                onClick={handleStartSession}
                                className="mt-2 bg-[#FDB913] text-black font-bold px-6 py-2.5 rounded-xl transition hover:scale-105"
                            >
                                Activate Session Now
                            </button>
                        )}
                    </div>
                )}

                {sessionStatus === "COMPLETED" && (
                    <div className="bg-gray-500/5 border border-gray-500/15 rounded-2xl p-6 mb-6 text-center max-w-xl mx-auto flex flex-col items-center gap-2">
                        <FaGavel className="text-gray-500 text-3xl" />
                        <h3 className="font-bold text-lg text-gray-300">Auction Completed</h3>
                        <p className="text-sm text-gray-400">
                            This tournament's live auction has concluded. You can review the final team standings and sold player records on this page.
                        </p>
                    </div>
                )}

                {sessionStatus === "ACTIVE" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* LEFT COLUMN: THE GAVEL RING */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* ACTIVE PLAYER CARD */}
                            <div className="bg-[#080E27] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 p-4">
                                    <FaGavel size={60} className="text-white/3 -rotate-45" />
                                </div>

                                {activePlayer ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-5 gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FDB913] to-amber-600 flex items-center justify-center text-black text-2xl font-black shrink-0">
                                                    {activePlayer.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-extrabold text-white">{activePlayer.name}</h2>
                                                    <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDB913]/10 text-[#FDB913]">
                                                        {activePlayer.role}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* TIMER COUNTDOWN */}
                                            <div className="flex items-center gap-3 bg-white/3 border border-white/5 px-4 py-2.5 rounded-2xl">
                                                <FaClock className={`text-xl ${timeLeft <= 5 ? "text-red-500 animate-spin" : "text-blue-400"}`} />
                                                <div className="text-right">
                                                    <span className={`text-2xl font-black tracking-tight ${timeLeft <= 5 ? "text-red-500 animate-pulse text-3xl" : "text-white"
                                                        }`}>
                                                        {timeLeft}s
                                                    </span>
                                                    {isPaused && <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Paused</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/2 border border-white/5 p-5 rounded-2xl">
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Base Price</p>
                                                <p className="text-lg font-bold mt-1 text-white">{formatINR(activePlayer.basePrice)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Current Highest Bid</p>
                                                {highestBidderTeamId ? (
                                                    <div>
                                                        <p className={`text-xl font-black mt-1 ${amILeading ? "text-green-400" : "text-[#FDB913]"}`}>
                                                            {formatINR(highestBid)}
                                                        </p>
                                                        <p className="text-xs text-gray-300 font-medium mt-0.5">
                                                            by {highestBidderTeamName} {amILeading && <span className="text-green-400 font-bold">(You)</span>}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-semibold mt-1 text-gray-400 italic">No bids placed yet</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* CONDITIONAL INTERACTION CONTAINER: ORGANIZER vs OWNER */}
                                        {isOrganizer && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/5 pt-5">
                                                {isPaused ? (
                                                    <button
                                                        onClick={handleResume}
                                                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition text-sm shadow-md"
                                                    >
                                                        <FaPlay size={12} /> Resume
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handlePause}
                                                        className="flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-[#FDB913] font-bold py-3 rounded-xl transition text-sm"
                                                    >
                                                        <FaPause size={12} /> Pause
                                                    </button>
                                                )}

                                                <button
                                                    disabled={controlLoading || !highestBidderTeamId}
                                                    onClick={handleSell}
                                                    className="flex items-center justify-center gap-2 bg-[#FDB913] hover:bg-amber-500 text-black font-black py-3 rounded-xl transition text-sm disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/10"
                                                >
                                                    {controlLoading ? <FaSpinner className="animate-spin" /> : <FaCheck size={12} />}
                                                    Sell Player
                                                </button>

                                                <button
                                                    disabled={controlLoading}
                                                    onClick={handleMarkUnsold}
                                                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition text-sm disabled:opacity-50"
                                                >
                                                    {controlLoading ? <FaSpinner className="animate-spin" /> : <FaTimes size={12} />}
                                                    Mark Unsold
                                                </button>

                                                <div className="col-span-2 sm:col-span-1 border border-white/5 bg-white/2 rounded-xl flex items-center justify-center px-3 text-xs text-gray-400 font-medium">
                                                    ID: {activePlayer.id.substring(0, 8).toUpperCase()}
                                                </div>
                                            </div>
                                        )}

                                        {isOwner && (
                                            <div className="border-t border-white/5 pt-5 space-y-4">
                                                {isPaused ? (
                                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center text-yellow-500 text-sm font-semibold flex items-center justify-center gap-2">
                                                        <FaPause size={12} /> Auction is paused by the host. Bidding disabled.
                                                    </div>
                                                ) : amILeading ? (
                                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center text-green-400 text-sm font-black flex items-center justify-center gap-2 animate-pulse">
                                                        <FaCheck size={14} /> You hold the leading bid!
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/* Presets and custom place bids */}
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Quick Increments</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <button
                                                                    disabled={bidPlacing || (myTeam && myTeam.remainingPurse < nextMinBid)}
                                                                    onClick={() => handlePlaceBidAmount(nextMinBid)}
                                                                    className="bg-[#FDB913]/10 border border-[#FDB913]/30 hover:bg-[#FDB913]/20 text-[#FDB913] font-bold py-2.5 rounded-xl transition text-xs truncate"
                                                                >
                                                                    Min bid: {formatINR(nextMinBid)}
                                                                </button>
                                                                <button
                                                                    disabled={bidPlacing || (myTeam && myTeam.remainingPurse < (nextMinBid + 50000))}
                                                                    onClick={() => handlePlaceBidAmount(nextMinBid + 50000)}
                                                                    className="bg-white/3 border border-white/10 hover:bg-white/5 text-white font-bold py-2.5 rounded-xl transition text-xs truncate"
                                                                >
                                                                    + ₹50,000
                                                                </button>
                                                                <button
                                                                    disabled={bidPlacing || (myTeam && myTeam.remainingPurse < (nextMinBid + 100000))}
                                                                    onClick={() => handlePlaceBidAmount(nextMinBid + 100000)}
                                                                    className="bg-white/3 border border-white/10 hover:bg-white/5 text-white font-bold py-2.5 rounded-xl transition text-xs truncate"
                                                                >
                                                                    + ₹1,00,000
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Custom Bid Input */}
                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                            <div className="flex-1 relative">
                                                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-extrabold text-sm">
                                                                    ₹
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    placeholder={`Custom amount (min: ${nextMinBid})`}
                                                                    value={customBidAmount}
                                                                    disabled={bidPlacing}
                                                                    onChange={(e) => setCustomBidAmount(e.target.value)}
                                                                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#0F1E4D]/80 border border-white/10 focus:outline-none focus:border-[#FDB913] transition text-sm text-white font-bold placeholder-gray-500"
                                                                />
                                                            </div>
                                                            <button
                                                                disabled={bidPlacing || !customBidAmount || Number(customBidAmount) < nextMinBid || (myTeam && myTeam.remainingPurse < Number(customBidAmount))}
                                                                onClick={() => handlePlaceBidAmount(customBidAmount)}
                                                                className="bg-[#FDB913] hover:bg-amber-500 text-black font-black px-6 py-3 rounded-xl transition text-sm shrink-0 disabled:opacity-40 flex items-center justify-center gap-2"
                                                            >
                                                                {bidPlacing ? <FaSpinner className="animate-spin" /> : <FaCoins size={14} />}
                                                                Place Custom Bid
                                                            </button>
                                                        </div>

                                                        {/* Live purse validator banner */}
                                                        {myTeam && customBidAmount && Number(customBidAmount) > myTeam.remainingPurse && (
                                                            <p className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                                                                <FaExclamationTriangle /> Entered bid exceeds your remaining purse budget!
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* SELECT NEXT PLAYER STATE / WAIT STATE */
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
                                                {isOrganizer ? "Select Next Player" : "Waiting for Host"}
                                            </h3>
                                            <p className="text-gray-400 text-xs mt-1">
                                                {isOrganizer
                                                    ? "Put an unsold player under the gavel to start bidding."
                                                    : "The tournament organizer is preparing the next player for bidding. Get ready!"}
                                            </p>
                                        </div>

                                        {isOrganizer ? (
                                            unsoldPlayers.length === 0 ? (
                                                <div className="text-center py-10 bg-white/3 border border-white/5 rounded-2xl">
                                                    <FaUser className="mx-auto text-3xl text-gray-600 mb-2" />
                                                    <p className="text-sm font-semibold text-gray-300">All players have been auctioned!</p>
                                                    <p className="text-xs text-gray-500 mt-1">There are no unsold players left in the pool.</p>
                                                </div>
                                            ) : (
                                                <form onSubmit={handlePutPlayerOnAuction} className="space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                                                Available Player
                                                            </label>
                                                            <select
                                                                value={nextPlayerId}
                                                                onChange={(e) => setNextPlayerId(e.target.value)}
                                                                className="w-full bg-[#0F1E4D]/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FDB913] transition"
                                                            >
                                                                <option value="">Select a player...</option>
                                                                {unsoldPlayers.map((p) => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.name} ({p.role} - Base: {formatINR(p.basePrice)})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex justify-between">
                                                                <span>Countdown Timer</span>
                                                                <span className="text-[#FDB913] font-bold">{bidDuration} seconds</span>
                                                            </label>
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="range"
                                                                    min="10"
                                                                    max="60"
                                                                    step="5"
                                                                    value={bidDuration}
                                                                    onChange={(e) => setBidDuration(Number(e.target.value))}
                                                                    className="flex-1 accent-[#FDB913]"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min="5"
                                                                    value={bidDuration}
                                                                    onChange={(e) => setBidDuration(Number(e.target.value))}
                                                                    className="w-16 bg-[#0F1E4D]/80 border border-white/10 rounded-xl px-2 py-1.5 text-center text-sm font-semibold focus:outline-none focus:border-[#FDB913]"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={controlLoading || !nextPlayerId}
                                                        className="w-full bg-[#FDB913] hover:bg-amber-500 text-black font-black py-3 rounded-xl transition text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                                                    >
                                                        {controlLoading ? <FaSpinner className="animate-spin" /> : <FaGavel size={14} />}
                                                        Put Player on Auction
                                                    </button>
                                                </form>
                                            )
                                        ) : (
                                            <div className="text-center py-10 bg-white/3 border border-white/5 rounded-2xl">
                                                <FaGavel className="mx-auto text-3xl text-[#FDB913] mb-2 animate-bounce" />
                                                <p className="text-sm font-semibold text-gray-300">Gavel at Rest</p>
                                                <p className="text-xs text-gray-500 mt-1">Waiting for the host to nominate a player.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* REALTIME BID FEED */}
                            <div className="bg-[#080E27] border border-white/5 rounded-3xl p-6 shadow-xl">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2 text-gray-200">
                                    <FaVolumeUp className="text-blue-400" /> Bidding Activity Log
                                </h3>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {bidHistory.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-xs italic">
                                            No bidding activity logged in this round.
                                        </div>
                                    ) : (
                                        bidHistory.map((bid, index) => {
                                            const isMyLoggedBid = myTeam && bid.teamName === myTeam.name;
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex justify-between items-center px-4 py-3 rounded-xl border text-sm transition-all duration-300 ${index === 0
                                                            ? isMyLoggedBid
                                                                ? "bg-green-500/10 border-green-500/30 text-white font-semibold scale-[1.01] shadow-lg shadow-green-500/5"
                                                                : "bg-[#FDB913]/10 border-[#FDB913]/30 text-white font-semibold scale-[1.01] shadow-lg shadow-yellow-500/5"
                                                            : "bg-white/2 border-white/5 text-gray-300"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-2 h-2 rounded-full ${index === 0
                                                                ? isMyLoggedBid ? "bg-green-400 animate-ping" : "bg-[#FDB913] animate-ping"
                                                                : "bg-gray-600"
                                                            }`} />
                                                        <span>
                                                            {bid.teamName} {isMyLoggedBid && <span className="text-[10px] text-green-400 font-bold ml-1">(You)</span>}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-bold text-green-400">{formatINR(bid.amount)}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium">{bid.time}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: INFORMATION SIDEBAR */}
                        <div className="bg-[#080E27] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col min-h-[500px]">
                            {/* TABS */}
                            <div className="flex border-b border-white/5 mb-5 p-1 bg-white/2 rounded-xl">
                                <button
                                    onClick={() => setActiveTab("teams")}
                                    className={`flex-1 py-2 px-1 text-center font-bold text-xs rounded-lg transition-all ${activeTab === "teams" ? "bg-[#FDB913] text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    Teams ({allTeams.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("sold")}
                                    className={`flex-1 py-2 px-1 text-center font-bold text-xs rounded-lg transition-all ${activeTab === "sold" ? "bg-[#FDB913] text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    Sold ({soldPlayers.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("unsold")}
                                    className={`flex-1 py-2 px-1 text-center font-bold text-xs rounded-lg transition-all ${activeTab === "unsold" ? "bg-[#FDB913] text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    Unsold ({unsoldPlayers.length})
                                </button>
                            </div>

                            {/* TAB PANELS */}
                            <div className="flex-1 overflow-y-auto max-h-[450px] space-y-3 pr-1">
                                {activeTab === "teams" && (
                                    allTeams.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 text-xs">No teams registered.</div>
                                    ) : (
                                        allTeams.map((team) => {
                                            const totalSpent = team.playersWon?.reduce((sum, p) => sum + p.price, 0) || 0;
                                            const displayRemaining = team.remainingPurse !== undefined ? team.remainingPurse : (team.purseAmount - totalSpent);
                                            const isSelfTeam = myTeam && team.id === myTeam.id;

                                            return (
                                                <div
                                                    key={team.id}
                                                    className={`flex items-center justify-between p-3.5 bg-white/2 rounded-2xl hover:bg-white/5 transition border ${isSelfTeam ? "border-[#FDB913]/30 bg-[#FDB913]/3" : "border-white/5"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {team.logo ? (
                                                            <img
                                                                src={team.logo}
                                                                alt={team.name}
                                                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold shrink-0">
                                                                <FaUsers size={16} />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                                                                {team.name}
                                                                {isSelfTeam && <span className="text-[9px] bg-[#FDB913]/10 text-[#FDB913] border border-[#FDB913]/25 px-1.5 py-0.5 rounded font-bold uppercase">Me</span>}
                                                            </h4>
                                                            <p className="text-[10px] text-gray-500 font-semibold uppercase mt-0.5">
                                                                Players: {team.playersWon?.length || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-extrabold text-sm text-green-400">{formatINR(displayRemaining)}</span>
                                                        <p className="text-[9px] text-gray-500 uppercase mt-0.5">Purse Left</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                )}

                                {activeTab === "sold" && (
                                    soldPlayers.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 text-xs">No players sold yet.</div>
                                    ) : (
                                        soldPlayers.map((player) => {
                                            const buyerTeam = allTeams.find(t => t.id === player.soldRecord.teamId);
                                            const isBoughtByMe = myTeam && buyerTeam?.id === myTeam.id;
                                            return (
                                                <div
                                                    key={player.id}
                                                    className={`flex items-center justify-between p-3.5 bg-white/2 rounded-2xl hover:bg-white/5 transition border ${isBoughtByMe ? "border-green-500/20 bg-green-500/2" : "border-white/5"
                                                        }`}
                                                >
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-sm text-white truncate">{player.name}</h4>
                                                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                            Buyer: <span className="text-[#FDB913] font-semibold">{buyerTeam?.name || "Team"}</span> {isBoughtByMe && <span className="text-[9px] text-green-400 font-bold ml-1">(You)</span>}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-extrabold text-sm text-green-400">{formatINR(player.soldRecord.price)}</span>
                                                        <p className="text-[9px] text-gray-500 uppercase mt-0.5">Sold price</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                )}

                                {activeTab === "unsold" && (
                                    unsoldPlayers.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 text-xs">No unsold players in the pool.</div>
                                    ) : (
                                        unsoldPlayers.map((player) => (
                                            <div
                                                key={player.id}
                                                className="flex items-center justify-between p-3.5 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/5 transition"
                                            >
                                                <div>
                                                    <h4 className="font-bold text-sm text-white truncate">{player.name}</h4>
                                                    <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 bg-white/5 text-gray-400 font-bold rounded">
                                                        {player.role}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-extrabold text-sm text-gray-300">{formatINR(player.basePrice)}</span>
                                                    <p className="text-[9px] text-gray-500 uppercase mt-0.5">Base Price</p>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* CUSTOM DIALOG MODAL */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Type indicator top band */}
                        <div className={`absolute top-0 inset-x-0 h-1.5 ${
                            dialog.type === "danger" ? "bg-red-500" :
                            dialog.type === "warning" ? "bg-yellow-500" :
                            dialog.type === "success" ? "bg-green-500" : "bg-[#FDB913]"
                        }`} />

                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                {dialog.type === "danger" && <FaExclamationTriangle className="text-red-500 shrink-0" />}
                                {dialog.type === "warning" && <FaExclamationTriangle className="text-yellow-500 shrink-0" />}
                                {dialog.type === "success" && <FaCheck className="text-green-500 shrink-0" />}
                                {dialog.type === "info" && <FaGavel className="text-[#FDB913] shrink-0" />}
                                {dialog.title}
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {dialog.message}
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            {dialog.showCancel && (
                                <button
                                    onClick={dialog.onCancel}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
                                >
                                    {dialog.cancelText}
                                </button>
                            )}
                            <button
                                onClick={dialog.onConfirm}
                                className={`px-5 py-2 rounded-xl text-xs font-black transition ${
                                    dialog.type === "danger" ? "bg-red-600 hover:bg-red-500 text-white" :
                                    dialog.type === "warning" ? "bg-yellow-500 hover:bg-amber-500 text-black" :
                                    dialog.type === "success" ? "bg-green-600 hover:bg-green-500 text-white" :
                                    "bg-[#FDB913] hover:bg-amber-500 text-black shadow-lg shadow-yellow-500/10"
                                }`}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveAuction;
