# DSH Balance

为 DeepSeek Harness（DSH）提供模型供应商余额与额度查询，并通过对话输入框的 `conversation.composer.dock` 插槽显示当前选中的余额状态。

> 当前版本：`0.1.0`
> 运行形态：DSH Web Profile 的 Host + Client 双端插件

## 功能

- 在 **设置 → 插件 → 插件配置 → 余额查询** 中管理供应商。
- 在输入框工具栏显示紧凑的余额或额度状态。
- 点击供应商名称切换要查看的供应商。
- 在状态栏中直接查看余额、刷新时间或全部额度窗口。
- 支持超时时间和查询缓存间隔。
- 支持金额换算：`接口原始值 ÷ 换算除数 = 最终显示金额`。
- 可复用 DSH“模型”页中的供应商基础地址和凭据引用。

## 内置方案

### DeepSeek

- 接口：`https://api.deepseek.com/user/balance`
- 展示货币余额。
- 复用模型供应商凭据。

### OpenCode Go

- 接口：`https://opencode.ai/zen/go/v1/usage`
- 展示滚动、每周和每月用量窗口。
- 复用模型供应商凭据。

### Neco 预填配置

Neco 不是官方内置方案。插件只提供一组便于编辑的自定义配置预填：

- 根据模型页 `baseURL` 自动选择 `/usage` 或 `/v1/usage`，避免重复 `/v1`。
- 默认余额路径：`$.wallet.remaining`
- 默认币种：`USD`
- 默认请求头：
  - `Content-Type: application/json`
  - `User-Agent: cc-switch/1.0`
- 默认开启金额换算，除数为 `500000`。

当前通用 JSON 路径解析器只支持简单对象属性路径，不支持数组映射、条件表达式或执行自定义 JavaScript。因此 Neco 当前读取钱包余额，不会复刻 CC Switch 中优先读取 `subscription.subscriptions[]` 的完整提取逻辑。

## 项目结构

```text
packages/
├─ dsh-bundle-balance/   # Web Profile bundle 与 Cordis patch
├─ dsh-host-balance/     # 配置、凭据、请求校验、缓存和余额查询
└─ dsh-client-balance/   # 插件配置卡片、行内状态栏及供应商切换
```

Cordis 中会注册两个条目：

- `balance-host`：Host 端查询服务。
- `balance-client`：Web 客户端界面。

插件列表中出现两个 `balance` 条目是双端插件结构导致的，并非重复加载。

## 安装

前置条件：

- 已安装 `dsh` CLI。
- 已安装 `pnpm`；缺失时可执行 `npm install -g pnpm`。

在项目根目录执行一条跨平台安装命令，无需区分 Windows、macOS 或 Linux：

```bash
node ./scripts/install.mjs
```

安装脚本会一次调用 `dsh plugin add` 并传入三个本地包路径：Bundle 负责应用 `cordis.patch.yml`，Client 负责界面，Host 负责余额查询。安装完成后重启 Web 服务：

```bash
dsh web
```
Bundle 会通过 `packages/dsh-bundle-balance/cordis.patch.yml` 插入：

```yaml
- insert:
    - id: balance-host
      name: '@deepseek-ai/dsh-host-balance'
    - id: balance-client
      name: '@deepseek-ai/dsh-client-balance'
```

不需要修改 DSH 宿主源码。

## 使用

1. 打开 **设置 → 插件 → 插件配置**。
2. 展开 **余额查询**。
3. 找到模型页已有的供应商：
   - DeepSeek 或 OpenCode Go 可直接使用内置方案。
   - Neco 会带入预填配置。
   - 其他供应商可填写自定义余额接口。
4. 保存后开启状态栏。
5. 在输入框工具栏：
   - 点击供应商名称切换供应商；
   - 点击页面空白处关闭切换菜单；
   - 直接查看余额、刷新时间或全部额度窗口；
   - 点击刷新图标强制重新查询。

当前供应商选择只保存在 Web 客户端运行状态中，页面刷新后会回到接口返回的第一个已配置供应商。

## 自定义供应商字段

- **余额查询地址**：必须是公网 HTTPS 地址。
- **请求方式**：`GET` 或 `POST`。当前 `POST` 不发送请求体。
- **余额 JSON 路径**：例如 `$.data.balance`。
- **币种**：ISO 4217 三字母代码，例如 `CNY`、`USD`。
- **请求头**：按名称和值逐行添加；`Authorization` 会自动注入。
- **金额换算**：适用于接口返回额度单位而不是实际金额的情况。
- **超时时间**：1–300 秒，默认 10 秒。
- **自动查询间隔**：0–1440 分钟，默认 30 分钟；`0` 表示不复用缓存，每次刷新都重新查询。

通用余额响应示例：

```json
{
  "data": {
    "balance": 62.89
  }
}
```

对应路径：

```text
$.data.balance
```

## 凭据

插件优先复用模型页的 DSH 凭据引用。

### macOS

手动填写的 API Key 保存到 Keychain：

- Service：`dsh.balance`
- Account：`provider:<供应商 ID>`

API Key 不会写入余额配置文件，也不会由配置接口返回。

### Windows 和其他平台

当前 `SecretStore` 不支持写入系统钥匙串。建议复用模型页凭据；也可以在启动 `dsh web` 前设置环境变量：

```text
DSH_BALANCE_SECRET_<PROVIDER_ID>
```

供应商 ID 会将非字母、数字和下划线替换为 `_`，再转为大写。例如：

```text
my-provider → DSH_BALANCE_SECRET_MY_PROVIDER
```

## 配置文件

余额配置保存在：

```text
~/.dsh/balance/config.json
```

其中只保存供应商元数据、请求配置、缓存间隔和绑定信息，不保存 API Key。

## 安全限制

- 仅允许公网 HTTPS，端口必须为空或为 `443`。
- 拒绝 URL 用户名和密码。
- 拒绝回环、私网、链路本地地址，以及 `.local`、`.internal` 域名。
- 保存和实际查询时都会解析 DNS；解析结果中只要存在私网地址即拒绝请求。
- 实际 HTTPS 连接会固定到已经校验的公网 IP，并保留原域名的 Host 与 TLS SNI，防止 DNS 重绑定。
- 禁止重定向。
- 请求与响应体上限为 512 KiB。
- 请求头名称和值会进行格式与 CR/LF 注入校验。
- JSON 路径仅支持最多 8 层的简单属性访问，并拒绝原型链危险键。

## 已知限制

- 手动选择的余额供应商保存在当前浏览器标签页会话中；关闭标签页后会恢复默认选择。
- 通用 `POST` 查询暂不支持自定义请求体。
- 通用 JSON 路径不支持数组索引、过滤器、计算表达式或自定义提取函数。
- 状态栏供应商选择为手动模式，不会自动跟随当前对话模型。
- 输入框状态栏使用 `conversation.composer.dock` 插槽，配置页使用 `settings.plugin.item` 插槽，不再扫描或修改 DSH 私有 DOM。

## 开发

仓库脚本：

```bash
npm run check
npm test
```

- `npm run check`：执行 JavaScript 语法检查。
- `npm test`：运行已有的 Host 安全测试。

本项目未包含构建步骤，`lib/` 中的 JavaScript 即运行时代码。修改 Host 端后需要重启 `dsh web`；只修改 Client 端时通常刷新页面即可。

## License

当前仓库尚未声明许可证。若计划公开发布或允许他人复用，请先确定授权方式并补充明确的 `LICENSE` 文件。包内已补充基础关键词和描述；`repository`、`homepage`、`bugs`、`author` 等字段应在确认最终发布地址和作者信息后填写。
