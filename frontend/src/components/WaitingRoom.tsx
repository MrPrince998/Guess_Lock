import { useState, useEffect } from "react";
import { hostGameModel } from "@/components/model/hostGameModel";
import { joinGameModel } from "@/components/model/joinGameModel";
import {
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Users, Copy, Gamepad2, Clock, User, ArrowRight } from "lucide-react";
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
          playerId: socket.id, // Host uses socket.id
          isHost: true,
        };
        console.log("Host navigating with state:", navigationState);

        navigate(`/game/${hostState.roomId}`, {
          state: navigationState,
        });
      } else {
        // For joined players, try multiple sources for roomId
        const finalRoomId =
          joinState.roomId || gameData.roomId || hostState.roomId;

        if (!finalRoomId) {
          console.error("No roomId available for navigation");
          toast.error("Navigation Error", {
            description: "Room ID is missing. Please rejoin the game.",
          });
          return;
        }
        const navigationState = {
          roomCode: joinState.roomCode,
          roomId: finalRoomId,
          playerId: joinState.playerId, // Use the playerId from joinGame response
          isHost: false,
        };
        console.log("Player navigating with state:", navigationState);

        navigate(`/game/${finalRoomId}`, {
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
  const currentPlayerName = localStorage.getItem("playerName");

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
    if (isHost) {
      hostGameModel.closeHosting();
    } else {
      joinGameModel.reset();
    }
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
            <h3 className="font-medium">Players ({players.length + 1}/2)</h3>
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
              <div className="text-center py-4 text-gray-400">
                <p>Waiting for opponent to join...</p>
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
