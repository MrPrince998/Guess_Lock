# Bulls and Cows Game - Data Flow Diagram

## System Architecture Overview

```mermaid
graph TB
    %% External Components
    Client[Client Application]
    DB[(MariaDB Database)]

    %% Main Application Layer
    Server[Express.js Server]

    %% Middleware Layers
    Security[Security Middleware<br/>helmet, cors, morgan]
    Auth[Authentication Layer<br/>JWT Validation]
    DataFilter[Data Filtering Layer<br/>filterGameData, filterPlayerData]
    AccessControl[Access Control<br/>gameAccessMiddleware, playerAccessMiddleware]

    %% Route Handlers
    AuthRoutes[Auth Routes<br/>/api/auth/*]
    GameRoutes[Game Routes<br/>/api/game/*]

    %% Controllers
    AuthController[Auth Controller<br/>signup, login, profile]
    GameController[Game Controller<br/>game operations]

    %% Database Layer
    MariaDBClient[MariaDB Client<br/>Connection Pool]

    %% Data Flow
    Client --> Server
    Server --> Security
    Security --> Auth
    Auth --> DataFilter
    DataFilter --> AccessControl
    AccessControl --> AuthRoutes
    AccessControl --> GameRoutes

    AuthRoutes --> AuthController
    GameRoutes --> GameController

    AuthController --> MariaDBClient
    GameController --> MariaDBClient
    MariaDBClient --> DB

    %% Response Flow
    DB --> MariaDBClient
    MariaDBClient --> AuthController
    MariaDBClient --> GameController
    AuthController --> Client
    GameController --> Client
```

## Authentication Data Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant AM as Auth Middleware
    participant AC as Auth Controller
    participant DB as MariaDB

    %% User Registration
    Note over C,DB: User Registration Flow
    C->>S: POST /api/auth/signup
    S->>AC: Forward request
    AC->>AC: Validate input
    AC->>AC: Hash password (bcryptjs)
    AC->>DB: INSERT INTO users
    DB-->>AC: User created
    AC->>AC: Generate JWT token
    AC-->>C: Return token + user data

    %% User Login
    Note over C,DB: User Login Flow
    C->>S: POST /api/auth/login
    S->>AC: Forward request
    AC->>DB: SELECT user by email
    DB-->>AC: User data
    AC->>AC: Verify password
    AC->>AC: Generate JWT token
    AC-->>C: Return token + user data

    %% Protected Route Access
    Note over C,DB: Protected Route Access
    C->>S: GET /api/auth/profile (with JWT)
    S->>AM: Validate JWT token
    AM->>AM: Verify token signature
    AM->>DB: Optional user lookup
    AM->>AC: Forward with user context
    AC-->>C: Return user profile
```

## Game Creation and Management Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant GC as Game Controller
    participant DF as Data Filter
    participant DB as MariaDB

    %% Game Creation
    Note over C,DB: Game Creation Flow
    C->>S: POST /api/game (with auth token)
    S->>GC: Create game request
    GC->>GC: Generate game code
    GC->>GC: Generate player ID
    GC->>DB: INSERT INTO games
    GC->>DB: INSERT INTO players
    DB-->>GC: Game and player created
    GC-->>C: Return game data + player ID

    %% Game Listing
    Note over C,DB: Game Listing Flow
    C->>S: GET /api/game?status=waiting
    S->>DF: Apply data filters
    DF->>GC: Forward filtered request
    GC->>DB: SELECT games with filters
    DB-->>GC: Game list
    GC->>DF: Raw game data
    DF->>DF: Filter sensitive data
    DF-->>C: Filtered game list

    %% Join Game
    Note over C,DB: Join Game Flow
    C->>S: POST /api/game/join-by-code
    S->>GC: Join game request
    GC->>DB: SELECT game by code
    DB-->>GC: Game data
    GC->>GC: Validate game joinable
    GC->>DB: INSERT INTO players
    GC->>DB: UPDATE game player count
    DB-->>GC: Updated game state
    GC-->>C: Return updated game + player ID
```

