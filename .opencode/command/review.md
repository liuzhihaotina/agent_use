---
description: 对当前工作区改动委派给 review 子代理做正式审查。
---

执行步骤：

1. **快速摸底**：先跑 `git diff --stat` 与 `git diff --stat --cached`，得到变更面
2. **整理上下文**给 `review` 子代理：
   - 改动文件清单
   - 关键变更说明（1–3 句话）
   - 主代理的**关注点**（如"是否影响 AuthMiddleware 的 token 校验"）
3. **委派 `review` 子代理**，按 [`review.md` §4 输出格式](../agents/review.md) 接收结果
4. **整合汇报**：把 review 的"🔴 阻塞 / 🟡 重要 / 🟢 轻微 / 🧪 缺口 / 📋 总评"原样附在汇报里，并附主代理的**处置计划**：

```markdown
### 🧭 主代理处置计划
- 🔴 项 #1：本 PR 修复 → 触发新一轮 review
- 🟡 项 #2：本 PR 修复
- 🟢 项 #3：记入下次 PR / 创建 issue
- 🧪 缺口：补 `src/foo.test.ts` 中的 X 场景
```

> 反模式：直接说"我自己也审过了，没问题"代替正式 review；review 报了问题却不给处置计划。
