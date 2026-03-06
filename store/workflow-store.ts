import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types";

interface WorkflowState {
  workflows: Workflow[];
  activeWorkflowId: string | null;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    () => ({
      workflows: [] as Workflow[],
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
    const session: Workflow = {
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

  saveSnapshot: (id: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    set((s) => ({
      workflows: s.workflows.map((w) =>
        w.id === id ? { ...w, nodes, edges, updatedAt: Date.now() } : w,
      ),
    }));
  },
};
