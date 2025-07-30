"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, Room, useChatStore } from "@/store/chatStore";
import { useToast } from "@/hooks/use-toast";
import { Send, Copy, Loader, Menu } from "lucide-react";
import { useSocket } from "@/lib/socket";
import { Textarea } from "./ui/textarea";
import ChatSideBar from "./ChatSideBar";

export default function ChatClient() {
  const router = useRouter();
  const params = useParams();
  const { isConnected, socket } = useSocket();

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { toast } = useToast();
  const roomId = params.roomId as string;

  // States
  const {
    username,
    messages,
    addMessage,
    setMessages,
    rooms,
    setRooms,
    setUserId,
    clearMessages,
  } = useChatStore();

  // States
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersTyping, setUsersTyping] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [sendMessageIsLoading, setSendMessageIsLoading] = useState(false);
  const [getMessagesIsLoading, setGetMessagesIsLoading] = useState(false);
  const [joiningChatIsLoading, setJoiningChatIsLoading] = useState(false);

  // Requests
  const sendMessage = () => {
    if (!message.trim() || !socket || !isConnected) return;

    setSendMessageIsLoading(true);

    socket.emit(
      "sendMessage",
      {
        roomName: roomId,
        username,
        message: message.trim(),
      },
      (res: any) => {
        if (res.success) {
          setMessage("");
          socket.emit("stop-typing", roomId, username);
          setSendMessageIsLoading(false);
        } else {
          toast({
            title: "Error",
            description: `There was an error sending message: ${res?.message}`,
            variant: "error",
          });
          setSendMessageIsLoading(false);
        }
      }
    );
  };

  const sendTyping = () => {
    if (!socket) return;

    socket.emit("typing", { roomName: roomId, username });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { roomName: roomId, username });
    }, 2000);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Room ID copied!",
      description: "Share this with others to join the chat.",
    });
  };

  const getUserRooms = () => {
    socket?.emit("getUserRooms", { username }, (response: any) => {
      if (response.success) {
        setRooms(response.rooms);
      } else {
        toast({
          title: "Error",
          description: `${response?.message}`,
          variant: "error",
        });
      }
      setLoading(false);
    });
  };

  const handleGetMessages = () => {
    socket?.emit("getRoomMessages", { roomName: roomId }, (res: any) => {
      setGetMessagesIsLoading(true);

      if (res.success) {
        setMessages((prevState: Message[]) => [...prevState, ...res.messages]);
        setGetMessagesIsLoading(false);
      } else {
        toast({
          title: "Error",
          description: `${res?.message}`,
          variant: "error",
        });
        setGetMessagesIsLoading(false);
      }
    });
  };

  // Effects
  useEffect(() => {
    if (!socket) return;

    return () => {
      socket.off("typingUpdate");
    };
  }, [socket, username]);

  useEffect(() => {
    if (isConnected) {
      if (!username) {
        router.push("/");
        return;
      }

      clearMessages();

      socket?.emit(
        "joinRoom",
        { roomName: roomId, username },
        (response: any) => {
          setJoiningChatIsLoading(true);
          if (response.success) {
            setUserId(response?.userId);
            setJoiningChatIsLoading(false);
            getUserRooms();
            handleGetMessages();
          } else {
            toast({
              title: "Error",
              description: response.message,
              variant: "error",
            });
            router.push("/");
            setJoiningChatIsLoading(false);
          }
        }
      );
    }
  }, [username, isConnected, roomId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("userJoined", ({ username }) => {
      addMessage({
        message: `🎉 ${username} joined the room`,
        username,
        timestamp: new Date(),
        type: "system",
      });
    });

    socket.on("userLeft", ({ username }) => {
      addMessage({
        message: `🚪 ${username} left the room`,
        username,
        timestamp: new Date(),
        type: "system",
      });
    });

    socket.on("userRemoved", ({ username }) => {
      addMessage({
        message: `❌ ${username} was removed from the room`,
        username,
        timestamp: new Date(),
        type: "system",
      });
    });

    socket.on("kickedFromRoom", ({ username }) => {
      addMessage({
        message: `🏌️‍♂️ You have been kicked out of this room.`,
        username,
        timestamp: new Date(),
        type: "system",
      });

      setTimeout(() => {
        router.push("/");
      }, 2000);
    });

    socket.on("typingUpdate", ({ usersTyping }) => {
      setUsersTyping(usersTyping.filter((u: string) => u !== username));
    });

    socket.on("newMessage", (msg: Message) => {
      addMessage({
        message: msg?.message,
        username: msg?.username,
        timestamp: msg?.timestamp,
        type: "chat",
      });
    });

    socket.on("ownerChanged", ({ newOwnerId, newOwnerUsername }) => {
      addMessage({
        message: `👨‍💼 ${newOwnerUsername} is now an admin`,
        username,
        timestamp: new Date(),
        type: "system",
      });
    });

    return () => {
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("userRemoved");
      socket.off("kickedFromRoom");
      socket.off("typingUpdate");
      socket.off("newMessage");
      socket.off("userListUpdate");
    };
  }, [isConnected]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (joiningChatIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen-svh">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen-svh max-h-screen-svh overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 bg-background md:hidden">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold">Chat Room</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[80%] bg-background lg:border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:w-1/4 lg:w-1/5`}
        >
          <ChatSideBar
            isConnected={isConnected}
            socket={socket}
            loading={loading}
          />
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main Chat Area */}
        <Card className="flex flex-col flex-1 rounded-none h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between hidden md:flex">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-xl font-semibold">Chat Room</h2>
                <div className="flex items-center space-x-2">
                  <code className="lg:text-sm text-xs text-muted-foreground">
                    {roomId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyRoomId}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {usersTyping.length > 0 && (
                  <p className="lg:text-sm text-xs text-muted-foreground italic">
                    {usersTyping.join(", ")}{" "}
                    {usersTyping.length === 1 ? "is" : "are"} typing...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 lg:p-4 p-2">
            {getMessagesIsLoading ? (
              <div className="w-full flex items-center justify-center py-4">
                <Loader className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex-1">
                  {messages?.map((msg, idx) => {
                    if (msg.type === "system") {
                      return (
                        <div
                          key={idx}
                          className="text-center text-muted-foreground lg:text-sm text-xs  py-2"
                        >
                          <span>{msg.message}</span>
                          <div className="text-xs opacity-60">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={idx}
                          className={`flex lg:mb-4 mb-2 flex-col ${
                            msg.username === username
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.username === username
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-xs lg:text-sm">
                                {msg.username === username
                                  ? "You"
                                  : msg.username}
                              </p>
                              <span className="text-xs opacity-70">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-xs lg:text-sm">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
                <div ref={bottomRef} />
              </>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="lg:p-4 p-2 border-t">
            <div className="flex space-x-2 items-center">
              <Textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (e.target?.value) {
                    sendTyping();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 resize-none text-xs lg:text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!message}
                className="flex items-center justify-center"
              >
                {sendMessageIsLoading ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden lg:inline">Send</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
