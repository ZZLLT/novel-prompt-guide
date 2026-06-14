/**
 * 提示词库浏览器
 * 浏览196个专业提示词模板
 */
import { useState, useEffect } from "react";
import { Search, Flame, TrendingUp, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type PromptTemplate = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  prompt: string;
  usage: number;
  token_count: number;
  tags: string[];
};

type PromptLibraryStats = {
  available: boolean;
  total_categories: number;
  total_prompts: number;
  total_usage: number;
  categories: Record<string, number>;
};

type PromptLibraryBrowserProps = {
  onUsePrompt?: (prompt: PromptTemplate) => void;
  onClose?: () => void;
};

export function PromptLibraryBrowser({ onUsePrompt, onClose }: PromptLibraryBrowserProps) {
  const [stats, setStats] = useState<PromptLibraryStats | null>(null);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadTopPrompts();
  }, []);

  async function loadStats() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/library/statistics");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  }

  async function loadTopPrompts() {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/library/top?limit=20");
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts);
      }
    } catch (err) {
      console.error("Failed to load prompts", err);
    } finally {
      setLoading(false);
    }
  }

  async function searchPrompts(query: string) {
    if (!query.trim()) {
      loadTopPrompts();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/ai/library/search?keyword=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.results);
      }
    } catch (err) {
      console.error("Failed to search prompts", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
    searchPrompts(query);
  }

  async function copyPrompt(prompt: PromptTemplate) {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }

  const filteredPrompts = selectedCategory === "all"
    ? prompts
    : prompts.filter((p) => p.category === selectedCategory);

  const categories = stats ? Object.keys(stats.categories).sort() : [];

  return (
    <div className="prompt-library-browser">
      {/* Header */}
      <div className="prompt-library-header">
        <div>
          <h2 className="text-xl font-bold">提示词库</h2>
          {stats && (
            <p className="text-sm text-muted-foreground">
              {stats.total_prompts} 个专业模板 · {(stats.total_usage / 10000).toFixed(1)}万+ 次使用
            </p>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="prompt-library-search">
        <Search size={16} className="prompt-search-icon" />
        <Input
          type="text"
          placeholder="搜索提示词... 例如：续写、角色、场景"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="prompt-search-input"
        />
      </div>

      {/* Categories */}
      <div className="prompt-categories">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
        >
          全部
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
            <Badge variant="secondary" className="ml-1">
              {stats?.categories[category]}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Prompts List */}
      <div className="prompt-list">
        {loading ? (
          <>
            <Skeleton className="h-32 w-full mb-3" />
            <Skeleton className="h-32 w-full mb-3" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : filteredPrompts.length === 0 ? (
          <div className="prompt-empty">
            <p>未找到匹配的提示词</p>
            <Button variant="outline" size="sm" onClick={() => handleSearch("")}>
              查看全部
            </Button>
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <div key={prompt.id} className="prompt-card">
              <div className="prompt-card-header">
                <div>
                  <h3 className="prompt-title">{prompt.title}</h3>
                  <div className="prompt-meta">
                    <span className="prompt-author">@{prompt.author}</span>
                    <Badge variant="outline">{prompt.category}</Badge>
                  </div>
                </div>
                <div className="prompt-stats">
                  <div className="prompt-stat">
                    <Flame size={14} className="text-orange-500" />
                    <span>{(prompt.usage / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              </div>

              <p className="prompt-description">{prompt.description}</p>

              {prompt.tags.length > 0 && (
                <div className="prompt-tags">
                  {prompt.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="prompt-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyPrompt(prompt)}
                >
                  {copiedId === prompt.id ? (
                    <>
                      <Check size={14} />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      复制
                    </>
                  )}
                </Button>
                {onUsePrompt && (
                  <Button size="sm" onClick={() => onUsePrompt(prompt)}>
                    使用此模板
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
