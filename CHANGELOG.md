# Changelog

## 0.3.0 - Unreleased

- 统一通过 DSH `credentials` 服务保存自定义供应商密钥，消除 macOS、Windows 和 Linux 的使用差异。
- 为插件自建凭据增加稳定引用和归属标记，避免误删模型页共享凭据。
- 增加旧版 macOS Keychain 凭据的一次性迁移兼容。
- 增加单包 `dsh-balance`，用于公开安装和 DSH Web Profile 加载。
- 补充安全策略、跨平台开发说明、打包校验和 CI 配置。

## 0.2.0

- 支持 `??` 回退链、`?.` 可选链和动态币种表达式。
- 改进余额状态栏、供应商绑定和设置页体验。
- 增加请求校验和 JSON 路径安全测试。

## 0.1.0

- 首次提供 DSH Host + Client 余额查询插件。
