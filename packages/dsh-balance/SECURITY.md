# Security Policy

请通过 GitHub Security Advisories 私下报告漏洞，不要在公开 issue 中粘贴 API Key 或完整的敏感响应。

插件只允许公网 HTTPS，拒绝私网/回环地址、内部域名、重定向、危险请求头和超大响应；请求时会重新解析 DNS 并固定到已校验的公网地址。API Key 由 DSH `credentials` 服务管理，不进入余额 JSON 配置或浏览器响应。旧版 macOS Keychain 仅作为一次性迁移来源。
