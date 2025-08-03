import { useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  Gamepad2,
  Users,
  Swords,
  Send,
  RotateCw,
  User,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import SetDigitModal from "../model/set-digit-modal";
import { joinGameModel } from "@/components/model/joinGameModel";
import { hostGameModel } from "@/components/model/hostGameModel";
import socket from "@/utils/socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GameScene = () => {
  const location = useLocation();
  const [joinState, setJoinState] = useState(joinGameModel.getState());
  const [hostState, setHostState] = useState(hostGameModel.getState());
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [userSecretNumber, setUserSecretNumber] = useState(
    sessionStorage.getItem("secretNumber")
  );
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);

  // Debugging logs
  useEffect(() => {
    console.log("GameScene state update:", {
      gameStarted,
      opponentReady,
      userSecretNumber,
      currentTurn,
    });
  }, [gameStarted, opponentReady, userSecretNumber, currentTurn]);

  const gameData = location.state || {};
  const isHost = gameData.isHost || false;

  // Get game identifiers with fallbacks
  const roomId =
    gameData.roomId ||
    (isHost ? hostState.roomId : joinState.roomId) ||
    sessionStorage.getItem("roomId");
  const roomCode =
    gameData.roomCode ||
    (isHost ? hostState.roomCode : joinState.roomCode) ||
    sessionStorage.getItem("roomCode");
  const playerId =
    gameData.playerId ||
    (isHost ? socket.id : joinState.playerId) ||
    sessionStorage.getItem("playerId") ||
    socket.id;

  // Handle missing data
  if (!roomId || !playerId) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-4">Missing Game Data</h2>
          <p className="text-gray-400 mb-4">
            Essential game information is missing. Please rejoin the game.
          </p>
          <Button onClick={() => (window.location.href = "/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Socket event handlers
  useEffect(() => {
    const handlePlayerReady = (data: { playerId: string }) => {
      console.log("Player ready:", data.playerId);
      setOpponentReady(true);
      toast.info("Opponent is ready!");
    };

    const handleGameStarted = (data: { currentTurn: string }) => {
      console.log("Game started! Current turn:", data.currentTurn);
      setGameStarted(true);
      setCurrentTurn(data.currentTurn);
      toast.success("Game started!");
    };

    const handleTurnChange = (data: { currentTurn: string }) => {
      console.log("Turn changed to:", data.currentTurn);
      setCurrentTurn(data.currentTurn);
      toast.info(
        data.currentTurn === playerId ? "Your turn!" : "Opponent's turn"
      );
    };

    socket.on("playerReady", handlePlayerReady);
    socket.on("gameStarted", handleGameStarted);
    socket.on("turnChanged", handleTurnChange);

    return () => {
      socket.off("playerReady", handlePlayerReady);
      socket.off("gameStarted", handleGameStarted);
      socket.off("turnChanged", handleTurnChange);
    };
  }, [playerId]);

  // Handle secret number submission
  const handleSecretSubmitted = useCallback(
    (number: string) => {
      setUserSecretNumber(number);
      sessionStorage.setItem("secretNumber", number);
      socket.emit("playerReady", { playerId, roomId });
    },
    [playerId, roomId]
  );

  // Get player names
  const currentPlayerName = localStorage.getItem("playerName") || "Player";
  const opponentName = isHost
    ? hostState.players.find((p) => p.id !== playerId)?.name || "Opponent"
    : "Host";

  // Render different states
  if (!userSecretNumber) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <SetDigitModal
          roomId={roomId}
          playerId={playerId}
          onSubmit={handleSecretSubmitted}
        />
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <WaitingForOpponent
            key="waiting-for-opponent"
            roomCode={roomCode}
            opponentReady={opponentReady}
            isHost={isHost}
            gameStarted={gameStarted}
          />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <GamePlayArea
      isHost={isHost}
      currentPlayerName={currentPlayerName}
      opponentName={opponentName}
      playerId={playerId}
      roomId={roomId}
      currentTurn={currentTurn}
    />
  );
};

// WaitingForOpponent Component
const WaitingForOpponent = ({
  roomCode,
  opponentReady,
  isHost,
  gameStarted,
}: {
  roomCode?: string;
  opponentReady: boolean;
  isHost: boolean;
  gameStarted: boolean;
}) => {
  const [showCopied, setShowCopied] = useState(false);

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    // <AnimatePresence mode="wait">
    <motion.div
      // key="waiting-for-opponent"
      // initial={{ opacity: 0, y: 20 }}
      // animate={{ opacity: 1, y: 0 }}
      // exit={{ opacity: 0, y: -20 }}
      // transition={{ duration: 0.3 }}
      className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-8 max-w-md w-full shadow-2xl text-center"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-md"></div>
          <div
            className={cn(
              "p-4 rounded-full relative",
              opponentReady ? "bg-green-500/20" : "bg-purple-500/20"
            )}
          >
            <Gamepad2
              className={cn(
                "h-8 w-8",
                opponentReady ? "text-green-400" : "text-purple-400"
              )}
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white">
          {opponentReady ? "Ready to Start!" : "Waiting for Opponent"}
        </h1>
        <p className="text-gray-400">
          {opponentReady
            ? "Both players are ready!"
            : isHost
            ? "Share the room code below"
            : "Waiting for host to start"}
        </p>

        <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              opponentReady
                ? "bg-gradient-to-r from-green-500 to-emerald-500 w-full"
                : "bg-gradient-to-r from-purple-500 to-indigo-500 w-1/2"
            )}
          ></div>
        </div>

        {roomCode && (
          <div className="mt-6 w-full">
            <div className="flex items-center justify-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Input
                  value={roomCode}
                  readOnly
                  className="text-center font-mono text-lg bg-gray-700 border-gray-600"
                />
                <button
                  onClick={copyRoomCode}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCopied ? "✓" : "Copy"}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this code with your friend
            </p>
          </div>
        )}
      </div>
    </motion.div>
    // </AnimatePresence>
  );
};

