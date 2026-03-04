import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProviderConfig, ModelOption } from "@/types";
import { PROVIDERS } from "@/lib/providers";

interface SettingsState {
  /** 用户配置的服务商列表 */
  providers: ProviderConfig[];

  /** 更新某个服务商的配置 */
  updateProvider: (id: string, patch: Partial<Omit<ProviderConfig, "models">>) => void;

  /** 添加模型到指定服务商 */
  addModel: (providerId: string, model: ModelOption) => void;
  /** 删除指定服务商的模型 */
  removeModel: (providerId: string, modelId: string) => void;
  /** 更新指定服务商的模型 */
  updateModel: (providerId: string, modelId: string, patch: Partial<ModelOption>) => void;
}

/** 从内置元数据生成默认服务商配置 */
const defaultProviders: ProviderConfig[] = PROVIDERS.map((p) => ({
  id: p.id,
  name: p.name,
  apiKey: "",
  baseURL: p.defaultBaseURL,
  enabled: false,
  models: [...p.models],
}));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      providers: defaultProviders,

      updateProvider: (id, patch) =>
        set((state) => ({
          providers: state.providers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      addModel: (providerId, model) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === providerId ? { ...p, models: [...p.models, model] } : p,
          ),
        })),

      removeModel: (providerId, modelId) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === providerId ? { ...p, models: p.models.filter((m) => m.id !== modelId) } : p,
          ),
        })),

      updateModel: (providerId, modelId, patch) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  models: p.models.map((m) => (m.id === modelId ? { ...m, ...patch } : m)),
                }
              : p,
          ),
        })),
    }),
    {
      name: "settings-store",
    },
  ),
);
