// @ts-ignore
import socket from "@/utils/socket";
import { toast } from "sonner";

export interface JoinGameState {
  roomCode: string;
  roomId: string;
  playerId: string;
  playerName: string;
  isPlayerJoined: boolean; // Indicates if the player has successfully joined
  isLoading: boolean;
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
  };

  private listeners: Array<(state: JoinGameState) => void> = [];

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
  async joinGame(): Promise<void> {
    const validationError = this.validateInput();
    if (validationError) {
      toast(validationError);
      return;
    }

    // Check if player is already joined
    if (this.state.isPlayerJoined) {
      toast("Already joined", {
        description: "You have already joined this game.",
      });
      return;
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
            toast(error);
          } else {
            this.state.roomId = roomId || "";
            this.state.playerId = playerId || "";
            this.state.isPlayerJoined = true; // Set to true on successful join
            console.log("Updated joinGameModel state:", {
              roomId: this.state.roomId,
              playerId: this.state.playerId,
              isPlayerJoined: this.state.isPlayerJoined,
            });
            toast("Successfully joined the game!");
          }

          this.notifyListeners();
          resolve();
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

// Join Game When host starts the game
socket.on("gameStarted", (data: { roomId: string; roomCode: string }) => {
  const { roomId, roomCode } = data;
  const joinGameState = joinGameModel.getState();
  if (joinGameState.roomId === roomId && joinGameState.roomCode === roomCode) {
    // joinGameModel.setRoomCode(roomCode);
    // joinGameModel.reset();
    toast("Game has started! You can now play.");
  }
});

// Export singleton instance
export const joinGameModel = new JoinGameModel();
