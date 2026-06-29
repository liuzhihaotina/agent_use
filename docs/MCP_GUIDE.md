# 🔌 opencode × MCP 接入操作手册

> 本手册回答一个问题：**"opencode 怎么通过 MCP 把外部能力变成代理可调用的 function call？"**
> 全部基于本仓库现有结构，按步骤照抄即可跑通。配套示例位于 [`examples/mcp-echo-server/`](../examples/mcp-echo-server/)，是一个开箱即跑的本地 MCP server。

---

## 0. 一图看懂

```
┌──────────────────────────────────────────────────────────────┐
│ opencode（你和代理聊天的地方）                                │
│                                                              │
│   ┌──────────────┐                                           │
│   │  主代理       │  ── 决定调哪个工具 ──▶ ┌──────────────┐ │
│   │ code-workflow│                       │  MCP Client   │ │
│   └──────────────┘                       └──────┬────────┘ │
│                                                  │ stdio /   │
└──────────────────────────────────────────────────┼─SSE──────┘
                                                   │
                                                   ▼
                                       ┌────────────────────────┐
                                       │  MCP Server（你写的）   │
                                       │  暴露若干 tools         │
                                       │  · echo                │
                                       │  · query_metrics       │
                                       │  · search_logs ...     │
                                       └────────────────────────┘
```

- **opencode** 内置 *MCP Client*，会按 `opencode.json > mcp` 段把每个 server 拉起来或连过去
- **MCP Server** 是任意一个**说 MCP 协议**的进程：可以是社区现成的（npm 包），也可以是你自己写的
- **工具名** 在 opencode 里统一规范化为 `mcp__<server名>__<tool名>`
- **代理** 只能调用自己 frontmatter 里 `tools` 字段**显式授权**过的工具名

---

## 1. 三种接入方式（按场景选）

| 方式 | 何时用 | 配置类型 |
|------|--------|----------|
| **本地命令型（stdio）** | server 是个 CLI 进程（npm 包 / 本地脚本） | `"type": "local"` |
| **远程 SSE 型** | server 部署在内网 / 公司 API 网关，通过 HTTP SSE 通信 | `"type": "remote"` |
| **自己写 server** | 没有现成 server 满足业务（最常见） | 本地命令型 + 你自己的代码 |

下面三个步骤对所有方式都适用。

---

## 2. 三步接入

### 步骤 1：在 `opencode.json` 声明 server

打开 [`opencode.json`](../opencode.json)，在 `mcp` 段加一项：

```jsonc
{
  "mcp": {
    // ── 例 1：直接用社区现成的文件系统 server ──────────────
    "filesystem": {
      "type": "local",
      "command": [
        "npx", "-y", "@modelcontextprotocol/server-filesystem",
        "./"                      // 暴露当前工程根目录
      ],
      "enabled": true             // ← 改成 true 才会启用
    },

    // ── 例 2：直接用社区现成的 git server ──────────────────
    "git": {
      "type": "local",
      "command": [
        "npx", "-y", "@modelcontextprotocol/server-git",
        "--repository", "./"
      ],
      "enabled": true
    },

    // ── 例 3：自己写的本地 server（看本手册 §4） ──────────
    "echo": {
      "type": "local",
      "command": ["node", "examples/mcp-echo-server/server.js"],
      "enabled": true
    },

    // ── 例 4：远程 SSE server ──────────────────────────────
    "internal-api": {
      "type": "remote",
      "url": "https://mcp.your-company.com/sse",
      "headers": {
        "Authorization": "Bearer ${MCP_TOKEN}"   // 支持环境变量插值
      },
      "enabled": true
    }
  }
}
```

> ✅ 改完保存即可，opencode 下次启动会自动拉起 / 连接。
> ⚠️ **不要**把真实 token 写进 `opencode.json`，用 `${ENV_VAR}` 形式从环境变量取。

---

### 步骤 2：把工具授权给某个代理

server 启动后，opencode 会把它提供的每个工具暴露为：

```
mcp__<服务器名>__<工具名>
```

