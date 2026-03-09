"use client";

import { useRef, useEffect, useState, useMemo, useId } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Trash2 } from "lucide-react";
import { MessageItem } from "@/app/chat/components/message-item";
import { flowContextActions } from "@/store/flow-context";
import { workflowActions } from "@/store/workflow-store";
import { toast } from "sonner";

interface WorkflowTryoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
}

export function WorkflowTryout({ open, onOpenChange, workflowId }: WorkflowTryoutProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatId = useId();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/workflow/run",
        body: () => {
          const snap = flowContextActions.snapshot();
          return { nodes: snap.nodes, edges: snap.edges };
        },
      }),
    [],
  );

  const { messages, sendMessage, setMessages, status } = useChat({
    id: chatId,
    transport,
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // Save latest snapshot before running
    const snap = flowContextActions.snapshot();
    workflowActions.saveSnapshot(workflowId, snap.nodes, snap.edges);

    sendMessage({ text });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="flex w-[420px] flex-col gap-0 p-0 sm:max-w-[420px]">
        <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-sm">Try Out</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClear}
            disabled={messages.length === 0 || isStreaming}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
          <div className="py-4">
            {messages.length === 0 && (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground text-sm text-center px-4">
                Send a message to run the workflow.
              </div>
            )}
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4 shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="min-h-[40px] max-h-[120px] resize-none"
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
