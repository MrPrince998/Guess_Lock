// @ts-ignore
import socket from "@/utils/socket";
import { toast } from "sonner";

export interface Player {
  id: string;
  name: string;
}

export interface JoinGameState {
  roomCode: string;
  roomId: string;
  playerId: string;
  playerName: string;
  isPlayerJoined: boolean; // Indicates if the player has successfully joined
  isLoading: boolean;
  players: Player[]; // <-- Add this line
}

export interface JoinGameResponse {
  roomId?: string;
  playerId?: string;
  error?: string;
}

export class JoinGameModel {
  private state: JoinGameState = {
    roomCode: "",
    roomId: "",
    playerId: "",
    playerName: "",
    isPlayerJoined: false,
    isLoading: false,
    players: [],
  };

  private listeners: Array<(state: JoinGameState) => void> = [];

  constructor() {
    // Attach socket listeners in the constructor to ensure `this` context is correct
    socket.on("gameStarted", (data: { roomId: string; roomCode: string }) => {
      const { roomId, roomCode } = data;
      const joinGameState = this.getState();
      if (
        joinGameState.roomId === roomId &&
        joinGameState.roomCode === roomCode
      ) {
        toast("Game has started! You can now play.");
      }
    });

    socket.on("roomData", (data) => {
      // Safely handle possibly undefined data or players
      this.state = {
        ...this.state,
        players: Array.isArray(data && data.players) ? data.players : [],
        // ...other fields if needed...
      };
      this.notifyListeners();
    });
  }

  // Subscribe to state changes
  subscribe(listener: (state: JoinGameState) => void) {
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
  getState(): JoinGameState {
    return { ...this.state };
  }

  // Update room code
  setRoomCode(roomCode: string) {
    this.state.roomCode = roomCode;
    this.notifyListeners();
  }

  // Navigate to waiting room
  navigateToWaitingRoom() {
    const { roomCode, roomId, playerId } = this.state;
    if (!roomId || !playerId) {
      toast.error("Cannot navigate to waiting room", {
        description: "You must join a game first.",
      });
      return;
    } else {
      // Emit event to server to notify players
      socket.emit("moveToWaitingRoom", {
        roomId,
        roomCode,
        playerId,
      });
      console.log("Navigating to waiting room with state:", {
        roomCode,
        roomId,
        playerId,
      });
    }
  }

  // Update player name
  setPlayerName(playerName: string) {
    this.state.playerName = playerName;
    this.notifyListeners();
  }

  // Validate input before joining
  private validateInput(): string | null {
    if (!this.state.roomCode.trim()) {
      return "Room code is required";
    }
    if (!this.state.playerName.trim()) {
      return "Player name is required";
    }
    return null;
  }

  // Join game logic
  async joinGame(): Promise<JoinGameResponse> {
    console.log("=== JOIN GAME MODEL DEBUG ===");
    console.log("Starting joinGame, current state:", this.getState());

    const validationError = this.validateInput();
    if (validationError) {
      toast.error(validationError);
      throw new Error(validationError);
    }

    // Check if player is already joined
    if (this.state.isPlayerJoined) {
      toast("Already joined", {
        description: "You have already joined this game.",
      });
      return { error: "Already joined" };
    }

    this.state.isLoading = true;
    this.notifyListeners();

    return new Promise((resolve) => {
      socket.emit(
        "joinGame",
        this.state.roomCode,
        this.state.playerName,
        ({ roomId, playerId, error }: JoinGameResponse) => {
          console.log("joinGame response:", { roomId, playerId, error });

          this.state.isLoading = false;

          if (error) {
            console.log("Join failed with error:", error);

            toast(error);
            this.notifyListeners();
            // reject(new Error(error));
          } else {
            console.log("Join successful, updating state...");

            this.state.roomId = roomId || "";
            this.state.playerId = playerId || "";
            this.state.isPlayerJoined = true; // Set to true on successful join

            console.log("Updated joinGameModel state:", {
              roomId: this.state.roomId,
              playerId: this.state.playerId,
              isPlayerJoined: this.state.isPlayerJoined,
            });
            toast.success("Successfully joined the game!");
            this.notifyListeners();
            resolve({ roomId, playerId });
          }
        }
      );
    });
  }

  // Reset state
  reset() {
    this.state = {
      roomCode: "",
      roomId: "",
      playerId: "",
      playerName: "",
      isPlayerJoined: false,
      isLoading: false,
      players: [], // Reset players array
    };
    this.notifyListeners();
  }

  // Check if successfully joined
  isJoined(): boolean {
    return (
      this.state.isPlayerJoined && !!(this.state.roomId && this.state.playerId)
    );
  }
}

// Export singleton instance
export const joinGameModel = new JoinGameModel();