例如本手册自带的 echo server 提供 `echo` / `add` 两个工具，对应：

- `mcp__echo__echo`
- `mcp__echo__add`

**默认情况下，所有代理都看不到任何 MCP 工具**——必须显式授权。

#### 什么是 frontmatter？

每个代理 `.md` 文件**最顶部**用 `---` 上下包起来的那一段就是 **YAML frontmatter**。它不是 Markdown 正文，而是 opencode 用来识别"这个代理叫什么、能用哪些模型、有哪些权限、能调哪些工具"的元数据。

```markdown
---            ← 上分隔线
key: value     ← 这一段是 YAML（注意是 YAML 语法，不是 JSON）
key2:
  - item1
  - item2
---            ← 下分隔线

这里开始才是 Markdown 正文，写给模型看的提示词。
```

#### 怎么编辑

打开 [`.opencode/agents/tools-runner.md`](../.opencode/agents/tools-runner.md)，**已经有**这段 frontmatter 了：

```markdown
---
description: 工具调用（function call）示范子代理 …
mode: subagent
model: openai-compatible/claude-opus-4-7
tools: []                      ← 默认空数组，表示不授权任何工具
permission:
  edit: deny
  bash: deny
  external_directory: deny
---
```

把 `tools: []` 这一行**替换成**：

```yaml
tools:
  - mcp__echo__echo            # ← 显式列出允许调用的工具
  - mcp__echo__add
  - mcp__filesystem__read_file
```

保存后整段 frontmatter 变成：

```markdown
---
description: 工具调用（function call）示范子代理 …
mode: subagent
model: openai-compatible/claude-opus-4-7
tools:
  - mcp__echo__echo
  - mcp__echo__add
  - mcp__filesystem__read_file
permission:
  edit: deny
  bash: deny
  external_directory: deny
---
```

> ⚠️ YAML 对缩进**很敏感**：用 2 个空格、不要用 Tab；列表项前的 `-` 后面要有 1 个空格；`---` 两条分隔线不能动。

> 💡 **强烈建议**：写入类工具（重启 / 改库 / 发邮件）单独放进一个**独立的代理**，避免和"只读查询代理"混在一起。这样可以用 opencode 的 `permission` 给它们不同的确认策略。

---

### 步骤 3：在对话里直接用

启动 opencode，让主代理把活分派给授权过的子代理：

```
请用 tools-runner 调一下 echo 工具，参数是 "hello mcp"
```

或者更自然地：

```
帮我看一下当前 git log 最近 5 条
（主代理会判断需要什么 git 只读操作，委派给 tools-runner）
```

---

## 3. 工具名 / 调用机制（更技术的细节）

### 3.1 工具名规则

```
mcp__<server名>__<tool名>
     ↑           ↑
   双下划线     双下划线
```

- `server名` 来自 `opencode.json > mcp` 的 key
- `tool名` 由 MCP server 自身在 `tools/list` 中声明（社区 server 见各自 README）

### 3.2 schema 来源

每个工具的 **入参 schema、描述、是否只读** 都由 MCP server 自己声明。
opencode 拉起 server 后会自动 `tools/list` 拉一遍，再注入给模型作为 function call 定义。

代理调用工具时，opencode 会：

1. 校验代理是否有授权（`tools` 字段）
2. 校验入参是否符合 server 声明的 JSON Schema
3. 通过 stdio / SSE 把调用发到 server
4. 把返回结果回填给代理

### 3.3 权限叠加

调用 MCP 工具时，权限按下表叠加：

| 检查项 | 谁负责 |
|--------|--------|
| 工具是否被代理授权 | 代理 frontmatter `tools` |
| 工具是否会改文件 / 联网 / 执行 shell | server 自身 + opencode 的 `permission` 配置 |
| 写入类工具是否要弹确认 | opencode（取决于 `permission.bash` / `edit` 等） |
| server 自己的鉴权（token / IP 白名单） | server 实现 |

---

## 4. 自己写一个 MCP server（最小示例）

