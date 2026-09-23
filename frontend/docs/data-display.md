# 数据展示与常用组件

本文档来自 UI 模板，描述组件的使用约定；业务数据通过 `src/data/jobs.ts` 接入后端。

## 选择合适的展示方式

| 需求                       | 组件                       | 示例                                    |
| -------------------------- | -------------------------- | --------------------------------------- |
| 比较趋势、数量、占比       | ChartContainer + Recharts  | `src/pages/examples/chart-example.tsx`  |
| 少量只读结构化数据         | Table                      | `src/pages/examples/data-example.tsx`   |
| 排序、筛选、批量操作、分页 | DataTable + TanStack Table | `src/pages/examples/table-example.tsx`  |
| 标题、描述、图标与操作     | ItemGroup + Item           | `src/pages/examples/common-example.tsx` |

数据请求、日期范围查询、导出和持久化属于页面或数据层。UI 组件接收数据、状态与回调，不自行请求网络。不要为同一份数据在 UI 内再维护一套业务状态。

## 图表

`ChartContainer` 提供标题、描述、可测量的响应式区域和可选 footer；直接组合 Recharts 图元。`ChartLegend` 和 `ChartTooltipContent` 共享 `ChartSeries[]`，每条序列使用稳定的 key、可读 label 和语义颜色。

```tsx
const series = [{ key: "count", label: "完成任务", color: "var(--chart-1)" }];

<ChartContainer
  title="任务趋势"
  description="最近 7 天 · 单位：项。请根据实际数据提供文字摘要。"
  footer={<ChartLegend series={series} />}
>
  <LineChart data={data} accessibilityLayer>
    <XAxis dataKey="date" />
    <YAxis domain={[0, "auto"]} />
    <Tooltip content={<ChartTooltipContent series={series} />} />
    <Line dataKey="count" stroke="var(--chart-1)" isAnimationActive={false} />
  </LineChart>
</ChartContainer>;
```

- 趋势用折线；离散类别比较用柱状；面积强调随时间变化的量；环形图只表达少量非负类别的整体占比。
- 柱状图的数值轴从零开始。轴、Tooltip 与原始数据使用相同单位；计数不出现小数刻度；百分比明确分母和时间范围。
- 使用主题变量，不在页面内写死色值；同一序列在切换类型后保持同色。折线可搭配虚线，类别必须有文字图例；状态数据使用相应 `--status-*`。
- 原始值保持 number，展示时格式化；缺失值用 null，避免误当作 0。处理 NaN、无限值和环形图负数的校验属于数据层。
- 提供 `accessibilityLayer`、文字摘要和原始数据表或等价的可读列表。Tooltip 不能是查看信息的唯一入口。
- 加载时保留图表空间；空数据有说明；错误提供重试。示例允许手动切换状态，不假装请求了服务器。
- 默认图表高 240px，窄屏减小刻度密度；父容器设置 `min-w-0`。示例不播放绘图动画；新增动画需遵循 reduced motion。
- 图表放在路由或 `React.lazy` 边界内，避免首页加载整套图表库。

## 表格

`Table` 保留原生 table 语义和横向滚动容器。`DataTable<TData>` 接收 `table: Table<TData>`，不重新实现数据处理引擎。排序、筛选、分页模型来自 `@tanstack/react-table`，行样式沿用基础 Table。

```tsx
const table = useReactTable({
  data,
  columns,
  getRowId: (row) => row.id,
  initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});

<DataTable
  table={table}
  caption="项目列表"
  selectable
  getRowLabel={(row) => row.name}
  toolbar={
    <Toolbar
      search={<SearchField aria-label="搜索表格" value={query} onChange={...} />}
      actions={<Button variant="ghost" size="sm">重置</Button>}
    >
      <FilterSelect label="状态" allLabel="全部状态" options={statusOptions} value={status} onChange={setStatus} />
    </Toolbar>
  }
  loading={loading}
  error={error}
  onRetry={reload}
/>;
```

- caption 描述数据内容，表头使用 scope。可排序列同步 `aria-sort`。当前组件面向平面表头；复杂分组表头、合并单元格应单独扩展。
- 行 ID 使用稳定业务 ID；不要使用会随排序、分页变化的数组索引。
- 表头全选仅作用于当前页；已选数量与批量操作都基于 `getFilteredSelectedRowModel()`。隐藏在筛选之外的选中项不受批量操作影响。
- 数字右对齐并使用 `font-mono tabular-nums`；标题与描述左对齐；状态显示文字，不仅靠颜色。
- 搜索与筛选后回到首页；更换数据后不能停留在不存在的页。TanStack 的客户端模式默认会自动重置页码；受控或服务端模式由页面负责修正。
- 用 `loading / error / emptyTitle / emptyDescription` 表达状态。加载和错误期间禁用行选择、排序与分页，避免误操作旧数据。
- 窄屏保留关键列并在表格内横向滚动；不要让整个页面被宽表格撑开。少量数据不启用虚拟滚动。
- 服务端数据可由页面配置 `manualPagination / manualSorting / manualFiltering` 和 `rowCount`；选中计数只涵盖当前加载的数据。跨服务端分页的全量选择需另外设计，当前示例不提供该能力。
- 独立 `Pagination` 使用从 1 开始的 `page`；零条数据展示禁用的第 1 / 1 页。DataTable 自行转换 TanStack 的从 0 开始的 pageIndex。

