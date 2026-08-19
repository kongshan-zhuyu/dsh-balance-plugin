# dsh-balance

为 DeepSeek Harness 提供安全的余额与额度状态栏。插件在对话输入框下方显示当前模型对应的余额或用量，并提供供应商管理、模型绑定、缓存和手动刷新。

## 已验证的官方方案

| 供应商 | 显示内容 | 说明 |
| --- | --- | --- |
| DeepSeek | 可用余额 | 使用 DeepSeek 官方 `/user/balance` 接口。 |
| OpenCode Go | 滚动、每周、每月用量 | 使用 OpenCode Go 官方用量接口。 |

其他模型供应商（如 Claude、Gemini、OpenAI、Kimi、智谱、通义千问）可通过其**公开且可验证的 HTTPS 余额/额度接口**作为自定义供应商接入。插件不会把聊天、`countTokens` 或单次请求 usage 接口误当成账户余额接口。

## 安装

需要 Node.js 22 或更高版本，以及可用的 DSH CLI。

### 从 npm 安装

```bash
npx -y @deepseek-ai/dsh plugin --profile web add dsh-balance-quota
```

### 本地开发安装

```bash
pnpm install
pnpm dev:install
```

安装或升级后需要重启 Web Profile：

```bash
dsh web
```

查看已安装插件：

```bash
dsh plugin --profile web list
```

## 配置与供应商选择

打开 **设置 → 插件 → 插件配置 → 余额查询**。

1. 对 DeepSeek 或 OpenCode Go，点击对应模型供应商的 **使用官方方案**。
2. 插件会优先复用模型页已有的 credential ref；不会覆盖或删除该共享凭据。
3. 对其他供应商，选择 **接入余额查询**，填写公开 HTTPS 余额/额度接口及 JSON 路径。

状态栏显示你手动选择的供应商。点击状态栏供应商名称可在菜单中切换；**每个会话独立记忆**——在某个会话里选择的供应商只对该会话生效，切换会话后自动恢复该会话上次的选择，未手动选择过的会话显示第一个已配置的供应商。设置页仍可把供应商绑定到模型路由，但状态栏不再根据会话模型自动切换。

## 刷新与性能

- 每个供应商可单独设置查询间隔 `queryIntervalMinutes`，默认 30 分钟。
- 页面处于后台时，插件不自动刷新。
- 页面重新可见时，插件会检查当前供应商是否已超过设置的间隔；只有到期才查询。
- Host 按供应商缓存结果，因此多个会话使用同一个模型/供应商时会复用同一份结果。
- 状态栏的刷新按钮会强制绕过缓存，立即查询。

## 自定义供应商

支持：

- 公网 HTTPS 余额或额度接口；
- `GET` 或无请求体 `POST`；
- 简单 JSON 属性路径、`?.` 可选链和最多 5 个 `??` 回退分支；
- 固定 ISO 4217 币种或从响应读取币种；
- 自定义请求头、超时、缓存间隔与金额换算。

示例：

```text
余额路径：$.remaining ?? $.quota?.remaining ?? $.balance
币种：$.unit ?? "USD"
```

## 凭据与安全

插件通过 DSH `credentials` 服务解析和存储凭据。自定义 API Key 不会写入余额 JSON 配置，也不会通过浏览器配置接口返回。

余额接口必须使用公网 HTTPS。插件拒绝私网/回环地址、内部域名、重定向、危险请求头和超大响应，并在请求时重新校验 DNS 以降低 DNS 重绑定风险。详见 [SECURITY.md](./SECURITY.md)。

## 开发与验证

```bash
pnpm check
pnpm test
pnpm pack:check
pnpm verify
```

## 许可证

[MIT](./LICENSE)
