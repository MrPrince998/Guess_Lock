/**
 * Middleware to filter sensitive game data based on user access
 */

const filterGameData = (req, res, next) => {
  // Override res.json to filter data before sending
  const originalJson = res.json;

  res.json = function (data) {
    if (data && data.data && data.data.game) {
      data.data.game = filterSensitiveGameInfo(
        data.data.game,
        req.user?.userId,
        req.hasGameAccess
      );
    } else if (data && data.data && data.data.games) {
      data.data.games = data.data.games.map((game) =>
        filterSensitiveGameInfo(game, req.user?.userId, req.hasGameAccess)
      );
    }

    return originalJson.call(this, data);
  };

  next();
};

const filterSensitiveGameInfo = (game, userId, hasGameAccess) => {
  if (!game) return game;

  // Create a copy to avoid mutating original
  const filteredGame = { ...game };

  // If user has no access to the game, hide sensitive information
  if (!hasGameAccess) {
    // Hide secret numbers from all players
    if (filteredGame.players) {
      filteredGame.players = filteredGame.players.map((player) => ({
        ...player,
        secret_number: null, // Hide secret numbers
        has_secret_number: Boolean(player.secret_number), // Only show if they have one
      }));
    }

    // Hide current turn details if game is not finished
    if (filteredGame.status !== "finished") {
      // Keep current turn info but don't reveal which player
      filteredGame.current_turn = filteredGame.current_turn ? "hidden" : null;
    }
  } else {
    // User has access to the game, but still hide other players' secret numbers
    if (filteredGame.players) {
      filteredGame.players = filteredGame.players.map((player) => {
        // Only show own secret number or if game is finished
        if (player.user_id === userId || filteredGame.status === "finished") {
          return player;
        } else {
          return {
            ...player,
            secret_number: null, // Hide other players' secret numbers
            has_secret_number: Boolean(player.secret_number),
          };
        }
      });
    }
  }

  return filteredGame;
};

const filterPlayerData = (req, res, next) => {
  // Override res.json to filter player-specific data
  const originalJson = res.json;

  res.json = function (data) {
    if (data && data.data && data.data.guesses) {
      // Only return guesses if user owns the player or game is finished
      const game = req.game;
      const player = req.player;

      if (
        !player ||
        (player.user_id !== req.user?.userId && game?.status !== "finished")
      ) {
        data.data.guesses = [];
        data.data.totalGuesses = 0;
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  filterGameData,
  filterPlayerData,
  filterSensitiveGameInfo,
};
