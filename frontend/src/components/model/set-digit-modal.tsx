import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { toast } from "sonner";
import { Button } from "../ui/button";
import { validateNumber } from "@/utils/validateNumber";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { joinGameModel } from "./joinGameModel";
import socket from "@/utils/socket";

interface Props {
  roomId: string;
  playerId: string;
  onSubmit?: (number: string) => void; // updated to accept the number
}

const SetDigitModal = ({ roomId, playerId, onSubmit }: Props) => {
  const [number, setNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    console.log("Attempting to submit:", { number, roomId, playerId });

    const joinState = joinGameModel.getState();
    const actualPlayerId =
      playerId ||
      joinState.playerId ||
      sessionStorage.getItem("playerId") ||
      socket.id;

    const finalRoomId =
      roomId || joinState.roomId || sessionStorage.getItem("roomId");

    console.log("Final values:", { finalRoomId, actualPlayerId });

    if (!finalRoomId || !actualPlayerId) {
      toast.error("Missing Information", {
        description: "Room ID or Player ID is missing. Please rejoin the game.",
      });
      return;
    }

    if (!validateNumber(number)) {
      toast.error("Invalid Code", {
        description: "Please enter a 4-digit number with all unique digits.",
      });
      return;
    }

    setIsSubmitting(true);

    const handleSuccess = (data: any) => {
      console.log("Secret submitted successfully:", data);
      setIsSubmitting(false);
      sessionStorage.setItem("secretNumber", number);

      toast("Code Locked In!", {
        description: "Your secret number has been securely stored.",
        icon: <ShieldCheck className="w-4 h-4" />,
      });

      // Clean up listeners
      cleanup();

      // Force a small delay to ensure sessionStorage is set
      setTimeout(() => {
        console.log("Calling onSubmit callback");
        onSubmit?.(number); // call with the entered number
      }, 100);
    };

    const handleError = (error: string) => {
      console.error("Error setting secret number:", error);
      setIsSubmitting(false);

      toast.error("Submission Failed", {
        description: error || "There was an issue setting your number.",
      });

      cleanup();
    };

    const cleanup = () => {
      socket.off("secretSubmitted", handleSuccess);
      socket.off("error", handleError);
      clearTimeout(timeoutId);
    };

    // Listen for backend response
    socket.once("secretSubmitted", handleSuccess);
    socket.once("error", handleError);

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      console.log("Timeout reached - no response from server");
      setIsSubmitting(false);
      toast.error("Timeout", {
        description: "Server took too long to respond. Please try again.",
      });
      cleanup();
    }, 5000);

    // Emit the event
    socket.emit("submitSecret", {
      roomId: finalRoomId,
      playerId: actualPlayerId,
      secretNumber: number,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center gap-3">
          <LockKeyhole className="h-5 w-5 text-white" />
          <h2 className="font-bold text-white text-lg">Set Your Secret Code</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-4 text-center">
            <p className="text-gray-300">
              Enter a 4-digit code with{" "}
              <span className="font-semibold text-yellow-400">
                unique digits
              </span>{" "}
              that your opponent will try to guess.
            </p>

            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={number}
                onChange={(val: string) => {
                  setNumber(val);
                }}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot
                    index={0}
                    className="w-14 h-14 text-2xl font-bold border-2 border-gray-600 bg-gray-800 text-white hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <InputOTPSlot
                    index={1}
                    className="w-14 h-14 text-2xl font-bold border-2 border-gray-600 bg-gray-800 text-white hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <InputOTPSlot
                    index={2}
                    className="w-14 h-14 text-2xl font-bold border-2 border-gray-600 bg-gray-800 text-white hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <InputOTPSlot
                    index={3}
                    className="w-14 h-14 text-2xl font-bold border-2 border-gray-600 bg-gray-800 text-white hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Example: 1234 or 5829</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={number.length !== 4 || isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 text-md shadow-lg transition-all"
          >
            {isSubmitting ? "Securing Code..." : "Lock In Secret Code"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetDigitModal;
