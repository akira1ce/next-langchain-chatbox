"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Plus, Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const createSession = useChatStore((s) => s.createSession);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const deleteSession = useChatStore((s) => s.deleteSession);

  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleNewChat = () => {
    createSession();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
  };

  const isOnChat = pathname.startsWith("/chat");

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center border-b px-4 font-semibold">Next LangChain</div>

      {/* New Chat 按钮 */}
      <div className="p-2">
        <Link href="/chat">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>

      {/* 会话列表 */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {sortedSessions.map((session) => (
          <Link
            key={session.id}
            href="/chat"
            onClick={() => setActiveSession(session.id)}
            className={cn(
              "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              isOnChat && activeSessionId === session.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}>
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{session.title}</span>
            <button
              onClick={(e) => handleDelete(e, session.id)}
              className="hidden shrink-0 rounded p-0.5 hover:bg-destructive/20 group-hover:block">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </Link>
        ))}
      </nav>

      {/* 底部 Settings */}
      <div className=" p-2 ">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
            pathname.startsWith("/settings")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground",
          )}>
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
