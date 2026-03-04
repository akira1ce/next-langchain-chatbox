import type { ProviderMeta } from "@/types";

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "openai",
    name: "OpenAI",
    defaultBaseURL: "https://api.openai.com/v1",
    models: [
      { id: "gpt-4o", name: "GPT-4o", providerId: "openai" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", providerId: "openai" },
      { id: "gpt-4.1", name: "GPT-4.1", providerId: "openai" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", providerId: "openai" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    defaultBaseURL: "https://api.anthropic.com",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", providerId: "anthropic" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", providerId: "anthropic" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultBaseURL: "https://api.deepseek.com",
    models: [
      { id: "deepseek-chat", name: "DeepSeek V3", providerId: "deepseek" },
      { id: "deepseek-reasoner", name: "DeepSeek R1", providerId: "deepseek" },
    ],
  },
];

/** 根据 providerId 获取服务商元数据 */
export function getProviderMeta(providerId: string): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.id === providerId);
}

/** 获取所有可用模型（从已启用的服务商中） */
export function getAllModels(): import("@/types").ModelOption[] {
  return PROVIDERS.flatMap((p) => p.models);
}
