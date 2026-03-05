import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Provider } from "@/types";

type ModelFactory = (provider: Provider, modelId: string) => BaseChatModel;

/** 服务商 → 模型构造器映射 */
const providerRegistry: Record<string, ModelFactory> = {
  openai: (provider, modelId) =>
    new ChatOpenAI({
      model: modelId,
      apiKey: provider.apiKey,
      configuration: { baseURL: provider.baseURL },
      streaming: true,
    }),

  anthropic: (provider, modelId) =>
    new ChatAnthropic({
      model: modelId,
      anthropicApiKey: provider.apiKey,
      anthropicApiUrl: provider.baseURL,
      streaming: true,
    }),

  // DeepSeek 兼容 OpenAI 接口
  deepseek: (provider, modelId) =>
    new ChatOpenAI({
      model: modelId,
      apiKey: provider.apiKey,
      configuration: { baseURL: provider.baseURL },
      streaming: true,
    }),
};

/** 根据服务商配置和模型 ID 创建 LangChain ChatModel */
export function createModel(provider: Provider, modelId: string): BaseChatModel {
  const factory = providerRegistry[provider.id];
  if (!factory) {
    throw new Error(`Unknown provider: ${provider.id}`);
  }
  return factory(provider, modelId);
}
