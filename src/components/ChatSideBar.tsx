"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardFooter,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Room, useChatStore } from "@/store/chatStore";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, MessageSquare, Loader } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogIn } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "./ui/theme-toggle";

interface Props {
  isConnected: boolean;
  socket: any;
  loading: boolean;
  className?: string;
}

const ChatSideBar: React.FC<Props> = ({
  isConnected,
  socket,
  loading,
  className,
}) => {
  // States
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [leaveRoomIsLoading, setLeaveRoomIsLoading] = useState(false);
  const [roomIdLocal, setRoomIdLocal] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [checkRoomLoading, setCheckRoomLoading] = useState(false);
  const [roomCheckParticipants, setRoomCheckParticipants] = useState([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("rooms");
  const [participants, setParticipants] = useState<
    { username: string; isAdmin?: boolean }[]
  >([]);

  //   Router
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();

  // Global
  const { username, rooms, setRooms, userId } = useChatStore();

  //   Hooks
  const { toast } = useToast();

  //   Memo
  const activeRoom: Room | undefined = useMemo(() => {
    return rooms?.find((data: Room) => data?.name === roomId);
  }, [rooms, roomId]);

  //   Requests
  const leaveRoom = () => {
    if (!isConnected) {
      return;
    }
    setLeaveRoomIsLoading(true);
    socket?.emit(
      "leaveRoom",
      { roomName: roomId, username },
      (response: any) => {
        if (response.success) {
          setTimeout(() => router.push("/"), 1000);

          toast({
            title: "Success",
            description: `${response?.message}`,
            variant: "success",
          });

          setRooms([]);
          setLeaveRoomIsLoading(false);
        } else {
          toast({
            title: "Error",
            description: `${response?.message}`,
            variant: "error",
          });
          setLeaveRoomIsLoading(false);
        }
      }
    );
  };

  const handleCreateOrJoinROom = () => {
    if (!roomIdLocal.trim()) return;
    router.push(`/chat/${roomIdLocal}`);
    setOpenJoinDialog(false);
  };

  const handleRemoveUser = (userId: string) => {
    if (isConnected) {
      socket?.emit(
        "removeUserFromRoom",
        {
          roomName: activeRoom?.name,
          username: userId,
        },
        (response: any) => {
          if (response.success) {
            setIsDialogOpen(false);

            toast({
              title: "Success",
              description: "User removed successfully",
              variant: "success",
            });
          } else {
            toast({
              title: "Error",
              description: response?.message,
              variant: "error",
            });
          }
        }
      );
    }
  };

  const checkParticipants = () => {
    setCheckRoomLoading(true);
    socket?.emit("checkRoom", roomIdLocal, (res: any) => {
      if (res.success) {
        setRoomCheckParticipants(res?.room?.participants);
        setCheckRoomLoading(false);
      } else {
        setCheckRoomLoading(false);
        setRoomCheckParticipants([]);
      }
    });
  };

  //   Effects
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "userListUpdate",
      (users: { username: string; isAdmin?: boolean }[]) => {
        setParticipants(users);
      }
    );
  }, [isConnected]);

  useEffect(() => {
    if (roomIdLocal) {
      const timeout = setTimeout(() => {
        checkParticipants();
      }, 800);

      return () => {
        clearTimeout(timeout);
        socket?.off("checkRoom");
      };
    }
  }, [roomIdLocal]);

  return (
    <Card
      className={`col-span-3 flex flex-col h-full rounded-none ${className} `}
    >
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-4">Your Chats</h2>
        <Dialog open={openJoinDialog} onOpenChange={setOpenJoinDialog}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Join New Room
            </Button>
          </DialogTrigger>

          <DialogTitle className="sr-only">Join or Create Room</DialogTitle>

          <DialogContent className="max-w-lg p-0">
            <div className="flex flex-col items-center justify-center">
              <Card className="w-full border-none shadow-none">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold">
                    Join a new room
                  </CardTitle>
                  <CardDescription>
                    Join an existing room to start chatting
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomId">Room ID</Label>
                    <Input
                      id="roomId"
                      placeholder="Enter room ID to join"
                      value={roomIdLocal}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s+/g, "-");
                        setRoomIdLocal(value);
                      }}
                      className="w-full"
                    />
                    <span className="text-xs text-muted-foreground">
                      Room Id must be more than three characters and must not
                      have a space
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                  <Button
                    onClick={handleCreateOrJoinROom}
                    className="w-full"
                    variant="secondary"
                    size="lg"
                    disabled={!roomIdLocal.trim() || roomIdLocal.length < 4}
                    loading={checkRoomLoading}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    {roomCheckParticipants.length
                      ? roomCheckParticipants?.length !== 1
                        ? `Join ${roomCheckParticipants[0]} and ${
                            roomCheckParticipants?.length - 1
                          } others in this room`
                        : `Join ${roomCheckParticipants[0]} in this room`
                      : "Create room"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {selectedUser} from the room?</DialogTitle>
          </DialogHeader>
          <p className="text-xs lg:text-sm text-muted-foreground">
            Are you sure you want to remove this participant? This action cannot
            be undone.
          </p>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) {
                  handleRemoveUser(selectedUser);
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col m-4"
      >
        <TabsList className="flex w-full mb-2">
          <TabsTrigger value="rooms" className="flex-1 text-xs lg:textsm">
            Rooms
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="flex-1 text-xs lg:textsm"
          >
            Participants
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="rooms">
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              rooms?.map((room) => (
                <Button
                  key={room.id}
                  variant={
                    activeRoom?.name === room.name ? "secondary" : "ghost"
                  }
                  className="w-full justify-start mb-1"
                  onClick={() => router.push(`/chat/${room.name}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="flex-1 text-left">{room.name}</span>
                </Button>
              ))
            )}
          </TabsContent>

          <TabsContent value="participants">
            {participants.length === 0 ? (
              <p className="text-xs lg:text-sm text-muted-foreground">
                No users in this room.
              </p>
            ) : (
              participants.map((user, index) => {
                const isUserAdmin = (user as any)?.id === activeRoom?.ownerId;
                const loggedInUserIsNotAdmin = userId !== activeRoom?.ownerId;

                return (
                  <div
                    key={index}
                    className="flex justify-between items-center mb-2 text-xs lg:text-sm"
                  >
                    <Button
                      className="flex items-center justify-start  gap-2 w-full"
                      variant="ghost"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{user.username}</span>
                      {isUserAdmin && <Badge variant="outline">Admin</Badge>}
                    </Button>

                    {!isUserAdmin && !loggedInUserIsNotAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user?.username);
                              setIsDialogOpen(true);
                            }}
                            className="text-red-600 text-xs"
                          >
                            Remove from Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <Separator />
      <div className="p-4 h-[80px]">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <p className="text-xs lg:text-sm font-medium">Logged in as:</p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              {username}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={leaveRoom}>
            {leaveRoomIsLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut />
            )}
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </Card>
  );
};

export default ChatSideBar;
