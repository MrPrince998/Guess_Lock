const mariadb = require("mariadb");

class MariaDBClient {
  constructor() {
    this.pool = mariadb.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
    });
  }

  async connect() {
    try {
      const conn = await this.pool.getConnection();
      console.log("Connected to MariaDB");
      conn.release();
      return true;
    } catch (error) {
      console.error("MariaDB Connection Error:", error);
      return false;
    }
  }

  async initDatabase() {
    const conn = await this.pool.getConnection();
    try {
      // Create users table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(32) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(20) NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          games_played INT DEFAULT 0,
          games_won INT DEFAULT 0
        )
      `);

      // Create games table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS games (
          id VARCHAR(50) PRIMARY KEY,
          code VARCHAR(10) UNIQUE NOT NULL,
          host_player_id VARCHAR(50) NOT NULL,
          status ENUM('waiting', 'ready', 'playing', 'finished') DEFAULT 'waiting',
          current_turn VARCHAR(50) NULL,
          winner VARCHAR(50) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create players table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS players (
          id VARCHAR(50) PRIMARY KEY,
          game_id VARCHAR(50) NOT NULL,
          user_id VARCHAR(32) NULL,
          name VARCHAR(20) NOT NULL,
          is_host BOOLEAN DEFAULT FALSE,
          has_secret_number BOOLEAN DEFAULT FALSE,
          secret_number VARCHAR(4) NULL,
          score INT DEFAULT 0,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Create guesses table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS guesses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          player_id VARCHAR(50) NOT NULL,
          game_id VARCHAR(50) NOT NULL,
          guess VARCHAR(4) NOT NULL,
          bulls INT NOT NULL,
          cows INT NOT NULL,
          guess_number INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
          FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
        )
      `);

      console.log("Database tables initialized successfully");
    } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // User operations
  async createUser(userData) {
    const conn = await this.pool.getConnection();
    try {
      const result = await conn.query(
        "INSERT INTO users (id, email, username, password, games_played, games_won) VALUES (?, ?, ?, ?, ?, ?)",
        [
          userData.id,
          userData.email,
          userData.username,
          userData.password,
          userData.gamesPlayed || 0,
          userData.gamesWon || 0,
        ]
      );
      return result;
    } finally {
      conn.release();
    }
  }

  async getUserByEmail(email) {
    const conn = await this.pool.getConnection();
    try {
      const rows = await conn.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  async getUserById(userId) {
    const conn = await this.pool.getConnection();
    try {
      const rows = await conn.query("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  async updateUserStats(userId, gamesPlayed, gamesWon) {
    const conn = await this.pool.getConnection();
    try {
      await conn.query(
        "UPDATE users SET games_played = ?, games_won = ? WHERE id = ?",
        [gamesPlayed, gamesWon, userId]
      );
    } finally {
      conn.release();
    }
  }

  // Game operations
  async createGame(gameData) {
    const conn = await this.pool.getConnection();
    try {
      await conn.query(
        "INSERT INTO games (id, code, host_player_id, status, current_turn, winner) VALUES (?, ?, ?, ?, ?, ?)",
        [
          gameData.id,
          gameData.code,
          gameData.host,
          gameData.status,
          gameData.currentTurn,
          gameData.winner,
        ]
      );
      return gameData;
    } finally {
      conn.release();
    }
  }

  async getGame(gameId) {
    const conn = await this.pool.getConnection();
    try {
      const gameRows = await conn.query("SELECT * FROM games WHERE id = ?", [
        gameId,
      ]);
      if (gameRows.length === 0) return null;

      const game = gameRows[0];

      // Get players for this game
      const playerRows = await conn.query(
        "SELECT * FROM players WHERE game_id = ?",
        [gameId]
      );
      game.players = playerRows;

      return game;
    } finally {
      conn.release();
    }
  }

  async getGameByCode(code) {
    const conn = await this.pool.getConnection();
    try {
      const gameRows = await conn.query("SELECT * FROM games WHERE code = ?", [
        code.toUpperCase(),
      ]);
      if (gameRows.length === 0) return null;

      const game = gameRows[0];

      // Get players for this game
      const playerRows = await conn.query(
        "SELECT * FROM players WHERE game_id = ?",
        [game.id]
      );
      game.players = playerRows;

      return game;
    } finally {
      conn.release();
    }
  }

  async updateGame(gameId, updates) {
    const conn = await this.pool.getConnection();
    try {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(updates), gameId];

      await conn.query(
        `UPDATE games SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    } finally {
      conn.release();
    }
  }

  async deleteGame(gameId) {
    const conn = await this.pool.getConnection();
    try {
      await conn.query("DELETE FROM games WHERE id = ?", [gameId]);
    } finally {
      conn.release();
    }
  }

  // Player operations
  async createPlayer(playerData) {
    const conn = await this.pool.getConnection();
    try {
      await conn.query(
        "INSERT INTO players (id, game_id, user_id, name, is_host, has_secret_number, secret_number, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          playerData.id,
          playerData.gameId,
          playerData.userId,
          playerData.name,
          playerData.isHost,
          playerData.hasSecretNumber,
          playerData.secretNumber,
          playerData.score,
        ]
      );
      return playerData;
    } finally {
      conn.release();
    }
  }

  async getPlayer(playerId) {
    const conn = await this.pool.getConnection();
    try {
      const rows = await conn.query("SELECT * FROM players WHERE id = ?", [
        playerId,
      ]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  async updatePlayer(playerId, updates) {
    const conn = await this.pool.getConnection();
    try {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(updates), playerId];

      await conn.query(`UPDATE players SET ${setClause} WHERE id = ?`, values);
    } finally {
      conn.release();
    }
  }

  async getPlayersByGameId(gameId) {
    const conn = await this.pool.getConnection();
    try {
      const rows = await conn.query("SELECT * FROM players WHERE game_id = ?", [
        gameId,
      ]);
      return rows;
    } finally {
      conn.release();
    }
  }

  // Guess operations
  async createGuess(guessData) {
    const conn = await this.pool.getConnection();
    try {
      const result = await conn.query(
        "INSERT INTO guesses (player_id, game_id, guess, bulls, cows, guess_number) VALUES (?, ?, ?, ?, ?, ?)",
        [
          guessData.playerId,
          guessData.gameId,
          guessData.guess,
          guessData.bulls,
          guessData.cows,
          guessData.guessNumber,
        ]
      );
      return result;
    } finally {
      conn.release();
    }
  }

  async getGuessesByPlayer(playerId) {
    const conn = await this.pool.getConnection();
    try {
      const rows = await conn.query(
        "SELECT * FROM guesses WHERE player_id = ? ORDER BY guess_number ASC",
        [playerId]
      );
      return rows;
    } finally {
      conn.release();
    }
  }

  async getAllGames() {
    const conn = await this.pool.getConnection();
    try {
      const gameRows = await conn.query(
        "SELECT * FROM games ORDER BY created_at DESC"
      );
      const games = new Map();

      for (const game of gameRows) {
        const playerRows = await conn.query(
          "SELECT * FROM players WHERE game_id = ?",
          [game.id]
        );
        game.players = playerRows;
        games.set(game.id, game);
      }

      return games;
    } finally {
      conn.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new MariaDBClient();