## Gameplay Data Flow

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant P2 as Player 2
    participant S as Server
    participant AC as Access Control
    participant GC as Game Controller
    participant CMP as Compare Helper
    participant DB as MariaDB

    %% Set Secret Numbers
    Note over P1,DB: Setup Phase
    P1->>S: POST /api/game/{id}/players/{pid}/secret
    S->>AC: Validate player ownership
    AC->>GC: Forward request
    GC->>DB: UPDATE player secret_number
    DB-->>GC: Updated
    GC-->>P1: Success

    P2->>S: POST /api/game/{id}/players/{pid}/secret
    S->>AC: Validate player ownership
    AC->>GC: Forward request
    GC->>DB: UPDATE player secret_number
    GC->>DB: UPDATE game status to 'playing'
    DB-->>GC: Game ready
    GC-->>P2: Game started

    %% Gameplay Loop
    Note over P1,DB: Gameplay Phase
    P1->>S: POST /api/game/{id}/players/{pid}/guess
    S->>AC: Validate turn + ownership
    AC->>GC: Forward guess
    GC->>DB: SELECT opponent secret number
    DB-->>GC: Opponent secret
    GC->>CMP: Compare guess vs secret
    CMP-->>GC: Bulls & Cows result
    GC->>DB: INSERT INTO guesses
    GC->>DB: UPDATE game current_turn
    GC->>GC: Check win condition
    alt Correct Guess
        GC->>DB: UPDATE game winner
        GC-->>P1: You won!
    else Continue Game
        GC-->>P1: Guess result
        Note over P2: P2's turn now
    end
