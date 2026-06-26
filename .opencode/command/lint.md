---
description: 运行与当前变更最相关的 lint / 格式化 / 类型检查。
---

执行步骤：

1. **识别变更文件**：`git diff --name-only`、`git diff --name-only --cached`
2. **按扩展名挑命令**（仅在项目存在对应配置时执行）：

   | 文件类型 | 推荐命令（按项目实际命名调整） |
   |----------|--------------------------------|
   | `.ts` / `.tsx` / `.js` | `pnpm lint --filter=<只跑改动文件>`、`pnpm typecheck` |
   | `.py` | `ruff check <files>`、`mypy <files>` |
   | `.go` | `golangci-lint run ./...`、`go vet ./...` |
   | `.rs` | `cargo clippy --no-deps`、`cargo fmt --check` |
   | `.json` / `.yaml` | `prettier --check <files>` |
   | `.md` | `markdownlint <files>`（若有） |

3. **执行**：仅对**本次变更涉及的文件**跑，避免污染输出
4. **汇报**：

```markdown
### 🧹 执行的命令
```bash
<具体命令>
```

### 📊 结果
- 状态：✅ 通过 / ⚠️ 有警告 / ❌ 失败
- 关键问题（如有）：
  - `path/to/file:line` —— 规则名 —— 简述

### 💡 建议
- 是否自动修复（`--fix` / `--write`）
- 是否需要主代理介入修改
```

> 反模式：跑全量 lint 导致输出爆炸、跑了不存在的命令、忽略 warning 直接报"通过"。
