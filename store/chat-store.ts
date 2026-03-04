import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatSession } from "@/types";
import type { UIMessage } from "@ai-sdk/react";

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;

  createSession: (modelId?: string) => string;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  updateMessages: (sessionId: string, messages: UIMessage[]) => void;
  updateTitle: (sessionId: string, title: string) => void;
  updateModelId: (sessionId: string, modelId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (modelId) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const session: ChatSession = {
          id,
          title: "New Chat",
          modelId,
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: id,
        }));
        return id;
      },

      deleteSession: (id) => {
        set((state) => {
          const remaining = state.sessions.filter((s) => s.id !== id);
          const needSwitch = state.activeSessionId === id;
          return {
            sessions: remaining,
            activeSessionId: needSwitch ? (remaining[0]?.id ?? null) : state.activeSessionId,
          };
        });
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      updateMessages: (sessionId, messages) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (!session) return state;

          // 自动从首条用户消息生成标题
          let title = session.title;
          if (title === "New Chat" && messages.length > 0) {
            const first = messages.find((m) => m.role === "user");
            if (first) {
              const text =
                first.parts?.find((p) => p.type === "text")?.text?.slice(0, 30) ?? "New Chat";
              title = text + (text.length >= 30 ? "..." : "");
            }
          }

          return {
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, messages, title, updatedAt: Date.now() } : s,
            ),
          };
        });
      },

      updateTitle: (sessionId, title) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s,
          ),
        }));
      },

      updateModelId: (sessionId, modelId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, modelId, updatedAt: Date.now() } : s,
          ),
        }));
      },
    }),
    {
      name: "chat-store",
    },
  ),
);