仓库内提供了一个可直接跑的最小 Node.js MCP server：

📁 [`examples/mcp-echo-server/`](../examples/mcp-echo-server/)

- 不需要数据库、不需要外部 API
- 只暴露两个工具：`echo` 和 `add`
- 总共约 80 行代码，单文件 + 一个 package.json
- 跑法：

```bash
# 1. 进入示例目录
cd examples/mcp-echo-server

# 2. 安装依赖
npm install

# 3. 让 opencode 把它拉起来（看本手册 §2 步骤 1 里的 "echo" 配置）
opencode
```

启动后在 opencode 里说：

```
请用 tools-runner 调 echo 工具，参数是 "你好"
```

如果一切正常，会看到 echo server 原样返回你的输入。

> ✅ 把这个示例当作"开发自己的 MCP server 的脚手架"：复制 → 改两个 tool → 上线一个属于你团队的工具集。

---

## 5. 调试与排错

### 5.1 server 没起来怎么办

| 症状 | 排查 |
|------|------|
| opencode 启动慢 / 报 `MCP server timeout` | server 进程没跑起来。手动执行 `command` 里的命令看 stderr |
| `tools/list` 为空 | server 跑起来了但没正确声明工具，看 server 自己的日志 |
| `tool not authorized` | 代理 frontmatter 的 `tools` 没列对应工具名 |
| `tool not found` | 工具名拼错；记住分隔符是**双下划线** `__` |
| 远程 SSE 401 | `headers` 里的 token 没注入；检查 `${MCP_TOKEN}` 环境变量 |

### 5.2 怎么看 server 的输出

- **本地 stdio server**：在 opencode 启动前手动单跑一次 `command`，确认能正确打印 MCP 握手包
- **远程 SSE server**：用 `curl` 试一下 SSE 端点：
  ```bash
  curl -N -H "Authorization: Bearer $MCP_TOKEN" https://mcp.your-company.com/sse
  ```

### 5.3 让代理"显式说出"它准备调哪个工具

在 [`.opencode/skills/tool-usage/SKILL.md`](../.opencode/skills/tool-usage/SKILL.md) 里已经规定：
> 调用前必须先在汇报里列出"意图 → 工具 → 入参"。

如果代理直接给了答案而没说调了什么，多半是它在**编造结果**而不是真调用，立刻让它回头说明。

---

## 6. 常见坑（按踩过频率排序）

1. **`enabled: false` 没改成 `true`**
   声明了 server，但忘了开关 —— 这是新手第一个会踩的坑。

2. **工具名拼错**
   `mcp_echo_echo`（单下划线）是错的，必须 `mcp__echo__echo`（双下划线）。

3. **把真实 token 写进 `opencode.json`**
   提交到 git 后基本等于泄露。一律用 `${ENV_VAR}`。

4. **server 的 stdout 被污染**
   stdio 型 MCP server 的 **stdout 是协议通道**，禁止用 `console.log` 打调试日志，会把 opencode 直接搞挂。
   debug 一律走 `console.error`（stderr）。

5. **把写入类工具放进默认代理**
   `tools-runner` 默认 `tools: []` 是有意的。新增写入工具时，**新建**一个代理（如 `ops-runner`），不要往现有代理塞。

6. **指望"全 server 全工具"**
   opencode 不鼓励"把所有 server 全部 enabled 然后让模型自己挑"。每多一个工具就多一份上下文成本和误用风险。**用多少开多少**。

---

## 7. 接下来去哪

- 想了解推荐的开发流程：[`AGENT.md`](../AGENT.md) §7、[`.opencode/skills/tool-usage/SKILL.md`](../.opencode/skills/tool-usage/SKILL.md)
- 想看 function call 代理样板：[`.opencode/agents/tools-runner.md`](../.opencode/agents/tools-runner.md)
- 想直接跑示例 server：[`examples/mcp-echo-server/README.md`](../examples/mcp-echo-server/README.md)
- 想深入 MCP 协议本身：<https://modelcontextprotocol.io>
