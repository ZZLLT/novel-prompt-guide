import { useState, type ChangeEvent, type FormEvent } from "react";
import { BookOpen, Check, X, ChevronLeft, ChevronRight, Sparkles, Bot, ArrowRight } from "lucide-react";
import type { InitialNovelSetup } from "../hooks/useCockpit";

const emptySetup: InitialNovelSetup = {
  title: "",
  genre: "",
  style: "",
  premise: "",
  protagonist: "",
  coreConflict: "",
  worldRule: "",
  firstVolumeGoal: "",
};

type SetupStep = {
  key: keyof InitialNovelSetup;
  label: string;
  placeholder: string;
  hint: string;
  aiSuggestionPrompt: string;
  fieldType: "input" | "textarea";
};

const setupSteps: SetupStep[] = [
  {
    key: "title",
    label: "书名",
    placeholder: "先写临时名也可以，后续可以改",
    hint: "一个能抓住核心概念的名字。比如《诡秘之主》暗示了主角的身份和力量来源。",
    aiSuggestionPrompt: "根据我填写的类型和一句话设定，帮我生成 3 个有吸引力的书名选项",
    fieldType: "input",
  },
  {
    key: "genre",
    label: "类型",
    placeholder: "玄幻 / 都市 / 科幻 / 悬疑 / 历史 / 仙侠...",
    hint: "类型决定了读者的期待。混搭类型（如「都市+悬疑」）可以拓宽受众。",
    aiSuggestionPrompt: "根据我的一句话设定，分析这个题材最适合哪种类型或类型组合",
    fieldType: "input",
  },
  {
    key: "style",
    label: "文风",
    placeholder: "爽文快节奏 / 慢热细腻 / 硬核设定 / 轻松幽默...",
    hint: "文风影响读者的阅读体验。快节奏适合爽文，慢热适合悬疑推理。",
    aiSuggestionPrompt: "根据类型和一句话设定，推荐 2-3 种适合的文风并解释原因",
    fieldType: "input",
  },
  {
    key: "premise",
    label: "一句话设定",
    placeholder: "这是一个关于谁，在什么世界，为了什么目标，付出什么代价的故事。",
    hint: "用一句话概括整个故事的核心矛盾。好的设定能引发好奇心和期待。",
    aiSuggestionPrompt: "帮我完善这句话设定，让它更有张力和吸引力",
    fieldType: "textarea",
  },
  {
    key: "protagonist",
    label: "主角",
    placeholder: "姓名、身份、最想要的东西、最大的弱点",
    hint: "主角的「渴望」驱动故事，「弱点」制造冲突。两者缺一不可。",
    aiSuggestionPrompt: "根据一句话设定和类型，帮我设计一个有魅力的主角：渴望、弱点、成长弧线",
    fieldType: "input",
  },
  {
    key: "coreConflict",
    label: "核心冲突",
    placeholder: "主角和世界、敌人、制度、秘密之间最大的矛盾是什么？",
    hint: "核心冲突是整本书的引擎。它应该足够强大，能持续产生新的矛盾。",
    aiSuggestionPrompt: "根据主角设定，帮我深化核心冲突：对抗力量、利益冲突、内在矛盾各是什么",
    fieldType: "textarea",
  },
  {
    key: "worldRule",
    label: "特殊规则",
    placeholder: "一条能持续制造剧情的问题或限制。比如：所有魔法都有代价。",
    hint: "特殊规则是世界观的灵魂。它限制角色的同时也在推动剧情。",
    aiSuggestionPrompt: "根据类型和核心冲突，帮我设计 2-3 条能持续制造冲突的世界规则",
    fieldType: "textarea",
  },
  {
    key: "firstVolumeGoal",
    label: "第一卷目标",
    placeholder: "第一卷结束时，主角要完成什么、失去什么、发现什么。",
    hint: "第一卷的目标要给读者一个阶段性满足，同时留下更大的悬念。",
    aiSuggestionPrompt: "根据核心冲突，帮我规划第一卷的节奏：小高潮、大高潮、卷末悬念",
    fieldType: "textarea",
  },
];

