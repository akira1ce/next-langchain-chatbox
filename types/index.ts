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

/** 聊天会话 */
export interface ChatSession {
  id: string;
  title: string;
  modelId?: string;
  createdAt: number;
  updatedAt: number;
  messages: import("@ai-sdk/react").UIMessage[];
}
