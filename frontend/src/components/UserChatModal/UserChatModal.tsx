import React from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface UserChatModalProps {
  playerName: string | undefined;
}

const UserChatModal = ({ playerName }: UserChatModalProps) => {
  return (
    <div className="w-50 flex gap-4 items-center">
      <Avatar>
        <AvatarImage
          src="https://avatars.githubusercontent.com/u/12345678?v=4"
          alt={playerName}
        />
      </Avatar>
      <h1 className="text-primary font-medium ">{playerName}</h1>
    </div>
  );
};

export default UserChatModal;
