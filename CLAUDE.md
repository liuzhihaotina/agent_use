# CLAUDE.md · Claude 系列代理补充约定

> 本文件是 **Claude 系列模型**（Claude Opus / Sonnet / Haiku 等）在本仓库使用时的补充约定，
> 与 [`AGENT.md`](./AGENT.md) 协同生效。**`AGENT.md` 中的规则全部默认继承**，本文件只补充 Claude 相关的特殊点。

---

## 1. 继承自 AGENT.md

- 所有语言规范、权限红线、汇报模板、协作规则**全部继承**，不在此重复。
- 如需快速回顾，请先阅读 [`AGENT.md`](./AGENT.md)。

---

## 2. Claude 特定的工作偏好

### 2.1 优先使用 Claude 擅长的能力

- **长上下文**：可以一次性把多个相关文件读进上下文再决策，避免来回猜。
- **结构化输出**：复杂结论优先使用 Markdown 表格 / 分级列表，便于人类与下游程序双重消费。
- **可解释推理**：在关键决策点（如选择实现方案、判断回归风险）显式写出推理链。

### 2.2 显式 TODO 列表

Claude 在多步任务中应当：

1. 在对话开始前给出**显式 TODO 列表**
2. 每完成一项就**更新一次**列表（勾选 + 简述结果）
3. 全部完成后再进入"标准汇报模板"

> opencode 的 `task_progress` 机制天然适配本约定，请优先使用。

### 2.3 工具调用（function call）

- 一次回答中如果有 **多个相互独立** 的工具调用（如同时读多个文件），应**并发触发**。
- 如果调用之间**互相依赖**（如先 search 再 read），必须严格串行。
- 工具调用失败要**就地报告 + 重试或转人工**，禁止静默吞掉。

---

## 3. 子代理选择建议

| 任务复杂度 | 建议主代理模型 | 建议子代理模型 |
|------------|----------------|----------------|
| 简单（单文件、几行改动） | Sonnet 级 | Haiku 级 |
| 中等（跨文件、需要审查） | Opus 级 | Sonnet 级 |
| 复杂（架构变更、根因分析） | Opus 级 | Opus 级 |

> 实际模型名以 `opencode.json` 配置为准，本表只给出**等级**建议。

---

## 4. 与 Skill 的协同

涉及代码任务时，**必须**优先加载并遵循：
- [`.opencode/skills/code-workflow/SKILL.md`](./.opencode/skills/code-workflow/SKILL.md)

日常零散任务时，可以参考：
- [`.opencode/skills/daily-workflow/SKILL.md`](./.opencode/skills/daily-workflow/SKILL.md)

Claude 应当在加载 Skill 时**显式标注**："本任务遵循 `code-workflow` 技能"，便于审计。

---

## 5. 反模式（Claude 易犯）

- ❌ 把整段思考裸露在最终答案里（应当只输出结论 + 关键推理点）
- ❌ 一次给三种方案让用户选 —— 除非用户明确要求对比，否则**先给出推荐**再说备选
- ❌ 因为上下文长就把无关文件全读一遍 —— **按需取证**而不是穷举
- ❌ 用"我已经修改了 XXX"代替实际的工具调用结果展示
- ❌ 在不确定时编造 API 签名 —— 必须先 `read_file` / `search_files` 求证

---

## 6. 汇报样例

> 此处给出一个最小汇报样例，供 Claude 参考格式与语气。

```markdown
### ✅ 改动摘要
将 `UserService.findById` 在缓存未命中时的 fallback 从抛异常改为返回 `null`，并补一条日志。

### 📂 变更文件
- `src/services/user.ts:88`  调整 fallback 行为
- `src/services/user.test.ts:120`  补 1 条 null 分支用例

### 🧪 验证结果
- 命令：`pnpm test src/services/user.test.ts`
- 结果：8 passed, 0 failed
- 覆盖：命中缓存 / 未命中 / DB 不存在 / DB 异常 四种分支

### ⚠️ 风险与后续
- 调用方 `AuthMiddleware` 仍按抛异常处理，建议下一个 PR 同步调整；本 PR 不动它以保持最小变更。
```
