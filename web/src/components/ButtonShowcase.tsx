/**
 * 组件展示页
 *
 * 这是一个shadcn/ui组件库的展示页面，用于：
 * 1. 演示已安装的shadcn/ui组件效果
 * 2. 作为组件使用参考文档
 * 3. 供开发者测试和预览组件
 *
 * 注意：这个页面仅用于展示，不会影响主应用功能
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Download,
  Trash2,
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  Info,
} from "lucide-react";

export function ButtonShowcase() {
  return (
    <div style={{ padding: "3rem 2rem", maxWidth: "1200px", margin: "0 auto", background: "var(--color-bg)" }}>
      {/* 页面标题和说明 */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          background: "var(--color-warm-blue)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1rem"
        }}>
          <Info size={16} style={{ color: "var(--color-accent)" }} />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", fontWeight: 600 }}>
            shadcn/ui 组件展示
          </span>
        </div>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "var(--color-text)",
          letterSpacing: "-0.02em"
        }}>
          组件库展示页
        </h1>
        <p style={{
          fontSize: "var(--text-base)",
          color: "var(--color-text-subtle)",
          maxWidth: "600px",
          margin: "0 auto",
          lineHeight: "1.6"
        }}>
          本页面展示了已安装的 shadcn/ui 组件效果，供开发者参考使用。
          这些组件基于 Radix UI，具有完整的无障碍支持和丰富的样式变体。
        </p>
      </div>

      {/* Variants */}
      <section style={{
        marginBottom: "3rem",
        padding: "var(--sp-6)",
        background: "var(--color-bg-elevated)",
        border: "2px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
          color: "var(--color-text)",
          letterSpacing: "-0.01em"
        }}>
          按钮变体 (Button Variants)
        </h2>
        <p style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-subtle)",
          marginBottom: "1.5rem",
          lineHeight: "1.6"
        }}>
          6种按钮样式，适用于不同的使用场景
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Sizes */}
      <section style={{
        marginBottom: "3rem",
        padding: "var(--sp-6)",
        background: "var(--color-bg-elevated)",
        border: "2px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
          color: "var(--color-text)",
          letterSpacing: "-0.01em"
        }}>
          按钮尺寸 (Button Sizes)
        </h2>
        <p style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-subtle)",
          marginBottom: "1.5rem",
          lineHeight: "1.6"
        }}>
          4种尺寸选项，根据界面层级选择合适的大小
        </p>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <Plus size={16} />
          </Button>
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          带图标 (With Icons)
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Button>
            <Sparkles size={16} style={{ marginRight: "0.5rem" }} />
            AI 生成
          </Button>
          <Button variant="outline">
            <Download size={16} style={{ marginRight: "0.5rem" }} />
            下载
          </Button>
          <Button variant="destructive">
            <Trash2 size={16} style={{ marginRight: "0.5rem" }} />
            删除
          </Button>
          <Button variant="secondary">
            继续
            <ArrowRight size={16} style={{ marginLeft: "0.5rem" }} />
          </Button>
        </div>
      </section>

      {/* Loading State */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          加载状态 (Loading)
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Button disabled>
            <Loader2 size={16} style={{ marginRight: "0.5rem", animation: "spin 1s linear infinite" }} />
            处理中...
          </Button>
          <Button variant="outline" disabled>
            <Loader2 size={16} style={{ marginRight: "0.5rem", animation: "spin 1s linear infinite" }} />
            正在保存
          </Button>
        </div>
      </section>

      {/* Disabled State */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          禁用状态 (Disabled)
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Button disabled>Default Disabled</Button>
          <Button variant="outline" disabled>Outline Disabled</Button>
          <Button variant="secondary" disabled>Secondary Disabled</Button>
        </div>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          实际应用场景
        </h2>

        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "0.75rem" }}>
            表单操作
          </h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Button>保存</Button>
            <Button variant="outline">取消</Button>
            <Button variant="destructive">重置</Button>
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "0.75rem" }}>
            工具栏
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button size="sm" variant="ghost">
              <Sparkles size={14} />
            </Button>
            <Button size="sm" variant="ghost">
              <Download size={14} />
            </Button>
            <Button size="sm" variant="ghost">
              <Trash2 size={14} />
            </Button>
            <Button size="sm" variant="ghost">
              <AlertCircle size={14} />
            </Button>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "0.75rem" }}>
            卡片操作
          </h3>
          <div style={{
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            maxWidth: "400px"
          }}>
            <h4 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              开始新章节
            </h4>
            <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>
              使用 AI 助手快速生成章节大纲，开始创作你的故事。
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button>
                <Sparkles size={16} style={{ marginRight: "0.5rem" }} />
                开始创作
              </Button>
              <Button variant="outline">了解更多</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Skeleton Loading */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          Skeleton 加载组件
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
          <Skeleton style={{ height: "20px", width: "100%" }} />
          <Skeleton style={{ height: "20px", width: "80%" }} />
          <Skeleton style={{ height: "20px", width: "60%" }} />
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Skeleton style={{ height: "40px", width: "100px" }} />
            <Skeleton style={{ height: "40px", width: "100px" }} />
          </div>
        </div>
      </section>

      {/* Card Component */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          Card 卡片组件
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          <Card>
            <CardHeader>
              <CardTitle>AI 写作助手</CardTitle>
              <CardDescription>智能生成章节内容，提升创作效率</CardDescription>
            </CardHeader>
            <CardContent>
              <p>使用先进的 AI 技术，根据你的大纲和设定自动生成高质量的小说内容。</p>
            </CardContent>
            <CardFooter style={{ display: "flex", gap: "0.5rem" }}>
              <Button>
                <Sparkles size={16} style={{ marginRight: "0.5rem" }} />
                开始使用
              </Button>
              <Button variant="outline">了解更多</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>人物关系图谱</CardTitle>
              <CardDescription>可视化管理复杂的人物关系网络</CardDescription>
            </CardHeader>
            <CardContent>
              <p>自动布局的关系图，支持拖拽、缩放，清晰展示人物之间的联系和演变。</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary">查看图谱</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Input & Label */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          Input 输入框组件
        </h2>
        <div style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" placeholder="your@email.com" />
          </div>
          <div>
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div>
            <Label htmlFor="name">小说名称</Label>
            <Input id="name" placeholder="输入你的小说标题" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <Label htmlFor="search">搜索</Label>
              <Input id="search" placeholder="搜索章节、人物..." />
            </div>
            <Button>搜索</Button>
          </div>
        </div>
      </section>

      {/* Badge Component */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          Badge 徽章组件
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <Badge>默认</Badge>
          <Badge variant="secondary">次要</Badge>
          <Badge variant="destructive">危险</Badge>
          <Badge variant="outline">边框</Badge>
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>状态：</span>
            <Badge variant="secondary">草稿</Badge>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>标签：</span>
            <Badge>玄幻</Badge>
            <Badge>都市</Badge>
            <Badge>言情</Badge>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>进度：</span>
            <Badge variant="outline">12/20 章</Badge>
          </div>
        </div>
      </section>

      {/* Component Summary */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
          已安装组件总览
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>shadcn/ui 组件库</CardTitle>
            <CardDescription>基于 Radix UI + Tailwind CSS 的现代化组件系统</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem" }}>
              <Badge variant="secondary">Button</Badge>
              <Badge variant="secondary">Skeleton</Badge>
              <Badge variant="secondary">Sonner (Toast)</Badge>
              <Badge variant="secondary">Input</Badge>
              <Badge variant="secondary">Label</Badge>
              <Badge variant="secondary">Card</Badge>
              <Badge variant="secondary">Badge</Badge>
            </div>
            <p style={{ marginTop: "1rem", color: "hsl(var(--muted-foreground))" }}>
              共 7 个组件 | 零运行时开销 | AAA 级可访问性 | 支持暗色模式
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
