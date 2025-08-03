const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Guess the Number Game API",
      version: "1.0.0",
      description:
        "A REST API for a multiplayer guess the number game. Players create games with 4-digit unique numbers and try to guess each other's numbers using Bulls (correct position) and Cows (correct digit, wrong position) scoring system.",
      contact: {
        name: "API Support",
        email: "support@guessthenumber.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Game: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique game identifier",
              example: "game_abc123def456",
            },
            code: {
              type: "string",
              description: "4-character game code for joining",
              example: "AB12",
            },
            host: {
              type: "string",
              description: "Host player ID",
              example: "player_host123",
            },
            players: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Player",
              },
              description: "Array of players in the game",
            },
            status: {
              type: "string",
              enum: ["waiting", "ready", "playing", "finished"],
              description: "Current game status",
            },
            currentTurn: {
              type: "string",
              description: "ID of player whose turn it is",
              example: "player_abc123",
            },
            winner: {
              type: "string",
              description: "ID of the winning player",
              example: "player_abc123",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Game creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Game last update timestamp",
            },
          },
        },
        Player: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique player identifier",
              example: "player_abc123def456",
            },
            name: {
              type: "string",
              description: "Player display name",
              example: "JohnDoe",
            },
            isHost: {
              type: "boolean",
              description: "Whether this player is the game host",
              example: false,
            },
            hasSecretNumber: {
              type: "boolean",
              description: "Whether player has set their secret number",
              example: true,
            },
            guesses: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Guess",
              },
              description: "Array of guesses made by this player",
            },
            score: {
              type: "integer",
              description: "Player score (number of guesses made)",
              example: 3,
            },
          },
        },
        Guess: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique guess identifier",
              example: "guess_abc123",
            },
            number: {
              type: "string",
              description: "The 4-digit guess",
              example: "1234",
            },
            result: {
              $ref: "#/components/schemas/GuessResult",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "When the guess was made",
            },
          },
        },
        GuessResult: {
          type: "object",
          properties: {
            bulls: {
              type: "integer",
              description: "Number of digits in correct position",
              minimum: 0,
              maximum: 4,
              example: 2,
            },
            cows: {
              type: "integer",
              description: "Number of correct digits in wrong position",
              minimum: 0,
              maximum: 4,
              example: 1,
            },
            isCorrect: {
              type: "boolean",
              description: "Whether this guess was completely correct",
              example: false,
            },
          },
        },
        CreateGameRequest: {
          type: "object",
          required: ["hostName"],
          properties: {
            hostName: {
              type: "string",
              description: "Name of the game host",
              example: "JohnDoe",
              minLength: 1,
              maxLength: 20,
            },
          },
        },
        JoinGameRequest: {
          type: "object",
          required: ["gameCode", "playerName"],
          properties: {
            gameCode: {
              type: "string",
              description: "4-character game code",
              example: "AB12",
              pattern: "^[A-Z0-9]{4}$",
            },
            playerName: {
              type: "string",
              description: "Player display name",
              example: "JaneDoe",
              minLength: 1,
              maxLength: 20,
            },
          },
        },
        SetSecretNumberRequest: {
          type: "object",
          required: ["secretNumber"],
          properties: {
            secretNumber: {
              type: "string",
              description: "4-digit number with unique digits",
              example: "1234",
              pattern: "^\\d{4}$",
            },
          },
        },
        MakeGuessRequest: {
          type: "object",
          required: ["guess"],
          properties: {
            guess: {
              type: "string",
              description: "4-digit guess with unique digits",
              example: "5678",
              pattern: "^\\d{4}$",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error message",
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js", "./controllers/*.js", "./server.js"],
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Guess the Number API Documentation",
  }),
};
