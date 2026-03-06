import type { WorkflowNodeType, WorkflowNodeData } from "@/types";
import { llmExecutor } from "./llm-executor";
import { testExecutor } from "./test-executor";

export interface ExecutionContext {
  input: string;
  nodeOutputs: Record<string, string>;
}

export type NodeExecutor = (data: WorkflowNodeData, ctx: ExecutionContext) => Promise<string>;

const executorRegistry: Record<WorkflowNodeType, NodeExecutor> = {
  llm: llmExecutor,
  test: testExecutor,
};

export function getExecutor(type: WorkflowNodeType): NodeExecutor {
  const executor = executorRegistry[type];
  if (!executor) {
    throw new Error(`No executor for node type: ${type}`);
  }
  return executor;
}
