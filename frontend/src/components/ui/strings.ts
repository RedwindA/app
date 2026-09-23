/** Default copy for UI primitives. Parameterized messages are functions. */
export const uiStrings = {
  dialog: {
    close: "关闭弹窗",
  },
  sheet: {
    close: "关闭面板",
  },
  pagination: {
    label: "分页",
    previous: "上一页",
    next: "下一页",
    page: (current: number, count: number) => `第 ${current} / ${count} 页`,
  },
  dataTable: {
    emptyTitle: "没有匹配的数据",
    emptyDescription: "试试调整筛选条件。",
    errorTitle: "数据加载失败",
    retry: "重试",
    selectPage: "选择当前页全部行",
    unavailable: "数据暂不可用",
    selectRow: (row: string) => `选择 ${row}`,
    loading: "正在加载…",
    loadFailed: "加载失败",
    total: (count: number) => `共 ${count} 条`,
    /** Leading space separates this clause from the total. */
    selected: (count: number) => ` · 已选 ${count} 条`,
    pageSize: "每页",
    pageSizeLabel: "每页条数",
  },
  datePicker: {
    required: "请选择或输入日期",
    invalid: "请输入有效日期，格式为 YYYY-MM-DD",
    tooEarly: (date: string) => `日期不能早于 ${date}`,
    tooLate: (date: string) => `日期不能晚于 ${date}`,
    open: (label: string) => `打开${label}日历`,
    month: "选择月份",
    year: "选择年份",
    clear: "清除",
    today: "今天",
  },
  combobox: {
    placeholder: "搜索并选择…",
    clear: (label: string) => `清除${label}`,
    expand: (label: string) => `展开${label}`,
    empty: "没有匹配的选项",
  },
  command: {
    label: "搜索命令",
    empty: "没有匹配的命令",
    list: "可用命令",
  },
  spinner: {
    label: "加载中",
  },
  breadcrumb: {
    label: "面包屑",
  },
  chart: {
    legend: "图例",
  },
  voteButton: {
    name: (label: string, count: number) => `${label}，${count} 票`,
  },
  themeToggle: {
    toLight: "切换浅色主题",
    toDark: "切换深色主题",
  },
  toolbar: {
    clear: "清除搜索",
  },
} as const;
