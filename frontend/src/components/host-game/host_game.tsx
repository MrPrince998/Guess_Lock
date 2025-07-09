import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { hostGameModel } from "@/components/model/hostGameModel";
import WaitingRoom from "@/components/WaitingRoom";
import { Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const HostGame = () => {
  const [state, setState] = useState(hostGameModel.getState());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = hostGameModel.subscribe(setState);
    return () => {
      unsubscribe();
      hostGameModel.cleanup();
    };
  }, []);

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      await hostGameModel.createGame();
      toast.success("Game Created!", {
        description: "Your game lobby is ready for players",
        icon: <Sparkles className="w-4 h-4" />,
      });
    } catch (error) {
      toast.error("Creation Failed", {
        description: "Couldn't create the game. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseHosting = () => {
    hostGameModel.closeHosting();
    toast.info("Game Closed", {
      description: "Your game lobby has been closed",
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          size="lg"
          onClick={handleCreateGame}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg transition-all"
          disabled={state.isLoading || isCreating}
        >
          {state.isLoading || isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Crown className="mr-2 h-4 w-4" />
          )}
          {state.isLoading || isCreating ? "Creating Game..." : "Host Game"}
        </Button>
      </AlertDialogTrigger>
      {state.isHosting && (
        <WaitingRoom isHost={true} onClose={handleCloseHosting} />
      )}
    </AlertDialog>
  );
};

export default HostGame;
