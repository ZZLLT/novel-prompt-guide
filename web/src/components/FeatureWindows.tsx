import { FunctionWindow } from "./FunctionWindow";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";

export function BudgetWindow({ onClose }: { onClose: () => void }) {
  return (
    <FunctionWindow title="预算控制" onClose={onClose} eyebrow="Token 管理" width="700px">
      <div className="function-overview">
        <div className="overview-stat">
          <div className="overview-stat-value">0</div>
          <div className="overview-stat-label">已使用 Token</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value">10,000</div>
          <div className="overview-stat-label">预算上限</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value">100%</div>
          <div className="overview-stat-label">剩余额度</div>
        </div>
      </div>

      <div className="alert alert-info" style={{marginBottom: '20px'}}>
        <AlertCircle size={16} style={{display: 'inline-block', marginRight: '8px'}} />
        设置 Token 预算上限，避免意外超支。系统会在接近预算时提醒。
      </div>

      <div className="form-field">
        <label className="form-label">预算上限 (Token)</label>
        <input className="form-input" type="number" defaultValue="10000" placeholder="输入预算上限" />
        <span className="form-helper">建议设置为单次任务的 2-3 倍</span>
      </div>

      <div className="form-field">
        <label className="form-label">警告阈值 (%)</label>
        <input className="form-input" type="number" defaultValue="80" placeholder="80" />
        <span className="form-helper">当使用量达到此百分比时发出警告</span>
      </div>

      <div className="card" style={{marginTop: '20px'}}>
        <div className="card-header">
          <h3 className="card-title">消耗趋势</h3>
        </div>
        <div className="card-body">
          <div className="empty-state" style={{padding: '40px'}}>
            <div className="empty-state-icon">
              <TrendingUp size={40} />
            </div>
            <p className="empty-state-title">暂无数据</p>
            <p className="empty-state-desc">开始使用后将显示 Token 消耗趋势图</p>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
        <button type="button">
          <Sparkles size={16} />
          保存设置
        </button>
        <button type="button">
          取消
        </button>
      </div>
    </FunctionWindow>
  );
}

