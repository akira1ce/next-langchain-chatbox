import type { ComponentType } from "react";
import type { WorkflowNodeType, WorkflowNodeData } from "@/types";
import { LLMConfig } from "./llm-config";
import { TestConfig } from "./test-config";

interface NodeConfigProps {
  nodeId: string;
  data: WorkflowNodeData;
}

/** 节点类型 → 配置组件注册表 */
export const nodeConfigRegistry: Record<WorkflowNodeType, ComponentType<NodeConfigProps>> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- per-node data narrowing handled inside each config component
  llm: LLMConfig as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test: TestConfig as any,
};
