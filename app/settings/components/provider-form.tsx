"use client";

import { useState } from "react";
import { useSettingsStore, settingsActions } from "@/store/settings-store";
import { PROVIDERS } from "@/lib/providers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, RotateCcw, Loader2, Zap } from "lucide-react";
import type { Provider } from "@/types";

interface ProviderFormProps {
  provider: Provider;
}

export function ProviderForm({ provider }: ProviderFormProps) {
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");

  // 连通性测试状态
  const [testing, setTesting] = useState(false);
  const [testModelId, setTestModelId] = useState(provider.models[0]?.id ?? "");
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const meta = PROVIDERS.find((p) => p.id === provider.id);
  const builtinIds = new Set(meta?.models.map((m) => m.id) ?? []);

  const handleAddModel = () => {
    const id = newModelId.trim();
    const name = newModelName.trim() || id;
    if (!id) return;
    if (provider.models.some((m) => m.id === id)) return;

    settingsActions.addModel(provider.id, { id, name, providerId: provider.id });
    setNewModelId("");
    setNewModelName("");
  };

  const handleResetModels = () => {
    if (!meta) return;
    const store = useSettingsStore.getState();
    const current = store.providers.find((p) => p.id === provider.id);
    if (current) {
      const customModels = current.models.filter((m) => !builtinIds.has(m.id));
      const newModels = [...meta.models, ...customModels];
      useSettingsStore.setState((state) => ({
        providers: state.providers.map((p) =>
          p.id === provider.id ? { ...p, models: newModels } : p,
        ),
      }));
    }
  };

  const handleTestConnection = async () => {
    if (!provider.apiKey || provider.models.length === 0) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider,
          modelId: testModelId || provider.models[0]?.id,
        }),
      });
      const data = await res.json();
      setTestResult({
        ok: data.ok,
        message: data.ok ? "Connected successfully!" : `Failed: ${data.error}`,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部：名称 + 启用开关 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{provider.name}</h3>
          <p className="text-sm text-muted-foreground">
            {provider.models.length} model{provider.models.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`enabled-${provider.id}`} className="text-sm">
            {provider.enabled ? (
              <Badge variant="default">Enabled</Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </Label>
          <Switch
            id={`enabled-${provider.id}`}
            checked={provider.enabled}
            onCheckedChange={(enabled) => settingsActions.updateProvider(provider.id, { enabled })}
          />
        </div>
      </div>

      {/* API Key + Base URL */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`apiKey-${provider.id}`}>API Key</Label>
          <Input
            id={`apiKey-${provider.id}`}
            type="password"
            placeholder="sk-..."
            value={provider.apiKey}
            onChange={(e) =>
              settingsActions.updateProvider(provider.id, { apiKey: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`baseURL-${provider.id}`}>Base URL</Label>
          <Input
            id={`baseURL-${provider.id}`}
            type="url"
            placeholder={meta?.defaultBaseURL}
            value={provider.baseURL ?? ""}
            onChange={(e) =>
              settingsActions.updateProvider(provider.id, { baseURL: e.target.value })
            }
          />
          {meta && <p className="text-xs text-muted-foreground">Default: {meta.defaultBaseURL}</p>}
        </div>

        {/* 连通性测试 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Select
              value={testModelId}
              onValueChange={setTestModelId}
              disabled={testing || provider.models.length === 0}>
              <SelectTrigger className="h-8 w-52 text-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {provider.models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing || !provider.apiKey || !testModelId}>
              {testing ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Zap className="mr-1 h-3 w-3" />
              )}
              {testing ? "Testing..." : "Test Connection"}
            </Button>
          </div>
          {testResult && (
            <p className={`text-sm ${testResult.ok ? "text-green-600" : "text-destructive"}`}>
              {testResult.message}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* 模型管理 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Models</Label>
          {meta && (
            <Button variant="ghost" size="sm" onClick={handleResetModels}>
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset built-in
            </Button>
          )}
        </div>

        {/* 模型列表 */}
        <div className="space-y-2">
          {provider.models.map((model) => (
            <div key={model.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <div className="flex-1 min-w-0">
                <Input
                  value={model.name}
                  onChange={(e) =>
                    settingsActions.updateModel(provider.id, model.id, { name: e.target.value })
                  }
                  className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <code className="shrink-0 text-xs text-muted-foreground">{model.id}</code>
              {builtinIds.has(model.id) && (
                <Badge variant="secondary" className="text-xs">
                  built-in
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => settingsActions.removeModel(provider.id, model.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* 添加新模型 */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Model ID</Label>
            <Input
              value={newModelId}
              onChange={(e) => setNewModelId(e.target.value)}
              placeholder="e.g. gpt-4o-2024-11-20"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddModel();
              }}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Display Name (optional)</Label>
            <Input
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="e.g. GPT-4o Nov"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddModel();
              }}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={handleAddModel}
            disabled={!newModelId.trim()}>
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            settingsActions.updateProvider(provider.id, {
              baseURL: meta?.defaultBaseURL ?? "",
            })
          }>
          Reset Base URL
        </Button>
      </div>
    </div>
  );
}
