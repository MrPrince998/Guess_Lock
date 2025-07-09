const {
  rooms,
  generateRoomCode,
  generateRoomId,
} = require("../utils/roomStore");
const { validateNumber } = require("../helpers/validators");
const { compareNumbers } = require("../helpers/compare");
const crypto = require("crypto");
const { create } = require("domain");

function registerGameSocket(io, socket) {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("createGame", (hostName, callback) => {
    const roomCode = generateRoomCode();
    const roomId = crypto.randomBytes(16).toString("hex");

    // create the host player
    const hostPlayerId = socket.id;
    const hostPlayer = {
      id: hostPlayerId,
      name: hostName,
      socketId: socket.id,
      secretNumber: null,
      currentGuess: null,
      guesses: [],
      score: 0,
      ready: false,
    };

    const room = {
      id: roomId,
      code: roomCode,
      host: socket.id,
      players: new Map([[hostPlayerId, hostPlayer]]),
      createAt: new Date(),
    };
    rooms.set(roomId, room);
    socket.join(roomId);

    console.log("Room created:", {
      roomCode,
      roomId,
      hostName,
      hostPlayerId,
    });

    callback({ roomCode, roomId });
  });

  socket.on("joinGame", (roomCode, playerName, callback) => {
    console.log("Join game attempt:", {
      roomCode,
      playerName,
      socketId: socket.id,
    });

    let roomId = null;

    for (const [id, room] of rooms.entries()) {
      if (room.code === roomCode.toUpperCase()) {
        roomId = id;
        break;
      }
    }

    if (!roomId) return callback({ error: "Room not found" });

    const room = rooms.get(roomId);
    if (room.players.size >= 2) return callback({ error: "Room is full" });

    const playerId = crypto.randomBytes(16).toString("hex");
    const player = {
      id: playerId,
      name: playerName,
      socketId: socket.id,
      secretNumber: null,
      currentGuess: null,
      guesses: [],
      score: 0,
      ready: false,
    };

    // After a player joins:
    room.players.set(playerId, player);
    socket.join(roomId);

    callback({ roomId: roomId, playerId: playerId });

    socket.to(roomId).emit("playerJoined", playerName);

    // Emit updated room data to all players in the room
    io.to(roomId).emit("roomData", {
      players: [...room.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        // Optionally add: ready: p.ready
      })),
    });
  });

  socket.on("submitSecret", ({ roomId, playerId, secretNumber }) => {
    console.log("=== submitSecret received ===");
    console.log("Data:", { roomId, playerId, secretNumber });

    const room = rooms.get(roomId);
    console.log("Room found:", !!room);

    const player = room?.players.get(playerId);
    console.log("Player found:", !!player, player?.name);

    if (!room || !player) {
      console.error("Invalid room or player:", { roomId, playerId });
      return socket.emit("error", "Invalid room or player");
    }

    // Validate the secret number
    if (!/^\d{4}$/.test(secretNumber)) {
      console.error("Invalid number format:", secretNumber);
      return socket.emit("error", "Secret number must be exactly 4 digits");
    }

    const digits = secretNumber.split("");
    const uniqueDigits = new Set(digits);
    if (uniqueDigits.size !== 4) {
      console.error("Non-unique digits:", secretNumber);
      return socket.emit("error", "All digits must be unique");
    }

    // Set the secret number and mark as ready
    player.secretNumber = secretNumber;
    player.ready = true;

    console.log(`✅ Player ${player.name} set secret number and is ready`);

    // Send confirmation to the player who submitted
    socket.emit("secretSubmitted", {
      success: true,
      message: "Secret number set successfully",
    });
    console.log("✅ Sent secretSubmitted confirmation");

    // Check if all players are ready
    const allPlayers = [...room.players.values()];
    const readyPlayers = allPlayers.filter((p) => p.ready);
    const allReady = readyPlayers.length === room.players.size;

    console.log(
      `Players status: ${readyPlayers.length}/${room.players.size} ready`
    );
    console.log(
      "All players:",
      allPlayers.map((p) => ({ name: p.name, ready: p.ready }))
    );

    // Notify other players that this player is ready
    const playerReadyEvent = {
      playerName: player.name,
      readyCount: readyPlayers.length,
      totalPlayers: room.players.size,
    };
    console.log("✅ Emitting playerReady event:", playerReadyEvent);
    socket.to(roomId).emit("playerReady", playerReadyEvent);

    if (allReady && room.players.size >= 2) {
      // All players are ready, start the game
      const playerIds = [...room.players.keys()];
      room.currentTurn =
        playerIds[Math.floor(Math.random() * playerIds.length)];

      const gameStartedEvent = {
        currentPlayer: room.players.get(room.currentTurn).name,
        currentPlayerId: room.currentTurn,
        message: "All players have set their numbers. Game starting!",
      };

      console.log("🎮 All players ready, starting game");
      console.log("✅ Emitting gameStarted to room:", roomId);
      console.log("✅ gameStarted event data:", gameStartedEvent);

      // Emit to ALL players in the room (including the sender)
      io.to(roomId).emit("gameStarted", gameStartedEvent);

      // Also emit to the current socket (as backup)
      socket.emit("gameStarted", gameStartedEvent);
    } else {
      console.log("⏳ Waiting for more players to be ready");
    }
  });

  socket.on("setDigit", ({ roomId, playerId, secretNumber }, callback) => {
    console.log("SetDigit response:", callback);
    console.log("=== SetDigit Debug Info ===");
    console.log("Received:", { roomId, playerId, secretNumber });
    console.log("PlayerId type:", typeof playerId);
    console.log("PlayerId length:", playerId?.length);

    try {
      // Validate the secret number
      if (!/^\d{4}$/.test(secretNumber)) {
        return callback({
          success: false,
          error: "Secret number must be exactly 4 digits",
        });
      }

      // Check if all the digits are unique
      const digits = secretNumber.split("");
      const uniqueDigits = new Set(digits);
      if (uniqueDigits.size !== 4) {
        callback({
          success: false,
          error: "Secret number must have unique digits.",
        });
        return;
      }

      // Get the room
      const room = rooms.get(roomId);
      if (!room) {
        console.error("Room not found:", roomId);
        callback({ success: false, error: "Room not found." });
        return;
      }

      console.log("=== Room Players Debug ===");
      console.log("Total players in room:", room.players.size);
      for (const [id, player] of room.players.entries()) {
        console.log(
          `Player ID: "${id}" (${typeof id}) - Name: ${player.name} - Socket: ${
            player.socketId
          }`
        );
      }
      console.log(
        "Looking for playerId:",
        `"${playerId}" (${typeof playerId})`
      );

      // Get the player
      const player = room.players.get(playerId);
      if (!player) {
        console.error("Player not found in room:", playerId);
        console.log("Available players:", Array.from(room.players.keys()));
        for (const [id] of room.players.entries()) {
          console.log(`"${id}" === "${playerId}": ${id === playerId}`);
        }
        return callback({ success: false, error: "Player not found." });
      }
      console.log("✅ Player found:", player.name);

      // Set the secret number for the player
      player.secretNumber = secretNumber;
      console.log(`Player ${playerId} set secret number: ${secretNumber}`);

      callback({ success: true });

      // check if all players have set their secret numbers
      const playersWithNumbers = Array.from(room.players.values()).filter(
        (p) => p.secretNumber
      );
      const allPlayersReady = playersWithNumbers.length === room.players.size;

      console.log(
        `Players ready: ${playersWithNumbers.length}/${room.players.size}`
      );

      if (allPlayersReady && room.players.size >= 2) {
        console.log("All players are ready. Starting the game...");
        io.to(roomId).emit("gameStarted", {
          message: "All players have set their numbers. Game starting!",
        });
      } else {
        // Notify other players that this player is ready
        socket.to(roomId).emit("playerReady", {
          playerName: player.name,
          readyCount: Array.from(room.players.values()).filter(
            (p) => p.secretNumber
          ).length,
          totalPlayers: room.players.size,
        });
      }
    } catch (error) {
      console.error("Error setting digit:", error);
      callback({
        success: false,
        error: "An error occurred while setting the digit.",
      });
    }
  });

  socket.on("makeGuess", ({ roomId, playerId, guess }) => {
    const room = rooms.get(roomId);
    if (!room || room.gameOver) return;

    if (playerId !== room.currentTurn) {
      return socket.emit("error", "Not your turn");
    }

    if (!validateNumber(guess)) {
      return socket.emit("error", "Invalid guess. Must be 4 unique digits.");
    }

    const opponent = [...room.players.entries()].find(
      ([id]) => id !== playerId
    )?.[1];
    if (!opponent) return socket.emit("error", "Opponent not found");

    const result = compareNumbers(opponent.secretNumber, guess);
    const isCorrect = result.correctPosition === 4;

    io.to(roomId).emit("guessResult", {
      playerId,
      guess,
      result,
      correct: isCorrect,
    });

    if (isCorrect) {
      room.gameOver = true;
      room.winner = playerId;
      io.to(roomId).emit("gameOver", {
        winner: room.players.get(playerId).name,
        secretNumber: opponent.secretNumber,
      });
    } else {
      room.currentTurn = [...room.players.keys()].find((id) => id !== playerId);
      io.to(roomId).emit("turnChanged", {
        currentPlayer: room.players.get(room.currentTurn).name,
        currentPlayerId: room.currentTurn,
      });
    }
  });

  socket.on("initiateGameStart", ({ roomId }) => {
    console.log("Host initiated game start for room:", roomId);
    const room = rooms.get(roomId);
    if (!room) return socket.emit("error", "Room not found");

    // Emit to all players in the room to move to game scene
    io.to(roomId).emit("moveToGame", {
      roomId: roomId,
      roomCode: room.code,
      message: "Host started the game! Moving to game scene...",
    });
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      for (const [playerId, player] of room.players.entries()) {
        if (player.socketId === socket.id) {
          player.socketId = null;
          socket.to(roomId).emit("playerDisconnected", player.name);
        }
      }
    }
  });

  socket.on("reconnectPlayer", ({ roomId, playerId }, callback) => {
    const room = rooms.get(roomId);
    const player = room?.players.get(playerId);
    if (!room || !player) return callback({ error: "Invalid room or player" });

    player.socketId = socket.id;
    socket.join(roomId);
    callback({
      success: true,
      gameState: {
        roomCode: room.code,
        players: [...room.players.values()].map((p) => ({
          id: p.id,
          name: p.name,
          ready: p.ready,
        })),
        currentTurn: room.currentTurn,
        gameOver: room.gameOver,
        winner: room.winner,
      },
    });

    socket.to(roomId).emit("playerReconnected", player.name);
  });

  socket.on("requestRoomData", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit("error", "Room not found");

    // Send the actual players in the room
    io.to(socket.id).emit("roomData", {
      players: [...room.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        // Optionally add: ready: p.ready
      })),
    });
  });
}

module.exports = { registerGameSocket };
