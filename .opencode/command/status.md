---
description: 显示仓库当前状态、最近历史与未跟踪文件，便于快速了解上下文。
---

依次执行下列命令，并用中文做结构化总结：

```bash
git status --short --branch
git log --oneline --decorate -10
git stash list
```

汇报要求：

- **当前分支**：分支名 + 是否落后于 origin
- **工作区状态**：修改 / 新增 / 删除 / 未跟踪 各几项，列出关键文件
- **最近 10 次提交**：用 1 行/条简述（含 hash 短码）
- **暂存栈**：是否有 stash，提示是否需要清理
- **下一步建议**：基于状态给一句话建议（如"建议先 commit / 建议先 stash / 状态干净可继续"）
