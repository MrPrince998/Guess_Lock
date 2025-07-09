import HostGame from "@/components/host-game/host_game";
import JoinGame from "@/components/join-game/join_game";
import QuickMatch from "@/components/quick-match/quick_match";
import { Input } from "@/components/ui/input";
import { LockKeyhole, User, Gamepad2 } from "lucide-react";

const MainPage = () => {
  const handleUserName = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem("playerName", e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
      <div className="container mx-auto flex flex-col items-center justify-center h-full px-4 py-4">
        {/* Header with game logo */}
        <div className="flex items-center mb-8 gap-3">
          <LockKeyhole className="h-12 w-12 text-yellow-400" />
          <h1 className="font-bold text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
            GuessLock
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-lg text-gray-300 mb-12 text-center max-w-md">
          A thrilling two-player secret code guessing battle
        </p>

        {/* Game card */}
        <div className="w-full h-full max-w-md bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-4 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Enter the Arena</h2>
          </div>

          {/* Card body */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                <User className="h-4 w-4" />
                Player Name
              </label>
              <Input
                placeholder="Your secret agent name"
                className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                onChange={handleUserName}
                defaultValue={localStorage.getItem("playerName") || ""}
              />
            </div>

            <div className="space-y-4">
              <QuickMatch />

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-600"></div>
                <span className="text-sm text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-600"></div>
              </div>

              <div className="space-y-3">
                <JoinGame />
                <HostGame />
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-sm text-gray-400 text-center max-w-md">
          Challenge a friend to a battle of wits. Guess their 4-digit code
          before they guess yours!
        </p>
      </div>
    </div>
  );
};

export default MainPage;
