import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Bot, Check, KeyRound, RefreshCcw, X } from "lucide-react";
import { fetchLlmModels, getLlmConfig, saveLlmConfig } from "../api/client";
import type { LlmConfigInput, LlmModel, ModelRole, ModelRoutes } from "../api/types";

const defaultRoutes: ModelRoutes = {
  planner: "gpt-4o-mini",
  writer: "gpt-4o-mini",
  reviewer: "gpt-4o-mini",
  assistant: "gpt-4o-mini",
};

const defaultConfig: LlmConfigInput = {
  endpoint: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  model_routes: defaultRoutes,
  api_key: "",
  api_enabled: false,
  clear_api_key: false,
  temperature: 0.3,
  max_tokens: 4096,
};

const modelRouteFields: Array<{ role: ModelRole; label: string; hint: string }> = [
  { role: "planner", label: "规划模型", hint: "设定、世界观、剧情规划" },
  { role: "writer", label: "写作模型", hint: "章节正文与续写" },
  { role: "reviewer", label: "审校模型", hint: "一致性、漏洞、润色审查" },
  { role: "assistant", label: "助手模型", hint: "短问答、提示词、下一步建议" },
];

function normalizeRoutes(routes: Partial<ModelRoutes> | undefined, model: string): ModelRoutes {
  const fallback = model || defaultConfig.model;
  return {
    planner: routes?.planner || fallback,
    writer: routes?.writer || fallback,
    reviewer: routes?.reviewer || fallback,
    assistant: routes?.assistant || fallback,
  };
}

