/**
 * Skip to Content Link
 *
 * 可访问性组件，允许键盘用户跳过导航直达主内容
 *
 * 使用方法：
 * 1. 在 App 的最顶部添加 <SkipToContent />
 * 2. 在主内容区域添加 id="main-content"
 *
 * @example
 * <SkipToContent />
 * <header>...</header>
 * <main id="main-content">...</main>
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      跳转到主内容
    </a>
  );
}
