# Guess the Number Game API Documentation

## Overview

A REST API for a multiplayer "Guess the Number" game with user authentication using MariaDB database.

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MariaDB (v10.4 or higher)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure database:

   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`

3. Setup database tables:

   ```bash
   npm run setup-db
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## Authentication

### JWT Token

Include JWT token in requests using the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

### Auth Endpoints

#### POST /api/auth/signup

Register a new user.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "PlayerName"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "PlayerName",
      "gamesPlayed": 0,
      "gamesWon": 0
    },
    "token": "jwt_token"
  }
}
```

#### POST /api/auth/login

Login an existing user.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "PlayerName",
      "gamesPlayed": 5,
      "gamesWon": 2
    },
    "token": "jwt_token"
  }
}
```

#### GET /api/auth/profile

Get current user profile (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "PlayerName",
      "gamesPlayed": 5,
      "gamesWon": 2
    }
  }
}
```

## Game Endpoints

All game endpoints support optional authentication. If authenticated, the user will be linked to the game.

#### POST /api/game

Create a new game.

**Body:**

```json
{
  "hostName": "Player1"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Game created successfully",
  "data": {
    "game": {
      "id": "game_123",
      "code": "AB12",
      "status": "waiting",
      "players": [...]
    },
    "playerId": "player_456"
  }
}
```

#### GET /api/game

Get all games.

**Response:**

```json
{
  "success": true,
  "data": {
    "games": [...],
    "total": 5
  }
}
```

#### GET /api/game/:gameId

Get specific game details.

#### POST /api/game/:gameId/join

Join a game by ID.

**Body:**

```json
{
  "playerName": "Player2"
}
```

#### POST /api/game/join-by-code

Join a game by code.

**Body:**

```json
{
  "code": "AB12",
  "playerName": "Player2"
}
```

#### POST /api/game/:gameId/players/:playerId/secret

Set your secret number.

**Body:**

```json
{
  "playerId": "player_456",
  "secretNumber": "1234"
}
```

#### POST /api/game/:gameId/players/:playerId/guess

Make a guess.

**Body:**

```json
{
  "playerId": "player_456",
  "guess": "5678"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Guess recorded successfully",
  "data": {
    "result": {
      "guess": "5678",
      "bulls": 1,
      "cows": 2,
      "isCorrect": false,
      "guessNumber": 3
    },
    "game": {...}
  }
}
```

#### GET /api/game/:gameId/players/:playerId/guesses

Get all guesses for a player.

#### GET /api/game/stats

Get game statistics.

## Game Rules

### Bulls and Cows

- **Bull**: Correct digit in correct position
- **Cow**: Correct digit in wrong position

### Number Format

- 4 digits
- All digits must be unique
- Example: 1234, 5678, 9876

### Game Flow

1. Host creates a game
2. Another player joins
3. Both players set their secret numbers
4. Players take turns guessing
5. First to guess correctly wins

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:

- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/missing token)
- 404: Not Found
- 409: Conflict (user already exists)
- 500: Internal Server Error

## Database Schema

### Users Table

- `id`: VARCHAR(32) PRIMARY KEY
- `email`: VARCHAR(255) UNIQUE
- `username`: VARCHAR(20)
- `password`: VARCHAR(255) (hashed)
- `created_at`: TIMESTAMP
- `games_played`: INT
- `games_won`: INT

### Games Table

- `id`: VARCHAR(50) PRIMARY KEY
- `code`: VARCHAR(10) UNIQUE
- `host_player_id`: VARCHAR(50)
- `status`: ENUM('waiting', 'ready', 'playing', 'finished')
- `current_turn`: VARCHAR(50)
- `winner`: VARCHAR(50)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Players Table

- `id`: VARCHAR(50) PRIMARY KEY
- `game_id`: VARCHAR(50) FOREIGN KEY
- `user_id`: VARCHAR(32) FOREIGN KEY (nullable)
- `name`: VARCHAR(20)
- `is_host`: BOOLEAN
- `has_secret_number`: BOOLEAN
- `secret_number`: VARCHAR(4)
- `score`: INT
- `joined_at`: TIMESTAMP

### Guesses Table

- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `player_id`: VARCHAR(50) FOREIGN KEY
- `game_id`: VARCHAR(50) FOREIGN KEY
- `guess`: VARCHAR(4)
- `bulls`: INT
- `cows`: INT
- `guess_number`: INT
- `created_at`: TIMESTAMP
