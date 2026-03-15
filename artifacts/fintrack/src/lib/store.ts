import { create } from 'zustand';
import type { ChatMessage } from '@workspace/api-client-react';

interface AppState {
  selectedMonth: number;
  selectedYear: number;
  setDateFilter: (month: number, year: number) => void;
  chatHistory: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
}

const currentDate = new Date();

export const useAppStore = create<AppState>((set) => ({
  selectedMonth: currentDate.getMonth() + 1, // 1-12
  selectedYear: currentDate.getFullYear(),
  setDateFilter: (month, year) => set({ selectedMonth: month, selectedYear: year }),
  
  chatHistory: [
    { role: "assistant", content: "Hi! I'm FinTrack AI. How can I help you with your finances today?" }
  ],
  addChatMessage: (msg) => set((state) => ({ 
    chatHistory: [...state.chatHistory, msg] 
  })),
  clearChat: () => set({ 
    chatHistory: [{ role: "assistant", content: "Chat cleared. What's on your mind?" }] 
  }),
}));