export function InitialSetupGuide({
  onClose,
  onSubmit,
  onAskAi,
}: {
  onClose: () => void;
  onSubmit: (setup: InitialNovelSetup) => void;
  onAskAi?: (prompt: string) => void;
}) {
  const [setup, setSetup] = useState<InitialNovelSetup>(emptySetup);
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState<"stepped" | "all">("stepped");

  function updateField(field: keyof InitialNovelSetup) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSetup((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(setup);
    onClose();
  }

  function handleAiSuggestion(step: SetupStep) {
    const filledFields = setupSteps
      .filter((s) => setup[s.key] && s.key !== step.key)
      .map((s) => `${s.label}：${setup[s.key]}`)
      .join("；");
    const prompt = `我正在写一部小说，目前填了这些：${filledFields || "（还没有填任何内容）"}。请${step.aiSuggestionPrompt}。`;
    onAskAi?.(prompt);
  }

  const step = setupSteps[currentStep];
  const filledCount = setupSteps.filter((s) => setup[s.key].trim()).length;
  const progressPercent = Math.round((filledCount / setupSteps.length) * 100);

  const renderField = (s: SetupStep, index: number) => {
    const isActive = viewMode === "stepped" && index === currentStep;
    const isFilled = setup[s.key].trim();
    if (viewMode === "stepped" && !isActive) return null;
    return (
      <div className={`setup-field-card${isActive ? " is-active" : ""}${isFilled ? " is-filled" : ""}`} key={s.key}>
        <div className="setup-field-head">
          <div>
            <span className="setup-field-number">{index + 1}</span>
            <span className="setup-field-label">{s.label}</span>
            {isFilled && <span className="setup-field-badge">已填</span>}
          </div>
          {onAskAi && (
            <button
              type="button"
              className="setup-ai-btn"
              onClick={() => handleAiSuggestion(s)}
              aria-label={`让 AI 帮我想${s.label}`}
            >
              <Sparkles size={14} />
              AI 建议
            </button>
          )}
        </div>
        <p className="setup-field-hint">{s.hint}</p>
        {s.fieldType === "textarea" ? (
          <textarea
            aria-label={s.label}
            value={setup[s.key]}
            onChange={updateField(s.key)}
            placeholder={s.placeholder}
            rows={3}
          />
        ) : (
          <input
            aria-label={s.label}
            value={setup[s.key]}
            onChange={updateField(s.key)}
            placeholder={s.placeholder}
          />
        )}
      </div>
    );
  };

  return (
    <section className="startup-guide-backdrop" onClick={onClose}>
      <form className="startup-guide-window startup-guide-enhanced" role="dialog" aria-label="小说初设引导" aria-modal="true" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <header className="startup-guide-header">
          <div>
            <span>起步设定</span>
            <h2>小说初设引导</h2>
            <p>一步步把小说的核心搭好。每一步都可以让 AI 帮你出主意，填完就能同步到故事圣经。</p>
          </div>
          <div className="startup-guide-header-actions">
            <div className="setup-mode-toggle" role="tablist" aria-label="填写模式">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "stepped"}
                className={viewMode === "stepped" ? "is-active" : ""}
                onClick={() => setViewMode("stepped")}
              >
                逐步引导
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "all"}
                className={viewMode === "all" ? "is-active" : ""}
                onClick={() => setViewMode("all")}
              >
                全部填写
              </button>
            </div>
            <button type="button" aria-label="关闭小说初设引导" onClick={onClose}>
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        </header>

        <div className="setup-progress-bar">
          <div className="setup-progress-fill" style={{ width: `${progressPercent}%` }} />
          <span>{filledCount}/{setupSteps.length} 已填 · {progressPercent}%</span>
        </div>

        {viewMode === "stepped" && (
          <div className="setup-step-indicators">
            {setupSteps.map((s, i) => (
              <button
                type="button"
                key={s.key}
                className={`setup-step-dot${i === currentStep ? " is-current" : ""}${setup[s.key].trim() ? " is-done" : ""}`}
                onClick={() => setCurrentStep(i)}
                aria-label={`第${i + 1}步：${s.label}`}
              >
                {setup[s.key].trim() ? <Check size={12} /> : i + 1}
              </button>
            ))}
          </div>
        )}

        <div className={viewMode === "stepped" ? "setup-stepped-body" : "startup-guide-grid"}>
          {setupSteps.map((s, i) => renderField(s, i))}
        </div>

        {viewMode === "stepped" && (
          <div className="setup-step-nav">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((v) => v - 1)}
              aria-label="上一步"
            >
              <ChevronLeft size={16} />
              上一步
            </button>
            {currentStep < setupSteps.length - 1 ? (
              <button type="button" onClick={() => setCurrentStep((v) => v + 1)} aria-label="下一步">
                下一步
                <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" className="setup-submit-btn" aria-label="保存初设并同步到故事圣经">
                <Check size={16} />
                完成，同步到故事圣经
              </button>
            )}
          </div>
        )}

        {viewMode === "all" && (
          <div className="startup-guide-actions">
            <p><BookOpen aria-hidden="true" size={15} /> 保存后会填入封面、世界观、人物和剧情大纲字段，并生成一条可提交给 AI 的检查指令。</p>
            <button type="submit" aria-label="保存小说初设">
              <Check aria-hidden="true" size={16} />
              保存初设
            </button>
          </div>
        )}

        {onAskAi && (
          <div className="setup-ai-footer">
            <Bot size={16} />
            <span>点击每步的「AI 建议」按钮，AI 会根据你已填的内容给出针对性建议。</span>
            <button type="button" className="setup-ai-all-btn" onClick={() => onAskAi("我刚开始一部新小说，请帮我从类型、核心设定、主角、冲突四个维度做一份完整的初设建议。")}>
              <ArrowRight size={14} />
              让 AI 帮我从头规划
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
