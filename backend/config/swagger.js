const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Guess the Number Game API",
      version: "1.0.0",
      description:
        "A REST API for a multiplayer guess the number game with user authentication using MariaDB database.",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique user identifier",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            username: {
              type: "string",
              description: "Username (2-20 characters)",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
            games_played: {
              type: "integer",
              description: "Total number of games played",
            },
            games_won: {
              type: "integer",
              description: "Total number of games won",
            },
          },
        },
        Game: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique game identifier",
            },
            code: {
              type: "string",
              description: "4-character game code for joining",
            },
            host_player_id: {
              type: "string",
              description: "ID of the host player",
            },
            status: {
              type: "string",
              enum: ["waiting", "ready", "playing", "finished"],
              description: "Current game status",
            },
            current_turn: {
              type: "string",
              nullable: true,
              description: "ID of player whose turn it is",
            },
            winner: {
              type: "string",
              nullable: true,
              description: "ID of winning player",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Game creation timestamp",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
            players: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Player",
              },
            },
          },
        },
        Player: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique player identifier",
            },
            game_id: {
              type: "string",
              description: "ID of the game this player is in",
            },
            user_id: {
              type: "string",
              nullable: true,
              description: "ID of authenticated user (if linked)",
            },
            name: {
              type: "string",
              description: "Player display name",
            },
            is_host: {
              type: "boolean",
              description: "Whether this player is the game host",
            },
            has_secret_number: {
              type: "boolean",
              description: "Whether player has set their secret number",
            },
            secret_number: {
              type: "string",
              nullable: true,
              description: "Player secret number (hidden from other players)",
            },
            score: {
              type: "integer",
              description: "Player score",
            },
            joined_at: {
              type: "string",
              format: "date-time",
              description: "When player joined the game",
            },
          },
        },
        Guess: {
          type: "object",
          properties: {
            guess: {
              type: "string",
              pattern: "^[0-9]{4}$",
              description: "4-digit guess with unique digits",
            },
            bulls: {
              type: "integer",
              minimum: 0,
              maximum: 4,
              description: "Number of correct digits in correct position",
            },
            cows: {
              type: "integer",
              minimum: 0,
              maximum: 4,
              description: "Number of correct digits in wrong position",
            },
            guess_number: {
              type: "integer",
              description: "Sequential guess number for this player",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "When the guess was made",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
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
              description: "Success message",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
      },
    },
    paths: {
      "/api/auth/signup": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          description:
            "Create a new user account with email, password, and username",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "username"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      description: "Valid email address",
                    },
                    password: {
                      type: "string",
                      minLength: 6,
                      pattern:
                        "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{6,}$",
                      description: "Password (min 6 chars, 1 letter, 1 number)",
                    },
                    username: {
                      type: "string",
                      minLength: 2,
                      maxLength: 20,
                      description: "Username (2-20 characters)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "User created successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              user: { $ref: "#/components/schemas/User" },
                              token: {
                                type: "string",
                                description: "JWT authentication token",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            409: {
              description: "User already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login user",
          description: "Authenticate user with email and password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                    },
                    password: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              user: { $ref: "#/components/schemas/User" },
                              token: {
                                type: "string",
                                description: "JWT authentication token",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/profile": {
        get: {
          tags: ["Authentication"],
          summary: "Get user profile",
          description: "Get current authenticated user profile information",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Profile retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              user: { $ref: "#/components/schemas/User" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/game": {
        get: {
          tags: ["Games"],
          summary: "Get all games",
          description:
            "Retrieve list of all games (sensitive data filtered based on access)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Games retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              games: {
                                type: "array",
                                items: { $ref: "#/components/schemas/Game" },
                              },
                              total: {
                                type: "integer",
                                description: "Total number of games",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Games"],
          summary: "Create a new game",
          description:
            "Create a new game (authentication optional, but recommended for stat tracking)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["hostName"],
                  properties: {
                    hostName: {
                      type: "string",
                      minLength: 1,
                      maxLength: 20,
                      description: "Host player name",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Game created successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              game: { $ref: "#/components/schemas/Game" },
                              playerId: {
                                type: "string",
                                description: "Host player ID",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/game/stats": {
        get: {
          tags: ["Games"],
          summary: "Get game statistics",
          description: "Get general game statistics (public endpoint)",
          responses: {
            200: {
              description: "Statistics retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              totalGames: { type: "integer" },
                              activeGames: { type: "integer" },
                              finishedGames: { type: "integer" },
                              totalPlayers: { type: "integer" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/api/game/join-by-code": {
        post: {
          tags: ["Games"],
          summary: "Join game by code",
          description: "Join a game using its 4-character code",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["code", "playerName"],
                  properties: {
                    code: {
                      type: "string",
                      pattern: "^[A-Z0-9]{4}$",
                      description: "4-character game code",
                    },
                    playerName: {
                      type: "string",
                      minLength: 1,
                      maxLength: 20,
                      description: "Player display name",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Successfully joined game",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              game: { $ref: "#/components/schemas/Game" },
                              playerId: {
                                type: "string",
                                description: "New player ID",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Game full or invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Game not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/game/{gameId}": {
        get: {
          tags: ["Games"],
          summary: "Get game details",
          description:
            "Get specific game details (filtered based on user access)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "gameId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Game ID",
            },
          ],
          responses: {
            200: {
              description: "Game details retrieved",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              game: { $ref: "#/components/schemas/Game" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            403: {
              description: "Access denied",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Game not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/game/{gameId}/join": {
        post: {
          tags: ["Games"],
          summary: "Join game by ID",
          description: "Join a specific game by its ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "gameId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Game ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["playerName"],
                  properties: {
                    playerName: {
                      type: "string",
                      minLength: 1,
                      maxLength: 20,
                      description: "Player display name",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Successfully joined game",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              game: { $ref: "#/components/schemas/Game" },
                              playerId: {
                                type: "string",
                                description: "New player ID",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Game full or invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Game not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/game/{gameId}/players/{playerId}/secret": {
        post: {
          tags: ["Player Actions"],
          summary: "Set secret number",
          description:
            "Set your secret 4-digit number (requires authentication and player ownership)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "gameId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Game ID",
            },
            {
              name: "playerId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Player ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["playerId", "secretNumber"],
                  properties: {
                    playerId: {
                      type: "string",
                      description: "Player ID (must match path parameter)",
                    },
                    secretNumber: {
                      type: "string",
                      pattern: "^[0-9]{4}$",
                      description: "4-digit number with unique digits",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Secret number set successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              game: { $ref: "#/components/schemas/Game" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Invalid secret number or already set",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not your player",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/game/{gameId}/players/{playerId}/guess": {
        post: {
          tags: ["Player Actions"],
          summary: "Make a guess",
          description:
            "Make a guess at the opponent's secret number (requires authentication and player ownership)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "gameId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Game ID",
            },
            {
              name: "playerId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Player ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["playerId", "guess"],
                  properties: {
                    playerId: {
                      type: "string",
                      description: "Player ID (must match path parameter)",
                    },
                    guess: {
                      type: "string",
                      pattern: "^[0-9]{4}$",
                      description: "4-digit guess with unique digits",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Guess recorded successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              result: {
                                type: "object",
                                properties: {
                                  guess: { type: "string" },
                                  bulls: { type: "integer" },
                                  cows: { type: "integer" },
                                  isCorrect: { type: "boolean" },
                                  guessNumber: { type: "integer" },
                                },
                              },
                              game: { $ref: "#/components/schemas/Game" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Invalid guess or not your turn",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not your player",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/game/{gameId}/players/{playerId}/guesses": {
        get: {
          tags: ["Player Actions"],
          summary: "Get player guesses",
          description:
            "Get all guesses made by a specific player (requires authentication and player ownership)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "gameId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Game ID",
            },
            {
              name: "playerId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Player ID",
            },
          ],
          responses: {
            200: {
              description: "Guesses retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              guesses: {
                                type: "array",
                                items: { $ref: "#/components/schemas/Guess" },
                              },
                              totalGuesses: { type: "integer" },
                              playerId: { type: "string" },
                              gameId: { type: "string" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not your player",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Player or game not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication endpoints",
      },
      {
        name: "Games",
        description: "Game management endpoints",
      },
      {
        name: "Player Actions",
        description: "Player-specific game actions",
      },
    ],
  },
  apis: [], // We're defining everything inline
};

const specs = swaggerJsdoc(options);

module.exports = specs;
