<div align="center">

# 🤖 OpenCode Agent Starter

**一个面向生产的 [opencode](https://opencode.ai) Agent 项目模板**

为开发者准备的、开箱即用、易于扩展的 AI 协作工作流骨架
内置主代理 + 子代理 + 技能 + 命令 + MCP 工具扩展位

<p>
  <img alt="opencode" src="https://img.shields.io/badge/opencode-ready-7C3AED?style=for-the-badge" />
  <img alt="language" src="https://img.shields.io/badge/language-中文-DC143C?style=for-the-badge" />
  <img alt="status" src="https://img.shields.io/badge/status-production--ready-22C55E?style=for-the-badge" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-3B82F6?style=for-the-badge" />
</p>

<p>
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-架构总览">架构</a> ·
  <a href="#-扩展指南">扩展</a> ·
  <a href="#-mcp-工具接入function-call">MCP 工具</a> ·
  <a href="#-生产落地清单">生产清单</a>
</p>

</div>

---

## ✨ 这个模板是什么

一句话：把 opencode 在任意项目里**"立刻可用、长期能扩展"**所需的全部约定和结构，预置成一个最小但完整的骨架。

它不是空文档堆叠，而是一套已经跑通的 **多代理协作工作流**：

- **主代理**驱动任务推进、做决策、汇报结果
- **子代理**分别承担 *审查 / 测试 / 调试* 三类专业工作
- **技能（skills）** 把"代码工作流"沉淀为可复用 SOP
- **命令（commands）** 把高频操作做成 `/diff`、`/status`、`/test` 这类快捷指令
- **MCP 扩展位** 让你随时把外部 API、数据库、内部工具接入成 *function call*

---

## 🚀 快速开始

### 1. 前置条件

| 依赖 | 说明 |
|------|------|
| [opencode](https://opencode.ai) | 已安装并完成模型 / Provider 配置 |
| Git | 用于版本控制与 `/diff`、`/status` 命令 |
| Node.js ≥ 18（可选） | 接入 MCP 工具服务器时需要 |

### 2. 克隆并启动

```bash
# 1. 把模板放入你的项目
git clone <this-repo> my-project && cd my-project

# 2. 用 opencode 打开当前工程
opencode

# 3. 第一次进入会自动加载：
#    - AGENT.md / CLAUDE.md  作为全局工作约定
#    - opencode.json         作为代理与权限配置
#    - .opencode/agents      注册主代理与子代理
#    - .opencode/skills      注入"代码工作流"技能
#    - .opencode/command     提供斜杠命令
```

### 3. 试一下

在 opencode 会话中输入：

```
/status                              # 查看仓库状态
/diff                                # 查看当前差异
请审查我刚才在 src/ 下的修改         # 自动委派给 review 子代理
跑一下与本次修改相关的最小测试       # 自动委派给 test 子代理
线上 500 报错，先复现再定位          # 自动委派给 debug 子代理
```

---

## 🧭 架构总览

```
agent_use/
├── README.md                   ← 你正在看的文档
├── AGENT.md                    ← 通用代理工作约定（语言 / 流程 / 输出）
├── CLAUDE.md                   ← Claude 系列代理的额外约定
├── opencode.json               ← opencode 主配置（模型 / 代理 / 权限 / MCP）
└── .opencode/
    ├── agents/                 ← 代理定义（主代理 + 子代理）
    │   ├── code-workflow.md    ·   主代理：任务编排与汇报
    │   ├── review.md           ·   子代理：代码审查
    │   ├── test.md             ·   子代理：测试与验证
    │   ├── debug.md            ·   子代理：复现与根因
    │   └── tools-runner.md     ·   子代理：function call / MCP 工具调用样板
    ├── skills/                 ← 可复用 SOP（被代理自动加载）
    │   ├── code-workflow/      ·   代码任务标准工作流
    │   ├── daily-workflow/     ·   日常轻量工作流
    │   └── tool-usage/         ·   MCP 工具 / function call 调用 SOP
    └── command/                ← 斜杠命令（手动触发）
        ├── status.md           ·   /status  仓库状态
        ├── diff.md             ·   /diff    差异速览
        ├── test.md             ·   /test    跑相关测试
        ├── lint.md             ·   /lint    跑相关 lint
        ├── review.md           ·   /review  委派 review 子代理
        └── debug.md            ·   /debug   复现并分析失败
```

### 多代理协作时序

```
 用户 ──▶ code-workflow（主代理）
              │
              ├─（修改代码后需复核）──▶  review   ──▶ 返回问题清单
              │
              ├─（需要验证）─────────▶  test     ──▶ 返回命令与结果
              │
              └─（出现失败）─────────▶  debug    ──▶ 返回根因与修复路径
              │
              ▼
         汇总结论 + 验证证据 + 风险提示  →  用户
```

---

## 🛠️ 扩展指南

模板的核心价值在于 **"加东西容易、删东西安全"**。下面是四种最常见的扩展场景。

### A. 新增一个子代理

在 `.opencode/agents/` 新建一个 Markdown，例如 `migration.md`：

```markdown
---
description: 数据库迁移代理：生成与校验 SQL 迁移脚本，输出均使用中文。
mode: subagent
model: openai-compatible/claude-opus-4-8
permission:
  edit: ask
  bash: ask
  external_directory: deny
---

你是数据库迁移代理。

## 职责
- 根据 schema 变更生成迁移脚本
- 校验向前 / 向后兼容
- 输出回滚 SQL

## 输出格式
- 变更摘要
- 迁移 SQL
- 回滚 SQL
- 风险点
```

然后在 `opencode.json` 的 `agent` 字段中登记同名条目即可。

### B. 新增一个技能（Skill）

技能是"代理可以随时取用的 SOP"。在 `.opencode/skills/<name>/SKILL.md` 写明：
- 触发场景
- 标准步骤
- 输出格式 / 检查清单

代理在匹配到对应场景时会自动加载，无需手动 `/调用`。

### C. 新增一个斜杠命令

在 `.opencode/command/` 新建一个 Markdown，比如 `release.md`：

```markdown
---
description: 打 tag、生成 changelog 并推送。
---

依次执行：
- `git fetch --tags`
- `git tag v$(date +%Y.%m.%d)`
- `git push --tags`

并用中文汇报每一步结果。
```

之后在会话里输入 `/release` 即可触发。

### D. 接入 MCP 工具（即 function call 扩展）

见下一节。

---

## 🔌 MCP 工具接入（function call）

opencode 通过 **MCP（Model Context Protocol）** 把任意外部能力暴露成代理可以调用的 *function call / tool*。
本模板已经在 `opencode.json` 里留好 `mcp` 接入位，按下面三步就能加新工具。

### 步骤 1：在 `opencode.json` 中声明 MCP 服务器

```jsonc
{
  "mcp": {
    // ① 本地命令型：把任意脚本作为工具进程拉起
    "filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "./"],
      "enabled": false
    },

    // ② 远程 SSE 型：对接公司内部 API 网关
    "internal-api": {
      "type": "remote",
      "url": "https://mcp.your-company.com/sse",
      "headers": { "Authorization": "Bearer ${MCP_TOKEN}" },
      "enabled": false
    }
  }
}
```

> 默认 `enabled: false`，避免初次启动把所有外部依赖都拉起来。需要时再打开。

### 步骤 2：把工具授权给具体代理

在某个代理的 frontmatter 里增加 `tools` 字段，显式列出可用工具：

```yaml
---
description: 运维代理：可查询监控、查询日志、重启服务。
mode: subagent
tools:
  - mcp__internal-api__query_metrics
  - mcp__internal-api__search_logs
  - mcp__internal-api__restart_service
permission:
  bash: deny
  edit: deny
---
```

> 工具名规则：`mcp__<服务器名>__<工具名>`，与 opencode 约定保持一致。

### 步骤 3：在对话里直接用

代理会自动决定何时调用工具，你也可以显式要求：

```
帮我查一下 user-service 最近 15 分钟的 5xx 比例，再决定要不要重启
```

### 推荐的开箱即用 MCP 服务器

| 场景 | 推荐服务器 | 用途 |
|------|------------|------|
| 文件系统 | `@modelcontextprotocol/server-filesystem` | 受控的文件读写 |
| Git | `@modelcontextprotocol/server-git` | 暴露 git 操作为工具 |
| 数据库 | `@modelcontextprotocol/server-postgres` | 让代理读 SQL 数据 |
| HTTP | `@modelcontextprotocol/server-fetch` | 让代理调任意 REST API |
| 浏览器 | `@modelcontextprotocol/server-puppeteer` | 让代理跑端到端校验 |

---

## 🔐 权限模型

opencode 的 `permission` 是这个模板能"放心上生产"的关键。
模板默认采用**最小权限**原则：

| 权限位 | 默认值 | 含义 |
|--------|--------|------|
| `edit` | `ask` | 修改文件前必须征求用户确认 |
| `bash` | `ask` | 执行任意 shell 前必须确认 |
| `external_directory` | `deny` | 禁止访问工程目录之外的文件 |

子代理在此基础上**继续收紧**：

- `review` 与 `test`：`edit: deny`，只读 / 只测，杜绝越权修改
- `debug` 与主代理：`edit: ask`，必要时可改但必须人工确认

> 上线前请按团队规范在 `opencode.json` 里再次审阅这些字段。

---

## 🧩 各代理职责一览

| 代理 | 模式 | 关键职责 | 何时被调用 |
|------|------|----------|------------|
| `code-workflow` | primary | 总调度、最小化改动、汇报结果 | 默认入口 |
| `review` | subagent | 正确性、回归、边界、测试缺口 | 改完代码需要复核 |
| `test` | subagent | 选择最窄验证命令并执行 | 需要可验证证据 |
| `debug` | subagent | 复现失败 → 定位根因 → 提出最小修复 | 出现报错或行为异常 |
| `tools-runner` | subagent | 通过 MCP 工具完成外部查询 / 受控操作 | 需要 function call 时 |

---

## 📦 生产落地清单

把模板套到真实项目时，建议按下表一项项过：

- [ ] 在 `opencode.json` 中把模型替换为团队统一的 Provider
- [ ] 按团队规范收紧 `permission`（建议保持 `ask` 或更严格）
- [ ] 在 `.opencode/agents/` 增补与你业务相关的专业代理（如 *migration / infra / security*）
- [ ] 在 `.opencode/command/` 增补团队常用脚本（如 `/release`、`/deploy`、`/rollback`）
- [ ] 在 `opencode.json > mcp` 中接入至少一个内部工具服务器
- [ ] 在 CI 中加入 "代理产物" 校验（如 review/test 子代理的输出可被流水线消费）
- [ ] 编写本项目专属的 `AGENT.md` 补充章节：业务术语、目录约定、危险操作清单
- [ ] 把 README 顶部"这个模板是什么"一节替换为**你项目本身**的介绍

---

## 🧪 模板自身的验证方式

模板没有业务代码，但提供了三种"自我验证"路径：

1. 在 opencode 会话中输入 `/status` 与 `/diff`，确认命令被正确识别
2. 让主代理"读 README 并用 3 句话概括"，验证 instructions 注入生效
3. 故意要求一个会改文件的操作，确认 `edit: ask` 弹出确认 —— 验证权限生效

---

## 🗺️ Roadmap（建议演进方向）

- [ ] 增加 `security` 子代理（敏感信息扫描 / 依赖漏洞）
- [ ] 增加 `infra` 子代理（K8s / Terraform 变更检查）
- [ ] 提供示例 MCP server（TypeScript 最小实现，演示自定义 function call）
- [ ] 提供 GitHub Actions 集成示例，在 PR 上自动跑 `review` 子代理

---

## 🤝 贡献

欢迎通过 Issue / PR 反馈：
- 在真实项目中遇到的扩展需求
- 你团队沉淀下来的 skill / command
- 想接入但 opencode 还没有现成方式的 MCP 工具

> 提交 PR 时请保持模板的"最小且可扩展"原则：不要绑死任何特定技术栈。

---

## 📄 License

MIT