## 列表

`ItemGroup` 渲染 ul，`Item` 渲染 li；内部按需组合 `ItemMedia / ItemContent / ItemTitle / ItemDescription / ItemActions`。

- 默认分隔线，不给每一项套卡片。
- 内容区 `min-w-0 flex-1`，操作区不挤压变形；长文本自然换行。需要截断时另外提供完整内容的访问路径。
- 点击进入其他页面用链接；展开详情或执行动作用按钮，图标按钮必须有可访问名称。
- 整行点击与行内动作不能形成嵌套交互元素。列表中的空、加载、错误状态可组合现有 Empty、Skeleton、Alert。

## 其他常用组件

| 组件                 | 约定                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Breadcrumb           | 使用 nav + ol；当前页 `aria-current="page"`；分隔符放在前一个 BreadcrumbItem 内。                                             |
| Accordion            | 使用 Base UI 管理展开状态和键盘行为，可受控或用 defaultValue；multiple 允许多项展开。                                         |
| RadioGroup           | 为组提供名称，每个选项关联 label；少量互斥选项，可禁用单项。                                                                  |
| Combobox             | 受控 value 是字符串或 null；options 为 value、label 和可选 disabled；键盘导航、搜索、清空和无匹配提示。选中值应存在于选项中。 |
| DatePicker           | 使用 Popover + Calendar；value 为本地日期字符串或空串，支持 min、max、required、disabled。提供清除和今天操作，沿用深浅主题。  |
| Slider / RangeSlider | 单值滑块使用 `label`；范围滑块使用 `startLabel` / `endLabel`，值为 `[start, end]`。页面提供数值文字。                         |
| HoverCard            | 悬停或聚焦触发的预览浮层；适合成员、状态等补充信息，不是唯一信息入口。                                                        |
| ContextMenu          | 右键、长按或聚焦后 Shift+F10 / ContextMenu 键打开；触发区默认可聚焦。页面处理动作，组件不发送请求。                           |
| Menubar              | 水平菜单栏，内部复用 DropdownMenu 项样式。默认不进入 modal，避免锁住宿主页面。                                                |
| NavigationMenu       | 分段导航；链接由页面决定是否关闭浮层。示例用 preventDefault 保留在当前页。                                                    |
| InputOTP             | `label` 必填；默认 6 位数字、`one-time-code`。槽位只展示，输入落在隐藏文本框。                                                |
| Kbd                  | 快捷键标注，使用等宽数字；可放在 Tooltip 或菜单快捷键区。                                                                     |
| Resizable            | `ResizableHandle` 必须提供 `label`。方向键调整；触控热区来自 `resizeTargetMinimumSize.coarse`（默认 44px）。布局由页面保存。   |
| Alert                | info、success、warning、error；图标加标题和正文。错误使用 role=alert，其余 role=status；不要用于重复播报每次输入。            |
| Progress             | label 必填；数值限制在 0 到 max，null/undefined 为未知总量，省略 aria-valuenow。                                              |
| Spinner              | 带可访问加载文本；减少动态效果时保留静态图标。                                                                                |
| Separator            | 默认装饰性；有语义时设置 decorative=false，支持水平与竖直。                                                                   |

日期范围、复杂日历、树形表格、拖拽排序和虚拟列表需按具体产品需求扩展，不作为这批基础组件的默认功能。范围滑块见 `RangeSlider`。

## 参考项目

- [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart)：直接组合 Recharts 图元，统一容器、图例和 Tooltip。
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/base/data-table)：将 TanStack 的数据处理与已有样式组件组合。
- [shadcn/ui Item](https://ui.shadcn.com/docs/components/base/item)：按媒体、内容和动作组织列表项。
- [Tremor](https://github.com/tremorlabs/tremor)：数据仪表盘的图例、指标和摘要编排参考。
- [Carbon Data Table](https://carbondesignsystem.com/components/data-table/usage/)：排序、工具栏、批量操作与表格状态的交互规范参考。

这批组件根据项目现有样式独立实现；没有覆盖已有自定义组件，也没有引入其他项目的后端、字体或图标体系。