function clampFiniteNumber(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeRoutes(routes: Partial<ModelRoutes> | undefined, model: string): ModelRoutes {
  const normalizedRoutes = normalizeRoutes(routes, model);
  return {
    planner: normalizedRoutes.planner.trim() || model,
    writer: normalizedRoutes.writer.trim() || model,
    reviewer: normalizedRoutes.reviewer.trim() || model,
    assistant: normalizedRoutes.assistant.trim() || model,
  };
}

function sanitizeModels(models: unknown): LlmModel[] {
  if (!Array.isArray(models)) return [];
  return models
    .map((model) => (typeof model === "string" ? { id: model } : model))
    .filter((model): model is LlmModel => (
      typeof model === "object" &&
      model !== null &&
      "id" in model &&
      typeof (model as { id?: unknown }).id === "string" &&
      Boolean((model as { id: string }).id.trim())
    ));
}

const quickPresets = [
  {
    id: "openai-compatible",
    label: "OpenAI 兼容",
    model: "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1",
    detail: "官方或兼容网关，适合作为默认档案。",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    model: "deepseek-chat",
    endpoint: "https://api.deepseek.com/v1",
    detail: "常用国产兼容网关，适合规划和审校。",
  },
  {
    id: "local",
    label: "本地网关",
    model: "local-model",
    endpoint: "http://127.0.0.1:8000/v1",
    detail: "本地代理或私有网关，适合低成本测试。",
  },
];

export function ApiSettingsWindow({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<LlmConfigInput>(defaultConfig);
  const [models, setModels] = useState<LlmModel[]>([]);
  const [isLoadingModels, setLoadingModels] = useState(false);
  const [status, setStatus] = useState("读取中");

  useEffect(() => {
    let alive = true;
    getLlmConfig()
      .then((nextConfig) => {
        if (!alive) return;
        setConfig({
          endpoint: nextConfig.endpoint,
          model: nextConfig.model,
          model_routes: normalizeRoutes(nextConfig.model_routes, nextConfig.model),
          api_key: "",
          api_enabled: nextConfig.api_enabled,
          clear_api_key: false,
          temperature: nextConfig.temperature,
          max_tokens: nextConfig.max_tokens,
        });
        setStatus(nextConfig.api_key_set ? (nextConfig.api_enabled ? "已启用即时 API" : "已保存密钥，当前走队列") : "未设置密钥");
      })
      .catch((error) => {
        if (!alive) return;
        setStatus(error instanceof Error ? error.message : String(error));
      });
    return () => {
      alive = false;
    };
  }, []);

  function updateText(field: "endpoint" | "model" | "api_key") {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setConfig((current) => {
        if (field !== "model") return { ...current, [field]: value };
        const currentModel = current.model.trim() || defaultConfig.model;
        const nextModel = value.trim() || defaultConfig.model;
        const currentRoutes = normalizeRoutes(current.model_routes, currentModel);
        const shouldFollowDefault = Object.values(currentRoutes).every((route) => route === currentModel);
        return {
          ...current,
          model: value,
          model_routes: shouldFollowDefault ? normalizeRoutes(undefined, nextModel) : currentRoutes,
        };
      });
    };
  }

  function updateRoute(role: ModelRole) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setConfig((current) => ({
        ...current,
        model_routes: {
          ...normalizeRoutes(current.model_routes, current.model),
          [role]: event.target.value,
        },
      }));
    };
  }

  function updateNumber(field: "temperature" | "max_tokens") {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.valueAsNumber;
      if (!Number.isFinite(value)) return;
      setConfig((current) => ({ ...current, [field]: value }));
    };
  }

  function updateFlag(field: "api_enabled" | "clear_api_key") {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setConfig((current) => ({ ...current, [field]: event.target.checked }));
    };
  }

  function applyPreset(preset: (typeof quickPresets)[number]) {
    setConfig((current) => ({
      ...current,
      endpoint: preset.endpoint,
      model: preset.model,
      model_routes: normalizeRoutes(undefined, preset.model),
    }));
    setStatus(`已套用预设：${preset.label}，请填写密钥后测试或保存`);
  }

  async function loadModels() {
    setLoadingModels(true);
    setStatus("正在获取模型列表");
    try {
      const result = await fetchLlmModels({
        endpoint: config.endpoint.trim(),
        api_key: config.api_key?.trim() || undefined,
      });
      const nextModels = sanitizeModels(result.models);
      setModels(nextModels);
      if (result.error) {
        setStatus(result.error);
        return;
      }
      setStatus(`已获取 ${nextModels.length} 个模型`);
      const firstModel = nextModels[0]?.id;
      const currentModel = config.model.trim();
      const hasCurrentModel = nextModels.some((model) => model.id === currentModel);
      if (firstModel && (!currentModel || !hasCurrentModel)) {
        setConfig((current) => ({
          ...current,
          model: firstModel,
          model_routes: normalizeRoutes(undefined, firstModel),
        }));
        setStatus(`已获取 ${nextModels.length} 个模型，已选择 ${firstModel}`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingModels(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("保存中");
    try {
      const model = config.model.trim() || defaultConfig.model;
      const payload: LlmConfigInput = {
        endpoint: config.endpoint.trim() || defaultConfig.endpoint,
        model,
        model_routes: sanitizeRoutes(config.model_routes, model),
        api_enabled: config.api_enabled,
        clear_api_key: config.clear_api_key,
        temperature: clampFiniteNumber(config.temperature, defaultConfig.temperature, 0, 2),
        max_tokens: Math.round(clampFiniteNumber(config.max_tokens, defaultConfig.max_tokens, 256, 16000)),
      };
      const apiKey = config.api_key?.trim() ?? "";
      if (apiKey) {
        payload.api_key = apiKey;
      }
      const saved = await saveLlmConfig(payload);
      setStatus(saved.api_key_set ? (saved.api_enabled ? "已保存，即时 API 已启用" : "已保存，当前走队列") : "已保存，密钥已清空");
      setConfig((current) => ({
        ...current,
        api_key: "",
        clear_api_key: false,
        api_enabled: saved.api_enabled,
        model_routes: normalizeRoutes(saved.model_routes, saved.model),
      }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="startup-guide-backdrop" onClick={onClose}>
      <form className="api-settings-window api-console-window" role="dialog" aria-label="API设置窗口" aria-modal="true" noValidate onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <header className="startup-guide-header api-console-header">
          <div>
            <span>Provider Control</span>
            <h2>LLM 控制台</h2>
            <p>统一管理模型网关、密钥、默认模型和多 Agent 路由。默认走队列，只有勾选即时 API 后才会直接调用外部模型。</p>
          </div>
          <button type="button" aria-label="关闭API设置窗口" onClick={onClose}>
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <section className={`api-runtime-bar${config.api_enabled ? "" : " is-queued"}`} aria-label="当前模型运行状态">
          <div>
            <span>当前激活模型</span>
            <strong>{config.model || "未配置"}</strong>
          </div>
          <div>
            <span>协议</span>
            <strong>OpenAI Compatible</strong>
          </div>
          <div>
            <span>调用模式</span>
            <strong>{config.api_enabled ? "即时 API" : "队列优先"}</strong>
          </div>
        </section>

        <section className="api-preset-strip" aria-label="厂商预设">
          <header>
            <strong>导入厂商预设</strong>
            <span>套入常用 endpoint 和模型名，密钥仍需手动填写。</span>
          </header>
          <div className="api-preset-grid">
            {quickPresets.map((preset) => (
              <button
                type="button"
               
                className="api-preset-card"
                key={preset.id}
                onClick={() => applyPreset(preset)}
              >
                <span>{preset.label}</span>
                <strong>{preset.model}</strong>
                <small>{preset.endpoint}</small>
                <em>{preset.detail}</em>
              </button>
            ))}
          </div>
        </section>

        <div className="api-console-body">
          <aside className="api-profile-sidebar" aria-label="配置档案">
            <header>
              <strong>配置档案</strong>
              <span>当前项目</span>
            </header>
            <button type="button" className="api-profile-item is-active">
              <span>默认档案</span>
              <small>{config.model || defaultConfig.model}</small>
            </button>
            <button type="button" className="api-profile-item">
              <span>兼容网关</span>
              <small>{config.endpoint || defaultConfig.endpoint}</small>
            </button>
            <button type="button" className="api-profile-item">
              <span>多模型路由</span>
              <small>Planner / Writer / Reviewer / Assistant</small>
            </button>
          </aside>

          <section className="api-editor-panel" aria-label="模型档案编辑器">
            <datalist id="api-model-options">
              {models.map((model) => (
                <option key={model.id} value={model.id} />
              ))}
            </datalist>
            <div className="api-settings-grid">
              <label className="span-2">
                <span>API 地址</span>
                <input className="form-input" aria-label="API地址" value={config.endpoint} onChange={updateText("endpoint")} placeholder="https://api.openai.com/v1" />
              </label>
              <label>
                <span>默认模型</span>
                <input className="form-input" aria-label="默认模型" list="api-model-options" value={config.model} onChange={updateText("model")} placeholder="gpt-4o-mini / deepseek-chat" />
              </label>
              <label>
                <span>API Key</span>
                <input className="form-input" aria-label="API密钥" value={config.api_key} onChange={updateText("api_key")} placeholder="留空则保留原密钥" type="password" />
              </label>
              <section className="api-model-panel span-2" aria-label="多模型协作设置">
                <header>
                  <div>
                    <span>多模型协作</span>
                    <strong>按任务把不同 Agent 分配到不同模型</strong>
                  </div>
                  <button
                    type="button"
                   
                   
                    aria-label="获取模型列表"
                    disabled={isLoadingModels || !config.endpoint.trim()}
                    onClick={loadModels}
                  >
                    <RefreshCcw aria-hidden="true" size={15} />
                    {isLoadingModels ? "获取中" : "获取模型"}
                  </button>
                </header>
                <div className="api-model-route-grid">
                  {modelRouteFields.map((field) => (
                    <label key={field.role}>
                      <span>{field.label}</span>
                      <input className="form-input"
                        aria-label={field.label}
                        list="api-model-options"
                        value={normalizeRoutes(config.model_routes, config.model)[field.role]}
                        onChange={updateRoute(field.role)}
                        placeholder={config.model}
                      />
                      <small>{field.hint}</small>
                    </label>
                  ))}
                </div>
                <p><Bot aria-hidden="true" size={14} /> 拉取模型只在点击时发生；不填角色模型时会使用默认模型。</p>
              </section>
              <label className="api-toggle-field">
                <input aria-label="启用即时API" checked={config.api_enabled} onChange={updateFlag("api_enabled")} type="checkbox" />
                <span>启用即时 API</span>
              </label>
              <label className="api-toggle-field">
                <input aria-label="清除已保存API密钥" checked={config.clear_api_key} onChange={updateFlag("clear_api_key")} type="checkbox" />
                <span>清除已保存密钥</span>
              </label>
              <label>
                <span>温度</span>
                <input className="form-input" aria-label="API温度" min="0" max="2" step="0.1" type="number" value={config.temperature} onChange={updateNumber("temperature")} />
              </label>
              <label>
                <span>最大输出</span>
                <input className="form-input" aria-label="API最大输出" min="256" max="16000" step="256" type="number" value={config.max_tokens} onChange={updateNumber("max_tokens")} />
              </label>
            </div>
          </section>
        </div>

        <div className="startup-guide-actions">
          <p><KeyRound aria-hidden="true" size={15} /> {status}</p>
          <button type="submit" aria-label="保存API设置">
            <Check aria-hidden="true" size={16} />
            保存 API
          </button>
        </div>
      </form>
    </section>
  );
}