// GamePlayArea Component
const GamePlayArea = ({
  isHost,
  currentPlayerName,
  opponentName,
  playerId,
  roomId,
  currentTurn,
}: {
  isHost: boolean;
  currentPlayerName: string;
  opponentName: string;
  playerId: string;
  roomId: string;
  currentTurn: string | null;
}) => {
  const [guess, setGuess] = useState("");
  const [guessHistory, setGuessHistory] = useState<
    Array<{
      guess: string;
      result: { correctPosition: number; correctDigit: number };
    }>
  >([]);
  const [isMyTurn, setIsMyTurn] = useState(currentTurn === playerId);

  interface GuessItem {
    guess: string;
    result: { correctPosition: number; correctDigit: number };
  }
  useEffect(() => {
    setIsMyTurn(currentTurn === playerId);
  }, [currentTurn, playerId]);

  const handleSubmitGuess = () => {
    if (guess.length !== 4 || !/^\d{4}$/.test(guess)) {
      toast.error("Please enter a valid 4-digit number");
      return;
    }

    socket.emit(
      "makeGuess",
      {
        roomId,
        playerId,
        guess,
      },
      (response: {
        success: boolean;
        result?: { correctPosition: number; correctDigit: number };
      }) => {
        if (response.success && response.result) {
          setGuessHistory((prev) => [
            ...prev,
            {
              guess,
              result: response.result,
            } as GuessItem,
          ]);
          setGuess("");
        }
      }
    );
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 p-4 overflow-hidden">
      <div className="container mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-purple-400" />
            <span className="text-white font-medium">
              Room: {roomId.substring(0, 8)}...
            </span>
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-sm flex items-center gap-1",
              isMyTurn
                ? "bg-green-500/20 text-green-400"
                : "bg-gray-700 text-gray-400"
            )}
          >
            {isMyTurn ? (
              <>
                <User className="h-3 w-3" />
                <span>Your Turn</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>Opponent's Turn</span>
              </>
            )}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Player 1 Panel */}
          <PlayerPanel
            name={currentPlayerName}
            isCurrentPlayer={true}
            isTurn={isMyTurn}
          />

          {/* Game Board */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex flex-col">
            <h2 className="text-center text-white font-bold mb-4">
              Guess History
            </h2>

            {guessHistory.length > 0 ? (
              <div className="space-y-2 flex-1 overflow-y-auto">
                {guessHistory.map((item, index) => (
                  <GuessResult
                    key={index}
                    guess={item.guess}
                    result={item.result}
                  />
                ))}
              </div>
            ) : (
              <div className="flex-1 grid place-items-center text-gray-500">
                <p>No guesses yet</p>
              </div>
            )}

            {/* Guess Input */}
            <div className="mt-4">
              <div className="flex gap-2">
                <Input
                  value={guess}
                  onChange={(e) =>
                    setGuess(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="Enter 4-digit guess"
                  className="flex-1 text-center font-mono text-lg"
                  disabled={!isMyTurn}
                />
                <Button
                  onClick={handleSubmitGuess}
                  disabled={!isMyTurn || guess.length !== 4}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Guess
                </Button>
              </div>
              {!isMyTurn && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Wait for your turn to guess
                </p>
              )}
            </div>
          </div>

          {/* Player 2 Panel */}
          <PlayerPanel
            name={opponentName}
            isCurrentPlayer={false}
            isTurn={!isMyTurn}
          />
        </div>
      </div>
    </div>
  );
};

// PlayerPanel Component
const PlayerPanel = ({
  name,
  isCurrentPlayer,
  isTurn,
}: {
  name: string;
  isCurrentPlayer: boolean;
  isTurn: boolean;
}) => {
  return (
    <div
      className={cn(
        "bg-gray-800/50 border rounded-xl p-6 flex flex-col items-center",
        isTurn ? "border-purple-500" : "border-gray-700"
      )}
    >
      <div className="relative mb-4">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${name}`}
          />
          <AvatarFallback>
            <User className="h-12 w-12 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        {isTurn && (
          <div className="absolute -bottom-2 -right-2 bg-purple-500 rounded-full p-1.5">
            <RotateCw className="h-4 w-4 text-white animate-spin" />
          </div>
        )}
      </div>

      <h3
        className={cn(
          "text-lg font-bold mb-1",
          isCurrentPlayer ? "text-purple-400" : "text-white"
        )}
      >
        {name}
      </h3>
      <span className="text-xs text-gray-400">
        {isCurrentPlayer ? "You" : "Opponent"}
      </span>
    </div>
  );
};

// GuessResult Component
const GuessResult = ({
  guess,
  result,
}: {
  guess: string;
  result: { correctPosition: number; correctDigit: number };
}) => {
  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex justify-between items-center">
        <div className="font-mono text-lg font-bold text-white">{guess}</div>
        <div className="flex gap-2">
          <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
            {result.correctPosition} correct
          </div>
          <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
            {result.correctDigit} misplaced
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScene;
