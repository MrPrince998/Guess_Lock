import { useLocation } from "react-router-dom";
import { joinGameModel } from "@/components/model/joinGameModel";
import { hostGameModel } from "@/components/model/hostGameModel";
import socket from "@/utils/socket";
import { useEffect, useState } from "react";
import SetDigitModal from "../model/set-digit-modal";

const GameScene = () => {
  const location = useLocation();
  const [joinState, setJoinState] = useState(joinGameModel.getState());
  const [hostState, setHostState] = useState(hostGameModel.getState());
  const [showSetDigitModal, setShowSetDigitModal] = useState(false);
  const players = hostState.players || [];

  useEffect(() => {
    const unsubscribeJoin = joinGameModel.subscribe(setJoinState);
    const unsubscribeHost = hostGameModel.subscribe(setHostState);
    return () => {
      unsubscribeJoin();
      unsubscribeHost();
    };
  }, []);

  // Get data from location state or models
  const gameData = location.state || {};
  const isHost = gameData.isHost || false;

  // Get roomId and playerId from the appropriate source
  const roomId =
    gameData.roomId || (isHost ? hostState.roomId : joinState.roomId);

  const playerId =
    gameData.playerId || (isHost ? socket.id : joinState.playerId);

  console.log("GameScene Data:", {
    gameData,
    isHost,
    roomId,
    playerId,
    joinState,
    hostState,
  });

  return (
    <div className="h-screen w-full bg-gray-500">
      {!showSetDigitModal ? (
        <SetDigitModal
          roomId={roomId!}
          playerId={playerId}
          onSubmit={() => setShowSetDigitModal(true)}
        />
      ) : players.length! >= 2 ? (
        <p>Waiting for the other player to submit their number... </p>
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-center text-white">
            Game Started!
          </h1>
        </div>
      )}
    </div>
  );
};

export default GameScene;
