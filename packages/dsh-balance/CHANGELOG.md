# Changelog

## 0.3.1 - Unreleased

- 将 DeepSeek 与 OpenCode Go 收敛为经过验证的统一官方余额/额度预设；不再把聊天或 token 统计接口误标为账户余额接口。
- 状态栏会按当前会话最近一次实际完成请求的 `provider/model` 自动匹配已绑定的余额供应商。
- 页面处于后台时暂停自动刷新；恢复可见时按每个供应商的 `queryIntervalMinutes` 判断是否需要查询。
- 同一供应商的多个会话复用 Host 端缓存；手动刷新仍可强制查询。
- 更新 README，补充支持范围、会话绑定、刷新策略与仓库截图。

## 0.3.0 - Unreleased

- 统一 DSH credentials 服务和跨平台安装流程。
- 增加单包 Bundle、Host、Client 发布形态。
- 增加旧版 macOS Keychain 迁移兼容。

## 0.2.0

- 支持 JSON 路径回退表达式、可选链和动态币种。

## 0.1.0

- 首次发布余额和额度查询插件。
