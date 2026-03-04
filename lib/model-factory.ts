import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ProviderConfig } from "@/types";

type ModelFactory = (config: ProviderConfig, modelId: string) => BaseChatModel;

/** 服务商 → 模型构造器映射 */
const providerRegistry: Record<string, ModelFactory> = {
  openai: (config, modelId) =>
    new ChatOpenAI({
      model: modelId,
      apiKey: config.apiKey,
      configuration: { baseURL: config.baseURL },
      streaming: true,
    }),

  anthropic: (config, modelId) =>
    new ChatAnthropic({
      model: modelId,
      anthropicApiKey: config.apiKey,
      anthropicApiUrl: config.baseURL,
      streaming: true,
    }),

  // DeepSeek 兼容 OpenAI 接口
  deepseek: (config, modelId) =>
    new ChatOpenAI({
      model: modelId,
      apiKey: config.apiKey,
      configuration: { baseURL: config.baseURL },
      streaming: true,
    }),
};

/** 根据服务商配置和模型 ID 创建 LangChain ChatModel */
export function createModel(providerConfig: ProviderConfig, modelId: string): BaseChatModel {
  const factory = providerRegistry[providerConfig.id];
  if (!factory) {
    throw new Error(`Unknown provider: ${providerConfig.id}`);
  }
  return factory(providerConfig, modelId);
}
