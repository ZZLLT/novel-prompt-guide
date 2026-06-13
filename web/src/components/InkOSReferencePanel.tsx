import { DatabaseZap, GitBranch, Route, ShieldCheck } from "lucide-react";
import {
  inkosModelRoutes,
  inkosPipelineStages,
  inkosReviewGates,
  inkosTruthFiles,
} from "../data/inkosInspired";

export function InkOSReferencePanel({ onOpen }: { onOpen: () => void }) {
  const firstStages = inkosPipelineStages.slice(0, 4);

  return (
    <section className="inkos-reference-panel" aria-label="创作流水线">
      <div className="inkos-reference-header">
        <div>
          <span>流程控制</span>
          <h3>创作流水线</h3>
        </div>
        <button type="button" aria-label="打开创作流水线窗口" onClick={onOpen}>
          <Route aria-hidden="true" size={15} />
          打开
        </button>
      </div>
      <div className="inkos-mini-flow" aria-label="十阶段预览">
        {firstStages.map((stage) => (
          <article key={stage.id}>
            <strong>{stage.label}</strong>
            <span>{stage.agent}</span>
          </article>
        ))}
      </div>
      <p>
        把“写正文”和“结算状态”拆开；默认只做可视化和结构提示，不自动触发 API。
      </p>
    </section>
  );
}

export function InkOSReferenceWindow() {
  const pipelineText = inkosPipelineStages.map((stage) => stage.label).join(" -> ");

  return (
    <div className="inkos-window-layout">
      <section className="inkos-window-hero">
        <span>Agent 管线 / Token 安全</span>
        <h3>十阶段写作管线</h3>
        <p>{pipelineText}</p>
      </section>

      <section className="inkos-pipeline-lane" aria-label="创作管线">
        {inkosPipelineStages.map((stage, index) => (
          <article key={stage.id}>
            <i>{String(index + 1).padStart(2, "0")}</i>
            <div>
              <span>{stage.phase}</span>
              <strong>{stage.label}</strong>
              <p>{stage.agent}：{stage.role}</p>
              <em>{stage.tokenPolicy}</em>
            </div>
          </article>
        ))}
      </section>

      <div className="inkos-window-columns">
        <section className="inkos-reference-card">
          <header>
            <DatabaseZap aria-hidden="true" size={17} />
            <strong>真相文件</strong>
          </header>
          <div className="inkos-truth-grid">
            {inkosTruthFiles.map((file) => (
              <article key={file.id}>
                <span>{file.owner}</span>
                <strong>{file.label}</strong>
                <p>{file.purpose}</p>
                <em>{file.tokenPolicy}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="inkos-reference-card">
          <header>
            <ShieldCheck aria-hidden="true" size={17} />
            <strong>人工审核门</strong>
          </header>
          <div className="inkos-gate-list">
            {inkosReviewGates.map((gate) => (
              <article key={gate.label}>
                <strong>{gate.label}</strong>
                <p>{gate.purpose}</p>
                <em>{gate.passSignal}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="inkos-reference-card">
          <header>
            <GitBranch aria-hidden="true" size={17} />
            <strong>多模型路由</strong>
          </header>
          <div className="inkos-route-list">
            {inkosModelRoutes.map((route) => (
              <article key={route.agent}>
                <span>{route.agent}</span>
                <strong>{route.modelTier}</strong>
                <p>{route.reason}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