export function GenerationModeWindow({ onClose }: { onClose: () => void }) {
  const modes = [
    { id: 'precise', name: '精确模式', desc: '严格遵循大纲，适合重要章节', icon: '🎯' },
    { id: 'balanced', name: '平衡模式', desc: '兼顾质量与创意，日常写作推荐', icon: '⚖️' },
    { id: 'creative', name: '创意模式', desc: '更多发挥空间，适合头脑风暴', icon: '✨' },
  ];

  return (
    <FunctionWindow title="生成模式" onClose={onClose} eyebrow="写作策略" width="600px">
      <div className="alert alert-info" style={{marginBottom: '20px'}}>
        不同模式影响 AI 生成的风格和自由度，可随时切换。
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
        {modes.map(mode => (
          <div key={mode.id} className="card" style={{cursor: 'pointer'}}>
            <div className="card-header">
              <span style={{fontSize: '24px', marginRight: '12px'}}>{mode.icon}</span>
              <div>
                <h3 className="card-title">{mode.name}</h3>
                <p className="card-body" style={{marginTop: '4px'}}>{mode.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button">
        确定
      </button>
    </FunctionWindow>
  );
}

export function PlaybookWindow({ onClose }: { onClose: () => void }) {
  const templates = [
    { name: '开场模板', desc: '主角登场、世界观展示、核心冲突引入' },
    { name: '高潮模板', desc: '节奏加快、冲突爆发、情绪推向顶点' },
    { name: '转折模板', desc: '剧情反转、揭示真相、改变方向' },
  ];

  return (
    <FunctionWindow title="创作蓝图" onClose={onClose} eyebrow="预设模板" width="700px">
      <div className="alert alert-warning" style={{marginBottom: '20px'}}>
        选择模板后，会自动填充相应的章节结构提示词。
      </div>

      <div style={{display: 'grid', gap: '12px'}}>
        {templates.map((tpl, i) => (
          <div key={i} className="card">
            <div className="card-header">
              <h3 className="card-title">{tpl.name}</h3>
            </div>
            <div className="card-body">{tpl.desc}</div>
          </div>
        ))}
      </div>

      <button type="button">
        关闭
      </button>
    </FunctionWindow>
  );
}

export function DocumentWindow({ onClose }: { onClose: () => void }) {
  return (
    <FunctionWindow title="文档工作台" onClose={onClose} eyebrow="WPS 同步" width="800px">
      <div className="alert alert-success" style={{marginBottom: '20px'}}>
        WPS 连接正常，可以同步文档内容。
      </div>

      <div className="form-field">
        <label className="form-label">当前文档</label>
        <input className="form-input" defaultValue="我的小说.docx" readOnly />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">同步状态</h3>
        </div>
        <div className="card-body">
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
            <span>最后同步：</span>
            <span>2 分钟前</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span>文档字数：</span>
            <span>12,458 字</span>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
        <button type="button">从 WPS 读取</button>
        <button type="button">写入 WPS</button>
        <button type="button">关闭</button>
      </div>
    </FunctionWindow>
  );
}

export function WorkflowWindow({ onClose }: { onClose: () => void }) {
  return (
    <FunctionWindow title="创作流水线" onClose={onClose} eyebrow="批量生成" width="900px">
      <div className="alert alert-info" style={{marginBottom: '20px'}}>
        设置批量生成任务，自动完成多个章节的创作。
      </div>

      <div className="form-field">
        <label className="form-label">起始章节</label>
        <input className="form-input" type="number" defaultValue="1" />
      </div>

      <div className="form-field">
        <label className="form-label">结束章节</label>
        <input className="form-input" type="number" defaultValue="10" />
      </div>

      <div className="form-field">
        <label className="form-label">生成模式</label>
        <select className="form-select">
          <option>平衡模式</option>
          <option>精确模式</option>
          <option>创意模式</option>
        </select>
      </div>

      <div className="empty-state" style={{padding: '40px', marginTop: '20px'}}>
        <p className="empty-state-title">流水线功能开发中</p>
        <p className="empty-state-desc">即将支持批量章节生成</p>
      </div>

      <button type="button">
        关闭
      </button>
    </FunctionWindow>
  );
}

export function ChapterPlannerWindow({ onClose }: { onClose: () => void }) {
  return (
    <FunctionWindow title="章节规划" onClose={onClose} eyebrow="剧情节拍" width="800px">
      <div className="form-field">
        <label className="form-label">章节编号</label>
        <input className="form-input" placeholder="第 X 章" />
      </div>

      <div className="form-field">
        <label className="form-label">章节目标</label>
        <textarea className="form-textarea" placeholder="本章要完成什么剧情推进？" />
      </div>

      <div className="form-field">
        <label className="form-label">关键节拍</label>
        <textarea className="form-textarea" placeholder="列出 3-5 个关键场景或转折点" />
      </div>

      <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
        <button type="button">保存规划</button>
        <button type="button">关闭</button>
      </div>
    </FunctionWindow>
  );
}

export function HookLedgerWindow({ onClose }: { onClose: () => void }) {
  return (
    <FunctionWindow title="伏笔账本" onClose={onClose} eyebrow="伏笔管理" width="900px">
      <div className="alert alert-warning" style={{marginBottom: '20px'}}>
        记录所有伏笔，避免遗忘或矛盾。
      </div>

      <div className="empty-state" style={{padding: '60px'}}>
        <p className="empty-state-title">暂无伏笔记录</p>
        <p className="empty-state-desc">点击下方按钮添加第一个伏笔</p>
      </div>

      <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
        <button type="button">添加伏笔</button>
        <button type="button">关闭</button>
      </div>
    </FunctionWindow>
  );
}

export function AuditWindow({ onClose }: { onClose: () => void }) {
  return (
    <FunctionWindow title="连续性审计" onClose={onClose} eyebrow="矛盾检测" width="800px">
      <div className="alert alert-info" style={{marginBottom: '20px'}}>
        自动检测剧情、人物、世界观的前后矛盾。
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">审计结果</h3>
          <span className="badge badge-success">无矛盾</span>
        </div>
        <div className="card-body">
          <div className="empty-state" style={{padding: '40px'}}>
            <p className="empty-state-desc">当前没有检测到明显矛盾</p>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
        <button type="button">重新审计</button>
        <button type="button">关闭</button>
      </div>
    </FunctionWindow>
  );
}
