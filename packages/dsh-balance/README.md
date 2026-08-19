# dsh-balance

为 DeepSeek Harness 提供供应商余额和额度状态栏。单个包同时提供 DSH Host、Web Client 和 Bundle，安装时不需要区分 macOS、Windows 或 Linux。

## 安装

需要 Node.js 22 或更高版本，以及可用的 DSH CLI：

```bash
npx -y @deepseek-ai/dsh plugin --profile web add dsh-balance@0.3.0
```

安装或升级后重启 Web Profile：

```bash
dsh web
```

查看已安装插件：

```bash
dsh plugin --profile web list
```

本地开发安装：

```bash
pnpm install
pnpm dev:install
```

本地安装脚本只用于仓库开发者；普通用户不需要 clone 仓库，也不需要手动安装 pnpm。

## 配置

打开 **设置 → 插件 → 插件配置 → 余额查询**。DeepSeek 和 OpenCode Go 使用内置方案，其他供应商可创建自定义配置。保存后状态栏会出现在对话输入框的 composer dock 中。

自定义供应商支持：

- 公网 HTTPS 余额接口。
- `GET` 或无请求体 `POST`。
- 简单 JSON 属性路径、`?.` 可选链和最多 5 个 `??` 回退分支。
- 固定 ISO 4217 币种，或从响应读取币种。
- 请求头、超时、缓存间隔和金额换算。

示例：

```text
余额路径：$.remaining ?? $.quota?.remaining ?? $.balance
币种：$.unit ?? "USD"
```

## 凭据

插件优先复用模型页已有的 DSH credential ref。自定义 API Key 会通过 DSH `credentials` 服务保存到 DSH 的统一凭据存储，插件不会把密钥写入余额配置文件，也不会从配置接口返回密钥。

显式传入的环境变量仍由 DSH 统一凭据服务按其优先级处理。模型页共享凭据不会被余额插件覆盖或删除；插件自己创建的凭据只会在删除对应供应商时清理。

旧版本在 macOS Keychain 中保存的凭据会在首次使用时迁移到 DSH 凭据服务。新版本不再依赖操作系统专用的 Keychain 命令，因此安装和使用流程在 macOS、Windows 和 Linux 上一致。

## 安全

余额接口必须是公网 HTTPS。插件拒绝私网地址、回环地址、内部域名、重定向、危险请求头和过大的响应，并在请求时重新校验 DNS 以降低 DNS 重绑定风险。完整策略见 [SECURITY.md](./SECURITY.md)。

## 开发

```bash
pnpm install
pnpm check
pnpm test
pnpm pack:check
pnpm verify
```

发布包只包含 `files` 白名单中的运行时代码和文档，设计稿、截图、测试输出和仓库元数据不会进入 npm 包。

## 许可证

[MIT](./LICENSE)
