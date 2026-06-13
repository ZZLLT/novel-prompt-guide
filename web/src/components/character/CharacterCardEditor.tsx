import { useState } from "react";
import { X, User, Sparkles } from "lucide-react";
import type { CharacterCard, CharacterRole } from "../../types/character";
import { CHARACTER_TRAITS, CHARACTER_ROLES, RELATIONSHIP_TYPES } from "../../types/character";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type CharacterCardEditorProps = {
  character?: CharacterCard;
  onSave: (character: Omit<CharacterCard, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
};

export function CharacterCardEditor({ character, onSave, onClose }: CharacterCardEditorProps) {
  const [formData, setFormData] = useState<Omit<CharacterCard, "id" | "createdAt" | "updatedAt">>({
    name: character?.name || "",
    avatar: character?.avatar,
    role: character?.role || "supporting",
    age: character?.age,
    gender: character?.gender,
    occupation: character?.occupation,
    appearance: character?.appearance || "",
    traits: character?.traits || [],
    background: character?.background || "",
    motivation: character?.motivation || "",
    fear: character?.fear || "",
    goal: character?.goal || "",
    skills: character?.skills || [],
    weaknesses: character?.weaknesses || [],
    relationships: character?.relationships || [],
    characterArc: character?.characterArc,
    signature: character?.signature || "",
    notes: character?.notes || "",
    tags: character?.tags || [],
    color: character?.color,
  });

  const [newTrait, setNewTrait] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newWeakness, setNewWeakness] = useState("");
  const [newTag, setNewTag] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("请输入角色名称");
      return;
    }
    onSave(formData);
    onClose();
  };

  const addTrait = (trait: string) => {
    if (trait && !formData.traits.includes(trait)) {
      setFormData({ ...formData, traits: [...formData.traits, trait] });
    }
  };

  const removeTrait = (trait: string) => {
    setFormData({ ...formData, traits: formData.traits.filter((t) => t !== trait) });
  };

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  const addWeakness = () => {
    if (newWeakness && !formData.weaknesses.includes(newWeakness)) {
      setFormData({ ...formData, weaknesses: [...formData.weaknesses, newWeakness] });
      setNewWeakness("");
    }
  };

  const removeWeakness = (weakness: string) => {
    setFormData({ ...formData, weaknesses: formData.weaknesses.filter((w) => w !== weakness) });
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="character-editor-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-header-title">
            <User size={20} />
            <h2>{character ? "编辑角色" : "创建角色"}</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="character-editor-form">
          <div className="modal-body">
            {/* 基础信息 */}
            <section className="form-section">
              <h3 className="form-section-title">基础信息</h3>

              <div className="form-row">
                <div className="form-field">
                  <Label className="form-label">角色名称 *</Label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入角色名称"
                  />
                </div>

                <div className="form-field">
                  <Label className="form-label">角色定位</Label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as CharacterRole })}
                  >
                    {Object.entries(CHARACTER_ROLES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.icon} {value.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <Label className="form-label">年龄</Label>
                  <Input
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) => setFormData({ ...formData, age: e.target.valueAsNumber || undefined })}
                    placeholder="年龄"
                  />
                </div>

                <div className="form-field">
                  <Label className="form-label">性别</Label>
                  <Input
                    type="text"
                    value={formData.gender || ""}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    placeholder="男/女/其他"
                  />
                </div>

                <div className="form-field">
                  <Label className="form-label">职业</Label>
                  <Input
                    type="text"
                    value={formData.occupation || ""}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="职业"
                  />
                </div>
              </div>

              <div className="form-field">
                <Label className="form-label">外貌描写</Label>
                <textarea
                  className="form-textarea"
                  value={formData.appearance}
                  onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                  placeholder="描述角色的外貌特征，1-2个标志性细节即可"
                  rows={3}
                />
              </div>
            </section>

            {/* 性格特征 */}
            <section className="form-section">
              <h3 className="form-section-title">性格特征</h3>

              {formData.traits.length > 0 && (
                <div className="trait-chips">
                  {formData.traits.map((trait) => (
                    <span key={trait} className="trait-chip">
                      {trait}
                      <button type="button" onClick={() => removeTrait(trait)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="form-field">
                <Label className="form-label">快速添加</Label>
                <div className="trait-quick-add">
                  {['勇敢', '善良', '固执', '冲动', '冷静', '幽默', '严肃', '乐观'].map((trait) => (
                    <button
                      key={trait}
                      type="button"
                      className="trait-quick-btn"
                      onClick={() => addTrait(trait)}
                      disabled={formData.traits.includes(trait)}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <Label className="form-label">自定义特征</Label>
                <div className="input-with-button">
                  <Input
                    type="text"
                    value={newTrait}
                    onChange={(e) => setNewTrait(e.target.value)}
                    placeholder="输入自定义特征"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTrait(newTrait);
                        setNewTrait("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addTrait(newTrait);
                      setNewTrait("");
                    }}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </section>

            {/* 背景故事 */}
            <section className="form-section">
              <h3 className="form-section-title">背景故事</h3>

              <div className="form-field">
                <Label className="form-label">背景经历</Label>
                <textarea
                  className="form-textarea"
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  placeholder="角色的成长经历、重要事件"
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <Label className="form-label">动机（想要什么）</Label>
                  <Input
                    type="text"
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder="例如：复仇、守护家人、证明自己"
                  />
                </div>

                <div className="form-field">
                  <Label className="form-label">恐惧（害怕什么）</Label>
                  <Input
                    type="text"
                    value={formData.fear}
                    onChange={(e) => setFormData({ ...formData, fear: e.target.value })}
                    placeholder="例如：失去亲人、被背叛、孤独"
                  />
                </div>
              </div>

              <div className="form-field">
                <Label className="form-label">目标</Label>
                <Input
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="角色的最终目标"
                />
              </div>
            </section>

            {/* 能力和弱点 */}
            <section className="form-section">
              <h3 className="form-section-title">能力与弱点</h3>

              <div className="form-field">
                <Label className="form-label">技能/优势</Label>
                {formData.skills.length > 0 && (
                  <div className="list-chips">
                    {formData.skills.map((skill) => (
                      <span key={skill} className="list-chip">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="input-with-button">
                  <Input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="例如：剑术、魔法、谈判"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill}>
                    添加
                  </Button>
                </div>
              </div>

              <div className="form-field">
                <Label className="form-label">弱点</Label>
                {formData.weaknesses.length > 0 && (
                  <div className="list-chips">
                    {formData.weaknesses.map((weakness) => (
                      <span key={weakness} className="list-chip list-chip-warning">
                        {weakness}
                        <button type="button" onClick={() => removeWeakness(weakness)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="input-with-button">
                  <Input
                    type="text"
                    value={newWeakness}
                    onChange={(e) => setNewWeakness(e.target.value)}
                    placeholder="例如：过于信任他人、身体虚弱"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addWeakness();
                      }
                    }}
                  />
                  <Button type="button" onClick={addWeakness}>
                    添加
                  </Button>
                </div>
              </div>
            </section>

            {/* 其他信息 */}
            <section className="form-section">
              <h3 className="form-section-title">其他信息</h3>

              <div className="form-field">
                <Label className="form-label">标志性台词/口头禅</Label>
                <Input
                  type="text"
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  placeholder="例如：天道酬勤"
                />
              </div>

              <div className="form-field">
                <Label className="form-label">角色弧光</Label>
                <textarea
                  className="form-textarea"
                  value={formData.characterArc || ""}
                  onChange={(e) => setFormData({ ...formData, characterArc: e.target.value })}
                  placeholder="角色的成长轨迹和变化"
                  rows={3}
                />
              </div>

              <div className="form-field">
                <Label className="form-label">笔记</Label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="其他备注"
                  rows={3}
                />
              </div>

              <div className="form-field">
                <Label className="form-label">标签</Label>
                {formData.tags.length > 0 && (
                  <div className="list-chips">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="list-chip">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="input-with-button">
                  <Input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="添加标签用于分组"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag}>
                    添加
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <footer className="modal-footer">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">
              <Sparkles size={16} />
              保存角色
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
