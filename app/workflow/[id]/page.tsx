"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { useWorkflowStore, workflowActions } from "@/store/workflow-store";
import { WorkflowCanvas } from "../components/workflow-canvas";

interface WorkflowEditorPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkflowEditorPage({ params }: WorkflowEditorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const workflows = useWorkflowStore((s) => s.workflows);

  const exists = workflows.some((w) => w.id === id);

  useEffect(() => {
    if (!exists) {
      router.replace("/workflow");
      return;
    }
    workflowActions.setActive(id);
  }, [id, exists, router]);

  if (!exists) return null;

  return (
    <ReactFlowProvider>
      <WorkflowCanvas workflowId={id} />
    </ReactFlowProvider>
  );
}
