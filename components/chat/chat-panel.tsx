"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageItem } from "@/components/chat/message-item";
import { ModelSelector } from "@/components/settings/model-selector";
import { useSettingsStore } from "@/store/settings-store";
import { useChatStore, chatActions } from "@/store/chat-store";
import { Send } from "lucide-react";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string>("");

  const providers = useSettingsStore((s) => s.providers);

  const { activeSessionId, sessions } = useChatStore();

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const sessionModelId = currentSession?.modelId ?? "";

  // 从 session 的 modelId 找到对应 provider
  const providerConfig = providers.find((p) => p.models.some((m) => m.id === sessionModelId));

  const handleModelChange = (modelId: string) => {
    if (activeSessionId) {
      chatActions.updateModelId(activeSessionId, modelId);
    }
  };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => {
          const session = useChatStore
            .getState()
            .sessions.find((s) => s.id === useChatStore.getState().activeSessionId);
          const mid = session?.modelId ?? "";
          return {
            providerConfig: useSettingsStore
              .getState()
              .providers.find((p) => p.models.some((m) => m.id === mid)),
            modelId: mid,
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    id: activeSessionId ?? undefined,
    transport,
    messages: currentSession?.messages,
  });

  // 流式结束后持久化消息（status 从 streaming/submitted → ready）
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    if (wasStreaming && status === "ready" && activeSessionId) {
      chatActions.updateMessages(activeSessionId, messages);
    }
    prevStatusRef.current = status;
  }, [status, activeSessionId, messages]);

  const isStreaming = status === "streaming" || status === "submitted";

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (!providerConfig?.apiKey) return;

    sendMessage({ text });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const noProvider = !providerConfig?.apiKey;

  if (!currentSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">No session selected</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部：模型选择 */}
      <div className="flex items-center border-b px-4 py-2 h-14">
        <ModelSelector value={sessionModelId} onValueChange={handleModelChange} />
      </div>

      {/* 中间：消息列表 */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="mx-auto max-w-3xl py-4">
          {messages.length === 0 && (
            <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
              {noProvider
                ? "Please configure a provider API key in Settings first."
                : "Send a message to start chatting."}
            </div>
          )}
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      {/* 底部：输入框 */}
      <div className="border-t p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={noProvider ? "Configure a provider first..." : "Type a message..."}
            disabled={noProvider}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming || noProvider}
            size="icon"
            className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
