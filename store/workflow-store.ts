import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkflowSession, SerializedNode, SerializedEdge } from "@/types";

interface WorkflowState {
  workflows: WorkflowSession[];
  activeWorkflowId: string | null;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    () => ({
      workflows: [] as WorkflowSession[],
      activeWorkflowId: null as string | null,
    }),
    { name: "workflow-store" },
  ),
);

const set = useWorkflowStore.setState;

export const workflowActions = {
  create: (title = "New Workflow") => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const session: WorkflowSession = {
      id,
      title,
      nodes: [],
      edges: [],
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({
      workflows: [session, ...s.workflows],
      activeWorkflowId: id,
    }));
    return id;
  },

  delete: (id: string) => {
    set((s) => {
      const remaining = s.workflows.filter((w) => w.id !== id);
      const needSwitch = s.activeWorkflowId === id;
      return {
        workflows: remaining,
        activeWorkflowId: needSwitch ? (remaining[0]?.id ?? null) : s.activeWorkflowId,
      };
    });
  },

  setActive: (id: string) => set({ activeWorkflowId: id }),

  updateTitle: (id: string, title: string) => {
    set((s) => ({
      workflows: s.workflows.map((w) => (w.id === id ? { ...w, title, updatedAt: Date.now() } : w)),
    }));
  },

  saveSnapshot: (id: string, nodes: SerializedNode[], edges: SerializedEdge[]) => {
    set((s) => ({
      workflows: s.workflows.map((w) =>
        w.id === id ? { ...w, nodes, edges, updatedAt: Date.now() } : w,
      ),
    }));
  },
};
