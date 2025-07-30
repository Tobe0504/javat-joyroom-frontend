import { create } from "zustand";

export interface Message {
  message: string;
  username: string;
  timestamp: Date;
  type?: "system" | any;
}

export interface Room {
  id: string;
  name: string;
  messages: Message[];
  ownerId: string;
  users: string;
}

interface ChatStore {
  username: string;
  messages: Message[];
  setUsername: (username: string) => void;
  addMessage: (message: Message) => void;
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  clearMessages: () => void;
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  userId: string;
  setUserId: (userId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  username: "",
  messages: [],
  setUsername: (username) => set({ username }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (updater) =>
    set((state) => ({
      messages: updater(state.messages),
    })),
  clearMessages: () => set({ messages: [] }),
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  userId: "",
  setUserId: (userId) => set({ userId }),
}));
