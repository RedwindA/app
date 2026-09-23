# UI 设计约定

CSS 变量是外观的唯一事实来源，位于 `src/styles/globals.css`。应用层可读性调整位于 `src/styles/index.css`。

## 颜色

默认深色：背景 #0d0d0f，卡片 #121214，浮层 #18181b，悬停 #202024；边框 #1f1f23，输入框边框 #2a2a30。浅色主题以暖白 #f7f5f0 为基础。雾蓝用于主要操作、激活状态、链接、焦点和进行中状态（深色 #92b8df、浅色 #315f91），不用大面积蓝色底。青绿用于成功与完成，紫罗兰用于分类与待评估，琥珀用于提醒与计划，玫瑰用于内容标签与重点。所有强调色提供深浅主题对应值，见 `--tone-*`；状态与图表颜色引用这套色板。

使用 bg-background、bg-card、text-foreground、text-muted-foreground、text-faint、border-border 等语义类。除组件内部的签名细节外，不在业务页面写死颜色。状态颜色使用 --status-* 变量。内容分类使用 text-tone-teal/violet/amber/rose 等语义类，淡底使用同色 /5 或 /10，边框使用 /20；颜色必须搭配文字或图标，不单独传达含义。

## 字体与密度

正文 Geist；计数、日期、导航辅助文字与小标题 Geist Mono。中文使用系统回退字体。正文多用 13px，列表标题 15px/600，页面标题 20–24px/600，辅助文字 11–12px。标题字距 -0.02em。按钮高 30/34/38px，圆角 8px；面板圆角 12px。

## 布局

后台：200px 侧栏、52px 顶栏、细边框圆角内容面板。移动端侧栏转成顶部导航。公开页面：1072px 外框（含左右内边距），主内容加 240px 右栏；窄屏上下排列。优先使用分隔线列表；避免给每一项套卡片。

## 组件与交互

主按钮使用 primary / primary-foreground token（深色浅雾蓝底深字、浅色深雾蓝底白字）、内嵌箭头；次按钮使用微弱内高光。VoteButton（`src/components/ui/vote-button.tsx`）为 48×56px，选中后蓝色填充。状态标签为圆点加文字、淡色背景。Badge 提供 active、success、warning、violet、rose、destructive 与 default 变体；Alert 使用对应状态的浅底与边框。普通交互 100–250ms，尊重 prefers-reduced-motion。

基础组件见 `src/components/ui/`；数值、复制、加载等微交互见 `src/components/motion/` 和 `src/components/ui/interior/`。交互组件基于项目已安装的 Base UI，只接收值与回调。组件的完整 Props 定义与导出均在对应源码中。

组件默认文案集中在 `src/components/ui/strings.ts`。

## 新页面工作方式

1. 复制现有页面结构，选择 Panel 或 PublicShell。
2. 导入已有 Button/Input/Dialog 等组件，不重新设计样式。
3. 保持页面负责数据、组件负责展示。
4. 检查深色、浅色和 375px 窄屏。

避免装饰性渐变、玻璃模糊、大面积彩色卡片、每项一张卡片、混用图标库，以及没有真实用途的按钮。

开关统一使用 `ui/switch.tsx`；表单错误使用 Field，确认操作使用 AlertDialog，侧面板使用 Sheet。数据请求集中在 `src/api/client.ts` 与 `src/data/jobs.ts`，不要把数据请求放进 UI 组件。

## 数据展示与常用组合

详细使用方式、状态约定和参考项目见 [数据展示规范](docs/data-display.md)。

- 图表使用 `ui/chart.tsx` 与 Recharts 组合，沿用 `--chart-*` 与 `--status-*`。图例、单位、时间范围、文字摘要和可读取的数据必须一起提供；不把缺失数据画成零。图表示例按需拆包加载，默认不播放绘图动画。
- 搜索加筛选栏使用 `components/toolbar.tsx` 的 `Toolbar`（`search` 槽位占独立网格列，控件换行不挤压搜索框；`actions` 靠右）、`SearchField`（放大镜、清除按钮、窄屏 44px）和 `FilterSelect`（`aria-label`、可选「全部」项、`value === ""` 表示不筛选）。筛选值保存在 URL 时，页面把 `onChange` 接到 `navigate`。
- 简单表格使用 `ui/table.tsx`；需要排序、筛选、选择或分页时使用 `ui/data-table.tsx`，页面创建 TanStack Table 实例。分页从 1 开始展示；全选只选当前页；批量操作只针对当前筛选结果中的选中项。文本左对齐，数值右对齐并使用等宽数字。
- 内容列表使用 `ItemGroup / Item / ItemContent / ItemActions`，保留分隔线、15px 标题、次要描述。导航使用链接，动作使用按钮，避免在整行按钮内嵌套其他按钮。
- 提示使用 Alert（持续信息）或 Toast（短暂反馈）；完成比例使用 Progress，未知时长使用不定进度或 Spinner。加载、空数据、无匹配结果、错误和正常状态必须区分。
- 少量固定选项使用 Select，多选一使用 RadioGroup，需要搜索时使用 Combobox。悬停补充信息使用 HoverCard；右键操作使用 ContextMenu；应用菜单使用 Menubar；站点分段导航使用 NavigationMenu。验证码使用 InputOTP；分栏使用 Resizable。日期、日历、快捷键和触控热区见 [扩展组件说明](docs/extended-components.md)。
- 新组合的触控操作在窄屏预留 44px 高度，桌面沿用现有紧凑尺寸。宽表格只在自身容器内横向滚动；不隐藏关键字段。键盘焦点清晰，颜色不作为唯一的信息来源。

表单 schema 与提交逻辑放在页面，Form/Field 只负责组合与可访问状态，见 [扩展组件说明](docs/extended-components.md)。
