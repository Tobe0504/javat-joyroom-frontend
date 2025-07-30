"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/lib/socket";
import { ThemeToggle } from "./ui/theme-toggle";

export default function HomeClient() {
  const router = useRouter();
  const { socket } = useSocket();
  const setUsername = useChatStore((state) => state.setUsername);

  const [username, setUsernameLocal] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);

  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) return;
    setUsername(username);
    router.push(`/chat/${roomId}`);
  };

  const checkParticipants = () => {
    setLoading(true);
    socket?.emit("checkRoom", roomId, (res: any) => {
      if (res.success) {
        setParticipants(res?.room?.participants);
      } else {
        setParticipants([]);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    if (roomId) {
      const timeout = setTimeout(() => {
        checkParticipants();
      }, 800);

      return () => {
        clearTimeout(timeout);
        socket?.off("checkRoom");
      };
    }
  }, [roomId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen-svh px-4 py-6 sm:py-8 relative bg-background">
      <Card className="w-full max-w-[90vw] sm:max-w-md md:max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-3xl font-bold">
            Welcome to Secrets 🎉
          </CardTitle>
          <CardDescription className="text-xs lg:text-sm sm:text-base">
            Initiate your own digital lair 🕸️ or beam into an existing one 🛸
            either way, we’ve got chat.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-xs lg:text-sm sm:text-base"
            >
              Name
            </Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsernameLocal(e.target.value)}
              className="w-full text-xs lg:text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomId" className="text-xs lg:text-sm sm:text-base">
              Room ID
            </Label>
            <Input
              id="roomId"
              placeholder="Enter room ID to join"
              value={roomId}
              onChange={(e) => {
                const value = e.target.value.replace(/\s+/g, "-");
                setRoomId(value);
              }}
              className="w-full lg:text-sm text-xs sm:text-base"
            />
            <span className="text-xs text-muted-foreground">
              Room ID must be more than three characters
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={joinRoom}
            className="w-full lg:text-sm text-xs  sm:text-base"
            variant="default"
            size="lg"
            disabled={!username.trim() || !roomId.trim() || roomId.length < 4}
            loading={loading}
          >
            <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {participants.length
              ? participants?.length !== 1
                ? `Join ${participants[0]} and ${
                    participants?.length - 1
                  } others in this room`
                : `Join ${participants[0]} in this room`
              : "Create room"}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Property of Javat 365</p>
      </div>

      <div className="absolute bottom-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
