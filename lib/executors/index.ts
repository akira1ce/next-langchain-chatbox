import type { WorkflowNodeType, WorkflowNodeData } from "@/types";
import { llmExecutor } from "./llm-executor";

export interface ExecutionContext {
  input: string;
  nodeOutputs: Record<string, string>;
}

export type NodeExecutor = (data: WorkflowNodeData, ctx: ExecutionContext) => Promise<string>;

const executorRegistry: Record<WorkflowNodeType, NodeExecutor> = {
  llm: llmExecutor,
};

export function getExecutor(type: WorkflowNodeType): NodeExecutor {
  const executor = executorRegistry[type];
  if (!executor) {
    throw new Error(`No executor for node type: ${type}`);
  }
  return executor;
}
