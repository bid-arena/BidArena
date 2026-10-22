import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { clearAuthSession } from "../utils/auth";
import { disconnectUserSocket, getSocketUrl } from "../services/socketService";
import api from "../services/api";
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
    Radio,
    Flame,
    BarChart3,
    Search,
    ChevronDown,
    Filter,
    ArrowRight,
    Crown,
    TrendingUp,
    ArrowUpRight,
    Shield,
    LayoutList,
    ListFilter,
    Layers,
    Activity,
    Target
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
import PlayerPurchasedModal from "../components/auctions/PlayerPurchasedModal";
import { auctionSound } from "../utils/auctionSoundSFX";

import batsmanIcon from "../assets/icons/batsman-rb.png";
import bowlerIcon from "../assets/icons/bowler-rb.png";
import allRounderIcon from "../assets/icons/all-rounder-rb.png";
import wicketkeeperIcon from "../assets/icons/wicketkeeper-rb.png";
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
    Cell,
    CartesianGrid,
    Legend
} from "recharts";

const formatINR = (amount) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("en-IN").format(amount) + " Pts";
};

const ROLE_BADGE_CONFIG = {
    Batsman: { icon: batsmanIcon, label: "Batsman", bg: "bg-blue-500/15 border-blue-500/30 text-blue-300" },
    Batter: { icon: batsmanIcon, label: "Batter", bg: "bg-blue-500/15 border-blue-500/30 text-blue-300" },
    Bowler: { icon: bowlerIcon, label: "Bowler", bg: "bg-red-500/15 border-red-500/30 text-red-300" },
    "All-Rounder": { icon: allRounderIcon, label: "All-Rounder", bg: "bg-purple-500/15 border-purple-500/30 text-purple-300" },
    "Wicket-Keeper": { icon: wicketkeeperIcon, label: "Wicketkeeper", bg: "bg-amber-500/15 border-amber-500/30 text-amber-300" },
    Wicketkeeper: { icon: wicketkeeperIcon, label: "Wicketkeeper", bg: "bg-amber-500/15 border-amber-500/30 text-amber-300" },
};

const getPlayerRoleBadge = (role) => {
    if (!role) return null;
    const norm = role.trim();
    return ROLE_BADGE_CONFIG[norm] || { icon: null, label: role, bg: "bg-white/10 border-white/20 text-gray-300" };
};

