import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Gamepad2, Users, Swords, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SetDigitModal from "../model/set-digit-modal";
import { joinGameModel } from "@/components/model/joinGameModel";
import { hostGameModel } from "@/components/model/hostGameModel";
import socket from "@/utils/socket";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import UserChatModal from "../UserChatModal/UserChatModal";

const GameScene = () => {
  const location = useLocation();
  const [joinState, setJoinState] = useState(joinGameModel.getState());
  const [hostState, setHostState] = useState(hostGameModel.getState());
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);

  // Use state for userSecretNumber so it triggers re-renders
  const [userSecretNumber, setUserSecretNumber] = useState(
    sessionStorage.getItem("secretNumber")
  );

  // Add debugging for navigation state
  console.log("=== GameScene Navigation Debug ===");
  console.log("location.state:", location.state);
  console.log("joinState:", joinState);
  console.log("hostState:", hostState);

  const gameData = location.state || {};
  const isHost = gameData.isHost || false;

  // Get roomId and roomCode from multiple sources with sessionStorage fallback
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

  console.log("=== Computed Values ===");
  console.log("roomId:", roomId);
  console.log("roomCode:", roomCode);
  console.log("playerId:", playerId);
  console.log("isHost:", isHost);

  // Early return if essential data is missing
  if (!roomId || !playerId) {
    console.error("❌ Missing essential data:", { roomId, playerId });
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-4">Missing Game Data</h2>
          <p className="text-gray-400 mb-4">
            Room ID or Player ID is missing. Please rejoin the game.
          </p>
          <Button onClick={() => (window.location.href = "/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Debug what component will render
  if (!userSecretNumber) {
    console.log("❌ Will render SetDigitModal - no secret number");
  } else if (!gameStarted) {
    console.log("⏳ Will render WaitingForOpponent - game not started");
  } else {
    console.log("🎮 Will render GameStartPanel - game started!");
  }

  useEffect(() => {
    console.log("Setting up socket listeners...");

    const unsubJoin = joinGameModel.subscribe(setJoinState);
    const unsubHost = hostGameModel.subscribe(setHostState);

    // Listen for game events
    const handlePlayerReady = (data: any) => {
      console.log("🟢 Player ready event received:", data);
      setOpponentReady(true);
    };

    const handleGameStarted = (data: any) => {
      console.log("🎮 Game started event received:", data);
      setGameStarted(true);
    };

    // Remove any existing listeners first
    socket.off("playerReady");
    socket.off("gameStarted");

    // Add new listeners
    socket.on("playerReady", handlePlayerReady);
    socket.on("gameStarted", handleGameStarted);

    console.log("Socket listeners attached");

    return () => {
      console.log("Cleaning up socket listeners");
      unsubJoin();
      unsubHost();
      socket.off("playerReady", handlePlayerReady);
      socket.off("gameStarted", handleGameStarted);
    };
  }, []);

  // Add useEffect to monitor sessionStorage changes
  useEffect(() => {
    const checkSecretNumber = () => {
      const secretFromStorage = sessionStorage.getItem("secretNumber");
      // console.log("Checking sessionStorage:", secretFromStorage);
      if (secretFromStorage && secretFromStorage !== userSecretNumber) {
        console.log("Updating userSecretNumber from sessionStorage");
        setUserSecretNumber(secretFromStorage);
      }
    };

    // Check immediately
    checkSecretNumber();

    // Set up an interval to check periodically (as fallback)
    const interval = setInterval(checkSecretNumber, 500);

    return () => clearInterval(interval);
  }, [userSecretNumber]);

  useEffect(() => {
    // Store navigation data in sessionStorage as backup
    if (
      gameData.roomId &&
      gameData.roomId !== sessionStorage.getItem("roomId")
    ) {
      sessionStorage.setItem("roomId", gameData.roomId);
      console.log("Stored roomId in sessionStorage:", gameData.roomId);
    }
    if (
      gameData.roomCode &&
      gameData.roomCode !== sessionStorage.getItem("roomCode")
    ) {
      sessionStorage.setItem("roomCode", gameData.roomCode);
      console.log("Stored roomCode in sessionStorage:", gameData.roomCode);
    }
    if (
      gameData.playerId &&
      gameData.playerId !== sessionStorage.getItem("playerId")
    ) {
      sessionStorage.setItem("playerId", gameData.playerId);
      console.log("Stored playerId in sessionStorage:", gameData.playerId);
    }
  }, [gameData]);

  // const gameData = location.state || {};
  // const isHost = gameData.isHost || false;

  // const roomId = useMemo(
  //   () => gameData.roomId || (isHost ? hostState.roomId : joinState.roomId),
  //   [gameData.roomId, isHost, hostState.roomId, joinState.roomId]
  // );

  // const playerId = useMemo(
  //   () => gameData.playerId || (isHost ? socket.id : joinState.playerId),
  //   [gameData.playerId, isHost, joinState.playerId]
  // );

  console.log("GameScene state:", {
    isHost,
    roomId,
    playerId,
    userSecretNumber,
    gameStarted,
    opponentReady,
    hostPlayers: hostState.players.length,
  });

  // Function to handle when secret number is submitted
  const handleSecretSubmitted = (number: string) => {
    console.log("=== handleSecretSubmitted called ===");
    setUserSecretNumber(number); // update immediately
    // Optionally, also update sessionStorage for consistency
    sessionStorage.setItem("secretNumber", number);
  };

  console.log("=== Render Decision ===");
  console.log("userSecretNumber exists?", !!userSecretNumber);
  console.log("gameStarted?", gameStarted);

  // Show SetDigitModal only if user hasn't set their secret number AND game hasn't started
  if (!userSecretNumber && !gameStarted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <SetDigitModal
          roomId={roomId}
          playerId={playerId}
          onSubmit={handleSecretSubmitted} // pass the number directly
        />
      </div>
    );
  }

  // Test function to manually trigger game start (for debugging)
  const testGameStart = () => {
    console.log("🧪 Manually triggering game start for testing");
    setGameStarted(true);
  };

  // Show waiting room if game hasn't started yet
  if (!gameStarted) {
    console.log("Rendering WaitingForOpponent");
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <WaitingForOpponent
          roomCode={isHost ? hostState.roomCode : joinState.roomCode}
          opponentReady={opponentReady}
          onTestGameStart={testGameStart} // Add this for debugging
        />
      </div>
    );
  }

  // Show game start panel when both players are ready
  console.log("Rendering GameStartPanel");
  // const opponentName = isHost ? hostState.players[0]?.name : "Host";
  const currentPlayerName = localStorage.getItem("playerName") || "Guest";
  let opponentName = "Opponent";

  if (isHost) {
    opponentName =
      hostState.players?.find((player) => player?.name !== currentPlayerName)
        ?.name || "Opponent";
  } else {
    opponentName =
      joinState.players?.find((player) => player?.name !== currentPlayerName)
        ?.name || "Host";
  }

  const player1Name = currentPlayerName;

  const player2Name =
    joinState.players?.find((player) => player?.name !== currentPlayerName)
      ?.name || "Opponent";

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <GameStartPanel
        isHost={isHost}
        opponentName={opponentName}
        player1Name={player1Name}
        player2Name={player2Name}
      />
    </div>
  );
};

