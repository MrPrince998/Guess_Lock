// @ts-ignore
import socket from "@/utils/socket";
import { toast } from "sonner";

export interface Player {
  name: string;
  id?: string;
}

export interface HostGameState {
  roomCode: string;
  roomId: string;
  players: Player[];
  isHosting: boolean;
  isLoading: boolean;
  hostName: string;
}

export interface CreateGameResponse {
  roomCode: string;
  roomId: string;
  error?: string;
}

export class HostGameModel {
  private state: HostGameState = {
    roomCode: "",
    roomId: "",
    players: [],
    isHosting: false,
    isLoading: false,
    hostName: "",
  };

  private listeners: Array<(state: HostGameState) => void> = [];
  private socketListenersInitialized = false;

  constructor() {
    // Don't initialize socket listeners here, do it when hosting starts
  }

  // Initialize socket listeners
  private initializeSocketListeners() {
    // Prevent duplicate listeners
    if (this.socketListenersInitialized) {
      return;
    }

    console.log("Initializing socket listeners for host");

    // Test socket connection
    socket.on("connect", () => {
      console.log("Host socket connected:", socket.id);
    });

    socket.on("playerJoined", (playerName: string) => {
      console.log("Player joined event received:", playerName);
      console.log(
        "Current room state:",
        this.state.roomId,
        this.state.roomCode
      );
      this.addPlayer({ name: playerName });
    });

    socket.on("playerLeft", (playerName: string) => {
      console.log("Player left event received:", playerName);
      this.removePlayer(playerName);
    });

    socket.on("playerDisconnected", (playerName: string) => {
      console.log("Player disconnected event received:", playerName);
      this.removePlayer(playerName);
    });

    socket.on("roomData", (data) => {
      // data.players should be an array of { id, name }
      this.state = {
        ...this.state,
        players: data.players,
        // ...other fields if needed...
      };
      this.notifyListeners();
    });

    this.socketListenersInitialized = true;
  }

  // Subscribe to state changes
  subscribe(listener: (state: HostGameState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  // Get current state
  getState(): HostGameState {
    return { ...this.state };
  }

  // Set host name
  setHostName(hostName: string) {
    this.state.hostName = hostName;
    this.notifyListeners();
  }

  // Add player to the waiting room
  private addPlayer(player: Player) {
    console.log("Adding player:", player);
    const existingPlayer = this.state.players.find(
      (p) => p.name === player.name
    );
    console.log("Existing player:", existingPlayer);
    if (!existingPlayer) {
      this.state.players.push(player);
      console.log("Player added. Current players:", this.state.players);
      this.notifyListeners();
      toast(`${player.name} joined the game!`);
    } else {
      console.log("Player already exists:", existingPlayer);
    }
  }

  // Remove player from the waiting room
  private removePlayer(playerName: string) {
    this.state.players = this.state.players.filter(
      (p) => p.name !== playerName
    );
    this.notifyListeners();
    toast(`${playerName} left the game`);
  }

  // Create a new game
  async createGame(): Promise<void> {
    const currentHostName = localStorage.getItem("playerName");
    const hostName = currentHostName || "Guest";

    this.setHostName(hostName);
    this.state.isLoading = true;
    this.notifyListeners();

    return new Promise((resolve) => {
      socket.emit("createGame", hostName, (response: CreateGameResponse) => {
        this.state.isLoading = false;

        if (response.error) {
          toast(response.error);
        } else {
          this.state.roomId = response.roomId;
          this.state.roomCode = response.roomCode;
          this.state.isHosting = true;

          // Add the host as the first player
          this.addPlayer({ name: hostName });

          // Store in session storage
          sessionStorage.setItem("roomId", response.roomId);
          sessionStorage.setItem("roomCode", response.roomCode);

          toast("Game Created!", {
            description: `Room Code: ${response.roomCode}`,
          });

          console.log(
            "Game created successfully. Room ID:",
            response.roomId,
            "Room Code:",
            response.roomCode
          );

          // Initialize socket listeners AFTER successfully creating the game
          this.initializeSocketListeners();
        }

        this.notifyListeners();
        resolve();
      });
    });
  }

  // Start the game
  startGame() {
    if (!this.canStartGame()) {
      toast("Need at least 2 players (including host) to start the game!");
      return;
    }

    console.log("Starting game with players:", this.state.players);

    // Emit an event that the backend will broadcast to all players in the room
    socket.emit("initiateGameStart", {
      roomId: this.state.roomId,
    });

    toast("Moving to game...");
  }

  // Close/cancel hosting
  closeHosting() {
    console.log("Closing hosting. Current players:", this.state.players);

    this.state.roomCode = "";
    this.state.roomId = "";
    this.state.players = []; // Clear all players including host
    this.state.isHosting = false;

    // Emit leave game event
    socket.emit("leaveGame");

    // Clear session storage
    sessionStorage.removeItem("roomId");
    sessionStorage.removeItem("roomCode");

    // Clean up socket listeners
    this.cleanup();

    this.notifyListeners();
  }

  // Get player count
  getPlayerCount(): number {
    return this.state.players.length;
  }

  // Check if game can be started
  canStartGame(): boolean {
    // Need at least 2 players total (host + 1 other player) to start the game
    const canStart = this.state.players.length >= 2 && this.state.isHosting;
    console.log(
      "Can start game:",
      canStart,
      "Players:",
      this.state.players.length,
      "Is hosting:",
      this.state.isHosting
    );
    return canStart;
  }

  // Cleanup socket listeners
  cleanup() {
    if (this.socketListenersInitialized) {
      console.log("Cleaning up socket listeners");
      socket.off("connect");
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("playerDisconnected");
      socket.off("roomData");
      this.socketListenersInitialized = false;
    }
  }
}

// Export singleton instance
export const hostGameModel = new HostGameModel();
