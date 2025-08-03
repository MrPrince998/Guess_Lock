const jwt = require("jsonwebtoken");
const mariadb = require("../config/mariadb");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user exists
    const user = await mariadb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
      });
    }

    // Attach user info to request
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Optional middleware - doesn't require authentication but adds user info if token is provided
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user exists
    const user = await mariadb.getUserById(decoded.userId);

    if (user) {
      req.user = { userId: decoded.userId };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    req.user = null;
    next();
  }
};

// Middleware to check if user owns or is part of the game
const gameAccessMiddleware = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const userId = req.user?.userId;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: "Game ID is required",
      });
    }

    // Get game details
    const game = await mariadb.getGame(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // If user is not authenticated, allow access to public game info only
    if (!userId) {
      req.game = game;
      req.hasGameAccess = false;
      return next();
    }

    // Check if user is part of this game
    const userInGame = game.players.some((player) => player.user_id === userId);

    if (!userInGame) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this game",
      });
    }

    req.game = game;
    req.hasGameAccess = true;
    next();
  } catch (error) {
    console.error("Game access middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Middleware to check if user owns the player
const playerAccessMiddleware = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const userId = req.user?.userId;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: "Player ID is required",
      });
    }

    // Get player details
    const player = await mariadb.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // If user is not authenticated and trying to access player-specific data
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to access player data",
      });
    }

    // Check if user owns this player
    if (player.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this player",
      });
    }

    req.player = player;
    next();
  } catch (error) {
    console.error("Player access middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  gameAccessMiddleware,
  playerAccessMiddleware,
};
