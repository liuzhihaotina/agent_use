---
description: 极简脚本执行入口，直接委派给 exec-script 子代理，适合只需要跑一个现成脚本的场景。
---

执行步骤：

1. **只保留最少信息**：把用户输入整理成 `scriptPath`。
2. **委派给 `exec-script` 子代理**：
   - 使用 [`exec-script`](../agents/exec-script.md)
   - 只传 `scriptPath`
   - `scriptPath` 必须是相对路径
3. **返回结果**：
   - 直接回传脚本输出
   - 不额外总结

> 用法示例：
> - `/exec-script scripts/hello.py`
> - `/exec-script examples/mcp-echo-server/echo.sh`
