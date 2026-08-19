# DSH Balance

`dsh-balance` 是 DeepSeek Harness 的余额与额度插件。它把 Host 查询、Web 状态栏、设置页和 Bundle 收敛为一个可安装包，支持 DeepSeek、OpenCode Go 和自定义供应商。

## 用户安装

需要 Node.js 22 或更高版本。直接安装固定版本：

```bash
npx -y @deepseek-ai/dsh plugin --profile web add dsh-balance@0.3.0
```

安装或更新后重启 Web Profile：

```bash
dsh web
```

查看插件：

```bash
dsh plugin --profile web list
```

删除时使用当前 CLI 帮助中显示的 profile 插件 remove 命令；不同 DSH 版本的删除参数可能不同，因此不在脚本中硬编码未经验证的变体。

## 本地开发

```bash
pnpm install
pnpm dev:install
```

开发者安装脚本只安装 `packages/dsh-balance` 这个本地包。它会在 Windows、macOS 和 Linux 内部选择正确的 DSH CLI，不要求用户手动区分系统，也不要求普通用户安装 pnpm。

## 功能

- 在设置 → 插件 → 插件配置中管理余额供应商。
- 在对话输入框状态栏显示余额、额度窗口、刷新时间和错误状态。
- 内置 DeepSeek 余额和 OpenCode Go 滚动/每周/月度额度。
- 自定义接口支持公网 HTTPS、GET、无请求体 POST、自定义请求头和金额换算。
- JSON 路径支持 `?.` 可选链和最多 5 个 `??` 回退分支，例如 `$.remaining ?? $.quota?.remaining ?? $.balance`。
- 优先复用 DSH 模型页的基础地址和 credential ref。

## 凭据和平台支持

插件统一使用 DSH `credentials` 服务，不再区分 macOS、Windows 和 Linux 的安装或配置流程。自定义 API Key 不写入余额 JSON 配置，也不会通过浏览器配置接口返回；模型页共享凭据不会被插件覆盖或删除。

旧版本 macOS Keychain 中的凭据只作为一次性迁移来源。升级后首次使用时，插件会尝试迁移到 DSH 凭据服务；新版本不再调用操作系统专用 Keychain 命令。

## 项目结构

```text
packages/
├─ dsh-balance/          # 对外安装包：Host、Client、Bundle、测试和发布文档
├─ dsh-host-balance/     # 旧版内部 Host，保留作迁移期回归对照
├─ dsh-client-balance/   # 旧版内部 Client，保留作迁移期回归对照
└─ dsh-bundle-balance/   # 旧版内部 Bundle，保留作迁移期回归对照
```

新的用户安装只使用 `dsh-balance`。旧三个包不应继续作为独立发布包。

## 质量检查

```bash
pnpm check
pnpm test
pnpm pack:check
pnpm verify
```

GitHub Actions 会在 Ubuntu、Windows、macOS 以及 Node.js 22/24 上运行相同检查。发布包使用 `files` 白名单，不会包含根目录设计稿、PNG 截图、`.git` 或本地验证产物。

## 文档

- [统一包说明](./packages/dsh-balance/README.md)
- [安全策略](./SECURITY.md)
- [变更日志](./CHANGELOG.md)
- [MIT License](./LICENSE)

## 许可证

MIT License，详见 [LICENSE](./LICENSE)。
