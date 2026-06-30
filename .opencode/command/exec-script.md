---
description: 极简脚本执行入口，直接委派给 exec-script 子代理，适合只需要跑一个现成脚本的场景。
---

执行步骤：

1. **只保留最少信息**：把用户输入整理成 `scriptPath` 和可选 `args`。
2. **委派给 `exec-script` 子代理**：
   - 使用 [`exec-script`](../agents/exec-script.md)
   - 传 `scriptPath`
   - 可选传 `args`
   - `scriptPath` 必须是相对路径
3. **返回结果**：
   - 直接回传脚本输出
   - 不额外总结

> 用法示例：
> - `/exec-script scripts/hello.py`
> - `/exec-script scripts/hello.py args=Tom`
> - `/exec-script examples/mcp-echo-server/echo.sh`
> - `/exec-script examples/mcp-echo-server/echo.sh args=one two`
