# 扩展组件

可操作示例位于组件目录的「命令与扩展组件」和「表单校验」。所有状态由页面管理，离开页面或刷新后重置。

## 命令面板

`Command` 接收 `items` 和 `onSelect(value)`；每项包含唯一 `value`、可见 `label`、可选 `keywords`、`group` 和 `disabled`。支持按名称或关键词筛选、方向键导航、Enter 执行、空结果提示和禁用项。带 `group` 的项按首次出现的顺序分组并显示标题，筛选后没有匹配项的分组整组隐藏；没有 `group` 的项排在最前。高亮是一个独立的色块（`data-slot="command-highlight"`），跟随指针或键盘在项之间滑动，指针离开项目（例如停在分组标题上）时停在原位，只有没有匹配结果时才隐藏；减少动态效果时直接跳到位置。高亮项本身只改文字颜色。它是内联命令搜索组件，组合已有 `Dialog`、`DialogTitle`、`DialogDescription` 和 `DialogContent` 即可得到命令面板；页面处理执行动作并关闭 Dialog。关闭时焦点回到触发按钮，重新打开时搜索重置。示例见 `src/pages/examples/extended-example.tsx`。

快捷键由页面按需要绑定，组件本身不注册全局监听，也不负责路由跳转或发送请求。

## 切换、折叠与滚动

- `Toggle` 接收 `pressed/onPressedChange`；图标按钮必须有 `aria-label`，按下状态通过 `aria-pressed` 传达。
- `ToggleGroup` 接收 `value/onValueChange`，值始终是字符串数组；默认只能选一项，加 `multiple` 允许多选。子项使用 `ToggleGroupItem value="…"`，组提供可访问名称；方向键在组内移动焦点。
- `Collapsible` 支持 `open/onOpenChange` 或 `defaultOpen`；用 `CollapsibleTrigger render={<Button />}` 沿用按钮样式，内容放在 `CollapsibleContent`。默认收起时卸载内容，不隐藏仍可获得焦点的控件。
- `ScrollArea` 必须传入 `label` 和明确高度（如 `className="h-40"`），标签用于命名可聚焦视口。支持纵向与横向滚动；Tab 聚焦后可用方向键或 PageDown 浏览内容，触控仍使用原生滚动。

## Calendar 与 DatePicker

`Calendar` 包装 React DayPicker 9，默认中文、Phosphor 导航图标与语义色。保留 DayPicker 的 `mode="single" | "multiple" | "range"`、`selected/onSelect`、`disabled`、`startMonth/endMonth`、`locale` 等属性；支持方向键移动日期和 Enter 选择。布局默认为月份两侧导航，不播放切换动画；自定义动画时需要自行尊重减少动态效果设置。

```tsx
const [date, setDate] = useState<Date>();

<Calendar mode="single" selected={date} onSelect={setDate} />;
```

Calendar 的值是 Date，对应日历日期；页面决定存储格式和时区规则。不要直接把本地日期 `toISOString().slice(0, 10)` 当作原日期，UTC 转换可能跨天。`DatePicker` 通过 Popover 复用 Calendar，接收 `YYYY-MM-DD` 字符串或空字符串，适用于紧凑表单；支持日期范围限制、清除、今天与键盘操作，选择后关闭浮层并归还焦点。

## 表单校验

`ui/form.tsx` 导出 Base UI Form，`ui/field.tsx` 提供标签、描述、输入与错误关联。Zod schema 放在示例页面 `src/pages/examples/form-example.tsx`：提交时 `safeParse`，将错误传给 Field 的 `invalid` 和 FieldError 的 `match`，并聚焦首个错误字段；首次提交后编辑会重新校验。`FieldControl render={<Input />}` 保留标签、`aria-invalid` 和错误描述关联。

示例关闭浏览器原生校验，统一显示中文错误。校验通过仅保留本页状态；生产项目应在页面或 data/ 添加提交适配器，并在服务端重复校验。不要将 schema、请求或持久化逻辑放进 UI 原语。

DatePicker 支持直接输入 `YYYY-MM-DD` 或 `YYYY/M/D`，按 Enter 或离开输入框后确认并规范化；无效日期及超出 min/max 的日期显示错误并阻止表单提交，Escape 恢复已确认的值。Alt + ↓ 打开日历，选择日期后焦点回到输入框。日历顶部可直接切换年份和月份；未指定边界时默认提供当前年前后 100 年，并包含已有选中日期的年份。原生 input 属性与 ref 作用于可见输入框，name 对应隐藏表单字段，提交值始终为 `YYYY-MM-DD` 或空字符串。

## 菜单、验证码与分栏

可操作示例位于组件目录的「菜单与分栏」、「表单」和「选择与输入」。

- `HoverCard` 使用 Base UI Preview Card；触发器可聚焦。延迟由 Trigger 的 `delay` / `closeDelay` 控制，示例使用 150ms / 100ms。
- `ContextMenu` 在触发区右键、长按，或聚焦后按 Shift+F10 / ContextMenu 键打开（组件会合成 `contextmenu`，不依赖浏览器默认快捷键）。项样式复用 DropdownMenu。页面处理 `onClick`。
- `Menubar` 组合已有 `DropdownMenu` 项。默认 `modal={false}`，避免在组件目录里锁滚动；需要锁页面时再打开。
- `NavigationMenu` 在列表后放置 `NavigationMenuViewport`。链接用 `closeOnClick` 关闭浮层；是否跳转由页面决定。
- `Kbd` / `KbdGroup` 标注快捷键，可放进 Tooltip（已为 `data-slot=kbd` 预留对比色）。
- `InputOTP` 必须传入 `label`，默认数字与 `one-time-code`。`InputOTPSlot` 只负责格子外观。
- `ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle` 包装 `react-resizable-panels`。手柄必须有 `label`；触控热区来自 `resizeTargetMinimumSize.coarse`（默认 44px），不是手柄上的 `after:` 伪元素。
- `RangeSlider` 与 `Slider` 共用轨道样式，值为 `[start, end]`，两个拇指分别命名。
