import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Sidebar from "../components/layout/Sidebar";
import {
    ArrowLeft,
    Gavel,
    Clock,
    Volume2,
    VolumeX,
    Play,
    Pause,
    Check,
    X,
    Loader2,
    User,
    Users,
    Wallet,
    AlertTriangle,
    RotateCcw,
    Coins,
    Trophy,
    Sparkles,
    Radio
} from "lucide-react";
import { getTournamentById } from "../services/tournamentService";
import { getPlayers, getPlayersByTournament } from "../services/playerService";
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
    placeBid,
    getAuctionBidHistory,
    getAuctionStats
} from "../services/auctionService";
import { toast } from "react-hot-toast";
import CompletedAuctionView from "../components/auctions/CompletedAuctionView";
import PlayerDetailsModal from "../components/players/PlayerDetailsModal";
import IPLPlayerPodium from "../components/auctions/IPLPlayerPodium";
import IPLBidFeed from "../components/auctions/IPLBidFeed";
import IPLTeamPurseCard from "../components/auctions/IPLTeamPurseCard";
import IPLMobileBidBar from "../components/auctions/IPLMobileBidBar";
import { auctionSound } from "../utils/auctionSoundSFX";

const formatINR = (amount) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("en-IN").format(amount) + " Pts";
};

const LiveAuction = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null);

    // Audio & Sound Effects State
    const [soundEnabled, setSoundEnabled] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("auction_sound_enabled");
            return saved !== null ? saved === "true" : true;
        }
        return true;
    });

    useEffect(() => {
        auctionSound.setEnabled(soundEnabled);
    }, [soundEnabled]);

    const toggleSound = () => {
        const next = !soundEnabled;
        console.log("[LiveAuction] toggleSound toggling to:", next);
        setSoundEnabled(next);
        localStorage.setItem("auction_sound_enabled", String(next));
        auctionSound.setEnabled(next);
        if (next) {
            auctionSound.init();
            auctionSound.playBidSound();
            toast.success("Broadcast audio enabled", { id: "audio-toggle" });
        } else {
            toast("Broadcast audio muted", { icon: "🔇", id: "audio-toggle" });
        }
    };

    // Confirmation Modal State
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

    // Data Loading states
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState(null);
    const [dbAuction, setDbAuction] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    // Team Owner Context
    const [myTeam, setMyTeam] = useState(null);

    // Bidding states
    const [activePlayer, setActivePlayer] = useState(null);
    const [highestBid, setHighestBid] = useState(null);
    const [highestBidderTeamId, setHighestBidderTeamId] = useState(null);
    const [highestBidderTeamName, setHighestBidderTeamName] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [bidDuration, setBidDuration] = useState(45);
    const [customBidAmount, setCustomBidAmount] = useState("");
    const [bidPlacing, setBidPlacing] = useState(false);

    const [nominatedPlayer, setNominatedPlayer] = useState(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);

    // Lists
    const [allTeams, setAllTeams] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [bidHistory, setBidHistory] = useState([]);
    const [activeTab, setActiveTab] = useState("teams"); // teams, sold, unsold

    // Completed Auction analytics
    const [completedStats, setCompletedStats] = useState(null);
    const [completedBidLogs, setCompletedBidLogs] = useState([]);

    // Action loaders
    const [controlLoading, setControlLoading] = useState(false);
    const [nextPlayerId, setNextPlayerId] = useState("");

    // Load initial tournament, players, teams, and active session details
    const loadInitialData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Tournament
            let tourney = null;
            try {
                tourney = await getTournamentById(tournamentId);
                setTournament(tourney);
                setAllTeams(tourney?.teams || []);
            } catch (err) {
                console.error("Error fetching tournament:", err);
                toast.error("Failed to load tournament details");
            }

            // 2. Fetch DB Auction Session Details
            let auctionDetails = null;
            try {
                auctionDetails = await getAuctionByTournamentId(tournamentId);
                setDbAuction(auctionDetails);
            } catch (err) {
                console.warn("No active auction session document found in DB yet:", err);
                setDbAuction(null);
            }

            if (auctionDetails && auctionDetails.status === "COMPLETED") {
                try {
                    const [statsData, bidLogsData] = await Promise.all([
                        getAuctionStats(tournamentId),
                        getAuctionBidHistory(tournamentId)
                    ]);
                    setCompletedStats(statsData);
                    setCompletedBidLogs(bidLogsData || []);
                } catch (err) {
                    console.error("Error loading completed auction reports:", err);
                }
            }

            // 3. Fetch Team Owner Context if applicable
            if (isOwner && tourney) {
                const foundTeam = tourney.teams?.find(t => t.ownerId === user?.id || t.ownerId === user?._id);
                if (foundTeam) {
                    setMyTeam(foundTeam);
                } else {
                    try {
                        const teamRes = await apiGetMyTeam();
                        setMyTeam(teamRes);
                    } catch (err) {
                        console.error("Error fetching my team context:", err);
                    }
                }
            }

            // 4. Fetch Players List
            try {
                const rawPlayersList = isOrganizer ? await getPlayers() : await getPlayersByTournament(tournamentId);
                const playersList = Array.isArray(rawPlayersList) ? rawPlayersList : [];
                const filteredPlayers = playersList.filter(p => {
                    if (!p) return false;
                    const tId = typeof p.tournamentId === "object" ? (p.tournamentId?._id || p.tournamentId?.id) : p.tournamentId;
                    return String(tId) === String(tournamentId) || String(p.tournamentId) === String(tournamentId);
                });
                setAllPlayers(filteredPlayers.length > 0 ? filteredPlayers : playersList);
            } catch (err) {
                console.error("Error fetching players:", err);
                setAllPlayers([]);
            }

            // 5. Fetch Live Realtime Auction State
            try {
                const liveState = await getAuctionState(tournamentId);
                if (liveState) {
                    if (liveState.active && liveState.player) {
                        setActivePlayer(liveState.player);
                        setHighestBid(liveState.highestBid);
                        setHighestBidderTeamId(liveState.highestBidderTeamId);
                        setHighestBidderTeamName(liveState.highestBidderTeamName);
                        setTimeLeft(liveState.timeLeft);
                        setIsPaused(liveState.isPaused);
                    } else if (liveState.nominatedPlayer) {
                        setNominatedPlayer(liveState.nominatedPlayer);
                    }
                }
            } catch (err) {
                console.warn("No active live auction state found:", err);
            }
        } catch (err) {
            console.error("Fatal error in loadInitialData:", err);
        } finally {
            setLoading(false);
        }
    };

    const apiGetMyTeam = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/teams/owner/my-team", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        return json.data;
    };

    const refreshLists = async () => {
        try {
            if (tournamentId) {
                try {
                    const tourney = await getTournamentById(tournamentId);
                    if (tourney) {
                        setTournament(tourney);
                        setAllTeams(tourney.teams || []);
                    }
                } catch (e) {
                    console.warn("Error refreshing tournament:", e);
                }

                try {
                    const rawPlayersList = isOrganizer ? await getPlayers() : await getPlayersByTournament(tournamentId);
                    const playersList = Array.isArray(rawPlayersList) ? rawPlayersList : [];
                    const filteredPlayers = playersList.filter(p => {
                        if (!p) return false;
                        const tId = typeof p.tournamentId === "object" ? (p.tournamentId?._id || p.tournamentId?.id) : p.tournamentId;
                        return String(tId) === String(tournamentId) || String(p.tournamentId) === String(tournamentId);
                    });
                    setAllPlayers(filteredPlayers.length > 0 ? filteredPlayers : playersList);
                } catch (e) {
                    console.warn("Error refreshing players:", e);
                }
            }
        } catch (err) {
            console.error("Error refreshing lists:", err);
        }
    };

    useEffect(() => {
        loadInitialData();

        const socketUrl = "http://localhost:5000";
        const socket = io(socketUrl);
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketConnected(true);
            socket.emit("join-auction", tournamentId);
        });

        socket.on("disconnect", () => {
            setSocketConnected(false);
        });

        socket.on("player-nominated", (data) => {
            setNominatedPlayer(data.player);
            if (data.player) {
                toast(`New player nominated: ${data.player.name}`, { icon: "📣" });
            }
        });

        socket.on("auction-timer-tick", (data) => {
            setTimeLeft(data.timeLeft);
            if (data.timeLeft <= 5 && data.timeLeft > 0) {
                auctionSound.playTickSound(true);
            }
        });

        socket.on("auction-timer-paused", () => {
            setIsPaused(true);
            toast("Timer paused by organizer", { icon: "⏸️" });
        });

        socket.on("auction-timer-resumed", (data) => {
            setIsPaused(false);
            setTimeLeft(data.timeLeft);
            toast("Timer resumed", { icon: "▶️" });
        });

        socket.on("auction-player-started", (data) => {
            setNominatedPlayer(null);
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

        socket.on("new-bid", (data) => {
            setHighestBid(data.amount);
            setHighestBidderTeamId(data.teamId);
            setHighestBidderTeamName(data.teamName);
            setTimeLeft(data.timeLeft);
            auctionSound.playBidSound();

            setBidHistory(prev => [
                {
                    teamName: data.teamName,
                    amount: data.amount,
                    time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                },
                ...prev
            ]);

            const isMyBid = myTeam && data.teamId === myTeam.id;
            if (isMyBid) {
                toast.success(`Your bid of ${formatINR(data.amount)} is leading! 🔥`, { icon: "🔥" });
            } else {
                toast(`New bid of ${formatINR(data.amount)} by ${data.teamName}!`, { icon: "💰" });
            }
            refreshLists();
        });

        socket.on("player-sold", (data) => {
            auctionSound.playHammerSound();
            auctionSound.playSoldFanfare();

            setNominatedPlayer(null);
            setActivePlayer(null);
            setHighestBid(null);
            setHighestBidderTeamId(null);
            setHighestBidderTeamName(null);
            setTimeLeft(0);
            setBidHistory([]);
            setCustomBidAmount("");

            setAllPlayers(prev => prev.map(p => {
                if (p.id === data.playerId) {
                    return {
                        ...p,
                        soldRecord: { teamId: data.teamId, price: data.price }
                    };
                }
                return p;
            }));

            setAllTeams(prev => prev.map(t => {
                if (t.id === data.teamId) {
                    const existingPlayersWon = t.playersWon || [];
                    return {
                        ...t,
                        remainingPurse: t.remainingPurse - data.price,
                        playersWon: [
                            ...existingPlayersWon,
                            { playerId: data.playerId, teamId: data.teamId, price: data.price }
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
                            { playerId: data.playerId, teamId: data.teamId, price: data.price }
                        ]
                    };
                });
                toast.success(`🎉 BOUGHT! You won ${data.player.name} at ${formatINR(data.price)}!`, {
                    duration: 8000,
                    icon: "🏆"
                });
            } else {
                toast.success(`${data.player.name} sold to ${data.teamName} for ${formatINR(data.price)}.`, {
                    duration: 5000,
                    icon: "🤝"
                });
            }
            refreshLists();
        });

        socket.on("player-unsold", (data) => {
            auctionSound.playUnsoldSound();

            setNominatedPlayer(null);
            setActivePlayer(null);
            setHighestBid(null);
            setHighestBidderTeamId(null);
            setHighestBidderTeamName(null);
            setTimeLeft(0);
            setBidHistory([]);
            setCustomBidAmount("");

            toast.error(`${data.player.name} went unsold.`, { duration: 5000, icon: "❌" });
            refreshLists();
        });

        socket.on("auction-ended", () => {
            setActivePlayer(null);
            setHighestBid(null);
            setHighestBidderTeamId(null);
            setHighestBidderTeamName(null);
            setTimeLeft(0);
            setBidHistory([]);
            setCustomBidAmount("");

            loadInitialData();
            toast.success("The live auction session has concluded.", { icon: "🏁", duration: 6000 });
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [tournamentId, myTeam?.id]);

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
            toast.error(`Insufficient points! Remaining budget is ${formatINR(myTeam.remainingPurse)}`);
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
            title: "End Auction Session",
            message: "Are you sure you want to end this live auction session? This will lock team rosters and finalize results.",
            confirmText: "Yes, Complete Session",
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
            setNominatedPlayer(null);
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
                    toast.error("Failed to execute sell action");
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

    const unsoldPlayers = allPlayers.filter(p => !p.soldRecord);
    const soldPlayers = allPlayers.filter(p => !!p.soldRecord);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#030712] text-white">
                <Sidebar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
                    <Loader2 className="animate-spin text-[#FDB913]" size={42} />
                    <span className="text-gray-400 font-bold text-xs sm:text-sm tracking-wider uppercase">Connecting to IPL Broadcast Arena...</span>
                </div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#030712] text-white">
                <Sidebar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <AlertTriangle className="text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-black uppercase tracking-wide">Tournament Not Found</h2>
                    <Link to={isOrganizer ? "/auctions" : "/owner-dashboard"} className="mt-4 px-6 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const sessionStatus = dbAuction ? dbAuction.status : "NO_SESSION";
    const amILeading = myTeam && highestBidderTeamId === myTeam.id;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#030712] text-white selection:bg-[#FDB913] selection:text-black">
            <Sidebar />

            <main className="flex-1 flex flex-col w-full max-w-[1750px] mx-auto p-3 sm:p-5 md:p-7 overflow-y-auto pb-24 md:pb-7">
                {/* ── IPL BROADCAST HEADER BAR ── */}
                <div className="bg-[#0B1120] border border-white/10 rounded-2xl p-4 sm:p-5 mb-5 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FDB913] via-amber-400 to-yellow-500" />

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Tournament Title & Broadcast Status */}
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                            <Link
                                to={isOrganizer ? "/auctions" : "/owner-dashboard"}
                                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white shrink-0"
                                title="Exit Arena"
                            >
                                <ArrowLeft size={18} />
                            </Link>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2 truncate">
                                        <Trophy size={20} className="text-[#FDB913] shrink-0" />
                                        <span className="truncate">{tournament.name}</span>
                                    </h1>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black border uppercase tracking-wider shrink-0 ${socketConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-bounce"}`} />
                                        {socketConnected ? "IPL LIVE BROADCAST" : "CONNECTING..."}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400 font-semibold truncate">
                                    <span className="flex items-center gap-1.5 text-gray-300 truncate">
                                        <Radio size={13} className="text-[#FDB913] animate-pulse shrink-0" />
                                        {isOrganizer ? "Organizer Command Desk" : `Owner Bidding Console • ${myTeam?.name || "Team Owner"}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Remaining Purse Ticker & Controls */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                            {isOwner && myTeam && (
                                <div className="bg-[#030712] border border-[#FDB913]/30 px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-3 sm:gap-4 shadow-inner">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
                                            <Wallet size={11} className="text-[#FDB913]" /> Purse Available
                                        </p>
                                        <p className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 font-mono">
                                            {formatINR(myTeam.remainingPurse)}
                                        </p>
                                    </div>
                                    <div className="text-right border-l border-white/10 pl-3 sm:pl-4">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Squad Acquired</p>
                                        <p className="text-sm sm:text-base font-black text-white mt-0.5">
                                            {myTeam.playersWon?.length || 0} Players
                                        </p>
                                    </div>
                                </div>
                            )}

                            {isOrganizer && (
                                <>
                                    {sessionStatus === "PENDING" && (
                                        <button
                                            disabled={controlLoading}
                                            onClick={handleStartSession}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 sm:px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95"
                                        >
                                            {controlLoading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                                            Activate Session
                                        </button>
                                    )}

                                    {sessionStatus === "ACTIVE" && (
                                        <button
                                            disabled={controlLoading}
                                            onClick={handleEndSession}
                                            className="bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-400 font-black px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-xs uppercase tracking-wider active:scale-95"
                                        >
                                            {controlLoading ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                                            End Session
                                        </button>
                                    )}
                                </>
                            )}

                            {sessionStatus === "COMPLETED" && (
                                <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
                                    Auction Concluded
                                </span>
                            )}

                            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                                <button
                                    onClick={toggleSound}
                                    className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 ${soundEnabled
                                        ? "bg-[#FDB913]/10 border-[#FDB913]/30 text-[#FDB913] shadow-lg shadow-yellow-500/5 hover:bg-[#FDB913]/20"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                    title={soundEnabled ? "Mute Broadcast Audio" : "Enable Broadcast Audio"}
                                >
                                    {soundEnabled ? (
                                        <div className="flex items-end gap-[2px] h-[16px] w-[16px] justify-center pb-[2px]">
                                            <span className="w-[3px] bg-current rounded-full animate-sound-bar-1"></span>
                                            <span className="w-[3px] bg-current rounded-full animate-sound-bar-2"></span>
                                            <span className="w-[3px] bg-current rounded-full animate-sound-bar-3"></span>
                                        </div>
                                    ) : (
                                        <VolumeX size={16} className="transition-transform duration-300 scale-95" />
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                                        {soundEnabled ? "Audio On" : "Muted"}
                                    </span>
                                </button>

                                <button
                                    onClick={refreshLists}
                                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white"
                                    title="Refresh Data"
                                >
                                    <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── PENDING / NO_SESSION WARNING BANNER ── */}
                {(sessionStatus === "PENDING" || sessionStatus === "NO_SESSION") && (
                    <div className="bg-[#0B1120] border border-amber-500/30 rounded-3xl p-5 sm:p-6 mb-5 text-center max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-3.5 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-white uppercase tracking-tight">
                                    {sessionStatus === "PENDING" ? "Auction Session Pending Activation" : "Arena Session Idle"}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {isOrganizer
                                        ? "Click Activate Session to enable real-time bidding for all connected franchises."
                                        : "Waiting for the tournament organizer to activate the live bidding round."}
                                </p>
                            </div>
                        </div>
                        {isOrganizer && (
                            <button
                                disabled={controlLoading}
                                onClick={handleStartSession}
                                className="bg-gradient-to-r from-[#FDB913] to-amber-500 hover:from-[#fec435] hover:to-amber-400 text-black font-black px-6 py-2.5 rounded-xl transition hover:scale-105 shadow-xl shadow-yellow-500/20 text-xs uppercase tracking-wider shrink-0"
                            >
                                {controlLoading ? "Activating..." : "Activate Live Session"}
                            </button>
                        )}
                    </div>
                )}

                {/* ── COMPLETED AUCTION REPORTS ── */}
                {sessionStatus === "COMPLETED" && (
                    <CompletedAuctionView
                        tournament={tournament}
                        allTeams={allTeams}
                        allPlayers={allPlayers}
                        formatINR={formatINR}
                        isOrganizer={isOrganizer}
                        isOwner={isOwner}
                        myTeam={myTeam}
                        completedStats={completedStats}
                        completedBidLogs={completedBidLogs}
                    />
                )}

                {/* ── LIVE BROADCAST GRID (ALWAYS VISIBLE WHEN NOT COMPLETED) ── */}
                {sessionStatus !== "COMPLETED" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* 1. CENTER SPOTLIGHT PLAYER PODIUM & CONTROLS */}
                        <div className="lg:col-span-12 xl:col-span-6 order-1 xl:order-2 w-full">
                            <IPLPlayerPodium
                                activePlayer={activePlayer}
                                timeLeft={timeLeft}
                                totalDuration={bidDuration}
                                isPaused={isPaused}
                                highestBid={highestBid}
                                highestBidderTeamName={highestBidderTeamName}
                                highestBidderTeamId={highestBidderTeamId}
                                myTeam={myTeam}
                                amILeading={amILeading}
                                formatINR={formatINR}
                                isOrganizer={isOrganizer}
                                isOwner={isOwner}
                                controlLoading={controlLoading}
                                handlePause={handlePause}
                                handleResume={handleResume}
                                handleSell={handleSell}
                                handleMarkUnsold={handleMarkUnsold}
                                nextMinBid={nextMinBid}
                                bidPlacing={bidPlacing}
                                handlePlaceBidAmount={handlePlaceBidAmount}
                                customBidAmount={customBidAmount}
                                setCustomBidAmount={setCustomBidAmount}
                                unsoldPlayers={unsoldPlayers}
                                nextPlayerId={nextPlayerId}
                                setNextPlayerId={setNextPlayerId}
                                bidDuration={bidDuration}
                                setBidDuration={setBidDuration}
                                handlePutPlayerOnAuction={handlePutPlayerOnAuction}
                                nominatedPlayer={nominatedPlayer}
                                socketRef={socketRef}
                                tournamentId={tournamentId}
                            />
                        </div>

                        {/* 2. LIVE BID COMMENTARY STREAM */}
                        <div className="lg:col-span-6 xl:col-span-3 order-2 xl:order-1 w-full">
                            <IPLBidFeed
                                bidHistory={bidHistory}
                                myTeam={myTeam}
                                formatINR={formatINR}
                            />
                        </div>

                        {/* 3. TEAM PURSE & ROSTER STANDINGS */}
                        <div className="lg:col-span-6 xl:col-span-3 order-3 xl:order-3 w-full">
                            <IPLTeamPurseCard
                                allTeams={allTeams}
                                soldPlayers={soldPlayers}
                                unsoldPlayers={unsoldPlayers}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                myTeam={myTeam}
                                formatINR={formatINR}
                                setSelectedPlayerId={setSelectedPlayerId}
                            />
                        </div>
                    </div>
                )}
            </main>

            {/* ── STICKY MOBILE BID BAR FOR TEAM OWNERS ── */}
            {sessionStatus === "ACTIVE" && (
                <IPLMobileBidBar
                    activePlayer={activePlayer}
                    isOwner={isOwner}
                    isPaused={isPaused}
                    amILeading={amILeading}
                    myTeam={myTeam}
                    highestBid={highestBid}
                    nextMinBid={nextMinBid}
                    bidPlacing={bidPlacing}
                    handlePlaceBidAmount={handlePlaceBidAmount}
                    formatINR={formatINR}
                />
            )}

            {/* ── CONFIRMATION MODAL ── */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0B1120] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Indicator top band */}
                        <div className={`absolute top-0 inset-x-0 h-1.5 ${dialog.type === "danger" ? "bg-red-500" :
                            dialog.type === "warning" ? "bg-amber-500" :
                                dialog.type === "success" ? "bg-emerald-500" : "bg-[#FDB913]"
                            }`} />

                        <div className="space-y-2 pt-1">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                {dialog.type === "danger" && <AlertTriangle size={20} className="text-red-500 shrink-0" />}
                                {dialog.type === "warning" && <AlertTriangle size={20} className="text-amber-500 shrink-0" />}
                                {dialog.type === "success" && <Check size={20} className="text-emerald-500 shrink-0" />}
                                {dialog.type === "info" && <Gavel size={20} className="text-[#FDB913] shrink-0" />}
                                {dialog.title}
                            </h3>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                {dialog.message}
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            {dialog.showCancel && (
                                <button
                                    onClick={dialog.onCancel}
                                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition"
                                >
                                    {dialog.cancelText}
                                </button>
                            )}
                            <button
                                onClick={dialog.onConfirm}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${dialog.type === "danger" ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20" :
                                    dialog.type === "warning" ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20" :
                                        dialog.type === "success" ? "bg-gradient-to-r from-[#FDB913] to-amber-500 text-black font-black shadow-lg shadow-yellow-500/20" :
                                            "bg-[#FDB913] hover:bg-amber-400 text-black shadow-lg shadow-yellow-500/10"
                                    }`}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PLAYER DETAILS MODAL ── */}
            {selectedPlayerId && (
                <PlayerDetailsModal
                    playerId={selectedPlayerId}
                    onClose={() => setSelectedPlayerId(null)}
                />
            )}
        </div>
    );
};

export default LiveAuction;
