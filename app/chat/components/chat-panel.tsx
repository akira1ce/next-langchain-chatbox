"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageItem } from "@/app/chat/components/message-item";
import { ModelSelector } from "@/app/settings/components/model-selector";
import { useSettingsStore } from "@/store/settings-store";
import { useChatStore, chatActions } from "@/store/chat-store";
import { Send, Workflow } from "lucide-react";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string>("");

  const providers = useSettingsStore((s) => s.providers);
  const { activeSessionId, sessions } = useChatStore();

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const sessionModelId = currentSession?.modelId ?? "";
  const boundWorkflow = currentSession?.workflow;
  const isWorkflowMode = !!boundWorkflow?.nodes?.length;

  const provider = isWorkflowMode
    ? null
    : providers.find((p) => p.models.some((m) => m.id === sessionModelId));

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
          const chatState = useChatStore.getState();
          const session = chatState.sessions.find((s) => s.id === chatState.activeSessionId);
          const mid = session?.modelId ?? "";
          const wf = session?.workflow;
          const isWf = !!wf?.nodes?.length;

          if (isWf) {
            return { workflow: wf };
          }

          const settingsState = useSettingsStore.getState();
          const pc = settingsState.providers.find((p) => p.models.some((m) => m.id === mid));

          return { provider: pc, modelId: mid };
        },
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    id: activeSessionId ?? undefined,
    transport,
    messages: currentSession?.messages,
  });

  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    if (wasStreaming && status === "ready" && activeSessionId) {
      chatActions.updateMessages(activeSessionId, messages);
    }
    prevStatusRef.current = status;
  }, [status, activeSessionId, messages]);

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const noProvider = !isWorkflowMode && !provider?.apiKey;

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isStreaming || noProvider) return;

    sendMessage({ text });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!currentSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">No session selected</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部 */}
      <div className="flex items-center gap-3 border-b px-4 py-2 h-14">
        {isWorkflowMode ? (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Workflow className="h-3.5 w-3.5" />
            {boundWorkflow.title}
          </Badge>
        ) : (
          <ModelSelector value={sessionModelId} onValueChange={handleModelChange} />
        )}
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="mx-auto max-w-3xl py-4">
          {messages.length === 0 && (
            <div className="flex h-[50vh] items-center justify-center text-muted-foreground text-center">
              {noProvider
                ? "Please configure a provider API key in Settings first."
                : isWorkflowMode
                  ? `发送消息以运行「${boundWorkflow.title}」工作流`
                  : "Send a message to start chatting."}
            </div>
          )}
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      {/* 输入框 */}
      <div className="border-t  p-4 shrink-0">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              noProvider
                ? "Configure a provider first..."
                : isWorkflowMode
                  ? "输入内容运行工作流..."
                  : "Type a message..."
            }
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
