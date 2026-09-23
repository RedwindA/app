# 架构

## 已有 React 项目只想套样式

复制 `src/components/`、`src/styles/`、`src/lib/utils.ts`，从本模板 package.json 安装对应 UI 依赖；配置 `@` 指向 src，并启用 Tailwind Vite 插件。在入口导入 `styles/index.css`，参考 main.tsx 配置 ThemeProvider、MotionProvider、TooltipProvider 和 Toaster。`MotionProvider` 必须包在应用根部：缺少它时 motion/ 与 ui/interior/ 里的组件会停在初始（不可见）状态；动效特性包（src/lib/motion-features.ts）异步加载，不阻塞首屏。布局中的 Link 依赖 TanStack Router，使用其他路由时需要替换链接组件。

`components.json` 已指向本地组件目录；新增 shadcn 组件后检查其图标和样式。不要用生成器覆盖已经定制的同名组件。

## 环境变量

接入 API 时可复制 `.env.example` 为 `.env.local`，在 pages/ 或 data/ 读取 `import.meta.env.VITE_API_BASE_URL`。变量可缺省或为空，适配器需要自行验证 URL；当前演示不读取这个变量、不发送请求。声明位于 `src/vite-env.d.ts`，基础 Vite 类型也已在 tsconfig.json 中启用。

`VITE_*` 会在构建时进入浏览器代码，只适合公开配置，不能存放密钥。更改后重启开发服务器，生产环境需要重新构建；不会因修改服务器上的 `.env` 自动更新已有静态文件。

## 错误边界、主题与字体

根部 AppErrorBoundary 包住所有 Provider 和路由，捕获后代渲染或生命周期异常并提供独立的刷新入口；事件回调、异步任务和 React 启动前的模块加载错误仍需各自处理。路由配置另有加载占位和错误界面，失败时可刷新重试加载最新资源。`index.html` 中的同步脚本在 React 启动前应用主题；修改主题存储 key 或默认值时，与 ThemeProvider 一起更新。Geist 仅打包 latin 字体子集，中文及其他文字使用系统回退字体。动效使用 `LazyMotion` + `motion/react-m` 和异步特性包；新增动画请沿用这一方式。

## 检查工具与测试范围

格式化使用 `pnpm format`。ESLint 检查 TypeScript、React Hooks 与 JSX 无障碍；Prettier 使用 Tailwind 排序插件。Vitest 覆盖状态持久化、异步加载取消、错误边界，以及 Dialog、Select、Combobox、DataTable、扩展组件与表单校验的交互。测试使用 user-event 验证键盘和焦点，axe-core 检查语义；jsdom 不检查颜色对比。`src/test/setup.ts` 已补齐 jsdom 缺少的 ResizeObserver、matchMedia、scrollTo、elementFromPoint 和 getAnimations，渲染带 ThemeProvider 或 Router 的页面不需要在测试里再打补丁。

jsdom 测不到的行为放在 `src/test/browser/*.browser.test.tsx`，由 `pnpm test:browser`（Vitest browser mode + Playwright Chromium，首次先 `pnpm exec playwright install chromium`）在真实浏览器里跑：主题切换的 View Transition 与减少动效、375px 窄屏布局、Dialog 焦点圈、Badge/Alert 全变体的颜色对比度（深浅主题各一次）。`pnpm test` 只跑 jsdom 项目。提交前仍应在浏览器里手动过一遍改动涉及的交互。

## 依赖升级

`renovate.json` 配置每周一检查 npm/pnpm、GitHub Actions 和 Node 版本；小版本与补丁合并分组，主版本单独审阅，不自动合并。需要仓库维护者安装或启用 Renovate GitHub App（或配置自托管 Renovate）后才会创建升级 PR；仅提交配置不会启动机器人。pnpm 锁文件与 packageManager 一起维护，参见 [Renovate npm 文档](https://docs.renovatebot.com/modules/manager/npm/)。

## 构建产物与 chunk 策略

生产构建使用 Vite 8（Rolldown）的 `build.rolldownOptions.output.codeSplitting.groups`。`test` 匹配包目录本身（`node_modules/<pkg>/`），因此能命中 pnpm 的 `.pnpm/<name>@version/node_modules/<name>/`，又不会把虚拟仓库目录名当成包名。分组只抽稳定、且首屏本来就要加载的运行时；不把「懒加载路由才用到的那一半」提前打进会被 `modulepreload` 的 chunk。

| chunk | 包含的包 | 原因 |
| --- | --- | --- |
| `react` | `react`、`react-dom`、`scheduler` | 所有页面共享的运行时，体积稳定 |
| `router` | `@tanstack/react-router`、`@tanstack/router-core`、`@tanstack/history`，以及依赖 `@tanstack/store`、`@tanstack/react-store` | 应用壳的路由运行时。不包含 `@tanstack/react-table` |
| `motion` | 从入口静态可达的 `motion-dom`、`motion-utils`、`framer-motion` 运行时（`tags: ["$initial"]`） | 根布局的 LazyMotion 运行时。`test` 排除路径中的 `features` / `feature-bundle` |

不把整个 `@base-ui/react` 收成一个 vendor chunk：默认拆分会让入口只带首屏用到的那部分，其余留在懒加载的 `components` 路由里；合成一份会让组件目录才需要的组件跟着首屏 `modulepreload`。

`framer-motion` 的特性包（`features-animation` 以及 `motion/features/animation` 等）必须留在懒加载 chunk：`MotionProvider` 通过 `import("@/lib/motion-features")` 异步加载 `domAnimation`，这样动画实现不阻塞首屏。`motion` 分组若匹配这些文件，特性包会被吸进已 preload 的 motion chunk，异步 chunk 就变成空壳。

仍按路由或示例懒加载、不进入入口或 vendor 的包：`recharts` 在 `chart-example`，`zod` 在 `form-example`，`react-day-picker` 与 `date-fns` 在 `components`。四个示例 chunk 只出现在 `components` 的动态 `import()` 里。

`chunkSizeWarningLimit` 为 **500**（未压缩 kB）。最大的懒加载示例是图表 chunk 410.39 kB，上浮 20% 为 492 kB，取整到 50 的倍数仍是 500。阈值高于全部分片，`pnpm build` 没有 chunk 体积告警；阈值只是告警，不会减小包体，也不会让 CI 失败。后续超过预算时应查看依赖组成、拆分示例或按需加载，避免单纯提高阈值掩盖增长。

首屏 gzip 合计 = `index` 加上 `dist/index.html` 里每个 `modulepreload` 的 chunk（含 `rolldown-runtime`）。改动 vendor 分组时用 `pnpm build` 的输出按这个算法核对首屏合计，不要只看单个 chunk；具体数字以当前构建输出为准，文档不维护一份会过期的表。
