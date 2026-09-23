# 状态与路由

## URL 中的筛选与分页参数

把筛选条件放进 search params 时，用 `src/lib/search-params.ts` 组装 `validateSearch`：

```ts
import { searchEnum, searchInt, searchParams, searchString } from "@/lib/search-params";

const events = createRoute({
  getParentRoute: () => app,
  path: "/events",
  validateSearch: searchParams({
    q: searchString,
    status: searchEnum(["open", "closed"]),
    page: searchInt(),
  }),
  component: lazyRouteComponent(() => import("@/pages/events"), "Events"),
});
```

每个 key 都是可选的，缺失、空串或非法值直接从结果里去掉，URL 不会带 `?q=&page=1` 这类默认值；页面用 `const { q = "", page = 1 } = routeApi.useSearch()` 补默认。清除某个参数写 `navigate({ search: (prev) => ({ ...prev, page: undefined }) })`。`app` 布局下的路由通过 `getRouteApi("/app/events")` 取得类型安全的 `useSearch` / `useNavigate`。`validateSearch` 也接受 Zod 等 Standard Schema 校验器，但会把 Zod 打进首屏；模板自身的路由只使用这组零依赖解析器。

## 数据与持久化示例

任务数据由 `src/data/jobs.ts` 中的 React Query hooks 获取并轮询（进行中的任务每 3 秒刷新），增删改后使对应查询失效。

`useLocalState` 支持值和函数式更新，例如 `save(previous => ({ ...previous, updates: !previous.updates }))`；存储必须可 JSON 序列化并通过传入的校验函数。有效的存储值按原始字符串缓存解析结果，未变更时保持对象引用；默认值由调用方提供，需要稳定引用时请复用同一个默认值对象。请通过 setter 更新状态，不要直接修改返回的对象。同页实例与其他标签页同步，删除或清空存储时恢复默认值。并发写入采用最后一次写入生效，不提供跨标签页事务。存储不可用时仅保留当前标签页的内存状态。设置页未编辑的表单跟随其他标签页更新；未保存的草稿保留，点击“还原修改”读取最新偏好。其他页面示例离开后重置。
