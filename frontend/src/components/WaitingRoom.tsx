import { useState, useEffect } from "react";
import { hostGameModel } from "@/components/model/hostGameModel";
import { joinGameModel } from "@/components/model/joinGameModel";
import {
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription, // Add this import
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Users,
  Copy,
  Gamepad2,
  Clock,
  User,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import socket from "@/utils/socket";

interface WaitingRoomProps {
  isHost: boolean;
  onClose: () => void;
}

const WaitingRoom = ({ isHost, onClose }: WaitingRoomProps) => {
  const [hostState, setHostState] = useState(hostGameModel.getState());
  const [joinState, setJoinState] = useState(joinGameModel.getState());
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeHost = hostGameModel.subscribe(setHostState);
    const unsubscribeJoin = joinGameModel.subscribe(setJoinState);

    // Listen for game start event for all players
    const handleMoveToGame = (gameData: any) => {
      console.log("Move to game event received:", gameData);
      console.log("Current joinState:", joinState);
      console.log("Current hostState:", hostState);

      if (isHost) {
        const navigationState = {
          roomCode: hostState.roomCode,
          roomId: hostState.roomId,
          playerId: socket.id,
          isHost: true,
        };
        console.log("Host navigating with state:", navigationState);

        navigate(`/game/${hostState.roomId}`, {
          state: navigationState,
        });
      } else {
        // Get roomId from multiple sources for joined players
        const roomId = joinState.roomId || gameData.roomId;
        const roomCode = joinState.roomCode || gameData.roomCode;

        if (!roomId) {
          console.error("No roomId available for navigation");
          console.log("Available data:", { joinState, gameData });
          toast.error("Navigation Error", {
            description: "Room ID is missing. Please rejoin the game.",
          });
          return;
        }

        const navigationState = {
          roomCode: roomCode,
          roomId: roomId,
          playerId: joinState.playerId,
          isHost: false,
        };
        console.log("Player navigating with state:", navigationState);

        navigate(`/game/${roomId}`, {
          state: navigationState,
        });
      }
    };

    // Add socket listener for move to game event
    socket.on("moveToGame", handleMoveToGame);

    return () => {
      unsubscribeHost();
      unsubscribeJoin();
      socket.off("moveToGame", handleMoveToGame);
    };
  }, [
    isHost,
    hostState.roomId,
    hostState.roomCode,
    joinState.roomId,
    joinState.roomCode,
    joinState.playerId,
    navigate,
  ]);

  const roomCode = isHost ? hostState.roomCode : joinState.roomCode;
  const players = isHost ? hostState.players : [];
  const currentPlayerName = localStorage.getItem("playerName") || "Guest";

  const handleStartGame = () => {
    if (isHost) {
      console.log("Host starting game...");
      toast.success("Game Starting!", {
        description: "The game is starting now!",
      });
      hostGameModel.startGame();
    }
  };

  const handleClose = () => {
    // Don't reset the models when closing - this clears important data
    // if (isHost) {
    //   hostGameModel.closeHosting();
    // } else {
    //   joinGameModel.reset(); // ❌ This is clearing roomId and roomCode!
    // }
    onClose();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AlertDialogContent className="max-w-md rounded-lg border-0 bg-gradient-to-b from-gray-900 to-gray-800 p-0 overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="flex items-center gap-2 text-white">
            {isHost ? (
              <>
                <Gamepad2 className="h-5 w-5" />
                <span>Your Game Lobby</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                <span>Waiting for Host</span>
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 text-sm">
            {isHost
              ? "Share your room code with friends to invite them to the game"
              : "Waiting for the host to start the game"}
          </AlertDialogDescription>
        </AlertDialogHeader>
      </div>

      <div className="p-6 space-y-6">
        {/* Room Code Section */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h3 className="text-sm font-medium text-gray-300">Room Code</h3>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="relative">
              <div className="text-4xl font-bold tracking-widest bg-gray-800/50 px-6 py-3 rounded-lg text-purple-300">
                {roomCode}
              </div>
              {isHost && (
                <button
                  onClick={copyToClipboard}
                  className="absolute -right-2 -top-2 bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-all"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4 text-gray-300" />
                </button>
              )}
            </div>
          </div>
          {copied && (
            <p className="text-xs text-green-400 mt-1">Copied to clipboard!</p>
          )}
        </div>

        {/* Players List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="h-5 w-5" />
            {isHost ? (
              <h3 className="font-medium">Players ({players.length}/2)</h3>
            ) : (
              <h3 className="font-medium">Players ({players.length + 1}/2)</h3>
            )}
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            {/* Host */}
            <div className="flex items-center gap-3 p-2 bg-gray-700/30 rounded">
              <div className="bg-purple-600/20 p-2 rounded-full">
                <User className="h-4 w-4 text-purple-300" />
              </div>
              <span className="font-medium text-white">
                {currentPlayerName} {isHost && "(Host)"}
              </span>
              <span
                className={`ml-auto text-xs ${
                  isHost
                    ? "bg-purple-600/30 text-purple-300"
                    : "bg-green-600/30 text-green-300"
                }  px-2 py-1 rounded-full`}
              >
                {isHost ? "Host" : "Player"}
              </span>
            </div>

            {/* Players */}
            {players.length > 0 ? (
              players.map((p, index) => {
                console.log("Player data:", p);
                if (p.name !== currentPlayerName && isHost)
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-gray-700/10 rounded animate-in fade-in"
                    >
                      <div className="bg-green-600/20 p-2 rounded-full">
                        <User className="h-4 w-4 text-green-300" />
                      </div>
                      <span className="font-medium text-gray-200">
                        {p.name}
                      </span>
                      <span className="ml-auto text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded-full">
                        Player
                      </span>
                    </div>
                  );
              })
            ) : (
              <div className="text-center py-8">
                <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
                  {/* Animated loading indicator */}
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin animation-delay-200"></div>
                    <Gamepad2 className="absolute inset-4 w-8 h-8 text-purple-400 animate-pulse" />
                  </div>

                  {/* Text with typing animation */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-gray-100">
                      Waiting for opponent
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Share room code{" "}
                      <span className="font-bold text-purple-300">
                        {roomCode}
                      </span>{" "}
                      with your friend
                    </p>
                  </div>

                  {/* Progress animation */}
                  <div className="w-full max-w-xs bg-gray-800 rounded-full h-2 mt-4">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full w-1/2 animate-pulse"></div>
                  </div>

                  {/* Optional tips section */}
                  <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <span>Pro tip: Send the invite link directly!</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {!isHost && (
          <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/20 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <p>Waiting for host to start the game</p>
          </div>
        )}
      </div>

      <AlertDialogFooter className="px-6 pb-6 pt-0 bg-gray-800/50">
        <AlertDialogCancel
          onClick={handleClose}
          className="border-gray-600 bg-transparent hover:bg-gray-700 text-gray-300"
        >
          {isHost ? "Cancel Game" : "Leave Lobby"}
        </AlertDialogCancel>
        {isHost && (
          <AlertDialogAction
            disabled={!hostGameModel.canStartGame()}
            onClick={handleStartGame}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <div className="flex items-center gap-2">
              Start Game <ArrowRight className="h-4 w-4" />
            </div>
          </AlertDialogAction>
        )}
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default WaitingRoom;
