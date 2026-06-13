import { Braces, FileText, Layers3, ShieldCheck } from "lucide-react";
import type { PromptPolicy } from "../api/types";

type PromptNode = {
  id: string;
  category: string;
  title: string;
  summary: string;
  variables: string[];
  version: string;
  tokenMode: string;
};

const promptNodes: PromptNode[] = [
  {
    id: "chapter-generate",
    category: "生成类 / 章节",
    title: "章节生成提示词",
    summary: "把阶段目标、人物动机、场景节拍压成可直接写正文的短指令。",
    variables: ["阶段", "章节目标", "出场人物"],
    version: "v3",
    tokenMode: "短上下文",
  },
  {
    id: "relation-delta",
    category: "人物线 / 增量",
    title: "关系变化提示词",
    summary: "只提交当前关系线、变化原因和下一步影响，用于更新人物图谱。",
    variables: ["人物A", "人物B", "变化原因"],
    version: "v2",
    tokenMode: "增量提交",
  },
  {
    id: "continuity-check",
    category: "审查类 / 风险",
    title: "连续性审查提示词",
    summary: "检查知识顺序、伏笔债务、世界规则冲突，先产出问题清单。",
    variables: ["已知信息", "伏笔", "规则"],
    version: "v4",
    tokenMode: "低成本模型",
  },
  {
    id: "quality-review",
    category: "质量守门 / 审查",
    title: "六维质量守门提示词",
    summary: "先用本地报告筛出语言风格、密度、节奏、宏观推进问题，再让 AI 修重点。",
    variables: ["质量报告", "章节目标", "严重度"],
    version: "v4",
    tokenMode: "先本地后模型",
  },
  {
    id: "world-contract",
    category: "世界观 / 契约",
    title: "世界观五维契约",
    summary: "把核心规则、空间、社会、文化、日常质感拆成五维，避免设定百科化。",
    variables: ["一句话设定", "类型", "规则限制"],
    version: "v1",
    tokenMode: "短字段契约",
  },
  {
    id: "macro-pacing",
    category: "质量守门 / 节奏",
    title: "宏观节奏诊断",
    summary: "检查早期是否过快结清主线债务、秘密是否同章过载，保留长期压力源。",
    variables: ["章节号", "结清信号", "伏笔债务"],
    version: "v1",
    tokenMode: "诊断摘要",
  },
  {
    id: "context-pack",
    category: "上下文 / 压缩",
    title: "短上下文包",
    summary: "把本次任务整理成目标、限制、相关事实、输出格式四段。",
    variables: ["任务", "限制", "输出格式"],
    version: "v1",
    tokenMode: "可缓存前缀",
  },
];

export function PromptPlazaLite({
  onQueueCommand,
  policy,
  promptPreview,
}: {
  onQueueCommand: (command: string) => void;
  policy: PromptPolicy;
  promptPreview: string;
}) {
  const outputs = policy.outputs.slice(0, 4).join(" / ");
  const activeSections = policy.priority_sections.join(" -> ");

  return (
    <section className="prompt-plaza-lite" aria-label="提示词广场">
      <header className="prompt-plaza-header">
        <div>
          <span>Prompt Plaza</span>
          <h3>提示词广场</h3>
          <p>把常用写作提示词拆成节点，点击只会填入调度指令，不会自动消耗 API。</p>
        </div>
        <div className="prompt-plaza-metrics" aria-label="提示词预算摘要">
          <strong>{policy.label}</strong>
          <span>{policy.context_budget_chars} 字上下文</span>
          <span>{policy.chat_budget_chars} 字聊天</span>
        </div>
      </header>

      <div className="prompt-plaza-toolbar">
        <div className="prompt-plaza-tabs" aria-label="提示词分类">
          <button type="button" className="is-active" aria-current="true">生成类</button>
          <button type="button">人物线</button>
          <button type="button">审查类</button>
          <button type="button">质量守门</button>
          <button type="button">世界观</button>
          <button type="button">上下文</button>
        </div>
        <div className="prompt-plaza-schema" aria-label="提示词字段">
          <span>变量</span>
          <span>版本</span>
          <span>Token 策略</span>
        </div>
      </div>

      <div className="prompt-node-grid">
        {promptNodes.map((node) => (
          <article className="prompt-node-card" key={node.id}>
            <div className="prompt-node-card-head">
              <small>{node.category}</small>
              <strong>{node.title}</strong>
            </div>
            <p>{node.summary}</p>
            <div className="prompt-node-meta">
              <span><Braces aria-hidden="true" size={14} /> 变量：{node.variables.join(" / ")}</span>
              <span><FileText aria-hidden="true" size={14} /> 版本：{node.version}</span>
              <span><ShieldCheck aria-hidden="true" size={14} /> {node.tokenMode}</span>
            </div>
            <button
              type="button"
              aria-label={`调用提示词：${node.title}`}
              onClick={() => onQueueCommand(`请使用「${node.title}」处理当前${policy.label}阶段，只提交必要上下文，输出：${outputs}。`)}
            >
              写入调度指令
            </button>
          </article>
        ))}
      </div>

      <footer className="prompt-plaza-footer">
        <div>
          <Layers3 aria-hidden="true" size={16} />
          <span>当前召回</span>
          <strong>{activeSections}</strong>
        </div>
        <p>{promptPreview || "生成提示词后会在这里显示最近一次 prompt 摘要，便于检查上下文是否过长。"}</p>
      </footer>
    </section>
  );
}