const getPlayerInitials = (name) => {
    if (!name || !name.trim()) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getPlayerAvatarStyle = (name) => {
    const hue = (name?.charCodeAt(0) || 75) * 23 % 360;
    return {
        background: `linear-gradient(135deg, hsl(${hue}, 80%, 45%), hsl(${(hue + 50) % 360}, 90%, 30%))`
    };
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

    // Sub-view page navigation state
    const [activeSubView, setActiveSubView] = useState("live-auction"); // live-auction, players, player-profile, team-page, leaderboard, statistics
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);

    // Player purchase celebration & history
    const [purchasedCelebration, setPurchasedCelebration] = useState(null);
    const [lastPurchased, setLastPurchased] = useState(null);

    // Refs to avoid stale closures in socket events
    const myTeamRef = useRef(myTeam);
    const allTeamsRef = useRef(allTeams);
    const allPlayersRef = useRef(allPlayers);

    useEffect(() => {
        myTeamRef.current = myTeam;
    }, [myTeam]);

    useEffect(() => {
        allTeamsRef.current = allTeams;
    }, [allTeams]);

    useEffect(() => {
        allPlayersRef.current = allPlayers;
    }, [allPlayers]);

    // Filters for players pool subpage
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortBy, setSortBy] = useState("default");
    const [teamRosterFilter, setTeamRosterFilter] = useState("all");
    const [leaderboardSort, setLeaderboardSort] = useState("purse-desc");
    const [statsRoleMetric, setStatsRoleMetric] = useState("count"); // "count" | "spent" | "sold"
    const [statsChart2Mode, setStatsChart2Mode] = useState("stacked"); // "stacked" | "grouped" | "ledger"
    const [statsTeamSort, setStatsTeamSort] = useState("spent-desc"); // "spent-desc" | "purse-desc" | "squad-desc" | "name"
    const [statsTierMetric, setStatsTierMetric] = useState("spent"); // "spent" | "count"

    // Memoized filtered & sorted players pool based strictly on verified DB schema fields
    const filteredAndSortedPlayers = useMemo(() => {
        return allPlayers
            .filter((p) => {
                const query = searchQuery.trim().toLowerCase();
                const matchesSearch = !query ||
                    p.name.toLowerCase().includes(query) ||
                    (p.role && p.role.toLowerCase().includes(query)) ||
                    (p.id && p.id.toLowerCase().includes(query));
                const normRole = (p.role || "").toLowerCase();
                const matchesRole = roleFilter === "All" ||
                    p.role === roleFilter ||
                    (roleFilter === "Batsman" && (normRole.includes("bat") || normRole === "batter")) ||
                    (roleFilter === "Bowler" && normRole.includes("bowl")) ||
                    (roleFilter === "All-Rounder" && normRole.includes("round")) ||
                    (roleFilter === "Wicket-Keeper" && (normRole.includes("keeper") || normRole.includes("wk")));
                const matchesStatus = statusFilter === "All" ||
                    (statusFilter === "SOLD" && !!p.soldRecord) ||
                    (statusFilter === "UNSOLD" && p.status === "UNSOLD") ||
                    (statusFilter === "AVAILABLE" && !p.soldRecord && p.status !== "UNSOLD");
                return matchesSearch && matchesRole && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === "price-desc") return (b.basePrice || 0) - (a.basePrice || 0);
                if (sortBy === "price-asc") return (a.basePrice || 0) - (b.basePrice || 0);
                if (sortBy === "name-asc") return (a.name || "").localeCompare(b.name || "");
                if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                return 0;
            });
    }, [allPlayers, searchQuery, roleFilter, statusFilter, sortBy]);

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
        const res = await api.get("/teams/owner/my-team");
        return res.data?.data;
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

        const token = localStorage.getItem("token");
        const socketUrl = getSocketUrl();
        const socket = io(socketUrl, {
            auth: { token },
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketConnected(true);
            socket.emit("join-auction", tournamentId);
            try {
                const rawUser = localStorage.getItem("user");
                if (rawUser) {
                    const u = JSON.parse(rawUser);
                    const userId = u?._id || u?.id;
                    if (userId) {
                        socket.emit("join-user", userId);
                    }
                }
            } catch {
                // ignore
            }
        });

        socket.on("force-logout", (data) => {
            try {
                socket.disconnect();
            } catch {
                // ignore
            }
            disconnectUserSocket();
            clearAuthSession();
            const message =
                data?.message ||
                "You have been logged out because your account was logged in from another device.";
            sessionStorage.setItem("auth_toast", message);
            sessionStorage.setItem("auth_toast_type", "error");
            window.location.href = "/login";
        });

        socket.on("disconnect", () => {
            setSocketConnected(false);
        });

        socket.on("player-nominated", (data) => {
            setNominatedPlayer(data.player);
            setPurchasedCelebration(null);
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
            setPurchasedCelebration(null);
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
                    teamId: data.teamId,
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

            const currentMyTeam = myTeamRef.current || myTeam;
            const currentAllTeams = allTeamsRef.current || allTeams;
            const wasBoughtByMe = Boolean(currentMyTeam && (data.teamId === currentMyTeam.id || data.teamName === currentMyTeam.name));
            const winningTeamObj = currentAllTeams.find(t => t.id === data.teamId || t.name === data.teamName) || { name: data.teamName, id: data.teamId };
            const playerObj = data.player || allPlayersRef.current.find(p => p.id === data.playerId) || { name: "Player", role: "Player", basePrice: 0 };

            const celebrationPayload = {
                player: playerObj,
                price: data.price,
                teamId: data.teamId,
                teamName: data.teamName,
                wasBoughtByMe,
                winningTeam: winningTeamObj,
                myTeam: currentMyTeam,
                timestamp: Date.now()
            };

            setPurchasedCelebration(celebrationPayload);
            setLastPurchased(celebrationPayload);

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
        <div className="h-screen w-full bg-[#050C1E] text-white selection:bg-[#FDB913] selection:text-black relative flex flex-col overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0A225C]/20 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-[#FDB913]/4 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            {/* ── TOP NAVIGATION BAR (FULL SCREEN BROADCAST) ── */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0B1020]/90 border-b border-white/[0.08] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 shadow-md shrink-0">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                        <Link
                            to={isOrganizer ? "/organizer-dashboard" : "/owner-dashboard"}
                            className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white shrink-0 hover:scale-105 active:scale-95 duration-200"
                            title="Exit Arena"
                        >
                            <ArrowLeft size={16} />
                        </Link>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <h1 className="text-xs sm:text-base font-black uppercase tracking-tight text-white flex items-center gap-1.5 truncate">
                                    <Trophy size={16} className="text-[#FDB913] shrink-0" />
                                    <span className="truncate">{tournament.name}</span>
                                </h1>
                                <span className="bg-[#F97316] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 shadow-sm shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    {socketConnected ? "LIVE" : "OFFLINE"}
                                </span>
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                                {isOrganizer ? "Organizer Command Desk" : `Owner Bidding Console • ${myTeam?.name || "Team Owner"}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
                        {/* Remaining Purse Ticker for Owner */}
                        {isOwner && myTeam && (
                            <div className="bg-black/45 border border-white/[0.05] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl flex items-center gap-2 sm:gap-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] text-xs">
                                <div>
                                    <span className="text-[7px] sm:text-[8px] text-gray-500 font-black uppercase block">Purse Left</span>
                                    <span className="font-mono font-black text-emerald-400 text-[11px] sm:text-xs">{formatINR(myTeam.remainingPurse)}</span>
                                </div>
                                <div className="text-right border-l border-white/10 pl-2 sm:pl-3 hidden xs:block">
                                    <span className="text-[7px] sm:text-[8px] text-gray-500 font-black uppercase block">Squad</span>
                                    <span className="font-black text-white text-[11px] sm:text-xs">{(myTeam.playersWon || []).length} P</span>
                                </div>
                            </div>
                        )}

                        {isOrganizer && (
                            <>
                                {sessionStatus === "PENDING" && (
                                    <button
                                        disabled={controlLoading}
                                        onClick={handleStartSession}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 duration-200"
                                    >
                                        {controlLoading ? <Loader2 className="animate-spin" size={13} /> : <Play size={13} />}
                                        <span className="hidden sm:inline">Activate Session</span>
                                        <span className="sm:hidden">Activate</span>
                                    </button>
                                )}

                                {sessionStatus === "ACTIVE" && (
                                    <button
                                        disabled={controlLoading}
                                        onClick={handleEndSession}
                                        className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-wider active:scale-95 duration-200"
                                    >
                                        {controlLoading ? <Loader2 className="animate-spin" size={13} /> : <X size={13} />}
                                        <span className="hidden sm:inline">End Session</span>
                                        <span className="sm:hidden">End</span>
                                    </button>
                                )}
                            </>
                        )}

                        {sessionStatus === "COMPLETED" && (
                            <span className="bg-gray-500/10 text-gray-400 border border-gray-500/25 font-black px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider">
                                Concluded
                            </span>
                        )}

                        {/* Audio Mute Switch */}
                        <button
                            onClick={toggleSound}
                            className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center ${soundEnabled
                                ? "bg-[#FDB913]/10 border-[#FDB913]/30 text-[#FDB913] shadow-md shadow-yellow-500/5 hover:bg-[#FDB913]/25"
                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                            title={soundEnabled ? "Mute Broadcast Audio" : "Enable Broadcast Audio"}
                        >
                            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                        </button>

                        <button
                            onClick={refreshLists}
                            className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white hover:scale-105 active:scale-95 duration-200"
                            title="Refresh Data"
                        >
                            <RotateCcw size={15} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── RESPONSIVE MOBILE / TABLET SUBVIEW NAVIGATION STRIP (< lg) ── */}
            <nav className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-3 py-2 bg-[#080E1E] border-b border-white/[0.06] scrollbar-none shrink-0 z-30">
                {[
                    { id: "live-auction", label: "Live Arena", icon: Gavel },
                    { id: "players", label: "Players Pool", icon: User },
                    { id: "team-page", label: isOrganizer ? "Franchise Rosters" : "My Team Roster", icon: Users },
                    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                    { id: "statistics", label: "Analytics", icon: BarChart3 }
                ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSubView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveSubView(item.id);
                                if (item.id === "players" && allPlayers.length > 0 && !selectedPlayer) {
                                    setSelectedPlayer(allPlayers[0]);
                                }
                                if (item.id === "team-page") {
                                    if (isOrganizer) {
                                        setTeamRosterFilter("all");
                                    } else {
                                        const ownerTeam = myTeam ? (allTeams.find(t => String(t.id || t._id) === String(myTeam.id || myTeam._id)) || myTeam) : null;
                                        if (ownerTeam) {
                                            setSelectedTeam(ownerTeam);
                                            setTeamRosterFilter(String(ownerTeam.id || ownerTeam._id));
                                        }
                                    }
                                }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition shrink-0 ${isActive
                                ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            <Icon size={12} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* ── CORE LAYOUT VIEWPORTS ── */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* ── LEFT BROADCAST DECK SIDEBAR (DESKTOP >= lg) ── */}
                <aside className="w-60 xl:w-64 border-r border-white/[0.08] bg-[#0A1020]/90 p-4 xl:p-5 hidden lg:flex flex-col justify-between shrink-0 z-20">
                    <div className="space-y-6">
                        <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest pl-2">Navigation Deck</p>
                        <nav className="space-y-1">
                            {[
                                { id: "live-auction", label: "Live Arena", icon: Gavel },
                                { id: "players", label: "Players Pool", icon: User },
                                { id: "team-page", label: isOrganizer ? "Franchise Rosters" : "My Team Roster", icon: Users },
                                { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                                { id: "statistics", label: "Analytics", icon: BarChart3 }
                            ].map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSubView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveSubView(item.id);
                                            if (item.id === "players" && allPlayers.length > 0 && !selectedPlayer) {
                                                setSelectedPlayer(allPlayers[0]);
                                            }
                                            if (item.id === "team-page") {
                                                if (isOrganizer) {
                                                    setTeamRosterFilter("all");
                                                } else {
                                                    const ownerTeam = myTeam ? (allTeams.find(t => String(t.id || t._id) === String(myTeam.id || myTeam._id)) || myTeam) : null;
                                                    if (ownerTeam) {
                                                        setSelectedTeam(ownerTeam);
                                                        setTeamRosterFilter(String(ownerTeam.id || ownerTeam._id));
                                                    }
                                                }
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
                            {socketConnected ? "CONNECTED" : "DISCONNECTED"}
                        </span>
                    </div>
                </aside>

                {/* ── WORKSPACE CONTENT FRAME ── */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0B1020]/40">
                    <main className={`flex-1 min-h-0 p-3 sm:p-4 pb-20 lg:pb-3 relative z-10 flex flex-col ${activeSubView === "live-auction" && sessionStatus !== "COMPLETED" ? "overflow-y-auto xl:overflow-hidden" : "overflow-y-auto"}`}>
                        {/* ── PENDING / NO_SESSION WARNING BANNER ── */}
                        {(sessionStatus === "PENDING" || sessionStatus === "NO_SESSION") && (
                            <div className="shrink-0 backdrop-blur-xl bg-[#091535]/90 border border-[#FDB913]/30 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 mb-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl relative overflow-hidden shadow-yellow-500/[0.02]">
                                <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/[0.03] rounded-full blur-xl pointer-events-none" />
                                <div className="flex items-center gap-3 text-left relative z-10 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                        <AlertTriangle size={16} className="drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-tight truncate">
                                            {sessionStatus === "PENDING" ? "Auction Session Pending Activation" : "Arena Session Idle"}
                                        </h3>
                                        <p className="text-[11px] text-gray-400 leading-tight">
                                            {isOrganizer
                                                ? "Activate the live bidding console to open the real-time player auction block."
                                                : "Waiting for the tournament commissioner to start the live player draft."}
                                        </p>
                                    </div>
                                </div>

                                {isOrganizer && sessionStatus === "PENDING" && (
                                    <button
                                        disabled={controlLoading}
                                        onClick={handleStartSession}
                                        className="w-full sm:w-auto bg-gradient-to-r from-[#FDB913] to-[#F29F05] hover:from-[#fec435] hover:to-[#fec435] text-black font-black px-4 py-1.5 rounded-xl transition hover:scale-[1.02] active:scale-95 shadow-lg shadow-yellow-500/20 text-xs uppercase tracking-wider shrink-0 duration-200 relative z-10 flex items-center justify-center gap-1.5"
                                    >
                                        {controlLoading ? <Loader2 className="animate-spin" size={13} /> : <Play size={13} />}
                                        Activate Live Session
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

                        {/* ── LIVE ACTION ACTIVE DASHBOARD VIEWS ── */}
                        {sessionStatus !== "COMPLETED" && (
                            <div className="flex-1 flex flex-col min-h-0">
                                {activeSubView === "live-auction" && (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-full min-h-0 flex-1 items-stretch">
                                        {/* 1. CENTER SPOTLIGHT PLAYER PODIUM & CONTROLS */}
                                        <div className="lg:col-span-12 xl:col-span-6 order-1 xl:order-2 w-full h-full min-h-0 flex flex-col">
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
                                                lastPurchased={lastPurchased}
                                            />
                                        </div>

                                        {/* 2. LIVE BID COMMENTARY STREAM */}
                                        <div className="lg:col-span-6 xl:col-span-3 order-2 xl:order-1 w-full h-full min-h-0 flex flex-col">
                                            <IPLBidFeed
                                                bidHistory={bidHistory}
                                                myTeam={myTeam}
                                                formatINR={formatINR}
                                                allTeams={allTeams}
                                                activePlayer={activePlayer}
                                            />
                                        </div>

                                        {/* 3. TEAM PURSE & ROSTER STANDINGS */}
                                        <div className="lg:col-span-6 xl:col-span-3 order-3 xl:order-3 w-full h-full min-h-0 flex flex-col">
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

                                {activeSubView === "players" && (
                                    <div className="space-y-6">
                                        {/* Filters Panel */}
                                        <div className="backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-2xl relative overflow-hidden space-y-3.5">
                                            {/* Ambient Corner Glow */}
                                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FDB913]/[0.03] rounded-full blur-2xl pointer-events-none" />

                                            {/* Top Row: Search Input + Results Counter & Reset */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                                                {/* Search Bar */}
                                                <div className="flex-1 relative">
                                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search player name, role or ID..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full bg-black/45 hover:bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/30 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-all shadow-inner"
                                                    />
                                                    {searchQuery && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSearchQuery("")}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 rounded-md transition cursor-pointer"
                                                            title="Clear search"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Right: Results Count & Reset Controls */}
                                                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                                    <span className="text-[11px] font-bold text-gray-300 bg-white/[0.04] border border-white/[0.08] px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                                                        <Users size={12} className="text-[#FDB913]" />
                                                        <span>
                                                            <strong className="text-white font-black">
                                                                {filteredAndSortedPlayers.length}
                                                            </strong> of {allPlayers.length} Players
                                                        </span>
                                                    </span>

                                                    {(searchQuery || roleFilter !== "All" || statusFilter !== "All" || sortBy !== "default") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSearchQuery("");
                                                                setRoleFilter("All");
                                                                setStatusFilter("All");
                                                                setSortBy("default");
                                                            }}
                                                            className="text-[11px] font-bold text-[#FDB913] hover:text-amber-300 bg-[#FDB913]/10 hover:bg-[#FDB913]/20 border border-[#FDB913]/30 px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                                                            title="Reset all filters"
                                                        >
                                                            <RotateCcw size={12} />
                                                            <span>Reset</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Row: 3 Custom Dropdowns in Responsive Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/[0.05] relative z-10">
                                                {/* 1. Role Filter Dropdown */}
                                                <div className="relative group">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FDB913] pointer-events-none transition group-hover:text-amber-300" size={14} />
                                                    <select
                                                        value={roleFilter}
                                                        onChange={(e) => setRoleFilter(e.target.value)}
                                                        className="w-full appearance-none bg-black/45 hover:bg-black/65 border border-white/10 hover:border-white/20 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/30 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-gray-200 focus:outline-none transition cursor-pointer shadow-inner"
                                                    >
                                                        <option value="All" className="bg-[#0B1530] text-gray-200 py-1.5">All Player Roles</option>
                                                        <option value="Batsman" className="bg-[#0B1530] text-gray-200 py-1.5">🏏 Batters (Batsmen)</option>
                                                        <option value="Bowler" className="bg-[#0B1530] text-gray-200 py-1.5">🎯 Bowlers</option>
                                                        <option value="All-Rounder" className="bg-[#0B1530] text-gray-200 py-1.5">⚡ All-Rounders</option>
                                                        <option value="Wicket-Keeper" className="bg-[#0B1530] text-gray-200 py-1.5">🧤 Wicketkeepers</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition group-hover:text-white" size={14} />
                                                </div>

                                                {/* 2. Status Filter Dropdown */}
                                                <div className="relative group">
                                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FDB913] pointer-events-none transition group-hover:text-amber-300" size={14} />
                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="w-full appearance-none bg-black/45 hover:bg-black/65 border border-white/10 hover:border-white/20 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/30 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-gray-200 focus:outline-none transition cursor-pointer shadow-inner"
                                                    >
                                                        <option value="All" className="bg-[#0B1530] text-gray-200 py-1.5">All Auction Statuses</option>
                                                        <option value="AVAILABLE" className="bg-[#0B1530] text-gray-200 py-1.5">🟢 Available in Pool</option>
                                                        <option value="SOLD" className="bg-[#0B1530] text-gray-200 py-1.5">🏆 Sold Under Hammer</option>
                                                        <option value="UNSOLD" className="bg-[#0B1530] text-gray-200 py-1.5">❌ Passed Unsold</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition group-hover:text-white" size={14} />
                                                </div>

                                                {/* 3. Sort & Valuation Dropdown */}
                                                <div className="relative group">
                                                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FDB913] pointer-events-none transition group-hover:text-amber-300" size={14} />
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value)}
                                                        className="w-full appearance-none bg-black/45 hover:bg-black/65 border border-white/10 hover:border-white/20 focus:border-[#FDB913] focus:ring-1 focus:ring-[#FDB913]/30 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-gray-200 focus:outline-none transition cursor-pointer shadow-inner"
                                                    >
                                                        <option value="default" className="bg-[#0B1530] text-gray-200 py-1.5">Default Order</option>
                                                        <option value="price-desc" className="bg-[#0B1530] text-gray-200 py-1.5">💰 Base Price: High to Low</option>
                                                        <option value="price-asc" className="bg-[#0B1530] text-gray-200 py-1.5">💵 Base Price: Low to High</option>
                                                        <option value="name-asc" className="bg-[#0B1530] text-gray-200 py-1.5">🔤 Name: A to Z</option>
                                                        <option value="newest" className="bg-[#0B1530] text-gray-200 py-1.5">🕒 Recently Added</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition group-hover:text-white" size={14} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Player list grid */}
                                        {(() => {
                                            if (filteredAndSortedPlayers.length === 0) {
                                                return (
                                                    <div className="py-16 text-center backdrop-blur-xl bg-[#0B1530]/60 border border-white/[0.06] rounded-3xl space-y-3">
                                                        <Users size={32} className="mx-auto text-gray-500 opacity-60" />
                                                        <p className="text-sm font-extrabold text-gray-300 uppercase tracking-wider">No Players Match Your Filters</p>
                                                        <p className="text-xs text-gray-500 max-w-sm mx-auto">Try clearing search terms or resetting role, status, or sorting filters.</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSearchQuery("");
                                                                setRoleFilter("All");
                                                                setStatusFilter("All");
                                                                setSortBy("default");
                                                            }}
                                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-[#FDB913] hover:text-white transition cursor-pointer"
                                                        >
                                                            Reset All Filters
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                                                    {filteredAndSortedPlayers.map((p) => {
                                                        const roleBadge = getPlayerRoleBadge(p.role);
                                                        const isSold = !!p.soldRecord;
                                                        const isUnsold = !isSold && p.status === "UNSOLD";
                                                        const isAvailable = !isSold && !isUnsold;
                                                        const soldTeam = isSold && p.soldRecord?.teamId ? allTeams.find(t => t.id === p.soldRecord.teamId) : null;
                                                        const wasBoughtByMe = myTeam && soldTeam && (soldTeam.id === myTeam.id || soldTeam.name === myTeam.name);

                                                        return (
                                                            <div
                                                                key={p.id || p._id}
                                                                onClick={() => {
                                                                    setSelectedPlayer(p);
                                                                    setActiveSubView("player-profile");
                                                                }}
                                                                className={`backdrop-blur-xl bg-[#0B1530]/90 hover:bg-[#0E1B3D] border rounded-3xl p-4 sm:p-5 transition-all duration-300 shadow-xl shadow-black/30 flex flex-col justify-between space-y-4 relative overflow-hidden group cursor-pointer ${wasBoughtByMe
                                                                    ? "border-emerald-500/40 hover:border-emerald-500/70 hover:shadow-emerald-500/10"
                                                                    : isSold
                                                                        ? "border-white/[0.08] hover:border-[#FDB913]/50 hover:shadow-yellow-500/10"
                                                                        : "border-white/[0.08] hover:border-blue-500/40 hover:shadow-blue-500/10"
                                                                    }`}
                                                            >
                                                                {/* Top Ambient Glow */}
                                                                <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 transition group-hover:opacity-40 ${wasBoughtByMe ? "bg-emerald-500" : isSold ? "bg-[#FDB913]" : "bg-blue-500"
                                                                    }`} />

                                                                {/* Top Header: Avatar + Identity + Status Pill */}
                                                                <div className="flex items-start justify-between gap-2.5 relative z-10">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        {/* Player Avatar */}
                                                                        <div className="relative shrink-0">
                                                                            {p.image ? (
                                                                                <img
                                                                                    src={p.image}
                                                                                    alt={p.name}
                                                                                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border border-white/20 shadow-md"
                                                                                />
                                                                            ) : (
                                                                                <div
                                                                                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg border border-white/20 shadow-md"
                                                                                    style={getPlayerAvatarStyle(p.name)}
                                                                                >
                                                                                    {getPlayerInitials(p.name)}
                                                                                </div>
                                                                            )}
                                                                            {isSold && (
                                                                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-0.5 rounded-full border-2 border-[#0B1530]">
                                                                                    <Check size={10} className="stroke-[3]" />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Name, Role & Details */}
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                                                {roleBadge && (
                                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${roleBadge.bg}`}>
                                                                                        {roleBadge.icon && (
                                                                                            <img src={roleBadge.icon} alt={roleBadge.label} className="w-3 h-3 object-contain" />
                                                                                        )}
                                                                                        {roleBadge.label}
                                                                                    </span>
                                                                                )}
                                                                                {p.id && (
                                                                                    <span className="text-[9px] font-mono text-gray-400 bg-white/[0.04] border border-white/10 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                                                                        #{p.id.slice(-6).toUpperCase()}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <h4 className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-[#FDB913] transition">
                                                                                {p.name}
                                                                            </h4>
                                                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                                                                                {p.createdAt ? (
                                                                                    <span>Listed: <strong className="text-gray-300 font-sans font-semibold">{new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                                                                                ) : (
                                                                                    <span>Player ID: <strong className="text-gray-300">#{p.id ? p.id.slice(-6).toUpperCase() : "REG"}</strong></span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Status Pill */}
                                                                    <div className="shrink-0">
                                                                        {isSold ? (
                                                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1 shadow-sm">
                                                                                <Trophy size={9} />
                                                                                <span>SOLD</span>
                                                                            </span>
                                                                        ) : isUnsold ? (
                                                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase border bg-rose-500/15 text-rose-400 border-rose-500/30">
                                                                                UNSOLD
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase border bg-blue-500/15 text-blue-300 border-blue-500/30">
                                                                                AVAILABLE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Middle: Pricing & Franchise Information */}
                                                                <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-2.5 sm:p-3 text-xs space-y-2 relative z-10 shadow-inner">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">
                                                                                Base Reserve
                                                                            </span>
                                                                            <span className="font-mono font-bold text-gray-200 text-xs sm:text-[13px]">
                                                                                {formatINR(p.basePrice)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">
                                                                                {isSold ? "Hammer Price" : "Current State"}
                                                                            </span>
                                                                            <span className={`font-mono font-black text-xs sm:text-[13px] ${isSold ? "text-[#FDB913]" : "text-gray-400"
                                                                                }`}>
                                                                                {isSold ? formatINR(p.soldRecord.price) : (isUnsold ? "Passed" : "Awaiting Floor")}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* If Sold: Winning Franchise Indicator */}
                                                                    {isSold && (
                                                                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                {soldTeam?.logo ? (
                                                                                    <img
                                                                                        src={soldTeam.logo}
                                                                                        alt={soldTeam.name}
                                                                                        className="w-4 h-4 rounded object-cover border border-white/10 shrink-0"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-4 h-4 rounded bg-amber-500/20 text-[#FDB913] font-bold text-[8px] flex items-center justify-center shrink-0">
                                                                                        {soldTeam?.name ? getPlayerInitials(soldTeam.name) : "T"}
                                                                                    </div>
                                                                                )}
                                                                                <span className="text-[10px] text-gray-300 font-bold truncate">
                                                                                    Sold to <strong className="text-white">{soldTeam?.name || "Franchise"}</strong>
                                                                                </span>
                                                                            </div>

                                                                            {wasBoughtByMe && (
                                                                                <span className="text-[7px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-1 py-0.2 rounded font-black uppercase shrink-0">
                                                                                    YOUR SQUAD
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Footer Action Button */}
                                                                <button
                                                                    type="button"
                                                                    className="w-full bg-white/[0.04] group-hover:bg-[#FDB913] group-hover:text-black border border-white/10 group-hover:border-[#FDB913] text-gray-300 transition-all duration-200 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm relative z-10 cursor-pointer"
                                                                >
                                                                    <span>View Profile Ledger</span>
                                                                    <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {activeSubView === "player-profile" && selectedPlayer && (
                                    <div className="space-y-6">
                                        <button
                                            onClick={() => setActiveSubView("players")}
                                            className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider hover:text-white transition flex items-center gap-1"
                                        >
                                            &larr; Back to Players Pool
                                        </button>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                            {/* Left Profile card summary */}
                                            <div className="lg:col-span-4 backdrop-blur-xl bg-[#0F1C3F]/90 border border-white/[0.08] rounded-3xl p-6 text-center space-y-5 shadow-2xl">
                                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#2563EB] to-[#F97316] text-white flex items-center justify-center text-5xl font-black mx-auto shadow-xl">
                                                    🏏
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-black text-white uppercase">{selectedPlayer.name}</h3>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Jersey #{selectedPlayer.jerseyNumber || "—"} • Age {selectedPlayer.age || "—"}</p>
                                                </div>

                                                <div className="flex justify-center gap-2">
                                                    <span className="px-3 py-1 bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#2563EB] rounded-full text-xs font-black uppercase">
                                                        {selectedPlayer.role}
                                                    </span>
                                                    <span className="px-3 py-1 bg-[#FDB913]/15 border border-[#FDB913]/30 rounded-full text-xs font-black text-[#FDB913]">
                                                        Base: {formatINR(selectedPlayer.basePrice)}
                                                    </span>
                                                </div>

                                                <div className="border-t border-white/[0.06] pt-4 space-y-2.5 text-left text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Player ID:</span>
                                                        <span className="font-mono font-extrabold text-white">#{selectedPlayer.id ? selectedPlayer.id.slice(-6).toUpperCase() : "REG"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Base Price:</span>
                                                        <span className="font-extrabold text-[#FDB913]">{formatINR(selectedPlayer.basePrice)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right stats history */}
                                            <div className="lg:col-span-8 space-y-5">
                                                <div className="backdrop-blur-md bg-[#0B1530]/90 border border-white/[0.06] rounded-3xl p-5 lg:p-6 space-y-4 shadow-2xl">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Tournament Career Stats</h3>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                        <div className="bg-black/25 p-3 rounded-2xl border border-white/[0.03] text-center">
                                                            <span className="text-[9px] text-gray-500 uppercase font-bold">Matches</span>
                                                            <p className="text-lg font-black text-white font-mono mt-0.5">{selectedPlayer.stats?.matches || 0}</p>
                                                        </div>
                                                        <div className="bg-black/25 p-3 rounded-2xl border border-white/[0.03] text-center">
                                                            <span className="text-[9px] text-gray-500 uppercase font-bold">Runs Avg</span>
                                                            <p className="text-lg font-black text-white font-mono mt-0.5">{selectedPlayer.stats?.avg || "—"}</p>
                                                        </div>
                                                        <div className="bg-black/25 p-3 rounded-2xl border border-white/[0.03] text-center">
                                                            <span className="text-[9px] text-gray-500 uppercase font-bold">Strike Rate</span>
                                                            <p className="text-lg font-black text-white font-mono mt-0.5">{selectedPlayer.stats?.sr || "—"}</p>
                                                        </div>
                                                        <div className="bg-black/25 p-3 rounded-2xl border border-white/[0.03] text-center">
                                                            <span className="text-[9px] text-gray-500 uppercase font-bold">Wickets</span>
                                                            <p className="text-lg font-black text-white font-mono mt-0.5">{selectedPlayer.stats?.wickets || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Chart Summary */}
                                                <div className="backdrop-blur-md bg-[#0B1530]/90 border border-white/[0.06] rounded-3xl p-5 lg:p-6 space-y-4 shadow-2xl">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Bidding Valuation Timeline</h3>
                                                    <div className="h-44">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={[
                                                                { name: "Base Price", val: selectedPlayer.basePrice },
                                                                { name: "Final Hammer", val: selectedPlayer.soldRecord?.price || selectedPlayer.basePrice }
                                                            ]}>
                                                                <defs>
                                                                    <linearGradient id="realColorVal" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <XAxis dataKey="name" stroke="#555" fontSize={10} />
                                                                <YAxis stroke="#555" fontSize={10} />
                                                                <Tooltip contentStyle={{ background: "#0F1C3F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "11px" }} />
                                                                <Area type="monotone" dataKey="val" stroke="#2563EB" fillOpacity={1} fill="url(#realColorVal)" strokeWidth={2.5} />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSubView === "team-page" && (() => {
                                    if (allTeams.length === 0) {
                                        return (
                                            <div className="py-20 text-center backdrop-blur-xl bg-[#0B1530]/60 border border-white/[0.06] rounded-3xl space-y-4">
                                                <Users size={40} className="mx-auto text-gray-500 opacity-60" />
                                                <h3 className="text-base font-black text-white uppercase tracking-wider">No Franchises Registered</h3>
                                                <p className="text-xs text-gray-400 max-w-sm mx-auto">Teams will appear here once loaded or registered for this tournament auction.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveSubView("live-auction")}
                                                    className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/25"
                                                >
                                                    Back to Live Arena
                                                </button>
                                            </div>
                                        );
                                    }

                                    const ROLE_GROUPS = [
                                        {
                                            key: "Batsman",
                                            label: "Batters",
                                            icon: batsmanIcon,
                                            emoji: "🏏",
                                            border: "border-blue-500/20 hover:border-blue-500/40",
                                            glow: "from-blue-600/10",
                                            badge: "bg-blue-500/15 border-blue-500/30 text-blue-300"
                                        },
                                        {
                                            key: "Bowler",
                                            label: "Bowlers",
                                            icon: bowlerIcon,
                                            emoji: "🎯",
                                            border: "border-red-500/20 hover:border-red-500/40",
                                            glow: "from-red-600/10",
                                            badge: "bg-red-500/15 border-red-500/30 text-red-300"
                                        },
                                        {
                                            key: "All-Rounder",
                                            label: "All-Rounders",
                                            icon: allRounderIcon,
                                            emoji: "⚡",
                                            border: "border-purple-500/20 hover:border-purple-500/40",
                                            glow: "from-purple-600/10",
                                            badge: "bg-purple-500/15 border-purple-500/30 text-purple-300"
                                        },
                                        {
                                            key: "Wicket-Keeper",
                                            label: "Wicketkeepers",
                                            icon: wicketkeeperIcon,
                                            emoji: "🧤",
                                            border: "border-amber-500/20 hover:border-amber-500/40",
                                            glow: "from-amber-600/10",
                                            badge: "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                        }
                                    ];

                                    const checkRoleMatch = (playerRole, groupKey) => {
                                        const norm = (playerRole || "").toLowerCase();
                                        if (groupKey === "Batsman") return norm.includes("bat") || norm === "batter";
                                        if (groupKey === "Bowler") return norm.includes("bowl");
                                        if (groupKey === "All-Rounder") return norm.includes("round");
                                        if (groupKey === "Wicket-Keeper") return norm.includes("keeper") || norm.includes("wk");
                                        return false;
                                    };

                                    const getTeamPurchasedPlayers = (team) => {
                                        if (!team) return [];
                                        const currentTeamId = team.id || team._id;
                                        return allPlayers.filter((p) => {
                                            const soldTeamId = p.soldRecord?.teamId || p.soldRecord?.team?._id || p.soldRecord?.team?.id;
                                            if (soldTeamId && String(soldTeamId) === String(currentTeamId)) return true;
                                            if (team.playersWon?.some(pw => String(pw.playerId || pw.id || pw._id) === String(p.id || p._id))) return true;
                                            return false;
                                        });
                                    };

                                    const allSoldPlayers = allPlayers.filter(p => !!p.soldRecord);
                                    const totalTournamentSpend = allSoldPlayers.reduce((sum, p) => sum + (p.soldRecord?.price || 0), 0);
                                    const totalTournamentBudget = allTeams.reduce((sum, t) => sum + (t.purseAmount || 0), 0);
                                    const totalTournamentPurseLeft = allTeams.reduce((sum, t) => sum + (t.remainingPurse ?? t.purseAmount ?? 0), 0);

                                    // Team Owner lookup
                                    const ownerTeam = myTeam ? (allTeams.find(t => String(t.id || t._id) === String(myTeam.id || myTeam._id)) || myTeam) : null;

                                    // If user is a team owner and not linked to any franchise yet
                                    if (!isOrganizer && !ownerTeam) {
                                        return (
                                            <div className="backdrop-blur-xl bg-[#0B1530]/90 border border-white/[0.08] rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
                                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl">
                                                    🛡️
                                                </div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-tight">No Franchise Linked</h3>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    Your team owner profile is not registered to an active franchise in this tournament auction. Please contact the tournament organizer.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveSubView("live-auction")}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition cursor-pointer"
                                                >
                                                    <ArrowLeft size={13} />
                                                    <span>Return to Live Arena</span>
                                                </button>
                                            </div>
                                        );
                                    }

                                    // Check if focused on a specific franchise:
                                    // Team owner is strictly locked to their own team; Organizer can toggle 'all' or specific team
                                    const isSpecificTeamView = isOrganizer ? (teamRosterFilter !== "all") : true;
                                    const focusedTeam = isOrganizer
                                        ? (isSpecificTeamView ? (allTeams.find(t => String(t.id || t._id) === String(teamRosterFilter)) || selectedTeam || allTeams[0]) : null)
                                        : ownerTeam;

                                    return (
                                        <div className="space-y-6">
                                            {/* Top Control Bar: Navigation & Franchise Switcher */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B1530]/60 backdrop-blur-md border border-white/[0.06] p-3 sm:p-3.5 rounded-2xl">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSubView("live-auction")}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer shadow-sm"
                                                    >
                                                        <ArrowLeft size={13} />
                                                        <span>Back to Live Arena</span>
                                                    </button>

                                                    {isOrganizer && isSpecificTeamView && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setTeamRosterFilter("all")}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDB913]/10 hover:bg-[#FDB913]/20 border border-[#FDB913]/30 text-xs font-bold text-[#FDB913] hover:text-amber-300 transition cursor-pointer shadow-sm"
                                                        >
                                                            <Users size={13} />
                                                            <span>View All Franchises</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Franchise Switcher (Organizer) vs Locked Squad Identity (Team Owner) */}
                                                {isOrganizer ? (
                                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                                                        <button
                                                            type="button"
                                                            onClick={() => setTeamRosterFilter("all")}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${!isSpecificTeamView
                                                                ? "bg-[#2563EB] text-white border border-blue-400/40 shadow-md shadow-blue-500/25"
                                                                : "bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                                                                }`}
                                                        >
                                                            <Users size={12} />
                                                            <span>All Franchises ({allTeams.length})</span>
                                                        </button>

                                                        {allTeams.map((t) => {
                                                            const isSelected = isSpecificTeamView && String(t.id || t._id) === String(focusedTeam?.id || focusedTeam?._id);
                                                            const isTeamMine = Boolean(myTeam && String(t.id || t._id) === String(myTeam.id || myTeam._id));
                                                            return (
                                                                <button
                                                                    key={t.id || t._id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedTeam(t);
                                                                        setTeamRosterFilter(String(t.id || t._id));
                                                                    }}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${isSelected
                                                                        ? "bg-[#2563EB] text-white border border-blue-400/40 shadow-md shadow-blue-500/25"
                                                                        : "bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                                                                        }`}
                                                                >
                                                                    <span>🛡️</span>
                                                                    <span>{t.name}</span>
                                                                    {isTeamMine && (
                                                                        <span className="text-[8px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-black uppercase">
                                                                            YOU
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-black uppercase tracking-wider">
                                                            <span>🛡️</span>
                                                            <span>{focusedTeam?.name}</span>
                                                            <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold text-emerald-200">My Franchise</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tournament Roster Overview Header Banner (Only shown in All Franchises overview mode for organizer) */}
                                            {!isSpecificTeamView && (
                                                <div className="backdrop-blur-xl bg-gradient-to-br from-[#0F1C3F]/95 via-[#0A1128]/95 to-[#080E1E]/95 border border-white/[0.08] p-5 sm:p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                                                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />
                                                    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#FDB913]/[0.04] rounded-full blur-3xl pointer-events-none" />

                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-xl">🏆</span>
                                                                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                                                                    Tournament Franchise Rosters
                                                                </h2>
                                                                <span className="text-[10px] font-black uppercase bg-[#FDB913]/15 text-[#FDB913] border border-[#FDB913]/30 px-2.5 py-0.5 rounded-full">
                                                                    All {allTeams.length} Teams
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-1 max-w-xl">
                                                                Real-time squad divisions and financial outlays across all {allTeams.length} participating franchises in this tournament.
                                                            </p>
                                                        </div>

                                                        {/* Tournament Key Financial Chips */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                                                            <div className="bg-black/35 border border-white/[0.05] px-3 py-2 rounded-xl text-center">
                                                                <span className="text-[8px] font-bold text-gray-400 uppercase block">Franchises</span>
                                                                <span className="font-mono text-xs sm:text-sm font-black text-white">{allTeams.length} Teams</span>
                                                            </div>
                                                            <div className="bg-black/35 border border-white/[0.05] px-3 py-2 rounded-xl text-center">
                                                                <span className="text-[8px] font-bold text-gray-400 uppercase block">Signed</span>
                                                                <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">{allSoldPlayers.length} / {allPlayers.length}</span>
                                                            </div>
                                                            <div className="bg-black/35 border border-white/[0.05] px-3 py-2 rounded-xl text-center">
                                                                <span className="text-[8px] font-bold text-gray-400 uppercase block">Total Spent</span>
                                                                <span className="font-mono text-xs sm:text-sm font-black text-red-400 truncate block">{formatINR(totalTournamentSpend)}</span>
                                                            </div>
                                                            <div className="bg-black/35 border border-white/[0.05] px-3 py-2 rounded-xl text-center">
                                                                <span className="text-[8px] font-bold text-gray-400 uppercase block">Purse Left</span>
                                                                <span className="font-mono text-xs sm:text-sm font-black text-[#FDB913] truncate block">{formatINR(totalTournamentPurseLeft)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── VIEW MODE 1: ALL FRANCHISE ROSTERS ── */}
                                            {!isSpecificTeamView ? (
                                                <div className="space-y-6">
                                                    {allTeams.map((team) => {
                                                        const teamPurchased = getTeamPurchasedPlayers(team);
                                                        const budget = team.purseAmount || 0;
                                                        const remaining = team.remainingPurse ?? budget;
                                                        const spent = Math.max(0, budget - remaining);
                                                        const percentSpent = budget > 0 ? Math.min(100, Math.max(0, Math.round((spent / budget) * 100))) : 0;
                                                        const isMine = Boolean(myTeam && String(team.id || team._id) === String(myTeam.id || myTeam._id));

                                                        return (
                                                            <div
                                                                key={team.id || team._id}
                                                                className="backdrop-blur-xl bg-[#0B1530]/90 border border-white/[0.08] rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl space-y-4 relative overflow-hidden"
                                                            >
                                                                {/* Ambient Subtle Accent Glow */}
                                                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#2563EB]/[0.04] rounded-full blur-2xl pointer-events-none" />

                                                                {/* Franchise Header Banner */}
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-white/[0.06] pb-3.5 relative z-10">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] border border-blue-400/30 flex items-center justify-center text-2xl shadow-lg shrink-0">
                                                                            🛡️
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                                                                                    {team.name}
                                                                                </h3>
                                                                                {isMine && (
                                                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                                                        Your Squad
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                                                Owner: <strong className="text-gray-200">{team.ownerName || team.user?.name || "Franchise Owner"}</strong>
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Quick Financial Pills & Focus Button */}
                                                                    <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                                                                        <div className="bg-black/40 border border-white/[0.06] px-3 py-1.5 rounded-xl text-center">
                                                                            <span className="text-[8px] text-gray-400 font-bold uppercase block">Purse Left</span>
                                                                            <span className="font-mono text-xs font-black text-[#FDB913]">{formatINR(remaining)}</span>
                                                                        </div>
                                                                        <div className="bg-black/40 border border-white/[0.06] px-3 py-1.5 rounded-xl text-center">
                                                                            <span className="text-[8px] text-gray-400 font-bold uppercase block">Spent ({percentSpent}%)</span>
                                                                            <span className="font-mono text-xs font-bold text-red-400">{formatINR(spent)}</span>
                                                                        </div>
                                                                        <div className="bg-black/40 border border-white/[0.06] px-3 py-1.5 rounded-xl text-center">
                                                                            <span className="text-[8px] text-gray-400 font-bold uppercase block">Squad Count</span>
                                                                            <span className="font-mono text-xs font-black text-white">{teamPurchased.length} Players</span>
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedTeam(team);
                                                                                setTeamRosterFilter(String(team.id || team._id));
                                                                            }}
                                                                            className="text-[10px] font-black uppercase tracking-wider text-[#FDB913] hover:text-white bg-[#FDB913]/10 hover:bg-[#FDB913]/20 border border-[#FDB913]/30 px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                                                                        >
                                                                            <span>Focus Squad</span>
                                                                            <ArrowRight size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* 4 Positional Role Division Columns for this Team */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
                                                                    {ROLE_GROUPS.map((group) => {
                                                                        const squadOfRole = teamPurchased.filter(p => checkRoleMatch(p.role, group.key));
                                                                        const roleSpent = squadOfRole.reduce((sum, p) => sum + (p.soldRecord?.price || 0), 0);
                                                                        return (
                                                                            <div
                                                                                key={group.key}
                                                                                className={`bg-black/25 border ${group.border} rounded-2xl p-3 space-y-2.5 flex flex-col justify-between`}
                                                                            >
                                                                                <div className="space-y-2">
                                                                                    {/* Role Column Header */}
                                                                                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            {group.icon ? (
                                                                                                <img src={group.icon} alt={group.label} className="w-4 h-4 object-contain" />
                                                                                            ) : (
                                                                                                <span className="text-sm">{group.emoji}</span>
                                                                                            )}
                                                                                            <span className="text-[11px] font-black uppercase text-white tracking-wider">
                                                                                                {group.label}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            {squadOfRole.length > 0 && (
                                                                                                <span className="text-[9px] text-gray-400 font-mono font-semibold">
                                                                                                    {formatINR(roleSpent)}
                                                                                                </span>
                                                                                            )}
                                                                                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${group.badge}`}>
                                                                                                {squadOfRole.length}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Acquired Players in this Role */}
                                                                                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                                                                                        {squadOfRole.length === 0 ? (
                                                                                            <p className="text-[10px] text-gray-500 italic py-3 text-center">
                                                                                                No {group.label.toLowerCase()}
                                                                                            </p>
                                                                                        ) : (
                                                                                            squadOfRole.map((p) => (
                                                                                                <div
                                                                                                    key={p.id || p._id}
                                                                                                    onClick={() => p.id && setSelectedPlayerId(p.id)}
                                                                                                    className="group/p bg-black/40 hover:bg-black/70 p-2 rounded-xl border border-white/[0.04] hover:border-[#FDB913]/30 transition cursor-pointer flex items-center justify-between gap-1.5"
                                                                                                    title="Click to view player ledger"
                                                                                                >
                                                                                                    <div className="min-w-0">
                                                                                                        <span className="font-extrabold text-[11px] text-white uppercase truncate block group-hover/p:text-[#FDB913] transition">
                                                                                                            {p.name}
                                                                                                        </span>
                                                                                                        <span className="text-[9px] text-gray-400 font-mono">
                                                                                                            Base: {formatINR(p.basePrice)}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <span className="font-mono text-[11px] font-black text-emerald-400 shrink-0">
                                                                                                        {formatINR(p.soldRecord?.price)}
                                                                                                    </span>
                                                                                                </div>
                                                                                            ))
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                /* ── VIEW MODE 2: FOCUSED SINGLE FRANCHISE LEDGER VIEW ── */
                                                (() => {
                                                    const teamPurchased = getTeamPurchasedPlayers(focusedTeam);
                                                    const totalBudget = focusedTeam.purseAmount || 0;
                                                    const purseLeft = focusedTeam.remainingPurse ?? totalBudget;
                                                    const totalSpent = Math.max(0, totalBudget - purseLeft);
                                                    const percentSpent = totalBudget > 0 ? Math.min(100, Math.max(0, Math.round((totalSpent / totalBudget) * 100))) : 0;
                                                    const avgCost = teamPurchased.length > 0 ? Math.round(totalSpent / teamPurchased.length) : 0;
                                                    const isMine = Boolean(myTeam && String(focusedTeam.id || focusedTeam._id) === String(myTeam.id || myTeam._id));
                                                    const topPlayer = [...teamPurchased].sort((a, b) => (b.soldRecord?.price || 0) - (a.soldRecord?.price || 0))[0];

                                                    return (
                                                        <div className="space-y-6">
                                                            {/* Focused Franchise Financial Hero */}
                                                            <div className="backdrop-blur-xl bg-gradient-to-br from-[#0F1C3F]/95 via-[#0A1128]/95 to-[#080E1E]/95 border border-white/[0.08] p-5 sm:p-6 md:p-7 rounded-3xl relative overflow-hidden shadow-2xl space-y-6">
                                                                <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />
                                                                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#FDB913]/[0.04] rounded-full blur-3xl pointer-events-none" />

                                                                {/* Identity Row */}
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] border border-blue-400/30 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shrink-0">
                                                                            🛡️
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                                                                                    {focusedTeam.name}
                                                                                </h2>
                                                                                {isMine && (
                                                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
                                                                                        Your Squad
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                                                                                <span>Owner: <strong className="text-gray-200">{focusedTeam.ownerName || focusedTeam.user?.name || "Franchise Owner"}</strong></span>
                                                                                <span>•</span>
                                                                                <span>Acquisitions: <strong className="text-white">{teamPurchased.length} Players</strong></span>
                                                                                {topPlayer && (
                                                                                    <>
                                                                                        <span>•</span>
                                                                                        <span>Top Buy: <strong className="text-[#FDB913]">{topPlayer.name} ({formatINR(topPlayer.soldRecord?.price)})</strong></span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {isOrganizer && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setTeamRosterFilter("all")}
                                                                            className="self-start sm:self-auto text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                                                        >
                                                                            <ArrowLeft size={13} />
                                                                            <span>All Franchises</span>
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Key Metrics Grid */}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
                                                                    <div className="bg-black/35 backdrop-blur-sm border border-white/[0.05] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
                                                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                                            <span>Purse Left</span>
                                                                            <Wallet size={13} className="text-[#FDB913]" />
                                                                        </div>
                                                                        <p className="text-base sm:text-xl font-black text-[#FDB913] font-mono mt-2 truncate">
                                                                            {formatINR(purseLeft)}
                                                                        </p>
                                                                        <span className="text-[10px] text-gray-500 font-semibold mt-1">Available for bids</span>
                                                                    </div>

                                                                    <div className="bg-black/35 backdrop-blur-sm border border-white/[0.05] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
                                                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                                            <span>Total Budget</span>
                                                                            <Coins size={13} className="text-blue-400" />
                                                                        </div>
                                                                        <p className="text-base sm:text-xl font-black text-white font-mono mt-2 truncate">
                                                                            {formatINR(totalBudget)}
                                                                        </p>
                                                                        <span className="text-[10px] text-gray-500 font-semibold mt-1">Franchise cap</span>
                                                                    </div>

                                                                    <div className="bg-black/35 backdrop-blur-sm border border-white/[0.05] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
                                                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                                            <span>Spent Ledger</span>
                                                                            <span className="text-[9px] font-mono font-bold text-red-400">{percentSpent}%</span>
                                                                        </div>
                                                                        <p className="text-base sm:text-xl font-black text-red-400 font-mono mt-2 truncate">
                                                                            {formatINR(totalSpent)}
                                                                        </p>
                                                                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                                                                            <div
                                                                                className="bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                                                                                style={{ width: `${percentSpent}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-black/35 backdrop-blur-sm border border-white/[0.05] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
                                                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                                            <span>Squad Count</span>
                                                                            <Users size={13} className="text-emerald-400" />
                                                                        </div>
                                                                        <p className="text-base sm:text-xl font-black text-white font-mono mt-2">
                                                                            {teamPurchased.length} <span className="text-xs font-normal text-gray-400">Players</span>
                                                                        </p>
                                                                        <span className="text-[10px] text-gray-500 font-semibold mt-1 truncate">
                                                                            Avg {teamPurchased.length > 0 ? formatINR(avgCost) : "—"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* 4 Role Cards for this Team */}
                                                            <div className="space-y-4">
                                                                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                                                    <span>Franchise Squad Division</span>
                                                                    <span className="text-[10px] font-bold text-[#FDB913] bg-[#FDB913]/10 border border-[#FDB913]/20 px-2 py-0.5 rounded-full">
                                                                        {teamPurchased.length} Acquired
                                                                    </span>
                                                                </h3>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                    {ROLE_GROUPS.map((group) => {
                                                                        const squadOfRole = teamPurchased.filter(p => checkRoleMatch(p.role, group.key));
                                                                        const roleSpent = squadOfRole.reduce((sum, p) => sum + (p.soldRecord?.price || 0), 0);
                                                                        return (
                                                                            <div
                                                                                key={group.key}
                                                                                className={`backdrop-blur-md bg-[#0F1C3F]/50 border ${group.border} rounded-3xl p-4 sm:p-4.5 space-y-3.5 shadow-xl flex flex-col justify-between`}
                                                                            >
                                                                                <div className="space-y-3">
                                                                                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                                                                                        <div className="flex items-center gap-2">
                                                                                            {group.icon ? (
                                                                                                <img src={group.icon} alt={group.label} className="w-5 h-5 object-contain" />
                                                                                            ) : (
                                                                                                <span className="text-base">{group.emoji}</span>
                                                                                            )}
                                                                                            <div>
                                                                                                <h4 className="text-xs font-black uppercase text-white tracking-wider">
                                                                                                    {group.label}
                                                                                                </h4>
                                                                                                <span className="text-[9px] text-gray-400 font-mono font-semibold">
                                                                                                    {formatINR(roleSpent)}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${group.badge}`}>
                                                                                            {squadOfRole.length}
                                                                                        </span>
                                                                                    </div>

                                                                                    <div className="space-y-2">
                                                                                        {squadOfRole.length === 0 ? (
                                                                                            <div className="border border-dashed border-white/10 rounded-2xl py-8 px-3 text-center space-y-1">
                                                                                                <p className="text-xs font-bold text-gray-500">No {group.label}</p>
                                                                                                <p className="text-[10px] text-gray-600">Pending nomination in arena</p>
                                                                                            </div>
                                                                                        ) : (
                                                                                            squadOfRole.map((p) => (
                                                                                                <div
                                                                                                    key={p.id || p._id}
                                                                                                    onClick={() => p.id && setSelectedPlayerId(p.id)}
                                                                                                    className="group/player bg-black/35 hover:bg-black/60 p-2.5 sm:p-3 rounded-2xl border border-white/[0.04] hover:border-[#FDB913]/30 transition-all cursor-pointer shadow-sm space-y-1.5"
                                                                                                    title="Click to view player ledger"
                                                                                                >
                                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                                        <div className="min-w-0">
                                                                                                            <span className="font-extrabold text-xs text-white uppercase truncate block group-hover/player:text-[#FDB913] transition">
                                                                                                                {p.name}
                                                                                                            </span>
                                                                                                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-mono">
                                                                                                                <span>#{p.id ? p.id.slice(-6).toUpperCase() : "REG"}</span>
                                                                                                                <span>•</span>
                                                                                                                <span>Base: {formatINR(p.basePrice)}</span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="text-right shrink-0">
                                                                                                            <span className="font-mono text-xs font-black text-emerald-400 block">
                                                                                                                {formatINR(p.soldRecord?.price)}
                                                                                                            </span>
                                                                                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block">
                                                                                                                HAMMER
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase">
                                                                                    <span>Slot allocation</span>
                                                                                    <span className="text-gray-300 font-mono font-semibold">{squadOfRole.length} Acquired</span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Complete Acquisition Ledger Trail */}
                                                            {teamPurchased.length > 0 && (
                                                                <div className="backdrop-blur-xl bg-[#0B1530]/80 border border-white/[0.08] rounded-3xl p-4 sm:p-5 md:p-6 space-y-4 shadow-2xl">
                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                                                                        <div>
                                                                            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                                                                <Gavel size={14} className="text-[#FDB913]" />
                                                                                <span>Complete Acquisition Trail ({teamPurchased.length})</span>
                                                                            </h4>
                                                                            <p className="text-[11px] text-gray-400 mt-0.5">Chronological record of all won hammer bids by {focusedTeam.name}</p>
                                                                        </div>
                                                                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl self-start sm:self-auto">
                                                                            Total Outlay: {formatINR(totalSpent)}
                                                                        </span>
                                                                    </div>

                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-left text-xs">
                                                                            <thead>
                                                                                <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                                                    <th className="py-2.5 px-3">#</th>
                                                                                    <th className="py-2.5 px-3">Player</th>
                                                                                    <th className="py-2.5 px-3">Role</th>
                                                                                    <th className="py-2.5 px-3">Base Price</th>
                                                                                    <th className="py-2.5 px-3">Hammer Price</th>
                                                                                    <th className="py-2.5 px-3">Premium Paid</th>
                                                                                    <th className="py-2.5 px-3 text-right">Action</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-white/[0.03]">
                                                                                {teamPurchased.map((p, idx) => {
                                                                                    const roleBadge = getPlayerRoleBadge(p.role);
                                                                                    const hammerPrice = p.soldRecord?.price || 0;
                                                                                    const basePrice = p.basePrice || 0;
                                                                                    const premium = Math.max(0, hammerPrice - basePrice);
                                                                                    return (
                                                                                        <tr
                                                                                            key={p.id || p._id || idx}
                                                                                            className="hover:bg-white/[0.02] transition"
                                                                                        >
                                                                                            <td className="py-3 px-3 font-mono text-gray-500 font-bold">{idx + 1}</td>
                                                                                            <td className="py-3 px-3">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0">
                                                                                                        {p.name.charAt(0)}
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <span className="font-extrabold text-white uppercase block">{p.name}</span>
                                                                                                        <span className="text-[9px] text-gray-500 font-mono">#{p.id ? p.id.slice(-6).toUpperCase() : "REG"}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-3 px-3">
                                                                                                {roleBadge && (
                                                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${roleBadge.bg}`}>
                                                                                                        {roleBadge.icon && <img src={roleBadge.icon} alt="" className="w-3 h-3 object-contain" />}
                                                                                                        {roleBadge.label}
                                                                                                    </span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="py-3 px-3 font-mono text-gray-400">{formatINR(basePrice)}</td>
                                                                                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">{formatINR(hammerPrice)}</td>
                                                                                            <td className="py-3 px-3 font-mono text-[11px] text-gray-400">
                                                                                                {premium > 0 ? (
                                                                                                    <span className="text-amber-400 font-semibold">+{formatINR(premium)}</span>
                                                                                                ) : (
                                                                                                    <span className="text-gray-500">At Base</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-right">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => p.id && setSelectedPlayerId(p.id)}
                                                                                                    className="text-[10px] font-black uppercase text-[#FDB913] hover:text-white bg-[#FDB913]/10 hover:bg-[#FDB913]/20 border border-[#FDB913]/30 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                                                                                >
                                                                                                    Ledger
                                                                                                </button>
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </div>
                                    );
                                })()}

                                {activeSubView === "leaderboard" && (() => {
                                    // 1. Process sold players and most expensive player
                                    const soldPlayers = allPlayers.filter(p => !!p.soldRecord && (p.soldRecord?.price || 0) > 0);
                                    const mostExpensivePlayer = soldPlayers.length > 0
                                        ? [...soldPlayers].sort((a, b) => (b.soldRecord?.price || 0) - (a.soldRecord?.price || 0))[0]
                                        : null;
                                    const buyerTeam = mostExpensivePlayer?.soldRecord?.teamId
                                        ? allTeams.find(t => String(t.id || t._id) === String(mostExpensivePlayer.soldRecord.teamId))
                                        : null;
                                    const expRoleBadge = mostExpensivePlayer ? getPlayerRoleBadge(mostExpensivePlayer.role) : null;

                                    // 2. Process all teams with budget metrics
                                    const processedTeams = allTeams.map(t => {
                                        const totalPurse = Number(t.purseAmount) || 0;
                                        const remaining = Number(t.remainingPurse ?? t.purseAmount ?? 0);
                                        const spent = Math.max(0, totalPurse - remaining);
                                        const percentSpent = totalPurse > 0 ? Math.min(100, Math.round((spent / totalPurse) * 100)) : 0;
                                        const percentRemaining = totalPurse > 0 ? Math.max(0, 100 - percentSpent) : 0;
                                        const squadCount = (t.playersWon || []).length;
                                        return {
                                            ...t,
                                            totalPurse,
                                            remaining,
                                            spent,
                                            percentSpent,
                                            percentRemaining,
                                            squadCount
                                        };
                                    });

                                    const topSpender = [...processedTeams].sort((a, b) => b.spent - a.spent)[0];
                                    const highestPurse = [...processedTeams].sort((a, b) => b.remaining - a.remaining)[0];

                                    const sortedTeams = [...processedTeams].sort((a, b) => {
                                        if (leaderboardSort === "purse-desc") return b.remaining - a.remaining;
                                        if (leaderboardSort === "spent-desc") return b.spent - a.spent;
                                        if (leaderboardSort === "players-desc") return b.squadCount - a.squadCount;
                                        if (leaderboardSort === "percent-desc") return b.percentSpent - a.percentSpent;
                                        return b.remaining - a.remaining;
                                    });

                                    const renderRankBadge = (rank) => {
                                        if (rank === 1) {
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/10 border border-yellow-500/40 text-yellow-300 font-mono font-black text-xs shadow-sm shadow-yellow-500/10">
                                                    <span>🥇</span> #1
                                                </span>
                                            );
                                        }
                                        if (rank === 2) {
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-slate-400/25 to-gray-400/10 border border-slate-400/40 text-slate-200 font-mono font-black text-xs shadow-sm shadow-slate-400/10">
                                                    <span>🥈</span> #2
                                                </span>
                                            );
                                        }
                                        if (rank === 3) {
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-700/25 to-orange-800/10 border border-amber-600/40 text-amber-300 font-mono font-black text-xs shadow-sm shadow-amber-600/10">
                                                    <span>🥉</span> #3
                                                </span>
                                            );
                                        }
                                        return (
                                            <span className="inline-flex items-center px-2 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 font-mono font-bold text-xs">
                                                #{rank}
                                            </span>
                                        );
                                    };

                                    return (
                                        <div className="space-y-6">
                                            {/* Top 3 KPI Spotlight Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                                                {/* Card 1: Most Expensive Player */}
                                                <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-[#121E42]/95 via-[#0B1530]/95 to-[#1c1605]/95 border border-[#FDB913]/30 rounded-3xl p-5 shadow-2xl shadow-[#FDB913]/5 flex flex-col justify-between group hover:border-[#FDB913]/50 transition-all duration-300">
                                                    <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#FDB913]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FDB913]/20 transition-all duration-500" />

                                                    <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDB913]/15 border border-[#FDB913]/30 text-[#FDB913] text-[10px] font-black uppercase tracking-wider">
                                                            <Crown size={12} className="text-[#FDB913]" />
                                                            <span>Record Acquisition</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Rank #1 Bid</span>
                                                    </div>

                                                    {mostExpensivePlayer ? (
                                                        <div className="space-y-3 relative z-10">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {expRoleBadge && (
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${expRoleBadge.bg}`}>
                                                                            {expRoleBadge.icon && (
                                                                                <img src={expRoleBadge.icon} alt={expRoleBadge.label} className="w-3 h-3 object-contain" />
                                                                            )}
                                                                            <span>{expRoleBadge.label}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#FDB913] transition-colors">
                                                                    {mostExpensivePlayer.name}
                                                                </h4>
                                                            </div>

                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-2xl sm:text-3xl font-black text-[#FDB913] font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(253,185,19,0.3)]">
                                                                    {formatINR(mostExpensivePlayer.soldRecord?.price)}
                                                                </span>
                                                            </div>

                                                            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                                                                <div className="min-w-0">
                                                                    <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Signed By</span>
                                                                    <span className="font-extrabold text-white truncate block">
                                                                        🛡️ {buyerTeam?.name || "Franchise"}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => mostExpensivePlayer.id && setSelectedPlayerId(mostExpensivePlayer.id)}
                                                                    className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-[#FDB913]/20 border border-white/10 hover:border-[#FDB913]/40 text-[#FDB913] text-[11px] font-bold flex items-center gap-1 transition-all"
                                                                >
                                                                    <span>Profile</span>
                                                                    <ArrowRight size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-6 text-center space-y-1 relative z-10">
                                                            <p className="text-sm font-bold text-gray-400">No Players Sold Yet</p>
                                                            <p className="text-[11px] text-gray-500">Record will appear once bidding commences</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card 2: Top Spending Franchise */}
                                                <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-[#121E42]/95 via-[#0B1530]/95 to-[#240e1b]/95 border border-rose-500/30 rounded-3xl p-5 shadow-2xl shadow-rose-500/5 flex flex-col justify-between group hover:border-rose-500/50 transition-all duration-300">
                                                    <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 transition-all duration-500" />

                                                    <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-wider">
                                                            <Flame size={12} className="text-rose-400" />
                                                            <span>Top Spending Franchise</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Most Capital Out</span>
                                                    </div>

                                                    {topSpender ? (
                                                        <div className="space-y-3 relative z-10">
                                                            <div>
                                                                <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-rose-300 transition-colors">
                                                                    🛡️ {topSpender.name}
                                                                </h4>
                                                                {topSpender.ownerName && (
                                                                    <p className="text-[11px] text-gray-400 font-semibold truncate mt-0.5">
                                                                        Owner: {topSpender.ownerName}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(244,63,94,0.3)]">
                                                                    {formatINR(topSpender.spent)}
                                                                </span>
                                                                <div className="mt-2 space-y-1">
                                                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                                                                        <span>Budget Utilized</span>
                                                                        <span className="text-rose-400 font-mono font-black">{topSpender.percentSpent}%</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-500"
                                                                            style={{ width: `${topSpender.percentSpent}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                                                                <div className="min-w-0">
                                                                    <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Squad Strength</span>
                                                                    <span className="font-extrabold text-blue-300 truncate block">
                                                                        {topSpender.squadCount} Players Acquired
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedTeam(topSpender);
                                                                        setTeamRosterFilter(String(topSpender.id || topSpender._id));
                                                                        setActiveSubView("team-page");
                                                                    }}
                                                                    className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                                                                >
                                                                    <span>Roster</span>
                                                                    <ArrowRight size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-6 text-center space-y-1 relative z-10">
                                                            <p className="text-sm font-bold text-gray-400">No Franchises Registered</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card 3: Highest Purse Remaining */}
                                                <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-[#121E42]/95 via-[#0B1530]/95 to-[#051c1c]/95 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl shadow-emerald-500/5 flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300">
                                                    <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />

                                                    <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                                            <Wallet size={12} className="text-emerald-400" />
                                                            <span>War Chest Leader</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Highest Purse</span>
                                                    </div>

                                                    {highestPurse ? (
                                                        <div className="space-y-3 relative z-10">
                                                            <div>
                                                                <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-emerald-300 transition-colors">
                                                                    🛡️ {highestPurse.name}
                                                                </h4>
                                                                {highestPurse.ownerName && (
                                                                    <p className="text-[11px] text-gray-400 font-semibold truncate mt-0.5">
                                                                        Owner: {highestPurse.ownerName}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(52,211,153,0.3)]">
                                                                    {formatINR(highestPurse.remaining)}
                                                                </span>
                                                                <div className="mt-2 space-y-1">
                                                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                                                                        <span>Purse Intact</span>
                                                                        <span className="text-emerald-400 font-mono font-black">{highestPurse.percentRemaining}%</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                                                                            style={{ width: `${highestPurse.percentRemaining}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                                                                <div className="min-w-0">
                                                                    <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Total Allocation</span>
                                                                    <span className="font-extrabold text-gray-300 truncate block font-mono">
                                                                        {formatINR(highestPurse.totalPurse)}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedTeam(highestPurse);
                                                                        setTeamRosterFilter(String(highestPurse.id || highestPurse._id));
                                                                        setActiveSubView("team-page");
                                                                    }}
                                                                    className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                                                                >
                                                                    <span>Roster</span>
                                                                    <ArrowRight size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-6 text-center space-y-1 relative z-10">
                                                            <p className="text-sm font-bold text-gray-400">No Franchises Registered</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Standings Console */}
                                            <div className="backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 shadow-black/40 relative overflow-hidden">
                                                <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#FDB913]/[0.02] rounded-full blur-3xl pointer-events-none" />

                                                {/* Header & Sort Controls */}
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06] relative z-10">
                                                    <div>
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FDB913]/20 to-amber-500/10 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shadow-md shadow-[#FDB913]/10">
                                                                <Trophy size={18} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                                                                    Comparative Franchise Ledger Standings
                                                                </h3>
                                                                <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                                    Real-time purse utilization, acquisition counts & financial ranks
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Sorting Tabs */}
                                                    <div className="flex items-center gap-1.5 bg-[#070D1E]/90 p-1.5 rounded-2xl border border-white/[0.08] overflow-x-auto scrollbar-none">
                                                        {[
                                                            { id: "purse-desc", label: "Purse Left", icon: Wallet },
                                                            { id: "spent-desc", label: "Most Spent", icon: Flame },
                                                            { id: "players-desc", label: "Squad Size", icon: Users },
                                                            { id: "percent-desc", label: "Budget %", icon: BarChart3 },
                                                        ].map(tab => {
                                                            const TabIcon = tab.icon;
                                                            const isActive = leaderboardSort === tab.id;
                                                            return (
                                                                <button
                                                                    key={tab.id}
                                                                    type="button"
                                                                    onClick={() => setLeaderboardSort(tab.id)}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                                                                        ? "bg-gradient-to-r from-[#FDB913] to-amber-500 text-[#0B1530] font-black shadow-md shadow-[#FDB913]/20"
                                                                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                                                                        }`}
                                                                >
                                                                    <TabIcon size={12} className={isActive ? "text-[#0B1530]" : "text-gray-400"} />
                                                                    <span>{tab.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Desktop View Table */}
                                                <div className="hidden md:block overflow-x-auto relative z-10">
                                                    <table className="w-full text-xs text-left text-gray-300">
                                                        <thead className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-white/[0.08]">
                                                            <tr>
                                                                <th className="py-3.5 px-3 text-center">Rank</th>
                                                                <th className="py-3.5 px-3">Franchise</th>
                                                                <th className="py-3.5 px-3 text-center">Squad Size</th>
                                                                <th className="py-3.5 px-3 text-right">Total Budget</th>
                                                                <th className="py-3.5 px-3">Depletion %</th>
                                                                <th className="py-3.5 px-3 text-right">Total Spent</th>
                                                                <th className="py-3.5 px-3 text-right">Purse Remaining</th>
                                                                <th className="py-3.5 px-3 text-center">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/[0.05]">
                                                            {sortedTeams.map((t, idx) => (
                                                                <tr
                                                                    key={t.id || t._id}
                                                                    onClick={() => {
                                                                        setSelectedTeam(t);
                                                                        setTeamRosterFilter(String(t.id || t._id));
                                                                        setActiveSubView("team-page");
                                                                    }}
                                                                    className="hover:bg-white/[0.04] transition-all cursor-pointer group"
                                                                >
                                                                    <td className="py-4 px-3 text-center font-mono font-black">
                                                                        {renderRankBadge(idx + 1)}
                                                                    </td>
                                                                    <td className="py-4 px-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/25 to-indigo-600/25 border border-blue-400/30 flex items-center justify-center font-black text-white text-xs shadow-sm flex-shrink-0 group-hover:border-[#FDB913]/50 transition-colors">
                                                                                {(t.name || "T").substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="font-extrabold text-white text-sm group-hover:text-[#FDB913] transition-colors truncate">
                                                                                    {t.name}
                                                                                </p>
                                                                                {t.ownerName && (
                                                                                    <p className="text-[11px] text-gray-400 font-medium truncate">
                                                                                        Owner: {t.ownerName}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-3 text-center font-mono">
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold text-xs">
                                                                            <Users size={11} />
                                                                            <span>{t.squadCount}</span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 px-3 text-right font-mono font-bold text-gray-300">
                                                                        {formatINR(t.totalPurse)}
                                                                    </td>
                                                                    <td className="py-4 px-3 min-w-[140px]">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center justify-between text-[10px] font-mono">
                                                                                <span className="text-gray-400">{t.percentSpent}%</span>
                                                                                <span className="text-gray-500">used</span>
                                                                            </div>
                                                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-500 ${t.percentSpent > 80
                                                                                        ? "bg-rose-500"
                                                                                        : t.percentSpent > 50
                                                                                            ? "bg-amber-500"
                                                                                            : "bg-emerald-500"
                                                                                        }`}
                                                                                    style={{ width: `${t.percentSpent}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-3 text-right font-mono font-bold text-rose-400">
                                                                        {formatINR(t.spent)}
                                                                    </td>
                                                                    <td className="py-4 px-3 text-right font-mono font-black text-emerald-400">
                                                                        <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/10">
                                                                            {formatINR(t.remaining)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 px-3 text-center">
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 group-hover:text-[#FDB913] transition-colors">
                                                                            <span>Roster</span>
                                                                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Mobile View Cards */}
                                                <div className="block md:hidden space-y-3 relative z-10">
                                                    {sortedTeams.map((t, idx) => (
                                                        <div
                                                            key={t.id || t._id}
                                                            onClick={() => {
                                                                setSelectedTeam(t);
                                                                setTeamRosterFilter(String(t.id || t._id));
                                                                setActiveSubView("team-page");
                                                            }}
                                                            className="backdrop-blur-md bg-[#0F1C3F]/60 border border-white/[0.08] hover:border-[#FDB913]/40 rounded-2xl p-4 space-y-3 transition-all shadow-lg active:scale-[0.99] cursor-pointer"
                                                        >
                                                            {/* Top Header */}
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    {renderRankBadge(idx + 1)}
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-extrabold text-white text-sm truncate">
                                                                            {t.name}
                                                                        </h4>
                                                                        {t.ownerName && (
                                                                            <p className="text-[10px] text-gray-400 truncate">
                                                                                Owner: {t.ownerName}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FDB913] bg-[#FDB913]/10 px-2 py-1 rounded-xl border border-[#FDB913]/20 flex-shrink-0">
                                                                    <span>View</span>
                                                                    <ArrowRight size={11} />
                                                                </span>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="space-y-1 bg-[#070D1E]/60 p-2.5 rounded-xl border border-white/[0.04]">
                                                                <div className="flex items-center justify-between text-[10px] font-mono">
                                                                    <span className="text-gray-400">Budget Spent</span>
                                                                    <span className="text-rose-400 font-bold">{t.percentSpent}% utilized</span>
                                                                </div>
                                                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${t.percentSpent > 80
                                                                            ? "bg-rose-500"
                                                                            : t.percentSpent > 50
                                                                                ? "bg-amber-500"
                                                                                : "bg-emerald-500"
                                                                            }`}
                                                                        style={{ width: `${t.percentSpent}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* 3-Column Stat Grid */}
                                                            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/[0.06]">
                                                                <div className="bg-white/[0.02] p-2 rounded-xl">
                                                                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">Remaining</span>
                                                                    <span className="text-xs font-black font-mono text-emerald-400 block mt-0.5 truncate">
                                                                        {formatINR(t.remaining)}
                                                                    </span>
                                                                </div>
                                                                <div className="bg-white/[0.02] p-2 rounded-xl">
                                                                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">Spent</span>
                                                                    <span className="text-xs font-black font-mono text-rose-400 block mt-0.5 truncate">
                                                                        {formatINR(t.spent)}
                                                                    </span>
                                                                </div>
                                                                <div className="bg-white/[0.02] p-2 rounded-xl">
                                                                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">Squad</span>
                                                                    <span className="text-xs font-black font-mono text-blue-300 block mt-0.5 truncate">
                                                                        {t.squadCount} Players
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {allTeams.length === 0 && (
                                                    <div className="text-center py-12 space-y-2">
                                                        <Trophy size={32} className="mx-auto text-gray-600" />
                                                        <p className="text-sm font-bold text-gray-400">No franchises registered for this auction.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {activeSubView === "statistics" && (() => {
                                    // 1. Dynamic Player Resolver
                                    const getPlayerStatsInfo = (p) => {
                                        if (!p) return { isSold: false, isUnsold: false, isAvailable: false, price: 0, teamId: null, roleKey: "allRounders" };
                                        const isSold = p.status === "SOLD" || (!!p.soldRecord && (p.soldRecord?.price || 0) > 0) || (Number(p.soldPrice) > 0);
                                        const price = Number(p.soldRecord?.price || p.soldPrice || p.finalPrice || (isSold ? (p.basePrice || 0) : 0)) || 0;
                                        const teamId = p.soldRecord?.teamId || p.soldRecord?.team?._id || p.soldRecord?.team?.id || p.winningTeamId || p.currentTeamId;
                                        const isUnsold = p.status === "UNSOLD";
                                        const isAvailable = !isSold && !isUnsold;

                                        const r = String(p.role || "").toLowerCase();
                                        let roleKey = "allRounders";
                                        if (r.includes("wk") || r.includes("keep")) {
                                            roleKey = "wicketkeepers";
                                        } else if (r.includes("bowl")) {
                                            roleKey = "bowlers";
                                        } else if (r.includes("bat") || r.includes("batter")) {
                                            roleKey = "batters";
                                        } else {
                                            roleKey = "allRounders";
                                        }

                                        return { isSold, isUnsold, isAvailable, price, teamId, roleKey };
                                    };

                                    // 2. Role distribution metrics
                                    const roleMetrics = {
                                        batters: { label: "Batters", count: 0, sold: 0, unsold: 0, available: 0, spent: 0, color: "#3B82F6", icon: batsmanIcon, topPlayer: null },
                                        bowlers: { label: "Bowlers", count: 0, sold: 0, unsold: 0, available: 0, spent: 0, color: "#EF4444", icon: bowlerIcon, topPlayer: null },
                                        allRounders: { label: "All-Rounders", count: 0, sold: 0, unsold: 0, available: 0, spent: 0, color: "#F59E0B", icon: allRounderIcon, topPlayer: null },
                                        wicketkeepers: { label: "Wicketkeepers", count: 0, sold: 0, unsold: 0, available: 0, spent: 0, color: "#8B5CF6", icon: wicketkeeperIcon, topPlayer: null },
                                    };

                                    (allPlayers || []).forEach(p => {
                                        if (!p) return;
                                        const info = getPlayerStatsInfo(p);
                                        const target = roleMetrics[info.roleKey] || roleMetrics.allRounders;
                                        target.count++;
                                        if (info.isSold) {
                                            target.sold++;
                                            target.spent += info.price;
                                            if (!target.topPlayer || info.price > target.topPlayer.price) {
                                                const buyerTeam = (allTeams || []).find(t => String(t.id || t._id) === String(info.teamId));
                                                target.topPlayer = {
                                                    name: p.name || "Player",
                                                    price: info.price,
                                                    teamName: buyerTeam ? buyerTeam.name : "Franchise"
                                                };
                                            }
                                        } else if (info.isUnsold) {
                                            target.unsold++;
                                        } else {
                                            target.available++;
                                        }
                                    });

                                    const totalPoolPlayers = (allPlayers || []).length;

                                    // 3. Tournament Macro Totals & Franchise Data Reconciliation
                                    const franchiseData = (allTeams || []).map(t => {
                                        if (!t) return null;
                                        const teamIdStr = String(t.id || t._id);
                                        const wonPlayers = (allPlayers || []).filter(p => {
                                            if (!p) return false;
                                            const info = getPlayerStatsInfo(p);
                                            if (info.isSold && info.teamId && String(info.teamId) === teamIdStr) return true;
                                            if (t.playersWon?.some(pw => String(pw.playerId || pw.id || pw._id) === String(p.id || p._id))) return true;
                                            return false;
                                        });

                                        const totalPurse = Number(t.purseAmount) || 0;
                                        const playersSpent = wonPlayers.reduce((acc, p) => acc + getPlayerStatsInfo(p).price, 0);

                                        let spent = 0;
                                        let remaining = totalPurse;

                                        if (t.remainingPurse !== undefined && t.remainingPurse !== null && Number(t.remainingPurse) < totalPurse) {
                                            spent = Math.max(playersSpent, totalPurse - Number(t.remainingPurse));
                                            remaining = Math.max(0, totalPurse - spent);
                                        } else if (playersSpent > 0) {
                                            spent = playersSpent;
                                            remaining = Math.max(0, totalPurse - spent);
                                        } else {
                                            remaining = Number(t.remainingPurse ?? totalPurse);
                                            spent = Math.max(0, totalPurse - remaining);
                                        }

                                        const topPlayerObj = wonPlayers.length > 0
                                            ? [...wonPlayers].sort((a, b) => getPlayerStatsInfo(b).price - getPlayerStatsInfo(a).price)[0]
                                            : null;

                                        return {
                                            id: teamIdStr,
                                            rawTeam: t,
                                            name: t.name,
                                            displayName: t.name.length > 10 ? t.name.substring(0, 9) + "…" : t.name,
                                            spent,
                                            remaining,
                                            totalPurse,
                                            owner: t.ownerName || "Franchise Owner",
                                            squadCount: Math.max(wonPlayers.length, (t.playersWon || []).length),
                                            wonPlayers,
                                            topPlayer: topPlayerObj ? { name: topPlayerObj.name, price: getPlayerStatsInfo(topPlayerObj).price } : null
                                        };
                                    });

                                    const totalPurseAll = franchiseData.reduce((acc, t) => acc + t.totalPurse, 0);
                                    const totalSpentAll = franchiseData.reduce((acc, t) => acc + t.spent, 0);
                                    const totalRemainingAll = Math.max(0, totalPurseAll - totalSpentAll);
                                    const overallSpentPct = totalPurseAll > 0 ? Math.round((totalSpentAll / totalPurseAll) * 100) : 0;

                                    const totalSoldPlayers = Object.values(roleMetrics).reduce((acc, r) => acc + r.sold, 0);
                                    const totalUnsoldPlayers = Object.values(roleMetrics).reduce((acc, r) => acc + r.unsold, 0);
                                    const totalAvailablePlayers = Math.max(0, totalPoolPlayers - totalSoldPlayers - totalUnsoldPlayers);
                                    const avgPlayerCost = totalSoldPlayers > 0 ? Math.round(totalSpentAll / totalSoldPlayers) : 0;
                                    const clearanceRate = totalPoolPlayers > 0 ? Math.round((totalSoldPlayers / totalPoolPlayers) * 100) : 0;

                                    // Top player of the entire tournament
                                    const allSoldPlayersList = (allPlayers || [])
                                        .filter(p => getPlayerStatsInfo(p).isSold)
                                        .map(p => {
                                            const soldInfo = getPlayerStatsInfo(p);
                                            return {
                                                ...p,
                                                player: p,
                                                soldInfo,
                                                team: (allTeams || []).find(t => String(t.id || t._id) === String(soldInfo.teamId))
                                            };
                                        })
                                        .sort((a, b) => (b.soldInfo?.price || 0) - (a.soldInfo?.price || 0));

                                    const highestSalePlayer = allSoldPlayersList[0] || null;

                                    // 4. Role Pie / Donut Chart Data
                                    const pieData = [
                                        { name: "Batters", key: "batters", value: roleMetrics.batters.count, sold: roleMetrics.batters.sold, spent: roleMetrics.batters.spent, color: "#3B82F6", icon: batsmanIcon },
                                        { name: "Bowlers", key: "bowlers", value: roleMetrics.bowlers.count, sold: roleMetrics.bowlers.sold, spent: roleMetrics.bowlers.spent, color: "#EF4444", icon: bowlerIcon },
                                        { name: "All-Rounders", key: "allRounders", value: roleMetrics.allRounders.count, sold: roleMetrics.allRounders.sold, spent: roleMetrics.allRounders.spent, color: "#F59E0B", icon: allRounderIcon },
                                        { name: "Wicketkeepers", key: "wicketkeepers", value: roleMetrics.wicketkeepers.count, sold: roleMetrics.wicketkeepers.sold, spent: roleMetrics.wicketkeepers.spent, color: "#8B5CF6", icon: wicketkeeperIcon },
                                    ];

                                    const activePieData = pieData.map(d => ({
                                        ...d,
                                        chartVal: statsRoleMetric === "count"
                                            ? d.value
                                            : statsRoleMetric === "spent"
                                                ? d.spent
                                                : d.sold
                                    }));
                                    const hasActivePieData = activePieData.some(d => d.chartVal > 0);

                                    // 5. Valuation Tier Brackets Data
                                    const tierBrackets = [
                                        { tier: "elite", shortName: "Elite (≥1Cr)", label: "Elite Tier (≥ 1Cr)", min: 10000000, max: Infinity, color: "#FDB913", count: 0, spent: 0, avgPrice: 0, players: [] },
                                        { tier: "star", shortName: "Star (50L-1Cr)", label: "Star Tier (50L - 1Cr)", min: 5000000, max: 9999999, color: "#3B82F6", count: 0, spent: 0, avgPrice: 0, players: [] },
                                        { tier: "core", shortName: "Core (20L-50L)", label: "Core Tier (20L - 50L)", min: 2000000, max: 4999999, color: "#10B981", count: 0, spent: 0, avgPrice: 0, players: [] },
                                        { tier: "base", shortName: "Base (<20L)", label: "Base Tier (< 20L)", min: 0, max: 1999999, color: "#9CA3AF", count: 0, spent: 0, avgPrice: 0, players: [] },
                                    ];

                                    allSoldPlayersList.forEach(p => {
                                        const price = p.soldInfo?.price || 0;
                                        const bracket = tierBrackets.find(b => price >= b.min && price <= b.max) || tierBrackets[tierBrackets.length - 1];
                                        bracket.count++;
                                        bracket.spent += price;
                                        bracket.players.push(p.name || p.player?.name || "Player");
                                    });

                                    tierBrackets.forEach(b => {
                                        b.avgPrice = b.count > 0 ? Math.round(b.spent / b.count) : 0;
                                    });

                                    // Custom Tooltip for Pie Chart
                                    const renderCustomPieTooltip = ({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            const countPct = totalPoolPlayers > 0 ? Math.round((item.value / totalPoolPlayers) * 100) : 0;
                                            const clearancePct = item.value > 0 ? Math.round((item.sold / item.value) * 100) : 0;
                                            const spendPct = totalSpentAll > 0 ? Math.round((item.spent / totalSpentAll) * 100) : 0;
                                            const avgCostInRole = item.sold > 0 ? Math.round(item.spent / item.sold) : 0;

                                            return (
                                                <div className="backdrop-blur-xl bg-[#070D1E]/95 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-2 text-xs z-50 min-w-[200px]">
                                                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <span className="font-black text-white text-sm">{item.name}</span>
                                                    </div>
                                                    <div className="space-y-1 font-mono">
                                                        <div className="flex justify-between items-center text-gray-300">
                                                            <span>Total in Pool:</span>
                                                            <span className="font-extrabold text-white">{item.value} ({countPct}%)</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-emerald-400">
                                                            <span>Secured / Sold:</span>
                                                            <span className="font-extrabold">{item.sold} ({clearancePct}%)</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[#FDB913]">
                                                            <span>Total Spent:</span>
                                                            <span className="font-extrabold">{formatINR(item.spent)} ({spendPct}%)</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-blue-300">
                                                            <span>Avg Price:</span>
                                                            <span className="font-extrabold">{item.sold > 0 ? formatINR(avgCostInRole) : "—"}</span>
                                                        </div>
                                                        {roleMetrics[item.key]?.topPlayer && (
                                                            <div className="pt-1.5 border-t border-white/10 text-[11px] text-gray-400">
                                                                <span className="text-gray-500 block text-[10px]">Top Buy:</span>
                                                                <span className="text-white font-bold truncate block">{roleMetrics[item.key].topPlayer.name} ({formatINR(roleMetrics[item.key].topPlayer.price)})</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    };

                                    // Custom Tooltip for Bar Chart
                                    const renderCustomBarTooltip = ({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            const pctSpent = item.totalPurse > 0 ? Math.round((item.spent / item.totalPurse) * 100) : 0;
                                            return (
                                                <div className="backdrop-blur-xl bg-[#070D1E]/95 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-2 text-xs z-50 min-w-[210px]">
                                                    <div className="pb-1.5 border-b border-white/10">
                                                        <p className="font-black text-white text-sm truncate flex items-center gap-1.5">
                                                            <span>🛡️</span> {item.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-sans">{item.owner}</p>
                                                    </div>
                                                    <div className="space-y-1 font-mono">
                                                        <div className="flex justify-between items-center text-rose-400">
                                                            <span>Spent:</span>
                                                            <span className="font-extrabold">{formatINR(item.spent)} ({pctSpent}%)</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-emerald-400">
                                                            <span>Purse Left:</span>
                                                            <span className="font-extrabold">{formatINR(item.remaining)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-gray-300">
                                                            <span>Total Purse:</span>
                                                            <span className="font-bold">{formatINR(item.totalPurse)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-amber-300 pt-1 border-t border-white/10">
                                                            <span>Players Signed:</span>
                                                            <span className="font-extrabold">{item.squadCount}</span>
                                                        </div>
                                                        {item.topPlayer && (
                                                            <div className="pt-1 text-[11px] text-gray-400">
                                                                <span className="text-gray-500 block text-[10px]">Top Signing:</span>
                                                                <span className="text-white font-bold truncate block">{item.topPlayer.name} ({formatINR(item.topPlayer.price)})</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    };

                                    // Custom Tooltip for Valuation Tier Chart
                                    const renderCustomTierTooltip = ({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            const pctCount = totalSoldPlayers > 0 ? Math.round((item.count / totalSoldPlayers) * 100) : 0;
                                            const pctSpend = totalSpentAll > 0 ? Math.round((item.spent / totalSpentAll) * 100) : 0;
                                            return (
                                                <div className="backdrop-blur-xl bg-[#070D1E]/95 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-2 text-xs z-50 min-w-[190px]">
                                                    <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <span className="font-black text-white text-sm">{item.label}</span>
                                                    </div>
                                                    <div className="space-y-1 font-mono">
                                                        <div className="flex justify-between items-center text-gray-300">
                                                            <span>Players in Tier:</span>
                                                            <span className="font-extrabold text-white">{item.count} ({pctCount}%)</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[#FDB913]">
                                                            <span>Capital Committed:</span>
                                                            <span className="font-extrabold">{formatINR(item.spent)} ({pctSpend}%)</span>
                                                        </div>
                                                        {item.players.length > 0 && (
                                                            <div className="pt-1.5 border-t border-white/10">
                                                                <span className="text-gray-500 block text-[10px]">Notable Signings:</span>
                                                                <span className="text-gray-300 text-[11px] font-sans truncate block">{item.players.slice(0, 3).join(", ")}{item.players.length > 3 ? "..." : ""}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    };

                                    // Sort franchise bar data
                                    const sortedFranchiseData = [...franchiseData].sort((a, b) => {
                                        if (statsTeamSort === "spent-desc") return b.spent - a.spent;
                                        if (statsTeamSort === "purse-desc") return b.remaining - a.remaining;
                                        if (statsTeamSort === "squad-desc") return b.squadCount - a.squadCount;
                                        if (statsTeamSort === "name") return a.name.localeCompare(b.name);
                                        return b.spent - a.spent;
                                    });

                                    return (
                                        <div className="space-y-6">
                                            {/* Macro Tournament Pulse KPI Cards */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                                {/* 1. Capital Outflow */}
                                                <div className="backdrop-blur-xl bg-gradient-to-br from-[#121E42]/90 via-[#0B1530]/90 to-[#220c18]/90 border border-rose-500/20 rounded-2xl p-4 shadow-xl space-y-2 hover:border-rose-500/40 transition">
                                                    <div className="flex items-center justify-between text-gray-400">
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Capital Outflow</span>
                                                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                                                            <Flame size={14} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg sm:text-2xl font-black font-mono text-rose-400 tracking-tight">
                                                            {formatINR(totalSpentAll)}
                                                        </p>
                                                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mt-1">
                                                            <span className="text-rose-300 font-bold">{overallSpentPct}% Depleted</span>
                                                            <span className="text-gray-500">of {formatINR(totalPurseAll)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Pool Clearance */}
                                                <div className="backdrop-blur-xl bg-gradient-to-br from-[#121E42]/90 via-[#0B1530]/90 to-[#0e221d]/90 border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-2 hover:border-emerald-500/40 transition">
                                                    <div className="flex items-center justify-between text-gray-400">
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Pool Clearance</span>
                                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                            <Gavel size={14} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg sm:text-2xl font-black font-mono text-emerald-400 tracking-tight">
                                                            {totalSoldPlayers} <span className="text-xs sm:text-sm font-semibold text-gray-400 font-sans">/ {totalPoolPlayers} Sold</span>
                                                        </p>
                                                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mt-1">
                                                            <span className="text-emerald-300 font-bold">{clearanceRate}% Secured</span>
                                                            <span className="text-gray-500">{totalAvailablePlayers} Available</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 3. Avg Player Valuation */}
                                                <div className="backdrop-blur-xl bg-gradient-to-br from-[#121E42]/90 via-[#0B1530]/90 to-[#221c0e]/90 border border-[#FDB913]/20 rounded-2xl p-4 shadow-xl space-y-2 hover:border-[#FDB913]/40 transition">
                                                    <div className="flex items-center justify-between text-gray-400">
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Avg. Signing</span>
                                                        <div className="w-7 h-7 rounded-lg bg-[#FDB913]/10 border border-[#FDB913]/20 flex items-center justify-center text-[#FDB913]">
                                                            <Coins size={14} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg sm:text-2xl font-black font-mono text-[#FDB913] tracking-tight">
                                                            {formatINR(avgPlayerCost)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                                                            Per acquired player
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 4. War Chest Reserve */}
                                                <div className="backdrop-blur-xl bg-gradient-to-br from-[#121E42]/90 via-[#0B1530]/90 to-[#0e1d28]/90 border border-blue-500/20 rounded-2xl p-4 shadow-xl space-y-2 hover:border-blue-500/40 transition">
                                                    <div className="flex items-center justify-between text-gray-400">
                                                        <span className="text-[10px] font-black uppercase tracking-wider">War Chest Left</span>
                                                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                                            <Wallet size={14} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg sm:text-2xl font-black font-mono text-blue-300 tracking-tight">
                                                            {formatINR(totalRemainingAll)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                                                            Across {franchiseData.length} franchises
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tournament Record Hammer Banner (if any sales made) */}
                                            {highestSalePlayer && (
                                                <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/10 via-[#FDB913]/10 to-orange-500/10 border border-[#FDB913]/25 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[#FDB913]/20 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shrink-0 text-xl">
                                                            👑
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-[#FDB913] bg-[#FDB913]/10 px-2 py-0.5 rounded-full border border-[#FDB913]/20">
                                                                    Auction Record Hammer
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-mono">
                                                                    Role: {highestSalePlayer.role || "Talent"}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                                                                {highestSalePlayer.name}
                                                                <span className="text-gray-400 font-normal text-xs ml-2">
                                                                    acquired by <strong className="text-white font-bold">{highestSalePlayer.team ? highestSalePlayer.team.name : "Franchise"}</strong>
                                                                </span>
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <div className="sm:text-right shrink-0">
                                                        <span className="text-[10px] text-gray-400 font-mono uppercase block">Hammer Price</span>
                                                        <span className="text-base sm:text-xl font-black font-mono text-[#FDB913]">
                                                            {formatINR(highestSalePlayer.soldInfo.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dual Core Diagrams Grid */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                                {/* Diagram 1: Role Distribution & Composition Donut */}
                                                <div className="backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                                                    {/* Header with Metric Switcher */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.06]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-blue-500/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0">
                                                                <Activity size={15} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                                                                    Role & Squad Allocation
                                                                </h3>
                                                                <p className="text-[11px] text-gray-400 font-medium">
                                                                    Dynamic talent distribution & capital expenditure
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Toggle: Count vs Capital Spent vs Sold */}
                                                        <div className="flex items-center gap-1 bg-[#070D1E]/90 p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto">
                                                            {[
                                                                { id: "count", label: "By Pool Count" },
                                                                { id: "spent", label: "By Capital Spent" },
                                                                { id: "sold", label: "By Sold Players" },
                                                            ].map(m => (
                                                                <button
                                                                    key={m.id}
                                                                    type="button"
                                                                    onClick={() => setStatsRoleMetric(m.id)}
                                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${statsRoleMetric === m.id
                                                                            ? "bg-[#3B82F6] text-white font-black shadow-sm"
                                                                            : "text-gray-400 hover:text-white"
                                                                        }`}
                                                                >
                                                                    {m.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Donut Chart Container */}
                                                    <div className="h-60 sm:h-64 relative">
                                                        {hasActivePieData ? (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={activePieData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={62}
                                                                        outerRadius={90}
                                                                        paddingAngle={4}
                                                                        dataKey="chartVal"
                                                                    >
                                                                        {activePieData.map((entry, index) => (
                                                                            <Cell key={`role-pie-cell-${index}`} fill={entry.color} stroke="#0B1530" strokeWidth={2.5} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip content={renderCustomPieTooltip} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        ) : (
                                                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 text-xs">
                                                                <span className="font-bold text-gray-400">No data points logged for this metric yet.</span>
                                                                <span className="text-[11px] text-gray-500 mt-1">Switch to "By Pool Count" to inspect complete talent roster.</span>
                                                            </div>
                                                        )}

                                                        {/* Center Donut Ring Metric */}
                                                        {hasActivePieData && (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                                                                <span className="text-base sm:text-xl font-black text-white font-mono truncate max-w-[130px]">
                                                                    {statsRoleMetric === "count"
                                                                        ? `${totalPoolPlayers} Players`
                                                                        : statsRoleMetric === "spent"
                                                                            ? formatINR(totalSpentAll)
                                                                            : `${totalSoldPlayers} Sold`}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                                                    {statsRoleMetric === "count" ? "Total Pool" : statsRoleMetric === "spent" ? "Capital Out" : "Total Secured"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Role Detail Breakdown Cards */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/[0.06]">
                                                        {Object.entries(roleMetrics).map(([key, data]) => {
                                                            const countPct = totalPoolPlayers > 0 ? Math.round((data.count / totalPoolPlayers) * 100) : 0;
                                                            const clearancePct = data.count > 0 ? Math.round((data.sold / data.count) * 100) : 0;
                                                            return (
                                                                <div key={key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 space-y-1.5 hover:border-white/15 transition group">
                                                                    <div className="flex items-center justify-between gap-1.5">
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            {data.icon && (
                                                                                <img src={data.icon} alt={data.label} className="w-3.5 h-3.5 object-contain" />
                                                                            )}
                                                                            <span className="text-xs font-bold text-white truncate">{data.label}</span>
                                                                        </div>
                                                                        <span className="text-[10px] font-mono font-black shrink-0" style={{ color: data.color }}>
                                                                            {data.count} ({countPct}%)
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                                                        <span>Clearance: <strong className="text-emerald-400">{data.sold}/{data.count}</strong></span>
                                                                        <span className="text-gray-300 font-bold">{clearancePct}%</span>
                                                                    </div>

                                                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-500"
                                                                            style={{ width: `${clearancePct}%`, backgroundColor: data.color }}
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                                                                        <span className="text-gray-500">Capital Out:</span>
                                                                        <span className="text-white font-extrabold truncate max-w-[120px]">
                                                                            {formatINR(data.spent)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Diagram 2: Franchise Spending & Purse Health */}
                                                <div className="backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                                                    {/* Header with Sort and Mode Switcher */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                                                <Flame size={15} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                                                                    Franchise Point Spending Analytics
                                                                </h3>
                                                                <p className="text-[11px] text-gray-400 font-medium">
                                                                    Real-time capital utilization vs purse reserve
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Right Controls: Sort & Mode Switcher */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {/* Sort Selector */}
                                                            <div className="flex items-center gap-1 bg-[#070D1E]/90 p-1 rounded-xl border border-white/[0.08]">
                                                                {[
                                                                    { id: "spent-desc", label: "Spent" },
                                                                    { id: "purse-desc", label: "Purse" },
                                                                    { id: "squad-desc", label: "Squad" },
                                                                    { id: "name", label: "A-Z" }
                                                                ].map(s => (
                                                                    <button
                                                                        key={s.id}
                                                                        type="button"
                                                                        onClick={() => setStatsTeamSort(s.id)}
                                                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${statsTeamSort === s.id
                                                                                ? "bg-rose-500 text-white font-black shadow-sm"
                                                                                : "text-gray-400 hover:text-white"
                                                                            }`}
                                                                    >
                                                                        {s.label}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* View Mode Toggle: Stacked vs Grouped vs Ledger */}
                                                            <div className="flex items-center gap-1 bg-[#070D1E]/90 p-1 rounded-xl border border-white/[0.08]">
                                                                <button
                                                                    type="button"
                                                                    title="Stacked Bar View"
                                                                    onClick={() => setStatsChart2Mode("stacked")}
                                                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${statsChart2Mode === "stacked"
                                                                            ? "bg-[#2563EB] text-white shadow-sm"
                                                                            : "text-gray-400 hover:text-white"
                                                                        }`}
                                                                >
                                                                    <Layers size={11} /> Stacked
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Side-by-Side Grouped View"
                                                                    onClick={() => setStatsChart2Mode("grouped")}
                                                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${statsChart2Mode === "grouped"
                                                                            ? "bg-[#2563EB] text-white shadow-sm"
                                                                            : "text-gray-400 hover:text-white"
                                                                        }`}
                                                                >
                                                                    <BarChart3 size={11} /> Grouped
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Ledger List View (Best for Many Franchises)"
                                                                    onClick={() => setStatsChart2Mode("ledger")}
                                                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${statsChart2Mode === "ledger"
                                                                            ? "bg-[#2563EB] text-white shadow-sm"
                                                                            : "text-gray-400 hover:text-white"
                                                                        }`}
                                                                >
                                                                    <LayoutList size={11} /> Ledger
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Data Rendering */}
                                                    {(() => {
                                                        const isManyTeams = sortedFranchiseData.length > 6;
                                                        const dynamicChartWidth = Math.max(100, sortedFranchiseData.length * 75);

                                                        if (sortedFranchiseData.length === 0) {
                                                            return (
                                                                <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500 text-xs">
                                                                    <Trophy size={28} className="text-gray-600 mb-2" />
                                                                    <span>No franchises registered in this auction.</span>
                                                                </div>
                                                            );
                                                        }

                                                        if (statsChart2Mode === "ledger") {
                                                            {/* Broadcast Ledger Mode */ }
                                                            return (
                                                                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                                                                    {sortedFranchiseData.map((team, idx) => {
                                                                        const pctSpent = team.totalPurse > 0 ? Math.round((team.spent / team.totalPurse) * 100) : 0;
                                                                        const pctRemaining = Math.max(0, 100 - pctSpent);
                                                                        return (
                                                                            <div
                                                                                key={team.name + idx}
                                                                                onClick={() => {
                                                                                    const match = allTeams.find(t => t.name === team.name || String(t.id || t._id) === String(team.id));
                                                                                    if (match) {
                                                                                        setSelectedTeam(match);
                                                                                        setTeamRosterFilter(String(match.id || match._id));
                                                                                        setActiveSubView("team-page");
                                                                                    }
                                                                                }}
                                                                                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#3B82F6]/40 rounded-2xl p-3 space-y-2 transition cursor-pointer group"
                                                                            >
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                                        <span className="w-5 h-5 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center font-mono font-bold text-[10px] text-gray-400">
                                                                                            #{idx + 1}
                                                                                        </span>
                                                                                        {team.logo ? (
                                                                                            <img src={team.logo} alt="" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                                                                                        ) : (
                                                                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[10px] font-bold text-blue-300">
                                                                                                {team.name.charAt(0)}
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="min-w-0">
                                                                                            <p className="font-extrabold text-white text-xs truncate group-hover:text-[#FDB913] transition-colors">
                                                                                                {team.name}
                                                                                            </p>
                                                                                            <p className="text-[10px] text-gray-400 truncate">
                                                                                                {team.owner}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right shrink-0 flex items-center gap-2">
                                                                                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                                                                                            {team.squadCount} Squad
                                                                                        </span>
                                                                                        <ArrowRight size={12} className="text-gray-500 group-hover:text-white transition-colors" />
                                                                                    </div>
                                                                                </div>

                                                                                {/* Dual Stacked Progress Bar */}
                                                                                <div className="space-y-1">
                                                                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex">
                                                                                        <div
                                                                                            className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-500"
                                                                                            style={{ width: `${pctSpent}%` }}
                                                                                            title={`Spent: ${pctSpent}%`}
                                                                                        />
                                                                                        <div
                                                                                            className="h-full bg-emerald-500 transition-all duration-500"
                                                                                            style={{ width: `${pctRemaining}%` }}
                                                                                            title={`Purse Left: ${pctRemaining}%`}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                                                                        <span className="text-rose-400 font-bold">
                                                                                            Spent: {formatINR(team.spent)} ({pctSpent}%)
                                                                                        </span>
                                                                                        <span className="text-emerald-400 font-bold">
                                                                                            Purse: {formatINR(team.remaining)} ({pctRemaining}%)
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        }

                                                        {/* Bar Chart Mode (Stacked or Grouped) */ }
                                                        return (
                                                            <div className="space-y-1.5">
                                                                {isManyTeams && (
                                                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-1">
                                                                        <span>⇄ Scroll horizontally to inspect all {sortedFranchiseData.length} teams</span>
                                                                        <span className="text-gray-500">Tip: Click "Ledger" for table view</span>
                                                                    </div>
                                                                )}

                                                                <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                                                    <div
                                                                        style={{
                                                                            minWidth: isManyTeams ? `${dynamicChartWidth}px` : "100%",
                                                                            height: "270px"
                                                                        }}
                                                                    >
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <BarChart
                                                                                data={sortedFranchiseData}
                                                                                margin={{ top: 12, right: 15, left: -10, bottom: 35 }}
                                                                            >
                                                                                <defs>
                                                                                    <linearGradient id="barSpentGrad" x1="0" y1="0" x2="0" y2="1">
                                                                                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.95} />
                                                                                        <stop offset="100%" stopColor="#FB7185" stopOpacity={0.65} />
                                                                                    </linearGradient>
                                                                                    <linearGradient id="barPurseGrad" x1="0" y1="0" x2="0" y2="1">
                                                                                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                                                                                        <stop offset="100%" stopColor="#059669" stopOpacity={0.65} />
                                                                                    </linearGradient>
                                                                                </defs>
                                                                                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                                                                                <XAxis
                                                                                    dataKey="displayName"
                                                                                    stroke="#9CA3AF"
                                                                                    fontSize={10}
                                                                                    tickLine={false}
                                                                                    interval={0}
                                                                                    angle={-30}
                                                                                    textAnchor="end"
                                                                                    height={40}
                                                                                />
                                                                                <YAxis
                                                                                    stroke="#9CA3AF"
                                                                                    fontSize={10}
                                                                                    tickLine={false}
                                                                                    axisLine={false}
                                                                                    tickFormatter={(v) => v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                                                                />
                                                                                <Tooltip content={renderCustomBarTooltip} />
                                                                                <Bar
                                                                                    dataKey="spent"
                                                                                    name="Spent"
                                                                                    fill="url(#barSpentGrad)"
                                                                                    stackId={statsChart2Mode === "stacked" ? "purse" : undefined}
                                                                                    radius={statsChart2Mode === "stacked" ? [0, 0, 4, 4] : [6, 6, 0, 0]}
                                                                                    maxBarSize={statsChart2Mode === "stacked" ? 36 : 24}
                                                                                />
                                                                                <Bar
                                                                                    dataKey="remaining"
                                                                                    name="Purse Left"
                                                                                    fill="url(#barPurseGrad)"
                                                                                    stackId={statsChart2Mode === "stacked" ? "purse" : undefined}
                                                                                    radius={[6, 6, 0, 0]}
                                                                                    maxBarSize={statsChart2Mode === "stacked" ? 36 : 24}
                                                                                />
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Footer Summary Strip */}
                                                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-3 text-[11px] font-mono">
                                                            <span className="flex items-center gap-1 text-rose-400 font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-rose-500" /> Spent
                                                            </span>
                                                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Purse Left
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-gray-400 font-mono">
                                                            Purse Pool: <strong className="text-emerald-400">{formatINR(totalPurseAll)}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Diagram 3: Valuation Tier & Spending Density AreaChart + Top Live Signings */}
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                                {/* Left: Valuation Tier & Spending Density AreaChart (7 cols) */}
                                                <div className="lg:col-span-7 backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                                                    {/* Card Header */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FDB913]/20 to-amber-500/10 border border-[#FDB913]/30 flex items-center justify-center text-[#FDB913] shrink-0">
                                                                <Target size={15} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                                                                    Auction Valuation & Spending Brackets
                                                                </h3>
                                                                <p className="text-[11px] text-gray-400 font-medium">
                                                                    Capital distribution across price tiers
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Metric Toggle */}
                                                        <div className="flex items-center gap-1 bg-[#070D1E]/90 p-1 rounded-xl border border-white/[0.08]">
                                                            {[
                                                                { id: "spent", label: "Capital Deployed" },
                                                                { id: "count", label: "Players Signed" }
                                                            ].map(m => (
                                                                <button
                                                                    key={m.id}
                                                                    type="button"
                                                                    onClick={() => setStatsTierMetric(m.id)}
                                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${statsTierMetric === m.id
                                                                            ? "bg-[#FDB913] text-[#0A1020] font-black shadow-sm"
                                                                            : "text-gray-400 hover:text-white"
                                                                        }`}
                                                                >
                                                                    {m.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* AreaChart Diagram */}
                                                    <div className="h-56 sm:h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart
                                                                data={tierBrackets}
                                                                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                                                            >
                                                                <defs>
                                                                    <linearGradient id="tierGrad" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#FDB913" stopOpacity={0.4} />
                                                                        <stop offset="95%" stopColor="#FDB913" stopOpacity={0.0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                                                                <XAxis
                                                                    dataKey="shortName"
                                                                    stroke="#9CA3AF"
                                                                    fontSize={11}
                                                                    tickLine={false}
                                                                />
                                                                <YAxis
                                                                    stroke="#9CA3AF"
                                                                    fontSize={10}
                                                                    tickLine={false}
                                                                    axisLine={false}
                                                                    tickFormatter={(v) => {
                                                                        if (statsTierMetric === "spent") {
                                                                            return v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v;
                                                                        }
                                                                        return `${v}`;
                                                                    }}
                                                                />
                                                                <Tooltip content={renderCustomTierTooltip} />
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey={statsTierMetric}
                                                                    stroke="#FDB913"
                                                                    strokeWidth={3}
                                                                    fillOpacity={1}
                                                                    fill="url(#tierGrad)"
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>

                                                    {/* Tier Stat Cards */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
                                                        {tierBrackets.map((tier) => (
                                                            <div
                                                                key={tier.tier}
                                                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 space-y-1 hover:border-[#FDB913]/30 transition"
                                                            >
                                                                <div className="flex items-center justify-between text-[10px]">
                                                                    <span className="font-extrabold uppercase tracking-wider" style={{ color: tier.color }}>
                                                                        {tier.shortName}
                                                                    </span>
                                                                    <span className="font-mono text-gray-400">
                                                                        {tier.count} sold
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs font-black font-mono text-white truncate">
                                                                    {formatINR(tier.spent)}
                                                                </div>
                                                                <div className="text-[9px] text-gray-400 font-mono">
                                                                    Avg: {tier.count > 0 ? formatINR(tier.avgPrice) : "₹0"}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Right: Top Live Signings Leaderboard (5 cols) */}
                                                <div className="lg:col-span-5 backdrop-blur-xl bg-[#0B1530]/95 border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                                                    {/* Card Header */}
                                                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                                                <Crown size={15} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                                                                    Top Live Signings
                                                                </h3>
                                                                <p className="text-[11px] text-gray-400 font-medium">
                                                                    Highest hammer bids recorded
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-[#FDB913] bg-[#FDB913]/10 px-2 py-0.5 rounded-full border border-[#FDB913]/20 font-bold">
                                                            {allSoldPlayersList.length} Total
                                                        </span>
                                                    </div>

                                                    {/* Sold Players Mini Leaderboard */}
                                                    <div className="space-y-2 flex-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                                                        {allSoldPlayersList.length === 0 ? (
                                                            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-4 text-gray-500 text-xs">
                                                                <Gavel size={26} className="text-gray-600 mb-2" />
                                                                <span className="font-bold text-gray-400">No players acquired yet.</span>
                                                                <span className="text-[10px] text-gray-500 mt-1">Live signings will appear here immediately once hammered sold.</span>
                                                            </div>
                                                        ) : (
                                                            allSoldPlayersList.slice(0, 5).map((item, idx) => {
                                                                const pObj = item.player || item;
                                                                const pId = pObj.id || pObj._id || idx;
                                                                const pName = pObj.name || item.name || "Player";
                                                                const pImage = pObj.image || item.image;
                                                                const pRole = pObj.role || item.role || "Talent";
                                                                const tName = item.team ? item.team.name : "Franchise";
                                                                const pPrice = item.soldInfo?.price || 0;

                                                                const rankColors = [
                                                                    "from-amber-400 to-yellow-500 text-black font-black",
                                                                    "from-slate-300 to-gray-400 text-black font-black",
                                                                    "from-amber-700 to-amber-800 text-white font-black",
                                                                    "bg-white/10 text-gray-300 font-bold",
                                                                    "bg-white/10 text-gray-300 font-bold"
                                                                ];
                                                                return (
                                                                    <div
                                                                        key={pId}
                                                                        onClick={() => {
                                                                            setSelectedPlayerModal(pObj);
                                                                            setIsModalOpen(true);
                                                                        }}
                                                                        className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#FDB913]/40 rounded-2xl p-2.5 flex items-center justify-between gap-3 transition cursor-pointer group"
                                                                    >
                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono shrink-0 ${idx < 3 ? `bg-gradient-to-br ${rankColors[idx]} shadow-sm` : rankColors[idx]}`}>
                                                                                #{idx + 1}
                                                                            </span>
                                                                            {pImage ? (
                                                                                <img
                                                                                    src={pImage}
                                                                                    alt={pName}
                                                                                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                                                                                    {pName.charAt(0) || "P"}
                                                                                </div>
                                                                            )}
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-extrabold text-white truncate group-hover:text-[#FDB913] transition-colors">
                                                                                    {pName}
                                                                                </p>
                                                                                <p className="text-[10px] text-gray-400 truncate">
                                                                                    {tName} • {pRole}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right shrink-0">
                                                                            <span className="text-xs font-black font-mono text-[#FDB913] block">
                                                                                {formatINR(pPrice)}
                                                                            </span>
                                                                            <span className="text-[9px] text-gray-400 font-mono">
                                                                                {pPrice >= 10000000 ? `${(pPrice / 10000000).toFixed(2)} Cr` : formatINR(pPrice)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>

                                                    {/* Footer Info */}
                                                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400 font-mono">
                                                        <span>Clearance: <strong className="text-white font-bold">{totalSoldPlayers}/{totalPoolPlayers}</strong></span>
                                                        <span>Total Capital: <strong className="text-emerald-400 font-bold">{formatINR(totalSpentAll)}</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </main>

                    {/* Timeline Commentary Ticker bar */}
                    <footer className="border-t border-white/[0.06] bg-[#0A1020]/95 px-3 sm:px-6 py-2 shrink-0 z-20">
                        <div className="max-w-[1750px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400 shrink-0">
                                <Flame size={13} className="text-[#F97316]" /> Realtime Commentary:
                            </div>

                            <div className="flex-1 overflow-x-auto whitespace-nowrap flex items-center gap-3 sm:gap-5 text-xs text-gray-300 scrollbar-none w-full">
                                {bidHistory.length === 0 ? (
                                    <span className="text-gray-500 italic text-[10px] sm:text-[11px]">No bids logged in this round. Commentary ticker idle...</span>
                                ) : (
                                    bidHistory.map((log, index) => (
                                        <div
                                            key={index}
                                            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border bg-white/[0.02] border-white/10 text-gray-300 text-[11px] sm:text-xs shrink-0"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913]" />
                                            <span className="font-extrabold text-white">{log.teamName}</span>
                                            <span>bid</span>
                                            <span className="text-[#FDB913] font-mono font-bold">{formatINR(log.amount)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </footer>
                </div>
            </div>

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

            {/* ── PLAYER PURCHASED CELEBRATION MODAL (TEAM OWNER EXPERIENCE) ── */}
            {purchasedCelebration && (
                <PlayerPurchasedModal
                    data={purchasedCelebration}
                    onClose={() => setPurchasedCelebration(null)}
                    onViewSquad={() => {
                        setActiveSubView("team-page");
                        const currentTeam = myTeamRef.current || myTeam;
                        if (currentTeam) {
                            setSelectedTeam(currentTeam);
                            setTeamRosterFilter(String(currentTeam.id || currentTeam._id));
                        }
                    }}
                    formatINR={formatINR}
                    durationMs={purchasedCelebration.wasBoughtByMe ? 10000 : 5000}
                />
            )}
        </div>
    );
};

export default LiveAuction;