```

## Database Schema and Data Relationships

```mermaid
erDiagram
    USERS {
        varchar id PK
        varchar email UK
        varchar username
        varchar password
        timestamp created_at
        int games_played
        int games_won
    }

    GAMES {
        varchar id PK
        varchar code UK
        varchar host_player_id FK
        enum status
        varchar current_turn_player_id FK
        varchar winner_player_id FK
        timestamp created_at
        timestamp updated_at
    }

    PLAYERS {
        varchar id PK
        varchar game_id FK
        varchar user_id FK
        varchar name
        boolean is_host
        varchar secret_number
        boolean has_secret_number
        int score
        timestamp joined_at
    }

    GUESSES {
        varchar id PK
        varchar player_id FK
        varchar game_id FK
        varchar guess_number
        int bulls
        int cows
        boolean is_correct
        timestamp created_at
    }

    USERS ||--o{ PLAYERS : "can create"
    GAMES ||--|| PLAYERS : "hosted by"
    GAMES ||--o{ PLAYERS : "contains"
    GAMES ||--o{ GUESSES : "has"
    PLAYERS ||--o{ GUESSES : "makes"
    PLAYERS }o--|| USERS : "belongs to"
```

## Security and Access Control Flow

```mermaid
graph TB
    Request[Incoming Request]

    %% Security Layers
    Helmet[Helmet Security Headers]
    CORS[CORS Policy Check]
    RateLimit[Rate Limiting]

    %% Authentication Layers
    OptionalAuth{Optional Auth?}
    RequiredAuth{Required Auth?}
    JWTValidation[JWT Token Validation]

    %% Authorization Layers
    GameAccess{Game Access Check}
    PlayerAccess{Player Ownership Check}

    %% Data Protection
    DataFilter[Data Filtering]

    %% Route Handlers
    PublicRoute[Public Route Handler]
    ProtectedRoute[Protected Route Handler]

    Request --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> OptionalAuth

    OptionalAuth -->|No Auth Required| DataFilter
    OptionalAuth -->|Auth Required| RequiredAuth

    RequiredAuth --> JWTValidation
    JWTValidation --> GameAccess

    GameAccess -->|Game Route| PlayerAccess
    GameAccess -->|General Route| DataFilter

    PlayerAccess --> DataFilter
    DataFilter --> ProtectedRoute
    DataFilter --> PublicRoute

    %% Styling
    classDef security fill:#ffcccc
    classDef auth fill:#ccffcc
    classDef access fill:#ccccff
    classDef data fill:#ffffcc

    class Helmet,CORS,RateLimit security
    class OptionalAuth,RequiredAuth,JWTValidation auth
    class GameAccess,PlayerAccess access
    class DataFilter data
```

## API Response Data Flow

```mermaid
graph TB
    %% Data Sources
    Database[(MariaDB)]

    %% Processing Layers
    Controller[Controller Logic]
    DataFilter[Data Filtering Middleware]
    AccessControl[Access Control Middleware]

    %% Response Types
    PublicData[Public Data Response]
    FilteredData[Filtered Data Response]
    PrivateData[Private Data Response]

    %% Client Types
    UnauthenticatedClient[Unauthenticated Client]
    AuthenticatedClient[Authenticated Client]
    GameParticipant[Game Participant]

    Database --> Controller
    Controller --> AccessControl

    AccessControl --> DataFilter
    DataFilter --> PublicData
    DataFilter --> FilteredData
    DataFilter --> PrivateData

    PublicData --> UnauthenticatedClient
    FilteredData --> AuthenticatedClient
    PrivateData --> GameParticipant

    %% Data Examples
    PublicData -.->|"Game list without secrets<br/>Player names only<br/>Public stats"| UnauthenticatedClient
    FilteredData -.->|"Game details with limited info<br/>Own player data<br/>User profile"| AuthenticatedClient
    PrivateData -.->|"Full game state<br/>Secret numbers<br/>All guess history"| GameParticipant
```

## Bulls and Cows Game Rules & Flow

### **Core Game Mechanics**

- **Room Capacity**: Exactly 2 players per game room
- **Secret Numbers**: Each player sets a unique 4-digit number (no repeated digits)
- **Objective**: Guess the opponent's 4-digit secret number
- **Win Condition**: First player to correctly guess wins the game
- **Scoring**: Bulls (correct digit in correct position) + Cows (correct digit in wrong position)

```mermaid
stateDiagram-v2
    [*] --> GameCreated: Host creates room
    GameCreated --> WaitingForPlayer: Room code generated
    WaitingForPlayer --> PlayersJoined: Second player joins
    PlayersJoined --> SettingSecrets: Both players in room
    SettingSecrets --> Player1SetSecret: Player 1 sets 4-digit number
    SettingSecrets --> Player2SetSecret: Player 2 sets 4-digit number
    Player1SetSecret --> ReadyToPlay: Both secrets set
    Player2SetSecret --> ReadyToPlay: Both secrets set
    ReadyToPlay --> Player1Turn: Random player starts
    ReadyToPlay --> Player2Turn: Random player starts

    Player1Turn --> GuessProcessing: Player 1 makes guess
    Player2Turn --> GuessProcessing: Player 2 makes guess

    GuessProcessing --> CorrectGuess: 4 Bulls (XXXX)
    GuessProcessing --> IncorrectGuess: < 4 Bulls

    CorrectGuess --> GameWon: Winner declared
    IncorrectGuess --> Player2Turn: Switch turns
    IncorrectGuess --> Player1Turn: Switch turns

    GameWon --> [*]: Game ends

    note right of SettingSecrets
        4-digit numbers with
        unique digits only
        (e.g., 1234, 5678)
    end note

    note right of GuessProcessing
        Bulls: Correct digit, correct position
        Cows: Correct digit, wrong position
        Example: Secret=1234, Guess=1324
        Result: 2 Bulls, 2 Cows
    end note
```

### **Detailed 2-Player Game Flow**

```mermaid
sequenceDiagram
    participant H as Host Player
    participant G as Guest Player
    participant S as Server
    participant DB as Database

    Note over H,DB: Room Creation & Setup
    H->>S: POST /api/game (hostName)
    S->>DB: CREATE game + host player
    S-->>H: Game code + player ID

    Note over H,DB: Guest Joins Room
    G->>S: POST /api/game/join-by-code (gameCode, playerName)
    S->>DB: CHECK room capacity < 2
    S->>DB: ADD guest player
    S-->>G: Success + player ID
    S-->>H: Room full notification

    Note over H,DB: Secret Number Setup
    H->>S: POST /game/{id}/players/{pid}/secret (4-digit)
    S->>DB: VALIDATE unique digits
    S->>DB: STORE host secret
    S-->>H: Secret set successfully

    G->>S: POST /game/{id}/players/{pid}/secret (4-digit)
    S->>DB: VALIDATE unique digits
    S->>DB: STORE guest secret
    S->>DB: UPDATE game status = 'playing'
    S->>DB: SET random starting player
    S-->>G: Game started!
    S-->>H: Game started!

    Note over H,DB: Gameplay Loop
    loop Until Someone Wins
        alt Host's Turn
            H->>S: POST /game/{id}/players/{pid}/guess (4-digit)
            S->>DB: GET guest secret number
            S->>S: CALCULATE bulls & cows
            S->>DB: STORE guess result
            alt Correct Guess (4 Bulls)
                S->>DB: SET winner = host
                S-->>H: YOU WON! 🎉
                S-->>G: You lost 😢
            else Wrong Guess
                S->>DB: SET current_turn = guest
                S-->>H: X Bulls, Y Cows
                S-->>G: Your turn now
            end
        else Guest's Turn
            G->>S: POST /game/{id}/players/{pid}/guess (4-digit)
            S->>DB: GET host secret number
            S->>S: CALCULATE bulls & cows
            S->>DB: STORE guess result
            alt Correct Guess (4 Bulls)
                S->>DB: SET winner = guest
                S-->>G: YOU WON! 🎉
                S-->>H: You lost 😢
            else Wrong Guess
                S->>DB: SET current_turn = host
                S-->>G: X Bulls, Y Cows
                S-->>H: Your turn now
            end
        end
    end
```

## Key Data Flow Patterns

### 1. **Authentication Flow**

- **Input**: Email/username + password
- **Process**: Hash validation → JWT generation
- **Output**: JWT token + user profile
- **Storage**: User credentials in MariaDB

### 2. **Game Room Management Flow**

- **Input**: Game code + player name
- **Process**: Validate room capacity (max 2) → Check duplicate names → Add player
- **Output**: Updated game state + player ID
- **Storage**: Player record linked to game room
- **Rules**:
  - ✅ Maximum 2 players per room
  - ✅ Unique player names within room
  - ✅ Room must be in "waiting" status to join

### 3. **4-Digit Secret Number Flow**

- **Input**: 4-digit number string
- **Process**: Validate unique digits → Store encrypted → Check if both players ready
- **Output**: Game status update (waiting → ready → playing)
- **Storage**: Secret number in player record
- **Rules**:
  - ✅ Exactly 4 digits
  - ✅ All digits must be unique (no repeats)
  - ✅ Valid examples: "1234", "5678", "9021"
  - ❌ Invalid examples: "1123", "555", "12345"

### 4. **Guess Processing & Win Detection Flow**

- **Input**: 4-digit guess number
- **Process**: Validate guess → Compare with opponent's secret → Calculate bulls/cows → Check win
- **Output**: Guess result + game state update + winner declaration
- **Storage**: Guess record + updated game state
- **Win Logic**:
  - 🎯 **4 Bulls** = Correct guess = **WINNER!**
  - 🐂 **Bulls**: Correct digit in correct position
  - 🐄 **Cows**: Correct digit in wrong position
  - 🔄 **Turn Switch**: If not winner, opponent's turn

### 5. **Game Room States & Transitions**

```mermaid
graph LR
    Created[Game Created<br/>1 Player] --> Waiting[Waiting for Player<br/>1 Player]
    Waiting --> Joined[Players Joined<br/>2 Players]
    Joined --> Setting[Setting Secrets<br/>0-2 secrets set]
    Setting --> Ready[Ready to Play<br/>Both secrets set]
    Ready --> Playing[Game Playing<br/>Taking turns]
    Playing --> Finished[Game Finished<br/>Winner declared]

    %% Rules
    Created -.->|"Host leaves"| Deleted[Game Deleted]
    Waiting -.->|"Host leaves"| Deleted
    Joined -.->|"Player leaves"| Waiting
    Setting -.->|"Player leaves"| Waiting
    Ready -.->|"Random start"| Playing
    Playing -.->|"4 Bulls = Win"| Finished
```

### 6. **Data Filtering Flow**

- **Input**: Raw database records
- **Process**: Apply user context → Filter sensitive fields
- **Output**: Appropriate data level for user
- **Rules**: Based on authentication status and game participation

### 7. **Access Control Flow**

- **Input**: Request with user context
- **Process**: Validate permissions → Check ownership
- **Output**: Allow/deny + appropriate data scope
- **Levels**: Public → Authenticated → Game participant → Player owner

## Environment Configuration

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=game_user
DB_PASSWORD=secure_password
DB_NAME=guess_the_number

# Authentication Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

This data flow diagram illustrates the complete journey of data through your Bulls and Cows game backend, from client requests through security layers, authentication, business logic, and database storage, ensuring proper access control and data protection at each stage.
