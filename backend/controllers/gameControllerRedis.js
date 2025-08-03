const crypto = require("crypto");
const { validateNumber } = require("../helpers/validators");
const { compareNumbers } = require("../helpers/compare");
const mariadb = require("../config/mariadb");
const { updateStats } = require("./authController");

// Helper functions
const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const generateId = () => {
  return crypto.randomBytes(16).toString("hex");
};

const getGameStatus = (game) => {
  if (game.winner) return "finished";
  if (game.current_turn) return "playing";

  const playersReady = game.players.filter((p) => p.has_secret_number).length;
  if (playersReady === game.players.length && game.players.length === 2) {
    return "ready";
  }
  return "waiting";
};

// Controllers
const createGame = async (req, res) => {
  try {
    const { hostName } = req.body;
    const userId = req.user?.userId; // Optional user ID from JWT

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

    const game = {
      id: gameId,
      code: gameCode,
      host: playerId,
      status: "waiting",
      currentTurn: null,
      winner: null,
    };

    const hostPlayer = {
      id: playerId,
      gameId: gameId,
      userId: userId || null,
      name: hostName.trim(),
      isHost: true,
      hasSecretNumber: false,
      secretNumber: null,
      score: 0,
    };

    // Save to MariaDB
    await mariadb.createGame(game);
    await mariadb.createPlayer(hostPlayer);

    // Get the complete game with players
    const completeGame = await mariadb.getGame(gameId);

    res.status(201).json({
      success: true,
      message: "Game created successfully",
      data: {
        game: {
          ...completeGame,
          status: getGameStatus(completeGame),
        },
        playerId,
      },
    });
  } catch (error) {
    console.error("Create game error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create game",
    });
  }
};

const getGames = async (req, res) => {
  try {
    const gamesMap = await mariadb.getAllGames();
    const games = Array.from(gamesMap.values()).map((game) => ({
      ...game,
      status: getGameStatus(game),
    }));

    res.status(200).json({
      success: true,
      data: {
        games,
        total: games.length,
      },
    });
  } catch (error) {
    console.error("Get games error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve games",
    });
  }
};

const getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await mariadb.getGame(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        game: {
          ...game,
          status: getGameStatus(game),
        },
      },
    });
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve game",
    });
  }
};

const joinGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerName } = req.body;
    const userId = req.user?.userId;

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

    const game = await mariadb.getGame(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    if (game.players.length >= 2) {
      return res.status(400).json({
        success: false,
        error: "Game is full",
      });
    }

    if (game.status === "finished") {
      return res.status(400).json({
        success: false,
        error: "Game has already ended",
      });
    }

    // Check if player name is already taken in this game
    const existingPlayer = game.players.find(
      (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
    );

    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        error: "Player name is already taken in this game",
      });
    }

    const playerId = `player_${generateId()}`;
    const newPlayer = {
      id: playerId,
      gameId: gameId,
      userId: userId || null,
      name: playerName.trim(),
      isHost: false,
      hasSecretNumber: false,
      secretNumber: null,
      score: 0,
    };

    await mariadb.createPlayer(newPlayer);

    // Get updated game
    const updatedGame = await mariadb.getGame(gameId);

    res.status(200).json({
      success: true,
      message: "Successfully joined game",
      data: {
        game: {
          ...updatedGame,
          status: getGameStatus(updatedGame),
        },
        playerId,
      },
    });
  } catch (error) {
    console.error("Join game error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join game",
    });
  }
};

const joinGameByCode = async (req, res) => {
  try {
    const { code, playerName } = req.body;
    const userId = req.user?.userId;

    // Validation
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Game code is required",
      });
    }

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

    const game = await mariadb.getGameByCode(code.trim());

    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found with the provided code",
      });
    }

    if (game.players.length >= 2) {
      return res.status(400).json({
        success: false,
        error: "Game is full",
      });
    }

    if (game.status === "finished") {
      return res.status(400).json({
        success: false,
        error: "Game has already ended",
      });
    }

    // Check if player name is already taken in this game
    const existingPlayer = game.players.find(
      (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
    );

    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        error: "Player name is already taken in this game",
      });
    }

    const playerId = `player_${generateId()}`;
    const newPlayer = {
      id: playerId,
      gameId: game.id,
      userId: userId || null,
      name: playerName.trim(),
      isHost: false,
      hasSecretNumber: false,
      secretNumber: null,
      score: 0,
    };

    await mariadb.createPlayer(newPlayer);

    // Get updated game
    const updatedGame = await mariadb.getGame(game.id);

    res.status(200).json({
      success: true,
      message: "Successfully joined game",
      data: {
        game: {
          ...updatedGame,
          status: getGameStatus(updatedGame),
        },
        playerId,
      },
    });
  } catch (error) {
    console.error("Join game by code error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join game",
    });
  }
};

