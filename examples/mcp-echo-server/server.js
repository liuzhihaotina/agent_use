#!/usr/bin/env node
/**
 * 最小可运行的 MCP server 示例
 * ────────────────────────────────────────────────────────────
 * 通过 stdio 与 opencode 通信，暴露两个工具：
 *   1) echo —— 原样返回输入字符串
 *   2) add  —— 返回两数之和
 *
 * 用法（被 opencode 自动拉起）：
 *   在 opencode.json 的 mcp 段配置：
 *     "echo": {
 *       "type": "local",
 *       "command": ["node", "examples/mcp-echo-server/server.js"],
 *       "enabled": true
 *     }
 *
 * 重要：
 *   - stdout 是协议通道，禁止用 console.log 打调试日志
 *   - 调试日志一律走 console.error（stderr）
 *
 * 依赖：@modelcontextprotocol/sdk
 *   cd examples/mcp-echo-server && npm install
 */

const { spawn } = require('node:child_process');
const { basename, dirname, join, resolve: pathResolve } = require('node:path');
const { existsSync } = require('node:fs');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// ─── 工具定义 ──────────────────────────────────────────────
const TOOLS = [
  {
    name: 'echo',
    description: '原样返回输入字符串，用于联通性测试。',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '要回显的内容' },
      },
      required: ['message'],
    },
  },
  {
    name: 'add',
    description: '返回两数之和，演示带数值参数的工具。',
    inputSchema: {
      type: 'object',
      properties: {
        a: { type: 'number', description: '加数 a' },
        b: { type: 'number', description: '加数 b' },
      },
      required: ['a', 'b'],
    },
  },
  {
    name: 'run_sh',
    description: '执行仓库里已有的 shell 脚本文件，返回标准输出。',
    inputSchema: {
      type: 'object',
      properties: {
        scriptPath: { type: 'string', description: '要执行的 shell 脚本路径' },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: '传给 shell 脚本的参数列表',
        },
      },
      required: ['scriptPath'],
    },
  },
  {
    name: 'run_py',
    description: '执行仓库里已有的 Python 脚本文件，返回标准输出。',
    inputSchema: {
      type: 'object',
      properties: {
        scriptPath: { type: 'string', description: '要执行的 Python 脚本路径' },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: '传给 Python 脚本的参数列表',
        },
      },
      required: ['scriptPath'],
    },
  },
];

// ─── 创建 server ───────────────────────────────────────────
const server = new Server(
  {
    name: 'mcp-echo-server',
    version: '0.1.0',
  },
  {
    capabilities: { tools: {} },
  }
);

// ─── 注册 list_tools 处理器 ───────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// ─── 注册 call_tool 处理器 ────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'echo': {
      const msg = String(args?.message ?? '');
      return {
        content: [{ type: 'text', text: msg }],
      };
    }

    case 'add': {
      const a = Number(args?.a);
      const b = Number(args?.b);
      if (Number.isNaN(a) || Number.isNaN(b)) {
        return {
          isError: true,
          content: [{ type: 'text', text: '参数 a / b 必须为数字' }],
        };
      }
      return {
        content: [{ type: 'text', text: String(a + b) }],
      };
    }

    case 'run_sh': {
      const scriptPath = String(args?.scriptPath ?? '');
      const scriptArgs = normalizeArgs(args?.args);
      return await executeScriptFile({ kind: 'sh', scriptPath, args: scriptArgs });
    }

    case 'run_py': {
      const scriptPath = String(args?.scriptPath ?? '');
      const scriptArgs = normalizeArgs(args?.args);
      return await executeScriptFile({ kind: 'py', scriptPath, args: scriptArgs });
    }

    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `未知工具：${name}` }],
      };
  }
});

function executeScriptFile({ kind, scriptPath, args = [] }) {
  return new Promise((resolve) => {
    const resolvedPath = pathResolve(process.cwd(), scriptPath);
    const command = kind === 'sh'
      ? pickGitBashCommand()
      : 'python';
    const childArgs = [resolvedPath, ...args];

    const child = spawn(command, childArgs, {
      cwd: process.cwd(),
      shell: false,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        resolve({
          isError: true,
          content: [{ type: 'text', text: stderr.trim() || `脚本执行失败，退出码：${code}` }],
        });
        return;
      }

      resolve({
        content: [{ type: 'text', text: stdout.trim() }],
      });
    });

    child.on('error', (err) => {
      resolve({
        isError: true,
        content: [{ type: 'text', text: `启动 ${command} 失败：${err.message}` }],
      });
    });
  });
}

function normalizeArgs(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item));
}

function pickGitBashCommand() {
  const gitBashPath = 'D:\\Soft\\gitbash\\Git\\bin\\bash.exe';
  if (existsSync(gitBashPath)) {
    return gitBashPath;
  }
  return 'bash';
}

// ─── 启动 ──────────────────────────────────────────────────
(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // 仅在 stderr 打 banner，避免污染 stdout 协议通道
  console.error('[mcp-echo-server] ready (stdio)');
})().catch((err) => {
  console.error('[mcp-echo-server] fatal:', err);
  process.exit(1);
});
