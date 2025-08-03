const crypto = require("crypto");
const { validateNumber } = require("../helpers/validators");
const { compareNumbers } = require("../helpers/compare");
const { client } = require("../config/redis");

// Helper functions
const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const generateId = () => {
  return crypto.randomBytes(16).toString("hex");
};

const findGameByCode = async (code) => {
  try {
    const gameKeys = await client.keys('game:*');
    for (const key of gameKeys) {
      const gameData = await client.hGetAll(key);
      if (gameData.code === code.toUpperCase()) {
        return { 
          gameId: gameData.id, 
          game: {
            ...gameData,
            players: JSON.parse(gameData.players || '[]'),
            guesses: JSON.parse(gameData.guesses || '[]')
          }
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding game by code:', error);
    return null;
  }
};

const getGameStatus = (game) => {
  if (game.winner) return "finished";
  if (game.currentTurn) return "playing";

  const playersReady = game.players.filter((p) => p.hasSecretNumber).length;
  if (playersReady === game.players.length && game.players.length === 2) {
    return "ready";
  }
  return "waiting";
};

// Controllers
const createGame = async (req, res) => {
  try {
    const { hostName } = req.body;

    // Validation
    if (
      !hostName ||
      typeof hostName !== "string" ||
      hostName.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Host name is required and must be a non-empty string",
      });
    }

    if (hostName.length > 20) {
      return res.status(400).json({
        success: false,
        error: "Host name must be 20 characters or less",
      });
    }

    const gameId = `game_${generateId()}`;
    const playerId = `player_${generateId()}`;
    const gameCode = generateGameCode();

    const hostPlayer = {
      id: playerId,
      name: hostName.trim(),
      isHost: true,
      hasSecretNumber: false,
      secretNumber: null,
      guesses: [],
      score: 0,
    };

    const game = {
      id: gameId,
      code: gameCode,
      host: playerId,
      players: [hostPlayer],
      status: "waiting",
      currentTurn: null,
      winner: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store game in Redis
    await client.hSet(`game:${gameId}`, {
      ...game,
      players: JSON.stringify(game.players),
      guesses: JSON.stringify([])
    });

    // Store player in Redis
    await client.hSet(`player:${playerId}`, {
      ...hostPlayer,
      gameId,
      guesses: JSON.stringify(hostPlayer.guesses)
    });

    res.status(201).json({
      success: true,
      message: "Game created successfully",
      data: {
        game: {
          ...game,
          status: getGameStatus(game),
        },
        playerId,
      },
    });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const joinGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerName } = req.body;

    // Validation
    if (
      !playerName ||
      typeof playerName !== "string" ||
      playerName.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Player name is required and must be a non-empty string",
      });
    }

    if (playerName.length > 20) {
      return res.status(400).json({
        success: false,
        error: "Player name must be 20 characters or less",
      });
    }

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    // Check if game is joinable
    if (game.players.length >= 2) {
      return res.status(409).json({
        success: false,
        error: "Game is full",
      });
    }

    if (getGameStatus(game) !== "waiting") {
      return res.status(409).json({
        success: false,
        error: "Game has already started",
      });
    }

    // Check if player name already exists in game
    if (game.players.some((p) => p.name === playerName.trim())) {
      return res.status(409).json({
        success: false,
        error: "Player name already exists in this game",
      });
    }

    const playerId = `player_${generateId()}`;
    const newPlayer = {
      id: playerId,
      name: playerName.trim(),
      isHost: false,
      hasSecretNumber: false,
      secretNumber: null,
      guesses: [],
      score: 0,
    };

    game.players.push(newPlayer);
    game.updatedAt = new Date();

    players.set(playerId, { ...newPlayer, gameId });

    res.json({
      success: true,
      message: "Successfully joined the game",
      data: {
        game: {
          ...game,
          status: getGameStatus(game),
        },
        playerId,
      },
    });
  } catch (error) {
    console.error("Error joining game by ID:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const joinGameByCode = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerName } = req.body;

    // Validation
    if (
      !playerName ||
      typeof playerName !== "string" ||
      playerName.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Player name is required and must be a non-empty string",
      });
    }

    if (playerName.length > 20) {
      return res.status(400).json({
        success: false,
        error: "Player name must be 20 characters or less",
      });
    }

    const result = findGameByCode(gameCode);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    const { gameId, game } = result;

    // Check if game is joinable
    if (game.players.length >= 2) {
      return res.status(409).json({
        success: false,
        error: "Game is full",
      });
    }

    if (getGameStatus(game) !== "waiting") {
      return res.status(409).json({
        success: false,
        error: "Game has already started",
      });
    }

    // Check if player name already exists in game
    if (game.players.some((p) => p.name === playerName.trim())) {
      return res.status(409).json({
        success: false,
        error: "Player name already exists in this game",
      });
    }

    const playerId = `player_${generateId()}`;
    const newPlayer = {
      id: playerId,
      name: playerName.trim(),
      isHost: false,
      hasSecretNumber: false,
      secretNumber: null,
      guesses: [],
      score: 0,
    };

    game.players.push(newPlayer);
    game.updatedAt = new Date();

    players.set(playerId, { ...newPlayer, gameId });

    res.json({
      success: true,
      message: "Successfully joined the game",
      data: {
        game: {
          ...game,
          status: getGameStatus(game),
        },
        playerId,
      },
    });
  } catch (error) {
    console.error("Error joining game by code:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const getGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    res.json({
      success: true,
      data: {
        game: {
          ...game,
          status: getGameStatus(game),
        },
      },
    });
  } catch (error) {
    console.error("Error getting game:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const getGames = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    let gamesList = Array.from(games.values());

    // Filter by status if provided
    if (status) {
      gamesList = gamesList.filter((game) => getGameStatus(game) === status);
    }

    // Sort by creation date (newest first)
    gamesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = gamesList.length;
    const paginatedGames = gamesList.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    // Add status to each game
    const gamesWithStatus = paginatedGames.map((game) => ({
      ...game,
      status: getGameStatus(game),
    }));

    res.json({
      success: true,
      data: {
        games: gamesWithStatus,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error getting games:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const deleteGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.query;

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    // Check if player is the host
    if (game.host !== playerId) {
      return res.status(403).json({
        success: false,
        error: "Only the host can delete the game",
      });
    }

    // Remove all players from players map
    game.players.forEach((player) => {
      players.delete(player.id);
    });

    // Remove game
    games.delete(gameId);

    res.json({
      success: true,
      message: "Game deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting game:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const setSecretNumber = async (req, res) => {
  try {
    const { gameId, playerId } = req.params;
    const { secretNumber } = req.body;

    // Validation
    if (!secretNumber || typeof secretNumber !== "string") {
      return res.status(400).json({
        success: false,
        error: "Secret number is required",
      });
    }

    if (!validateNumber(secretNumber)) {
      return res.status(400).json({
        success: false,
        error: "Secret number must be 4 unique digits",
      });
    }

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Player not found in this game",
      });
    }

    const player = game.players[playerIndex];

    if (player.hasSecretNumber) {
      return res.status(409).json({
        success: false,
        error: "Secret number already set",
      });
    }

    if (getGameStatus(game) !== "waiting") {
      return res.status(409).json({
        success: false,
        error: "Cannot set secret number after game has started",
      });
    }

    // Set secret number
    player.secretNumber = secretNumber;
    player.hasSecretNumber = true;
    game.updatedAt = new Date();

    // Update player in players map
    const playerData = players.get(playerId);
    if (playerData) {
      playerData.secretNumber = secretNumber;
      playerData.hasSecretNumber = true;
    }

    // Check if game can start (both players have secret numbers)
    const playersReady = game.players.filter((p) => p.hasSecretNumber).length;
    if (playersReady === 2) {
      // Start the game - randomly choose who goes first
      const randomPlayerIndex = Math.floor(Math.random() * game.players.length);
      game.currentTurn = game.players[randomPlayerIndex].id;
    }

    res.json({
      success: true,
      message: "Secret number set successfully",
      data: {
        game: {
          ...game,
          status: getGameStatus(game),
        },
      },
    });
  } catch (error) {
    console.error("Error setting secret number:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const makeGuess = async (req, res) => {
  try {
    const { gameId, playerId } = req.params;
    const { guess } = req.body;

    // Validation
    if (!guess || typeof guess !== "string") {
      return res.status(400).json({
        success: false,
        error: "Guess is required",
      });
    }

    if (!validateNumber(guess)) {
      return res.status(400).json({
        success: false,
        error: "Guess must be 4 unique digits",
      });
    }

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Player not found in this game",
      });
    }

    const currentGameStatus = getGameStatus(game);
    if (currentGameStatus !== "playing") {
      return res.status(409).json({
        success: false,
        error: "Game is not in playing status",
      });
    }

    if (game.currentTurn !== playerId) {
      return res.status(400).json({
        success: false,
        error: "Not your turn",
      });
    }

    const player = game.players[playerIndex];
    const opponent = game.players.find((p) => p.id !== playerId);

    if (!opponent || !opponent.secretNumber) {
      return res.status(400).json({
        success: false,
        error: "Opponent has not set secret number",
      });
    }

    // Compare guess with opponent's secret number
    const result = compareNumbers(opponent.secretNumber, guess);
    const isCorrect = result.correctPosition === 4;

    const guessData = {
      id: `guess_${generateId()}`,
      number: guess,
      result: {
        bulls: result.correctPosition,
        cows: result.correctDigit,
        isCorrect,
      },
      timestamp: new Date(),
    };

    // Add guess to player's guesses
    player.guesses.push(guessData);
    player.score = player.guesses.length;
    game.updatedAt = new Date();

    // Update player in players map
    const playerData = players.get(playerId);
    if (playerData) {
      playerData.guesses.push(guessData);
      playerData.score = player.score;
    }

    if (isCorrect) {
      // Game over - player wins
      game.winner = playerId;
      game.currentTurn = null;
    } else {
      // Switch turns
      game.currentTurn = opponent.id;
    }

    res.json({
      success: true,
      message: isCorrect ? "Congratulations! You won!" : "Guess processed",
      data: {
        guess: guessData,
        game: {
          ...game,
          status: getGameStatus(game),
        },
      },
    });
  } catch (error) {
    console.error("Error making guess:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const getGameStats = async (req, res) => {
  try {
    const stats = {
      totalGames: games.size,
      waitingGames: 0,
      playingGames: 0,
      finishedGames: 0,
      totalPlayers: players.size,
    };

    for (const game of games.values()) {
      const status = getGameStatus(game);
      switch (status) {
        case "waiting":
          stats.waitingGames++;
          break;
        case "playing":
          stats.playingGames++;
          break;
        case "finished":
          stats.finishedGames++;
          break;
      }
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting game stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

module.exports = {
  createGame,
  joinGameById,
  joinGameByCode,
  getGame,
  getGames,
  setSecretNumber,
  makeGuess,
  deleteGame,
  getGameStats,
};
