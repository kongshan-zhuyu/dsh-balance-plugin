window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-client-balance",
  factory: (require) => {
    const module = { exports: {} }; const exports = module.exports;
    const React = require("react"); const h = React.createElement;
    const inject = ["slots", "connection", "remote"];
    const state = { modelKey: null, timer: null, bar: null, style: null, connection: null, remote: null };
    const api = async (path, options) => { const res = await fetch(`/dsh-balance${path}`, { cache: "no-store", ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } }); const data = await res.json(); if (!data.ok) throw new Error(data.error || "余额查询请求失败"); return data; };
    const formatMoney = (value, currency) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency || "CNY", maximumFractionDigits: 2 }).format(value);
    function ensureSettingsStyle() {
      const id = "dsh-balance-settings-style"; if (document.getElementById(id)) return;
      const style = document.createElement("style"); style.id = id; style.textContent = `
        .db-settings{display:flex;flex-direction:column;gap:12px;max-width:720px;color:var(--dsw-alias-label-primary);font-family:inherit}
        .db-simple-head{display:flex;flex-direction:column;gap:12px}
        .db-simple-head h2{margin:0;font-size:16px;line-height:24px;font-weight:500;color:var(--dsw-alias-label-primary)}
        .db-simple-head p{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-tertiary)}
        .db-provider-list{display:flex;flex-direction:column;gap:8px;margin:12px 0 0;padding:0;list-style:none}
        .db-provider-row{display:flex;align-items:center;gap:10px;padding:12px 14px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:transparent}
        .db-provider-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}
        .db-live{flex:none;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-success-primary)}
        .db-live.error{background:var(--dsw-alias-state-error-primary)}
        .db-tag{flex:none;border:1px solid var(--dsw-alias-border-l3);border-radius:4px;padding:1px 6px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px}
        .db-spacer{flex:1}
        .db-quiet,.db-primary{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 14px;border-radius:18px;font:inherit;font-size:14px;line-height:22px;cursor:pointer}
        .db-quiet{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary)}
        .db-quiet:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-solid)}
        .db-delete{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 14px;border:0;border-radius:18px;background:transparent;color:var(--dsw-alias-state-error-primary);font:14px/22px inherit;cursor:pointer}
        .db-delete:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}
        .db-provider-row .db-quiet,.db-provider-row .db-delete{height:28px;padding:0 10px;border-radius:14px;font-size:12px;line-height:18px}
        .db-quiet:disabled,.db-primary:disabled,.db-delete:disabled,.db-add:disabled,.db-back:disabled{opacity:.4;cursor:default}
        .db-quiet:focus-visible,.db-primary:focus-visible,.db-delete:focus-visible,.db-add:focus-visible,.db-back:focus-visible,.db-select:focus-visible,.db-toggle:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3);outline:none}
        .db-add-grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:0}
        .db-add{flex:1 1 0;min-width:180px;height:44px;box-sizing:border-box;border:1px dashed var(--dsw-alias-border-l3);border-radius:12px;background:transparent;color:var(--dsw-alias-label-primary);font:14px/22px inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}
        .db-add:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}
        .db-bottom-settings{display:flex;align-items:center;gap:10px;margin-top:0;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
        .db-select{box-sizing:border-box;height:32px;max-width:240px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:0 32px 0 10px;font:14px/22px inherit;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-position:right 12px center;background-repeat:no-repeat;background-size:12px 12px}
        .db-select:focus{border-color:var(--dsw-alias-brand-primary);outline:none}
        .db-toggle{width:32px;height:18px;border:0;border-radius:9px;background:var(--dsw-alias-bg-overlay);padding:2px;cursor:pointer;flex:none}
        .db-toggle i{display:block;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s var(--ds-ease-in-out)}
        .db-toggle.on{background:var(--dsw-alias-button-info-fill)}
        .db-toggle.on i{transform:translateX(14px)}
        .db-editor{display:flex;flex-direction:column;gap:14px;padding:14px 16px;border-radius:12px;background:var(--dsw-alias-bg-module-platform)}
        .db-editor-head{display:flex;align-items:center;gap:8px}
        .db-editor-head h3{margin:0;font-size:14px;line-height:22px;font-weight:500}
        .db-back{box-sizing:border-box;display:inline-flex;align-items:center;height:28px;padding:0 10px;border:0;border-radius:14px;background:transparent;color:var(--dsw-alias-label-tertiary);font:12px/18px inherit;cursor:pointer}
        .db-back:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
        .db-form{display:grid;grid-template-columns:1fr;gap:14px}
        .db-field{display:flex;flex-direction:column;gap:6px}
        .db-field.wide{grid-column:1/-1}
        .db-field label{font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;gap:10px}
        .db-field input{box-sizing:border-box;height:32px;width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:0 10px;font:14px/22px inherit;outline:none}
        .db-field input:focus{border-color:var(--dsw-alias-brand-primary)}
        .db-field input::placeholder{color:var(--dsw-alias-label-dimmed)}
        .db-field input:disabled{opacity:.6;cursor:default}
        .db-form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;padding-top:2px}
        .db-primary{border:0;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
        .db-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
        .db-message{margin:0;color:var(--dsw-alias-state-success-primary);font-size:12px;line-height:18px}
        .db-message.error{color:var(--dsw-alias-state-error-primary)}
        @media(max-width:640px){.db-provider-row .db-delete{padding:0 6px}.db-bottom-settings{flex-wrap:wrap}}
        @media (prefers-reduced-motion:reduce){.db-toggle i{transition:none}}
        .db-provider-card{flex-direction:column;align-items:stretch;gap:0;padding:12px 14px}
        .db-row-line{display:flex;align-items:center;gap:10px;min-width:0}
        .db-row-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;min-width:0;padding-top:8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
        .db-row-meta .db-meta-note{color:var(--dsw-alias-label-caption)}
        .db-meta-error{color:var(--dsw-alias-state-error-primary)}
        .db-bind{box-sizing:border-box;height:28px;max-width:160px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:transparent;color:var(--dsw-alias-label-secondary);padding:0 24px 0 10px;font:12px/18px inherit;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-position:right 8px center;background-repeat:no-repeat;background-size:12px 12px}
        .db-bind:hover{border-color:var(--dsw-alias-border-l3)}`;
      document.head.append(style);
    }
    async function readActiveModel() {
      const connection = state.connection; if (!connection) return null;
      try {
        const list = await connection.api.sessions.list({});
        if (!list.result.ok || !Array.isArray(list.result.value.items) || !list.result.value.items.length) return null;
        const items = list.result.value.items;
        const session = items.find(s => s.running && !s.blank) || items.find(s => !s.blank) || items[0];
        if (!session) return null;
        const dir = await connection.api.sessions.models({ sessionId: session.sessionId });
        const current = dir.result?.ok ? dir.result.value?.current : null;
        if (!current || typeof current.provider !== "string" || typeof current.model !== "string") return null;
        return `${current.provider}/${current.model}`;
      } catch { return null; }
    }
    function ensureBar() {
      if (state.bar) return state.bar;
      state.style = document.createElement("style"); state.style.textContent = ".dsh-balance-status{position:fixed;z-index:9999;right:12px;bottom:10px;display:flex;align-items:center;gap:0;max-width:calc(100vw - 24px);overflow:auto;border:1px solid var(--dsw-alias-border-l2,#3a4b5c);border-radius:8px;background:var(--dsw-alias-bg-base,#101821);box-shadow:0 5px 20px #0004;color:var(--dsw-alias-label-secondary,#9eb0c1);font:12px ui-sans-serif,system-ui}.dsh-balance-status button{background:transparent;border:0;border-left:1px solid var(--dsw-alias-border-l2,#3a4b5c);padding:8px 10px;white-space:nowrap;color:inherit;font:inherit;cursor:pointer}.dsh-balance-status button:first-child{border-left:0}.dsh-balance-status .db-ok{color:#37bea9}.dsh-balance-status .db-warn{color:#e4a63a}.dsh-balance-status .db-error{color:#e36d75}"; document.head.append(state.style);
      const bar = document.createElement("div"); bar.className = "dsh-balance-status"; bar.setAttribute("aria-live", "polite"); bar.addEventListener("click", () => { refreshBar(); window.dispatchEvent(new CustomEvent("dsh-balance:open")); }); document.body.append(bar); state.bar = bar; return bar;
    }
    function renderBar(config, providers) {
      if (!config.statusBar) { state.bar?.remove(); state.bar = null; return; }
      const bar = ensureBar(); const selected = providers[0]; bar.replaceChildren();
      const put = (text, className = "", title = "") => { const button = document.createElement("button"); button.textContent = text; if (className) button.className = className; if (title) button.title = title; bar.append(button); };
      if (!selected) return put(providers.length ? "余额查询 · 无匹配供应商" : "余额查询 · 未配置供应商");
      if (selected.status !== "ok") return put(`${selected.name} · 查询失败 · ${selected.error || ""}`, "db-error");
      const route = state.modelKey || selected.name;
      put(`● ${route}`, "db-ok");
      for (const item of selected.usageWindows || []) { const label = item.type === "rolling" ? "滚动" : item.type === "weekly" ? "本周" : "本月"; put(`${label} ${item.percent}%`, item.percent >= 90 ? "db-error" : item.percent >= 80 ? "db-warn" : "", item.resetAt ? `重置于 ${item.resetAt}` : ""); }
      if (!(selected.usageWindows || []).length) put(formatMoney(selected.available, selected.currency));
    }
    async function refreshBar() { try { const config = (await api("/config")).config; state.modelKey = await readActiveModel(); const providers = (await api(`/summary${state.modelKey ? `?model=${encodeURIComponent(state.modelKey)}` : ""}`)).providers; renderBar(config, providers); } catch { if (state.bar) state.bar.textContent = "余额查询 · 离线"; } }
    function SettingsSection() {
      try {
      const [config, setConfig] = React.useState(null); const [message, setMessage] = React.useState(""); const [messageKind, setMessageKind] = React.useState("ok"); const [statuses, setStatuses] = React.useState({}); const [editing, setEditing] = React.useState(false); const [modelProviders, setModelProviders] = React.useState([]);
      const blankForm = { id: "", name: "", endpoint: "", responsePath: "$.data.balance", currency: "CNY", apiKey: "", credentialRef: "", route: "", method: "GET", headersText: "", endpointBase: "" };
      const [form, setForm] = React.useState(blankForm);
      const loadSummary = () => api("/summary").then(data => setStatuses(Object.fromEntries(data.providers.map(p => [p.id, p])))).catch(() => {}); React.useEffect(() => { api("/config").then(data => setConfig(data.config)).catch(error => { setMessage(error.message); setMessageKind("error"); }); loadSummary(); }, []);
      React.useEffect(() => { const connection = state.connection; if (!connection) return; Promise.all([connection.api.llm.providers({}), connection.api.settings.describe({})]).then(([directory, settings]) => { if (!directory.result.ok || !settings.result.ok) throw new Error("无法读取模型供应商"); const namespaces = new Map(settings.result.value.namespaces.map(item => [item.ns, item])); const atPath = (value, path) => path.reduce((current, key) => current && typeof current === "object" ? current[key] : undefined, value); setModelProviders(directory.result.value.providers.filter(entry => { const namespace = namespaces.get(entry.settingsNs); return entry.active && namespace && (entry.settingsPath.length === 0 || atPath(namespace.value, entry.settingsPath) !== undefined); }).map(entry => { const namespace = namespaces.get(entry.settingsNs); const profile = atPath(namespace.value, entry.settingsPath) || namespace.value; return { id: entry.provider, name: entry.displayName || entry.provider, credentialRef: typeof profile?.apiKeyEnv === "string" ? profile.apiKeyEnv : "", baseURL: typeof profile?.baseURL === "string" ? profile.baseURL : "" }; })); }).catch(() => setModelProviders([])); }, []);
      const boundRoute = (id) => Object.entries(config?.bindings || {}).find(([, bid]) => bid === id)?.[0] || "";
      const bindRoute = async (id, route) => {
        const next = { ...(config.bindings || {}) };
        for (const [key, bid] of Object.entries(next)) if (bid === id) delete next[key];
        if (route) next[route] = id;
        try { await api("/preferences", { method: "POST", body: JSON.stringify({ statusBar: config.statusBar, bindings: next }) }); setConfig({ ...config, bindings: next }); setMessage(route ? `已绑定到 ${route}` : "已解除绑定"); loadSummary(); refreshBar(); } catch (error) { setMessage(error.message); setMessageKind("error"); }
      };
      const balanceMeta = (id) => {
        const s = statuses[id]; if (!s) return null;
        if (s.status !== "ok") return h("span", { className: "db-meta-error" }, s.error || "查询失败");
        const out = [h("span", { key: "bal" }, formatMoney(s.available, s.currency))];
        for (const item of s.usageWindows || []) { const label = item.type === "rolling" ? "滚动" : item.type === "weekly" ? "本周" : "本月"; out.push(h("span", { key: item.type, title: item.resetAt ? `重置于 ${item.resetAt}` : undefined }, `${label} ${item.percent}%`)); }
        if (!(s.usageWindows || []).length) out.push(h("span", { key: "note", className: "db-meta-note" }, "仅余额"));
        return out;
      };
      if (!config) return h("div", { style: { padding: 16 } }, message || "正在加载…");
      const save = async () => { try { await api("/preferences", { method: "POST", body: JSON.stringify({ statusBar: config.statusBar, bindings: config.bindings }) }); setMessage("已保存"); refreshBar(); } catch (error) { setMessage(error.message); setMessageKind("error"); } };
      const saveProvider = async (event) => { event.preventDefault(); try { const body = { ...form, apiKey: form.apiKey || undefined, method: form.method === "POST" ? "POST" : "GET" }; if (body.endpoint && body.endpoint.startsWith("/") && body.endpointBase) body.endpoint = body.endpointBase.replace(/\/+$/, "") + body.endpoint; if (form.headersText.trim()) { try { body.headers = Object.fromEntries(form.headersText.split(/[\r\n]+/).map(l => l.split(":").map(s => s.trim())).filter(kv => kv.length === 2 && kv[0] && kv[1])); } catch { throw new Error("请求头格式有误，每行应为：名称: 值"); } } const data = await api("/provider", { method: "POST", body: JSON.stringify(body) }); let bindings = { ...(config.bindings || {}) }; if (form.route) { for (const [key, bid] of Object.entries(bindings)) if (bid === data.provider.id) delete bindings[key]; bindings[form.route] = data.provider.id; await api("/preferences", { method: "POST", body: JSON.stringify({ statusBar: config.statusBar, bindings }) }); } const saved = { ...data.provider, method: body.method, headers: body.headers || {} }; setConfig({ ...config, providers: [...config.providers.filter(item => item.id !== data.provider.id), saved], bindings }); setForm(blankForm); setEditing(false); setMessage(form.route ? `已接入并绑定到 ${form.route}` : form.credentialRef ? "供应商已保存；将复用模型页的凭据" : "供应商已保存；密钥已写入系统钥匙串"); loadSummary(); refreshBar(); } catch (error) { setMessage(error.message); setMessageKind("error"); } };
      const beginAdd = (source) => { setForm(source ? { ...blankForm, id: source.id.replace(/[^a-z0-9_-]/gi, "-").slice(0, 64), name: source.name, credentialRef: source.credentialRef, route: source.id, endpointBase: source.baseURL || "", endpoint: source.baseURL || "" } : blankForm); setEditing(true); };
      const beginPreset = (source) => { setForm({ ...blankForm, id: source.id.replace(/[^a-z0-9_-]/gi, "-").slice(0, 64), name: source.name, credentialRef: source.credentialRef, preset: "deepseek", route: source.id, endpointBase: source.baseURL || "", endpoint: source.baseURL || "" }); setEditing(true); };
      const beginEdit = (provider) => { const mp = modelProviders.find(m => m.id === provider.id); setForm({ ...provider, apiKey: "", headersText: toHeadersText(provider), method: provider.method || "GET", route: "", endpointBase: mp?.baseURL || "" }); setEditing(true); };
      const remove = async (id) => { try { await api(`/provider/${encodeURIComponent(id)}`, { method: "DELETE" }); setConfig({ ...config, providers: config.providers.filter(item => item.id !== id) }); setMessage("供应商已删除"); } catch (error) { setMessage(error.message); setMessageKind("error"); } };
      const field = (key, label, type = "text", wide = false) => h("div", { className: `db-field${wide ? " wide" : ""}` }, h("label", { htmlFor: `db-${key}` }, label), h("input", { id: `db-${key}`, type, required: key !== "apiKey", value: form[key], onChange: event => setForm({ ...form, [key]: event.target.value }) }));
      const toHeadersText = (provider) => Object.entries(provider.headers || {}).map(([k, v]) => `${k}: ${v}`).join("\n");
      if (editing) return h("section", { className: "db-settings" }, h("div", { className: "db-editor" }, h("div", { className: "db-editor-head" }, h("button", { className: "db-back", onClick: () => setEditing(false) }, "← 返回供应商列表"), h("div", { className: "db-spacer" }), h("h3", null, form.preset === "deepseek" ? "DeepSeek 官方余额查询" : form.id ? "配置余额查询" : "添加供应商")), h("form", { className: "db-form", onSubmit: saveProvider }, field("id", "标识，例如 my-relay"), field("name", "显示名称"), form.preset === "deepseek" ? h("p", { className: "db-message db-field wide" }, "已使用 DeepSeek 官方余额接口，无需填写查询地址或字段路径。") : [field("endpoint", form.endpointBase ? "余额查询地址（以 / 开头时将拼接基础地址）" : "余额查询 HTTPS 地址", "url", true), form.endpointBase && h("p", { className: "db-message db-field wide" }, "已复用模型页基础地址：", form.endpointBase, "，仅需在下方追加路径（如 /usage）；或保留为完整地址。" ), h("div", { className: "db-field" }, h("label", { htmlFor: "db-method" }, "请求方式"), h("select", { id: "db-method", className: "db-select", value: form.method, onChange: event => setForm({ ...form, method: event.target.value }) }, h("option", { value: "GET" }, "GET"), h("option", { value: "POST" }, "POST"))), field("responsePath", "余额 JSON 路径"), field("currency", "币种"), h("div", { className: "db-field wide" }, h("label", { htmlFor: "db-headers" }, "请求头（每行一个：名称: 值；Authorization 自动注入，无需填写）"), h("textarea", { id: "db-headers", className: "db-input db-textarea", rows: 2, placeholder: "User-Agent: cc-switch/1.0", value: form.headersText, onChange: event => setForm({ ...form, headersText: event.target.value }) }))], !form.credentialRef && field("apiKey", "API Key（仅写入钥匙串）", "password", true), form.credentialRef && h("p", { className: "db-message db-field wide" }, "已复用模型页凭据：", form.credentialRef), h("div", { className: "db-form-actions" }, h("button", { className: "db-quiet", type: "button", onClick: () => setEditing(false) }, "取消"), h("button", { className: "db-primary", type: "submit" }, "保存供应商")))), message && h("p", { className: messageKind === "error" ? "db-message error" : "db-message", role: "status" }, message));
      return h("section", { className: "db-settings" }, h("header", { className: "db-simple-head" }, h("h2", null, "供应商"), h("p", null, "优先复用“模型”页已配置的供应商和凭据；已支持 DeepSeek 官方余额查询。")), modelProviders.length > 0 && h("div", { className: "db-provider-list" }, modelProviders.map(provider => h("div", { className: "db-provider-row", key: `model-${provider.id}` }, h("span", { className: "db-provider-name" }, provider.name), h("span", { className: "db-live" }), h("span", { className: "db-tag" }, /deepseek/i.test(`${provider.id} ${provider.name}`) ? "官方预设" : "模型页"), h("div", { className: "db-spacer" }), h("button", { className: "db-quiet", onClick: () => /deepseek/i.test(`${provider.id} ${provider.name}`) ? beginPreset(provider) : beginAdd(provider) }, /deepseek/i.test(`${provider.id} ${provider.name}`) ? "使用官方方案" : "接入余额查询")))), h("div", { className: "db-provider-list" }, config.providers.map(provider => h("div", { className: "db-provider-row db-provider-card", key: provider.id }, h("div", { className: "db-row-line" }, h("span", { className: "db-provider-name" }, provider.name), h("span", { className: statuses[provider.id] && statuses[provider.id].status !== "ok" ? "db-live error" : "db-live" }), h("span", { className: "db-tag" }, provider.preset === "deepseek" ? "官方预设" : provider.credentialRef ? "复用凭据" : "自定义"), modelProviders.length > 0 && h("select", { className: "db-bind", value: boundRoute(provider.id), onChange: event => bindRoute(provider.id, event.target.value), title: "绑定到此模型供应商后，状态栏随所选模型显示该余额" }, h("option", { value: "" }, "未绑定模型"), modelProviders.map(mp => h("option", { key: mp.id, value: mp.id }, mp.name))), h("div", { className: "db-spacer" }), h("button", { className: "db-quiet", onClick: () => beginEdit(provider) }, "编辑"), h("button", { className: "db-delete", onClick: () => remove(provider.id) }, "删除")), h("div", { className: "db-row-meta" }, ...(balanceMeta(provider.id) || [])))), h("div", { className: "db-add-grid" }, h("button", { className: "db-add", onClick: () => beginAdd() }, "＋ 添加自定义供应商")), h("div", { className: "db-bottom-settings" }, h("span", null, "状态栏"), h("button", { className: `db-toggle${config.statusBar ? " on" : ""}`, "aria-pressed": config.statusBar, onClick: () => setConfig({ ...config, statusBar: !config.statusBar }) }, h("i")), h("div", { className: "db-spacer" }), h("button", { className: "db-quiet", onClick: () => { loadSummary(); refreshBar(); } }, "刷新"), h("button", { className: "db-primary", onClick: save }, "保存")), message && h("p", { className: messageKind === "error" ? "db-message error" : "db-message", role: "status" }, message)));
    } catch (error) { try { window.__balanceSectionError = (error && error.stack) || String(error); } catch {} return h("div", { className: "db-settings" }, h("p", { className: "db-message error" }, "余额查询分区渲染失败: " + String((error && error.message) || error))); }
    }
    function installModelBridge() {
      const onModelChange = (event) => { if (typeof event.detail?.model === "string") { state.modelKey = event.detail.model; refreshBar(); } };
      window.addEventListener("dsh-balance:model-change", onModelChange);
      const disposers = [() => window.removeEventListener("dsh-balance:model-change", onModelChange)];
      if (state.remote && typeof state.remote.$on === "function") disposers.push(state.remote.$on("llm/adapters-updated", () => refreshBar()));
      return () => { for (const dispose of disposers) dispose(); };
    }
    function apply(ctx) {
      state.connection = ctx.get("connection"); state.remote = ctx.get("remote");
      ensureSettingsStyle();
      ctx.effect(() => { refreshBar(); state.timer = setInterval(refreshBar, 30_000); const dispose = installModelBridge(); return () => { clearInterval(state.timer); dispose(); state.bar?.remove(); state.style?.remove(); state.bar = state.style = null; }; }, "dsh-balance: status bar");
      ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "dsh-balance", order: 40, label: () => "余额查询" }, SettingsSection)), "dsh-balance: settings");
    }
    exports.apply = apply; exports.inject = inject; return module.exports;
  }
});
