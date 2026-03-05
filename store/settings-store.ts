import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Provider, ModelOption } from "@/types";
import { PROVIDERS } from "@/lib/providers";

interface SettingsState {
  /** 用户配置的服务商列表 */
  providers: Provider[];
}

/** 从内置元数据生成默认服务商配置 */
const defaultProviders: Provider[] = PROVIDERS.map((p) => ({
  id: p.id,
  name: p.name,
  apiKey: "",
  baseURL: p.defaultBaseURL,
  enabled: false,
  models: [...p.models],
}));

export const useSettingsStore = create<SettingsState>()(
  persist((_set) => ({ providers: defaultProviders }), {
    name: "settings-store",
  }),
);

const set = useSettingsStore.setState;

export const settingsActions = {
  /** 更新某个服务商的配置 */
  updateProvider: (id: string, patch: Partial<Omit<Provider, "models">>) =>
    set((state) => ({
      providers: state.providers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  /** 添加模型到指定服务商 */
  addModel: (providerId: string, model: ModelOption) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === providerId ? { ...p, models: [...p.models, model] } : p,
      ),
    })),

  /** 删除指定服务商的模型 */
  removeModel: (providerId: string, modelId: string) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === providerId ? { ...p, models: p.models.filter((m) => m.id !== modelId) } : p,
      ),
    })),

  /** 更新指定服务商的模型 */
  updateModel: (providerId: string, modelId: string, patch: Partial<ModelOption>) =>
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
};
