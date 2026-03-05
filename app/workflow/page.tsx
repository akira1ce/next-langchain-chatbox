"use client";

import { useRouter } from "next/navigation";
import { useWorkflowStore, workflowActions } from "@/store/workflow-store";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkflowListPage() {
  const router = useRouter();
  const { workflows } = useWorkflowStore();

  const sorted = [...workflows].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleCreate = () => {
    const id = workflowActions.create();
    router.push(`/workflow/${id}`);
  };

  const handleOpen = (id: string) => {
    workflowActions.setActive(id);
    router.push(`/workflow/${id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    workflowActions.delete(id);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">Workflows</h1>
        <Button size="sm" className="gap-1.5" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
            <Workflow className="h-12 w-12" />
            <p className="text-sm">No workflows yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((wf) => (
              <div
                key={wf.id}
                onClick={() => handleOpen(wf.id)}
                className={cn(
                  "group relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/50 hover:shadow-md",
                )}
              >
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium">
                    {wf.title}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {wf.nodes.length} node{wf.nodes.length !== 1 && "s"} &middot;{" "}
                  {wf.edges.length} edge{wf.edges.length !== 1 && "s"}
                </p>

                <p className="text-xs text-muted-foreground">
                  Updated {new Date(wf.updatedAt).toLocaleString()}
                </p>

                <button
                  onClick={(e) => handleDelete(e, wf.id)}
                  className="absolute right-3 top-3 hidden rounded p-1 hover:bg-destructive/20 group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
