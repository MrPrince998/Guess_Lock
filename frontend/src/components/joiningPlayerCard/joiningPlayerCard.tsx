import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const joiningPlayerCard = () => {
  return (
    <div className="w-full">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" />
        <AvatarFallback className="bg-primary text-primary-foreground">
          <span className="text-lg font-semibold">P</span>
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default joiningPlayerCard;