const setSecretNumber = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, secretNumber } = req.body;

    // Validation
    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: "Player ID is required",
      });
    }

    if (!validateNumber(secretNumber)) {
      return res.status(400).json({
        success: false,
        error:
          "Secret number must be a 4-digit number with unique digits (e.g., 1234)",
      });
    }

    const game = await mariadb.getGame(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: "Player not found in this game",
      });
    }

    if (player.has_secret_number) {
      return res.status(400).json({
        success: false,
        error: "Secret number already set for this player",
      });
    }

    // Update player with secret number
    await mariadb.updatePlayer(playerId, {
      has_secret_number: true,
      secret_number: secretNumber,
    });

    // Get updated game
    const updatedGame = await mariadb.getGame(gameId);
    const gameStatus = getGameStatus(updatedGame);

    // If both players have set their secret numbers, start the game
    if (gameStatus === "ready") {
      const firstPlayer = updatedGame.players[0];
      await mariadb.updateGame(gameId, {
        status: "playing",
        current_turn: firstPlayer.id,
      });

      const finalGame = await mariadb.getGame(gameId);
      return res.status(200).json({
        success: true,
        message: "Secret number set successfully. Game is starting!",
        data: {
          game: {
            ...finalGame,
            status: "playing",
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Secret number set successfully",
      data: {
        game: {
          ...updatedGame,
          status: gameStatus,
        },
      },
    });
  } catch (error) {
    console.error("Set secret number error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to set secret number",
    });
  }
};

const makeGuess = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, guess } = req.body;

    // Validation
    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: "Player ID is required",
      });
    }

    if (!validateNumber(guess)) {
      return res.status(400).json({
        success: false,
        error: "Guess must be a 4-digit number with unique digits (e.g., 1234)",
      });
    }

    const game = await mariadb.getGame(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    if (game.status !== "playing") {
      return res.status(400).json({
        success: false,
        error: "Game is not currently in playing state",
      });
    }

    if (game.current_turn !== playerId) {
      return res.status(400).json({
        success: false,
        error: "It's not your turn",
      });
    }

    const currentPlayer = game.players.find((p) => p.id === playerId);
    const otherPlayer = game.players.find((p) => p.id !== playerId);

    if (!currentPlayer || !otherPlayer) {
      return res.status(404).json({
        success: false,
        error: "Players not found",
      });
    }

    // Get current player's guesses to determine guess number
    const existingGuesses = await mariadb.getGuessesByPlayer(playerId);
    const guessNumber = existingGuesses.length + 1;

    // Compare guess with other player's secret number
    const result = compareNumbers(guess, otherPlayer.secret_number);

    // Save the guess
    const guessData = {
      playerId: playerId,
      gameId: gameId,
      guess: guess,
      bulls: result.correctPosition,
      cows: result.correctDigit,
      guessNumber: guessNumber,
    };

    await mariadb.createGuess(guessData);

    // Check if guess is correct (4 bulls)
    if (result.correctPosition === 4) {
      // Player wins
      await mariadb.updateGame(gameId, {
        winner: playerId,
        status: "finished",
        current_turn: null,
      });

      // Update user stats if authenticated
      if (currentPlayer.user_id) {
        await updateStats(currentPlayer.user_id, "won");
      }
      if (otherPlayer.user_id) {
        await updateStats(otherPlayer.user_id, "lost");
      }

      const finalGame = await mariadb.getGame(gameId);

      return res.status(200).json({
        success: true,
        message: "Congratulations! You guessed the correct number!",
        data: {
          result: {
            guess,
            bulls: result.correctPosition,
            cows: result.correctDigit,
            isCorrect: true,
            guessNumber,
          },
          game: {
            ...finalGame,
            status: "finished",
          },
        },
      });
    }

    // Switch turns
    await mariadb.updateGame(gameId, {
      current_turn: otherPlayer.id,
    });

    const updatedGame = await mariadb.getGame(gameId);

    res.status(200).json({
      success: true,
      message: "Guess recorded successfully",
      data: {
        result: {
          guess,
          bulls: result.correctPosition,
          cows: result.correctDigit,
          isCorrect: false,
          guessNumber,
        },
        game: {
          ...updatedGame,
          status: getGameStatus(updatedGame),
        },
      },
    });
  } catch (error) {
    console.error("Make guess error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process guess",
    });
  }
};

const getPlayerGuesses = async (req, res) => {
  try {
    const { gameId, playerId } = req.params;

    const game = await mariadb.getGame(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: "Player not found in this game",
      });
    }

    const guesses = await mariadb.getGuessesByPlayer(playerId);

    res.status(200).json({
      success: true,
      data: {
        guesses: guesses.map((g) => ({
          guess: g.guess,
          bulls: g.bulls,
          cows: g.cows,
          guessNumber: g.guess_number,
          timestamp: g.created_at,
        })),
        totalGuesses: guesses.length,
        playerId,
        gameId,
      },
    });
  } catch (error) {
    console.error("Get player guesses error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve player guesses",
    });
  }
};

const getGameStats = async (req, res) => {
  try {
    const gamesMap = await mariadb.getAllGames();
    const games = Array.from(gamesMap.values());

    const stats = {
      totalGames: games.length,
      activeGames: games.filter((g) => g.status === "playing" || g.status === "waiting" || g.status === "ready").length,
      finishedGames: games.filter((g) => g.status === "finished").length,
      totalPlayers: games.reduce((total, game) => total + game.players.length, 0),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get game stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve game statistics",
    });
  }
};

module.exports = {
  createGame,
  getGames,
  getGameById,
  joinGameById,
  joinGameByCode,
  setSecretNumber,
  makeGuess,
  getPlayerGuesses,
  getGameStats,
};
