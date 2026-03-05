/** 服务商配置 */
export interface ProviderConfig {
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

export type WorkflowNodeType = "llm";

/** LLM 节点配置 */
export interface LLMNodeData extends Record<string, unknown> {
  label: string;
  systemPrompt: string;
  providerId: string;
  modelId: string;
}

/** 节点数据联合（后续可扩展更多节点类型） */
export type WorkflowNodeData = LLMNodeData;

/** 序列化的节点（用于持久化 & API 传输） */
export interface SerializedNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

/** 序列化的边 */
export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
}

/** 工作流会话（持久化） */
export interface WorkflowSession {
  id: string;
  title: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  createdAt: number;
  updatedAt: number;
}

/** 前后端传输的工作流执行载荷 */
export interface WorkflowPayload {
  nodes: Array<{
    id: string;
    type: WorkflowNodeType;
    data: WorkflowNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  input: string;
  providerConfig: ProviderConfig;
}

/** ─── Chat ─── */

/** 聊天会话 */
export interface ChatSession {
  id: string;
  title: string;
  modelId?: string;
  createdAt: number;
  updatedAt: number;
  messages: import("@ai-sdk/react").UIMessage[];
}
