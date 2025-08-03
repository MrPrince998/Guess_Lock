const express = require("express");
const router = express.Router();
const {
  optionalAuthMiddleware,
  authMiddleware,
  gameAccessMiddleware,
  playerAccessMiddleware,
} = require("../middleware/auth");
const {
  filterGameData,
  filterPlayerData,
} = require("../middleware/dataFilter");
const {
  createGame,
  getGames,
  getGameById,
  joinGameById,
  joinGameByCode,
  setSecretNumber,
  makeGuess,
  getPlayerGuesses,
  getGameStats,
} = require("../controllers/gameControllerRedis");

// Public routes (no authentication required)
router.get("/", optionalAuthMiddleware, filterGameData, getGames); // Filter sensitive data in game list
router.get("/stats", getGameStats); // Anyone can see general stats

// Routes with optional authentication
router.post("/", optionalAuthMiddleware, createGame); // Can create game with or without auth
router.post("/join-by-code", optionalAuthMiddleware, joinGameByCode); // Can join with or without auth

// Game-specific routes with access control
router.get(
  "/:gameId",
  optionalAuthMiddleware,
  gameAccessMiddleware,
  filterGameData,
  getGameById
);

router.post("/:gameId/join", optionalAuthMiddleware, joinGameById);

// Player-specific routes (require authentication and ownership)
router.post(
  "/:gameId/players/:playerId/secret",
  authMiddleware,
  playerAccessMiddleware,
  setSecretNumber
);

router.post(
  "/:gameId/players/:playerId/guess",
  authMiddleware,
  playerAccessMiddleware,
  makeGuess
);

router.get(
  "/:gameId/players/:playerId/guesses",
  authMiddleware,
  playerAccessMiddleware,
  filterPlayerData,
  getPlayerGuesses
);

module.exports = router;
