"use client";

import { useSettingsStore } from "@/store/settings-store";
import { useEditorActions } from "../editor-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LLMNodeData } from "@/types";

interface LLMConfigProps {
  nodeId: string;
  data: LLMNodeData;
}

export function LLMConfig({ nodeId, data }: LLMConfigProps) {
  const providers = useSettingsStore((s) => s.providers);
  const enabledProviders = providers.filter((p) => p.enabled && p.apiKey);
  const { updateNodeData } = useEditorActions();

  const selectedProvider = enabledProviders.find(
    (p) => p.id === data.providerId,
  );
  const availableModels = selectedProvider?.models ?? [];

  const update = (patch: Partial<LLMNodeData>) =>
    updateNodeData(nodeId, patch);

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="node-label">Label</Label>
        <Input
          id="node-label"
          value={data.label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-provider">Provider</Label>
        <Select
          value={data.providerId}
          onValueChange={(v) => update({ providerId: v, modelId: "" })}
        >
          <SelectTrigger id="node-provider">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {enabledProviders.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-model">Model</Label>
        <Select
          value={data.modelId}
          onValueChange={(v) => update({ modelId: v })}
          disabled={!availableModels.length}
        >
          <SelectTrigger id="node-model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 space-y-1.5">
        <Label htmlFor="node-prompt">System Prompt</Label>
        <Textarea
          id="node-prompt"
          className="min-h-[120px] resize-y font-mono text-xs"
          value={data.systemPrompt}
          onChange={(e) => update({ systemPrompt: e.target.value })}
          placeholder={"You are a helpful assistant.\n\nUse {{nodeId.output}} to reference other nodes."}
        />
      </div>
    </>
  );
}
