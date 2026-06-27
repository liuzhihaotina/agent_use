# mcp-echo-server · 最小可运行的 MCP server 示例

> 配合 [`docs/MCP_GUIDE.md`](../../docs/MCP_GUIDE.md) 使用。
> 这是一份"开箱即跑"的 MCP server 脚手架：复制本目录、改两个工具、就能给团队上线一组 function call。

---

## 它暴露了什么

| 工具名 | 完整调用名 | 入参 | 作用 |
|--------|-----------|------|------|
| `echo` | `mcp__echo__echo` | `{ message: string }` | 原样回显 |
| `add`  | `mcp__echo__add`  | `{ a: number, b: number }` | 返回 a + b |

---

## 一分钟跑通

### 1. 安装依赖

```bash
cd examples/mcp-echo-server
npm install
```

### 2. 在仓库根 `opencode.json` 启用

确认 `mcp.echo` 段是这样：

```jsonc
{
  "mcp": {
    "echo": {
      "type": "local",
      "command": ["node", "examples/mcp-echo-server/server.js"],
      "enabled": true
    }
  }
}
```

> 默认仓库里给的是 `"enabled": false`，请改成 `true`。

### 3. 授权给某个代理

> 📌 关于 "frontmatter"：每个代理 `.md` 文件**最顶部**那一段被 `---` 上下包起来的就是 YAML frontmatter。
> 你**不是**额外往 Markdown 里塞 YAML，而是**编辑已经存在的那段** —— 把 `tools: []` 改成你要授权的工具列表。

打开 [`.opencode/agents/tools-runner.md`](../../.opencode/agents/tools-runner.md)，文件最上面长这样：

```markdown
---
description: 工具调用（function call）示范子代理 …
mode: subagent
model: openai-compatible/claude-opus-4-7
tools: []                      ← 看这一行
permission:
  edit: deny
  bash: deny
  external_directory: deny
---

你是 **tools-runner 子代理**，…
（下面是正文 Markdown，不要动）
```

把 `tools: []` 改成（注意缩进 2 空格、用短横线 `-`）：

```markdown
---
description: 工具调用（function call）示范子代理 …
mode: subagent
model: openai-compatible/claude-opus-4-7
tools:
  - mcp__echo__echo
  - mcp__echo__add
permission:
  edit: deny
  bash: deny
  external_directory: deny
---
```

保存即可。**`---` 上下两行不要动**，它们是 frontmatter 的分隔标记。

> 💡 想再给它授权别的 server 的工具？继续在 `tools:` 下面追加一行 `- mcp__<server>__<tool>` 就行，不需要改其它东西。

### 4. 在 opencode 里直接试

```
请用 tools-runner 调一下 echo，参数是 "hello mcp"
```

预期返回：

```
hello mcp
```

再试一下：

```
请用 tools-runner 调一下 add，a=3, b=4
```

预期返回：

```
7
```

---

## 想加自己的工具？

1. 打开 [`server.js`](./server.js)
2. 在 `TOOLS` 数组里加一项（含 `name` / `description` / `inputSchema`）
3. 在 `CallToolRequestSchema` 的 switch 里加对应分支
4. 在代理 frontmatter 的 `tools` 字段授权新工具名

---

## 常见坑

- **stdout 被污染**
  本 server 的 stdout 是 MCP 协议通道。**禁止**用 `console.log` 调试，请用 `console.error`（stderr）。

- **`tool not authorized`**
  代理的 frontmatter `tools` 没列；或工具名分隔符写成了单下划线 `_`，应为双下划线 `__`。

- **`npm install` 失败 / `@modelcontextprotocol/sdk` 不存在**
  本目录依赖 [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk)。请确认 Node ≥ 18 且能访问 npm 仓库（必要时配置代理 / 镜像）。

---

## 与 opencode 的协作链路

```
你 → opencode 主代理 → tools-runner 子代理
                             │
                             ├─ 解析工具名 mcp__echo__echo
                             ▼
                       opencode MCP Client
                             │ stdio
                             ▼
                       本目录的 server.js
                             │
                             ▼
                       返回结果回到代理
                             │
                             ▼
                       代理整理后回答你
```
