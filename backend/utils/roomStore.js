const crypto = require("crypto");

const rooms = new Map();

function generateRoomId() {
  return crypto.randomBytes(16).toString("hex");
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

module.exports = {
  rooms,
  generateRoomId,
  generateRoomCode,
};
