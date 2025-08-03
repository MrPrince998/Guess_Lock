# Guess the Number Game API

A REST API for a multiplayer guess the number game where players create games with 4-digit unique numbers and try to guess each other's numbers using Bulls and Cows scoring system.

## Features

- Create and join games using game codes
- Set secret 4-digit numbers with unique digits
- Make guesses with Bulls/Cows feedback
- Real-time game status tracking
- Comprehensive API documentation with Swagger

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## API Documentation

Visit `http://localhost:3000/api-docs` for interactive Swagger documentation.

## Game Rules

1. Each player sets a 4-digit secret number with unique digits (e.g., 1234, 5678)
2. Players take turns guessing each other's secret numbers
3. After each guess, feedback is provided:
   - **Bulls**: Correct digits in correct position
   - **Cows**: Correct digits in wrong position
4. First player to guess correctly wins!

## API Endpoints

### Game Management

- `POST /api/game` - Create a new game
- `GET /api/game` - Get all games
- `GET /api/game/{gameId}` - Get specific game details
- `DELETE /api/game/{gameId}` - Delete a game (host only)
- `GET /api/game/stats` - Get game statistics

### Player Actions

- `POST /api/game/{gameId}/join` - Join a game by ID
- `POST /api/game/join/{gameCode}` - Join a game by code
- `POST /api/game/{gameId}/players/{playerId}/secret` - Set secret number
- `POST /api/game/{gameId}/players/{playerId}/guess` - Make a guess

### Utility

- `GET /health` - Health check
- `GET /` - API information

## Example Usage

### 1. Create a Game

```bash
curl -X POST http://localhost:3000/api/game \
  -H "Content-Type: application/json" \
  -d '{"hostName": "Alice"}'
```

### 2. Join a Game

```bash
curl -X POST http://localhost:3000/api/game/join/AB12 \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Bob"}'
```

### 3. Set Secret Number

```bash
curl -X POST http://localhost:3000/api/game/{gameId}/players/{playerId}/secret \
  -H "Content-Type: application/json" \
  -d '{"secretNumber": "1234"}'
```

### 4. Make a Guess

```bash
curl -X POST http://localhost:3000/api/game/{gameId}/players/{playerId}/guess \
  -H "Content-Type: application/json" \
  -d '{"guess": "5678"}'
```

## Game Status Flow

1. **waiting** - Game created, waiting for players to join and set secret numbers
2. **ready** - Both players have joined and set secret numbers
3. **playing** - Game in progress, players taking turns
4. **finished** - Game completed, winner determined

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (game full, not your turn, etc.)
- `500` - Internal Server Error

## Development

### File Structure

```
backend/
├── server.js              # Main server file
├── swagger.js             # Swagger configuration
├── controllers/
│   └── gameController.js  # Game logic controllers
├── routes/
│   └── gameRoutes.js      # API routes
├── helpers/
│   ├── validators.js      # Input validation
│   └── compare.js         # Number comparison logic
└── utils/
    └── roomStore.js       # Data storage utilities
```

### Adding New Features

1. Add new routes in `routes/gameRoutes.js`
2. Implement controllers in `controllers/gameController.js`
3. Add validation in `helpers/validators.js`
4. Update Swagger documentation

## License

MIT License
