import { UIMessage } from "@ai-sdk/react";

/** ─── Providers ─── */
export interface Provider {
  id: string; // "openai" | "anthropic" | "deepseek" | ...
  name: string; // 显示名
  apiKey: string;
  baseURL?: string;
  enabled: boolean;
  models: ModelOption[]; // 该服务商下的模型列表（内置 + 自定义）
}

/** 模型选项 */
export interface ModelOption {
  id: string; // "gpt-4o"
  name: string; // 显示名
  providerId: string;
}

/** 服务商元数据（内置静态数据） */
export interface ProviderMeta {
  id: string;
  name: string;
  defaultBaseURL: string;
  models: ModelOption[];
}

/** ─── Workflow ─── */

export type WorkflowNodeType = "llm" | "test";

/** LLM 节点配置（provider 由前端选择时一并写入） */
export interface LLMNodeData extends Record<string, unknown> {
  label: string;
  systemPrompt: string;
  providerId: string;
  modelId: string;
  /** 前端选 provider 时将完整配置写入，后端直接取用 */
  provider?: Provider;
}

/** Test 节点配置：为上一个节点输出添加自定义前缀 */
export interface TestNodeData extends Record<string, unknown> {
  label: string;
  prefix: string;
}

/** 节点数据联合 */
export type WorkflowNodeData = LLMNodeData | TestNodeData;

/** 序列化的节点（用于持久化 & API 传输） */
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

/** 序列化的边 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

/** 工作流配置 */
export interface Workflow {
  id: string;
  title: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: number;
  updatedAt: number;
}

/** ─── Chat ─── */

/** 聊天会话 */
export interface ChatSession {
  id: string;
  title: string;
  modelId?: string;
  workflowId?: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
}
