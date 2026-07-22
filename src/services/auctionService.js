import api from "./api";

/**
 * Create a new auction session for a tournament
 * @param {Object} data - { tournamentId }
 */
export const createAuction = async (data) => {
    const res = await api.post("/auctions", data);
    return res.data.data;
};

/**
 * Start an auction session
 * @param {Object} data - { auctionId }
 */
export const startAuction = async (data) => {
    const res = await api.post("/auctions/start", data);
    return res.data.data;
};

/**
 * End an auction session
 * @param {Object} data - { auctionId }
 */
export const endAuction = async (data) => {
    const res = await api.post("/auctions/end", data);
    return res.data.data;
};

/**
 * Get all auctions
 */
export const getAuctions = async () => {
    const res = await api.get("/auctions");
    return res.data.data;
};

/**
 * Start bidding on a specific player in a tournament
 * @param {Object} data - { tournamentId, playerId, durationSeconds }
 */
export const startPlayerAuction = async (data) => {
    const res = await api.post("/auctions/player/start", data);
    return res.data.data;
};

/**
 * Pause the active player countdown timer
 * @param {Object} data - { tournamentId }
 */
export const pausePlayerAuction = async (data) => {
    const res = await api.post("/auctions/player/pause", data);
    return res.data.data;
};

/**
 * Resume the active player countdown timer
 * @param {Object} data - { tournamentId }
 */
export const resumePlayerAuction = async (data) => {
    const res = await api.post("/auctions/player/resume", data);
    return res.data.data;
};

/**
 * Manually sell the active player to the highest bidder
 * @param {Object} data - { tournamentId }
 */
export const sellPlayerAuction = async (data) => {
    const res = await api.post("/auctions/player/sell", data);
    return res.data;
};

/**
 * Manually mark the active player as unsold
 * @param {Object} data - { tournamentId }
 */
export const unsoldPlayerAuction = async (data) => {
    const res = await api.post("/auctions/player/unsold", data);
    return res.data;
};

/**
 * Get the live real-time auction state for a tournament
 * @param {string} tournamentId
 */
export const getAuctionState = async (tournamentId) => {
    const res = await api.get(`/auctions/state/${tournamentId}`);
    return res.data.data;
};

/**
 * Get the database auction session details by tournament ID
 * @param {string} tournamentId
 */
export const getAuctionByTournamentId = async (tournamentId) => {
    const res = await api.get(`/auctions/tournament/${tournamentId}`);
    return res.data.data;
};

/**
 * Place a bid on the active player
 * @param {Object} data - { playerId, amount }
 */
export const placeBid = async (data) => {
    const res = await api.post("/bids/place", data);
    return res.data.data;
};

/**
 * Get chronological bid logs for a tournament
 * @param {string} tournamentId
 */
export const getAuctionBidHistory = async (tournamentId) => {
    const res = await api.get(`/bids/tournament/${tournamentId}`);
    return res.data.data;
};

/**
 * Get aggregated auction stats for a tournament
 * @param {string} tournamentId
 */
export const getAuctionStats = async (tournamentId) => {
    const res = await api.get(`/auctions/tournament/${tournamentId}/stats`);
    return res.data.data;
};

