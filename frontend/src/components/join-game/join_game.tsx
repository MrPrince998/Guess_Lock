import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { joinGameModel } from "@/components/model/joinGameModel";
import { useState, useEffect } from "react";
import WaitingRoom from "@/components/WaitingRoom";
import { DoorOpen, Gamepad2, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const JoinGame = () => {
  const [state, setState] = useState(joinGameModel.getState());
  const [currentPlayerName, setCurrentPlayerName] = useState(
    localStorage.getItem("playerName") || ""
  );

  useEffect(() => {
    const unsubscribe = joinGameModel.subscribe(setState);
    return unsubscribe;
  }, []);

  // Add debugging for component renders
  console.log("JoinGame rendering with state:", state);

  // const handleJoinGame = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   console.log("=== JOIN GAME DEBUG ===");
  //   console.log("Current state before join:", state);

  //   if (!state.roomCode || state.roomCode.length < 4) {
  //     toast.error("Invalid Room Code", {
  //       description: "Please enter a valid 4-character room code",
  //     });
  //     return;
  //   }

  //   const playerName = currentPlayerName || "Guest";
  //   joinGameModel.setPlayerName(playerName);
  //   localStorage.setItem("playerName", playerName);

  //   try {
  //     console.log("Calling joinGame...");
  //     // setState(joinGameModel.isJoined(true));
  //     const response = await joinGameModel.joinGame();
  //     console.log("Join Game Response:", response);
  //     console.log("State after joinGame:", joinGameModel.getState());

  //     // Force a state update to make sure the component re-renders
  //     setState(joinGameModel.getState());

  //     if (response && !response.error) {
  //       toast.success("Joined Successfully", {
  //         description: `Entering room ${state.roomCode}`,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Join game error:", error);
  //     toast.error("Join Failed", {
  //       description:
  //         "Couldn't join the room. Please check the code and try again.",
  //     });
  //   }
  // };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.roomCode || state.roomCode.length < 4) {
      toast.error("Invalid Room Code", {
        description: "Please enter a valid 4-character room code",
      });
      return;
    }

    const playerName = currentPlayerName || "Guest";
    joinGameModel.setPlayerName(playerName);
    localStorage.setItem("playerName", playerName);

    try {
      const response = await joinGameModel.joinGame();
      console.log("Join Game Response:", response);

      if (response && !response.error) {
        // Force immediate state update
        setState((prev) => ({
          ...prev,
          isPlayerJoined: true,
          roomId: response.roomId || prev.roomId,
          playerId: response.playerId || prev.playerId,
        }));

        toast.success("Joined Successfully", {
          description: `Entering room ${state.roomCode}`,
        });
      }
    } catch (error) {
      console.error("Join game error:", error);
      toast.error("Join Failed", {
        description:
          "Couldn't join the room. Please check the code and try again.",
      });
    }
  };

  const handleClose = () => {
    joinGameModel.reset();
  };

  // useEffect(() => {
  //   if (state.isPlayerJoined) {
  //     // Automatically navigate to the waiting room after joining
  //     joinGameModel.navigateToWaitingRoom();
  //   }
  // }, [state.isPlayerJoined]);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="w-full bg-transparent hover:bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors"
        >
          <DoorOpen className="mr-2 h-4 w-4" />
          Join Game
        </Button>
      </AlertDialogTrigger>

      {!state.isPlayerJoined && (
        <AlertDialogContent className="border-0 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg shadow-2xl max-w-md">
          <div className="space-y-6">
            {/* Header */}
            <AlertDialogHeader>
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Gamepad2 className="h-5 w-5" />
                <AlertDialogTitle className="text-white">
                  Join a Game
                </AlertDialogTitle>
              </div>
              <p className="text-sm text-gray-400">
                Enter the room code provided by your friend
              </p>
            </AlertDialogHeader>

            {/* Form */}
            <form onSubmit={handleJoinGame} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Name
                </label>
                <Input
                  placeholder="Player name"
                  value={currentPlayerName}
                  onChange={(e) => setCurrentPlayerName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <DoorOpen className="h-4 w-4" />
                  Room Code
                </label>
                <Input
                  placeholder="ABCD"
                  value={state.roomCode}
                  onChange={(e) =>
                    joinGameModel.setRoomCode(e.target.value.toUpperCase())
                  }
                  maxLength={4}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 text-center text-xl font-mono tracking-widest h-14"
                />
              </div>

              <AlertDialogFooter className="pt-4">
                <AlertDialogCancel className="border-gray-700 bg-transparent hover:bg-gray-700 text-gray-300">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  disabled={state.isLoading || !state.roomCode}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  {state.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Join Game"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </div>
        </AlertDialogContent>
      )}

      {state.isPlayerJoined && (
        <WaitingRoom isHost={false} onClose={handleClose} />
      )}
    </AlertDialog>
  );
};

export default JoinGame;
