import type { StagePlaybook } from "../data/playbooks";

export function CreativePlaybook({
  onQueueCommand,
  playbook,
}: {
  onQueueCommand: (command: string) => void;
  playbook: StagePlaybook;
}) {
  return (
    <section className="creative-playbook" aria-label="创作蓝图">
      <div className="playbook-header">
        <div>
          <span>PLAYBOOK</span>
          <h3>创作蓝图</h3>
        </div>
        <strong>多 Agent 接力</strong>
      </div>

      <div className="playbook-metrics">
        <article>
          <span>读者承诺</span>
          <p>{playbook.promise}</p>
        </article>
        <article>
          <span>本阶段交付</span>
          <p>{playbook.target}</p>
        </article>
        <article>
          <span>风险预警</span>
          <p>{playbook.risk}</p>
        </article>
      </div>

      <div className="playbook-columns">
        <section>
          <h3>章节节拍</h3>
          <ol className="beat-list">
            {playbook.beats.map((beat) => (
              <li key={beat.label}>
                <strong>{beat.label}</strong>
                <p>{beat.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3>多 Agent 接力</h3>
          <div className="relay-list">
            {playbook.relay.map((item) => (
              <article key={item.agent}>
                <strong>{item.agent}</strong>
                <p>{item.handoff}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="seed-bank" aria-label="素材按钮">
        {playbook.seeds.map((seed) => (
          <button
            aria-label={`调用素材：${seed.label}`}
            key={seed.label}
            onClick={() => onQueueCommand(seed.prompt)}
            type="button"
          >
            {seed.label}
          </button>
        ))}
      </div>
    </section>
  );
}
