const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { registerGameSocket } = require("./sockets/gameSocket");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Attach game socket logic
io.on("connection", (socket) => {
  registerGameSocket(io, socket);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