const WaitingForOpponent = ({
  roomCode,
  opponentReady,
  onTestGameStart,
}: {
  roomCode?: string;
  opponentReady: boolean;
  onTestGameStart?: () => void;
}) => (
  <motion.div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-8 max-w-md w-full shadow-2xl text-center">
    <div className="flex flex-col items-center gap-6">
      <div className="bg-purple-600/20 p-4 rounded-full">
        <Gamepad2 className="h-8 w-8 text-purple-400" />
      </div>
      <h1 className="text-2xl font-bold text-white">Waiting for Opponent</h1>
      <p className="text-gray-400">
        {opponentReady
          ? "Opponent is ready! Starting game..."
          : "Waiting for opponent to set their secret number..."}
      </p>

      <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
        <div
          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all"
          style={{ width: opponentReady ? "100%" : "50%" }}
        ></div>
      </div>

      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg w-full">
        <div className="flex items-center justify-center gap-3 text-sm">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-gray-300">
            Room Code:{" "}
            <span className="font-mono font-bold text-purple-300">
              {roomCode || "N/A"}
            </span>
          </span>
        </div>
      </div>

      {/* Debug button - remove after fixing */}
      {onTestGameStart && (
        <Button
          onClick={onTestGameStart}
          variant="outline"
          size="sm"
          className="mt-4 text-xs"
        >
          🧪 Test Game Start
        </Button>
      )}
    </div>
  </motion.div>
);

const GameStartPanel = ({
  isHost,
  opponentName,
  player1Name,
  player2Name,
}: {
  isHost: boolean;
  opponentName?: string;
  player1Name?: string;
  player2Name?: string;
}) => {
  const [startAnimation, setStartAnimation] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Start the animation after a short delay
    const timer = setTimeout(() => {
      setStartAnimation(false);
      setVisible(false);
    }, 500); // Adjust delay as needed

    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="w-full">
      {startAnimation && (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-8 max-w-md w-full aspect-square shadow-2xl text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid place-items-center h-full"
          >
            <div className="flex items-center justify-between gap-10">
              {visible && (
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Avatar className="h-40 w-40">
                    <AvatarImage
                      src="https://avatars.githubusercontent.com/u/123456789?v=4"
                      alt={player1Name}
                    />
                  </Avatar>
                  <h1 className="font-bold text-secondary">{player1Name}</h1>
                </motion.div>
              )}
              <div className="relative">
                <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-md"></div>
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-4 h-22 aspect-square rounded-full relative grid items-center justify-center">
                  <Swords className="h-8 w-8 text-secondary" />
                  <span className="text-secondary font-bold">V/S</span>
                </div>
              </div>
              {visible && (
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Avatar className="w-40 h-40">
                    <AvatarImage
                      src="https://avatars.githubusercontent.com/u/123456789?v=4"
                      alt={player2Name}
                    />
                  </Avatar>
                  <h1 className="font-bold text-secondary">{player2Name}</h1>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      <div className="flex h-full items-start justify-between py-10">
        <div className="flex flex-col gap-4 items-center">
          <Avatar className="h-40 w-40">
            <AvatarImage
              src="https://avatars.githubusercontent.com/u/123456789?v=4"
              alt={player1Name}
            />
          </Avatar>
          <h1 className="font-bold text-secondary">{player1Name}</h1>
        </div>
        <div className="w-120 min-h-screen bg-secondary">
          <UserChatModal
            playerName={
              isHost ? player1Name ?? "Player" : player2Name ?? "Player"
            }
          />
        </div>
        <div className="flex flex-col gap-4 items-center">
          <Avatar className="h-40 w-40">
            <AvatarImage
              src="https://avatars.githubusercontent.com/u/123456789?v=4"
              alt={player2Name}
            />
          </Avatar>
          <h1 className="font-bold text-secondary">{player2Name}</h1>
        </div>
      </div>
    </div>
  );
};

export default GameScene;
