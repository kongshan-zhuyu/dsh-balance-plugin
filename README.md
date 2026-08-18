# dsh-balance

DSH 余额查询插件（`@deepseek-ai/dsh-bundle-balance`），用于查询模型供应商的余额与用量窗口。
它新增一个设置分区，并在界面上提供随模型变化的悬浮状态栏：显示当前模型的供应商、支持的滚动/周/月用量窗口，
无用量窗口时回退显示可用余额。

## 安全模型

- API Key 从不写入 `config.json`、不通过 HTTP 接口返回、也不在浏览器中渲染。
- 在 macOS 上，密钥保存于 Keychain 的 `dsh.balance` 服务中，仅宿主进程可读取。
- 供应商地址必须是公网 HTTPS。回环地址、私网/链路本地 IP、`.local` 与带凭据的 URL 在 DNS 解析后一律拒绝。
- 拒绝重定向，请求超时 8 秒，请求/响应体上限 512 KiB。
- 仅接受受限的请求头集合，危险头与 CR/LF 注入被拒绝。
- JSON 字段映射仅限 `$.data.balance` 之类的简单属性路径；不使用 eval、JSONPath 过滤器或模板插值。

## 在 macOS 上安装

1. 运行 `bash scripts/install-macos.sh`，内部使用官方 profile 命令：
   `dsh plugin --profile web add <local-package-path>`。
2. 重启 `dsh web`。

安装目标是 [dsh-bundle-balance](./packages/dsh-bundle-balance)，
它暴露了所需的 `dsh.bundle.patch` 清单，无需手工合并 profile patch。

## 官方接口边界

模型感知通过官方的会话模型目录 RPC 实现，不依赖私有 DSH API：

1. `connection.api.sessions.list({})` 取最新活跃会话；
2. `connection.api.sessions.models({ sessionId })` 读取该会话的 `current` 选择
   （`{ provider, model }`），拼成 `provider/model` 作为当前模型 key；
3. 状态栏与 `bindings` 均以该 key 工作；同时订阅官方转发的
   `llm/adapters-updated` 事件（`remote.$on`）及时刷新。

绑定语义：`bindings` 支持两种 key——精确路由 `deepseek/deepseek-chat` 或
供应商前缀 `deepseek`（同一供应商的所有模型共享余额）。设置页可在每个余额
供应商上选择要绑定到的模型供应商，或在"模型页"供应商上点"接入余额查询"
后自动绑定。状态栏点击会立即刷新并在页面派发 `dsh-balance:open` 事件，
供外部宿主打开设置面板（本插件不自带打开设置入口）。

## 供应商配置契约

`POST /dsh-balance/provider` 接受元数据与可选的 `apiKey`，密钥会立即转入钥匙串，绝不存入配置。
编辑已有供应商且未重新输入密钥时，`apiKey` 留空即保留原密钥，不会覆盖：

```json
{
  "id": "my-relay",
  "name": "My Relay",
  "endpoint": "https://relay.example.com/api/balance",
  "method": "GET",
  "auth": "bearer",
  "responsePath": "$.data.balance",
  "currency": "CNY",
  "usageWindows": [
    { "type": "weekly", "percentPath": "$.data.week.percent", "resetAtPath": "$.data.week.reset_at" }
  ]
}
```

`POST /dsh-balance/preferences` 接受 `{ statusBar, bindings }`；`bindings` 形如
`{ "deepseek": "my-relay" }` 或 `{ "deepseek/deepseek-chat": "my-relay" }`。

安装前先运行 `npm test` 与 `npm run check`。