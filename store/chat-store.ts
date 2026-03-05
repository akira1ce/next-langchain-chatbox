import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatSession, WorkflowSession } from "@/types";
import type { UIMessage } from "@ai-sdk/react";

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (_set) => ({
      sessions: [],
      activeSessionId: null,
    }),
    { name: "chat-store" },
  ),
);

const set = useChatStore.setState;

export const chatActions = {
  createSession: (opts?: {
    modelId?: string;
    workflow?: WorkflowSession;
  }) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const session: ChatSession = {
      id,
      title: opts?.workflow?.title ?? "New Chat",
      modelId: opts?.modelId,
      workflow: opts?.workflow,
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

  deleteSession: (id: string) => {
    set((state) => {
      const remaining = state.sessions.filter((s) => s.id !== id);
      const needSwitch = state.activeSessionId === id;
      return {
        sessions: remaining,
        activeSessionId: needSwitch ? (remaining[0]?.id ?? null) : state.activeSessionId,
      };
    });
  },

  setActiveSession: (id: string) => set({ activeSessionId: id }),

  updateMessages: (sessionId: string, messages: UIMessage[]) => {
    set((state) => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return state;

      // 自动从首条用户消息生成标题
      let title = session.title;
      if (title === "New Chat" && messages.length > 0) {
        const first = messages.find((m: UIMessage) => m.role === "user");
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

  updateTitle: (sessionId: string, title: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s,
      ),
    }));
  },

  updateModelId: (sessionId: string, modelId: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, modelId, updatedAt: Date.now() } : s,
      ),
    }));
  },
};
