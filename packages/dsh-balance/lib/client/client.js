window.__ModuleLoader__.load({
  id: "dsh-balance",
  factory: (require) => {
    const module = { exports: {} }; const exports = module.exports;
    const React = require("react"); const h = React.createElement;
    const inject = ["slots", "connection"];
    const state = { selectedProviderId: sessionStorage.getItem("dsh-balance:selected-provider"), providers: [], config: null, timer: null, clock: null, bar: null, style: null, provider: null, connection: null, dockListeners: new Set() };
    const OFFICIAL_PRESETS = new Set(["deepseek", "opencode-go"]);
    const refreshDue = (provider, syncedAt, now = Date.now()) => { const interval = Number(provider?.queryIntervalMinutes ?? 30); const synced = Date.parse(syncedAt || ""); return !Number.isFinite(interval) || interval <= 0 || !Number.isFinite(synced) || now - synced >= interval * 60_000; };
    const api = async (path, options) => { const res = await fetch(`/dsh-balance${path}`, { cache: "no-store", ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } }); const data = await res.json(); if (!data.ok) throw new Error(data.error || "余额查询请求失败"); return data; };
    const formatMoney = (value, currency) => { try { return new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency || "CNY", currencyDisplay: "narrowSymbol", maximumFractionDigits: 2 }).format(value); } catch { return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value); } };
    function ensureSettingsStyle() {
      const id = "dsh-balance-settings-style"; if (document.getElementById(id)) return;
      const style = document.createElement("style"); style.id = id; style.textContent = `
.db-plugin-card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3);list-style:none;transition:border-color .16s,background .16s}
        .db-plugin-card:hover{border-color:var(--dsw-alias-label-dimmed)}
        .db-plugin-card.open{border-color:var(--dsw-alias-label-dimmed);background:var(--dsw-alias-bg-layer-2)}
        .db-plugin-card-head{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;border:0;border-radius:12px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
        .db-plugin-card-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
        .db-plugin-card-title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
        .db-plugin-card-desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
        .db-plugin-card-chevron{flex:none;color:var(--dsw-alias-label-tertiary);font-size:16px;transition:transform .16s}
        .db-plugin-card.open .db-plugin-card-chevron{transform:rotate(180deg)}
        .db-plugin-card-body{margin:0 16px;padding:14px 0 16px;border-top:1px solid var(--dsw-alias-border-l2)}
        .db-settings{display:flex;flex-direction:column;gap:12px;max-width:720px;color:var(--dsw-alias-label-primary);font-family:inherit}
        .db-simple-head{display:flex;flex-direction:column;gap:12px}
        .db-simple-head h2{margin:0;font-size:16px;line-height:24px;font-weight:500;color:var(--dsw-alias-label-primary)}
        .db-simple-head p{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-tertiary)}
        .db-provider-list{display:flex;flex-direction:column;gap:8px;margin:12px 0 0;padding:0;list-style:none}
        .db-provider-row{display:flex;align-items:center;gap:10px;padding:12px 14px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:transparent}
        .db-provider-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}
        .db-live{flex:none;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-success-primary)}
        .db-live.error{background:var(--dsw-alias-state-error-primary)}
        .db-tag{flex:none;border:1px solid var(--dsw-alias-border-l3);border-radius:4px;padding:1px 6px;color:var(--dsw-alias-label-secondary);font-size:10px;line-height:15px}
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
        .db-field-help{margin:4px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
        .db-header-list{display:flex;flex-direction:column;gap:12px}
        .db-header-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 28px;gap:8px;align-items:center;padding:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:transparent}
        .db-header-row input{width:100%;height:40px;box-sizing:border-box;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:14px/22px inherit;outline:none}
        .db-header-row input:focus{border-color:var(--dsw-alias-brand-primary)}
        .db-header-remove{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
        .db-header-remove:hover{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}
        .db-header-remove svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
        .db-header-add{align-self:flex-start;height:32px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:12px/18px inherit;cursor:pointer}
        .db-header-add:hover{background:var(--dsw-alias-interactive-bg-hover)}        .db-editor{display:flex;flex-direction:column;gap:14px;padding:14px 16px;border-radius:12px;background:var(--dsw-alias-bg-module-platform)}
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
        .db-form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;padding-top:2px}.db-form-actions .db-quiet,.db-form-actions .db-primary{height:36px;min-width:72px;padding:0 16px;border-radius:18px;font-size:14px;line-height:22px}
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
        .db-inline-editor{margin-top:12px;padding:16px;border-radius:10px;background:var(--dsw-alias-bg-module-platform)}
        .db-meta-error{color:var(--dsw-alias-state-error-primary)}
        .db-bind{box-sizing:border-box;height:28px;max-width:160px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:transparent;color:var(--dsw-alias-label-secondary);padding:0 24px 0 10px;font:12px/18px inherit;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-position:right 8px center;background-repeat:no-repeat;background-size:12px 12px}
        .db-bind:hover{border-color:var(--dsw-alias-border-l3)}`;
      document.head.append(style);
    }
    const usageLabel = (type) => type === "rolling" ? "滚动用量" : type === "weekly" ? "每周用量" : "每月用量";
    const compactUsageLabel = (type) => type === "rolling" ? "滚动" : type === "weekly" ? "每周" : "每月";
    function formatResetAt(value) {
      if (!value) return "暂无重置时间";
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return String(value);
      const diff = date.getTime() - Date.now();
      if (diff <= 0) return "即将重置";
      const totalMinutes = Math.max(1, Math.ceil(diff / 60_000));
      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.floor(totalMinutes % 1440 / 60);
      const minutes = totalMinutes % 60;
      const parts = [];
      if (days) parts.push(`${days} 天`);
      if (hours) parts.push(`${hours} 小时`);
      if (!days && minutes) parts.push(`${minutes} 分钟`);
      return `重置于 ${parts.join(" ")}`;
    }
    function formatSyncedAt(value) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "";
      const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
      if (seconds < 10) return "刚刚更新";
      if (seconds < 60) return `${seconds} 秒前更新`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前更新`;
      return `${Math.floor(seconds / 3600)} 小时前更新`;
    }
    function notifyDock() {
      for (const listener of state.dockListeners) listener();
    }
    function subscribeDock(listener) {
      state.dockListeners.add(listener);
      return () => state.dockListeners.delete(listener);
    }
    function observeMenuDismissal() {
      const onDocumentPointerDown = (event) => {
        const menu = document.querySelector(".dsh-balance-provider-menu");
        if (menu && !menu.hidden && !menu.contains(event.target) && !event.target.closest?.(".dsh-balance-provider")) menu.hidden = true;
      };
      const closeOverlays = () => {
        const menu = document.querySelector(".dsh-balance-provider-menu");
        if (menu && !menu.hidden) menu.hidden = true;
      };
      window.addEventListener("resize", closeOverlays);
      window.addEventListener("scroll", closeOverlays, true);
      document.addEventListener("pointerdown", onDocumentPointerDown);
      return () => {
        window.removeEventListener("resize", closeOverlays);
        window.removeEventListener("scroll", closeOverlays, true);
        document.removeEventListener("pointerdown", onDocumentPointerDown);
      };
    }
    function BalanceDock() {
      const [, redraw] = React.useReducer(value => value + 1, 0);
      const hostRef = React.useRef(null);
      React.useEffect(() => subscribeDock(redraw), []);
      if (state.config?.statusBar) ensureBar();
      React.useLayoutEffect(() => {
        const host = hostRef.current;
        const bar = state.bar;
        if (!host || !bar) return;
        host.replaceChildren(bar);
        return () => {
          // 插槽卸载时归还状态栏 DOM，宿主会在重新挂载插槽时恢复。
          if (bar.parentElement === host) bar.remove();
        };
      });
      if (!state.config?.statusBar) return null;
      return h("span", { className: "dsh-balance-dock-host", ref: hostRef });
    }
    function ensureBar() {
      if (state.bar) return state.bar;
      state.style = document.createElement("style"); state.style.textContent = `
        .dsh-balance-dock-host{display:flex;align-items:center;justify-content:center;min-width:0;width:100%;margin-top:2px}
        .dsh-balance-status{position:relative;z-index:0;display:flex;align-items:center;justify-content:center;min-width:0;width:100%;max-width:100%;color:var(--dsw-alias-label-tertiary,#8a919b);font:12px/18px ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .dsh-balance-status *{box-sizing:border-box}
        .dsh-balance-summary{display:flex;align-items:center;justify-content:center;min-width:0;width:100%;min-height:26px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#68707b);font:inherit;white-space:nowrap}
        .dsh-balance-dot{flex:none;width:5px;height:5px;margin-right:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#21aa8b)}
        .dsh-balance-provider{min-width:0;overflow:hidden;text-overflow:ellipsis;color:inherit;cursor:pointer}
        .dsh-balance-provider:hover{color:var(--dsw-alias-label-primary,#252a31)}
        .dsh-balance-separator{flex:none;margin:0 7px;color:var(--dsw-alias-label-tertiary,#9299a2)}
        .dsh-balance-value{flex:none;color:var(--dsw-alias-label-primary,#30353c);font-weight:650;font-variant-numeric:tabular-nums}
        .dsh-balance-updated{flex:none;margin-left:8px;color:var(--dsw-alias-label-tertiary,#a0a6ae);font-size:11px}
        .dsh-balance-refresh{display:inline-flex;align-items:center;justify-content:center;flex:none;width:22px;height:22px;margin-left:5px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary,#9299a2);font:14px/1 inherit;cursor:pointer}
        .dsh-balance-refresh.loading{animation:dsh-balance-spin .7s linear infinite}.dsh-balance-refresh:disabled{cursor:wait;opacity:.65}@keyframes dsh-balance-spin{to{transform:rotate(360deg)}}
        .dsh-balance-refresh:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f1f3f5);color:var(--dsw-alias-label-primary,#25292f)}
        .dsh-balance-summary.error{color:var(--dsw-alias-state-error-primary,#d04d59)}
        .dsh-balance-summary.error .dsh-balance-dot{background:var(--dsw-alias-state-error-primary,#d04d59)}
        .dsh-balance-provider-menu{position:fixed;z-index:1001;width:230px;padding:6px;border:1px solid var(--dsw-alias-border-l2,#e1e4e8);border-radius:12px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 12px 34px rgba(26,34,46,.14)}
        .dsh-balance-provider-menu[hidden]{display:none}
        .dsh-balance-provider-option{display:flex;align-items:center;width:100%;min-height:38px;padding:7px 9px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,#25292f);font:13px/20px inherit;text-align:left;cursor:pointer}
        .dsh-balance-provider-option:hover{background:var(--dsw-alias-interactive-bg-hover,#f1f3f5)}
        .dsh-balance-provider-option.active::after{content:"✓";margin-left:auto;font-size:14px}
        .dsh-balance-provider-option .dsh-balance-dot{margin-right:9px}
        .dsh-balance-provider-option-value{margin-left:auto;color:var(--dsw-alias-label-secondary,#68707b);font-size:12px;font-weight:600}
        .dsh-balance-provider-option.active .dsh-balance-provider-option-value{margin-left:8px;margin-right:8px}
        @media (max-width:760px){.dsh-balance-updated{display:none}}
      `; document.head.append(state.style);
      const bar = document.createElement("div"); bar.className = "dsh-balance-status"; bar.setAttribute("aria-live", "polite");
      const menu = document.createElement("div"); menu.className = "dsh-balance-provider-menu"; menu.hidden = true;
      const summary = document.createElement("div"); summary.className = "dsh-balance-summary";
      summary.addEventListener("click", event => {
        const providerName = event.target.closest?.(".dsh-balance-provider");
        if (!providerName) return;
        event.stopPropagation();
        if (menu.hidden) renderProviderMenu(menu, providerName); else menu.hidden = true;
      });
      bar.append(summary); document.body.append(menu); state.bar = bar; return bar;
    }
    function renderProviderMenu(menu, anchor) {
      menu.replaceChildren();
      for (const item of state.providers) { const option = document.createElement("button"); option.type = "button"; option.className = `dsh-balance-provider-option${item.id === state.provider?.id ? " active" : ""}`; const dot = document.createElement("i"); dot.className = "dsh-balance-dot"; const label = document.createElement("span"); label.textContent = item.name; const value = document.createElement("span"); value.className = "dsh-balance-provider-option-value"; value.textContent = (item.usageWindows || []).length ? `${Math.max(...item.usageWindows.map(window => window.percent))}%` : item.status === "ok" ? formatMoney(item.available, item.currency) : "查询失败"; option.append(dot, label, value); option.addEventListener("click", event => { event.stopPropagation(); state.selectedProviderId = item.id; sessionStorage.setItem("dsh-balance:selected-provider", item.id); menu.hidden = true; refreshBar(false, false, item.id); }); menu.append(option); }
      const rect = anchor.getBoundingClientRect(); menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - 242))}px`; menu.style.bottom = `${Math.max(12, window.innerHeight - rect.top + 8)}px`; menu.hidden = false;
    }
    function renderBar(config, providers) {
      if (!config.statusBar) { state.bar?.remove(); state.bar = null; state.provider = null; notifyDock(); return; }
      const bar = ensureBar(); const selected = state.selectedProviderId && providers.some(provider => provider.id === state.selectedProviderId) ? providers.find(provider => provider.id === state.selectedProviderId) : providers[0]; const summary = bar.querySelector(".dsh-balance-summary"); state.provider = selected || null; summary.replaceChildren(); summary.className = "dsh-balance-summary";
      const put = (text, className) => { const span = document.createElement("span"); if (className) span.className = className; span.textContent = text; summary.append(span); return span; };
      const dot = document.createElement("i"); dot.className = "dsh-balance-dot"; summary.append(dot);
      if (!selected) { put("未配置余额供应商", "dsh-balance-provider"); notifyDock(); return; }
      put(selected.name, "dsh-balance-provider");
      if (selected.status !== "ok") {
        summary.classList.add("error"); put("查询失败", "dsh-balance-separator"); put(selected.error || "余额查询失败", "dsh-balance-value");
      } else {
        const windows = selected.usageWindows || [];
        if (windows.length) {
          for (const item of windows) {
            const level = item.percent >= 90 ? "danger" : item.percent >= 80 ? "warn" : "";
            put(`· ${compactUsageLabel(item.type)} `, "dsh-balance-separator");
            const value = put(`${item.percent}%`, "dsh-balance-value");
            if (level) value.classList.add(level);
          }
        } else {
          put("· 可用余额", "dsh-balance-separator"); put(formatMoney(selected.available, selected.currency), "dsh-balance-value");
        }
      }
      if (selected.syncedAt) put(formatSyncedAt(selected.syncedAt), "dsh-balance-updated");
      const refresh = document.createElement("button"); refresh.type = "button"; refresh.className = "dsh-balance-refresh"; refresh.textContent = "↻"; refresh.title = "刷新余额"; refresh.setAttribute("aria-label", "刷新余额");
      refresh.addEventListener("click", async event => { event.stopPropagation(); refresh.disabled = true; refresh.classList.add("loading"); try { await refreshBar(false, true); } finally { refresh.disabled = false; refresh.classList.remove("loading"); } });
      summary.append(refresh); notifyDock();
    }
    async function refreshBar(reloadConfig = false, force = false, providerId = null) { try { if (reloadConfig || !state.config) state.config = (await api("/config")).config; const targetId = providerId || (force ? state.provider?.id : null); const query = new URLSearchParams(); if (force) query.set("force", "1"); if (targetId) query.set("provider", targetId); const result = (await api(`/summary${query.size ? `?${query}` : ""}`)).providers; const providers = targetId ? [...state.providers.filter(provider => provider.id !== targetId), ...result] : result; state.providers = providers; const manual = state.selectedProviderId && providers.some(provider => provider.id === state.selectedProviderId) ? providers.find(provider => provider.id === state.selectedProviderId) : null; let selected = manual || providers[0]; if (!selected && providers.length) { selected = providers[0]; state.selectedProviderId = selected.id; sessionStorage.setItem("dsh-balance:selected-provider", selected.id); } else if (!selected) { state.selectedProviderId = null; sessionStorage.removeItem("dsh-balance:selected-provider"); } renderBar(state.config, providers); } catch { if (state.bar) { state.provider = { name: "余额查询", status: "error", error: "网络连接不可用" }; renderBar(state.config || { statusBar: true }, [state.provider]); } } }
    function SettingsSection() {
      try {
      const [config, setConfig] = React.useState(null); const [message, setMessage] = React.useState(""); const [messageKind, setMessageKind] = React.useState("ok"); const [statuses, setStatuses] = React.useState({}); const [editing, setEditing] = React.useState(null); const [modelProviders, setModelProviders] = React.useState([]);
      const blankForm = { id: "", name: "", endpoint: "", responsePath: "$.remaining ?? $.quota?.remaining ?? $.balance", currency: "$.unit ?? $.quota?.unit ?? \"USD\"", apiKey: "", credentialRef: "", route: "", method: "GET", headersText: "", endpointBase: "", timeoutSeconds: 10, queryIntervalMinutes: 30, conversionEnabled: false, valueDivisor: 1 };
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
        if (s.status !== "ok") return [h("span", { className: "db-meta-error" }, s.error || "查询失败")];
        const out = (s.usageWindows || []).length ? [] : [h("span", { key: "bal" }, formatMoney(s.available, s.currency))];
        for (const item of s.usageWindows || []) { const label = item.type === "rolling" ? "滚动" : item.type === "weekly" ? "本周" : "本月"; out.push(h("span", { key: item.type, title: item.resetAt ? `重置于 ${item.resetAt}` : undefined }, `${label} ${item.percent}%`)); }
        if (!(s.usageWindows || []).length) out.push(h("span", { key: "note", className: "db-meta-note" }, "仅余额"));
        return out;
      };
      if (!config) return h("div", { style: { padding: 16 } }, message || "正在加载…");
      const saveProvider = async (event) => { event.preventDefault(); try { const preset = form.preset || (form.route === "opencode-go" || form.id === "opencode-go" ? "opencode-go" : form.route === "deepseek" || form.id === "deepseek" || form.id === "deepseek-official" ? "deepseek" : ""); const body = { ...form, ...(preset ? { preset } : {}), apiKey: form.apiKey || undefined, method: form.method === "POST" ? "POST" : "GET", valueDivisor: form.conversionEnabled ? Math.max(1, Number(form.valueDivisor) || 1) : 1 }; delete body.conversionEnabled; if (body.preset) { delete body.endpoint; delete body.endpointBase; delete body.responsePath; } else if (body.endpoint && body.endpoint.startsWith("/") && body.endpointBase) body.endpoint = body.endpointBase.replace(/\/+$/, "") + body.endpoint; if (form.headersText.trim()) { try { body.headers = Object.fromEntries(form.headersText.split(/[\r\n]+/).map(line => { const at = line.indexOf(":"); return at < 1 ? [] : [line.slice(0, at).trim(), line.slice(at + 1).trim()]; }).filter(kv => kv.length === 2 && kv[0] && kv[1])); } catch { throw new Error("请求头格式有误，每行应为：名称: 值"); } } const data = await api("/provider", { method: "POST", body: JSON.stringify(body) }); let bindings = { ...(config.bindings || {}) }; if (form.route) { for (const [key, bid] of Object.entries(bindings)) if (bid === data.provider.id) delete bindings[key]; bindings[form.route] = data.provider.id; await api("/preferences", { method: "POST", body: JSON.stringify({ statusBar: config.statusBar, bindings }) }); } const saved = { ...data.provider, method: body.method, headers: body.headers || {}, ...(body.valueDivisor ? { valueDivisor: Number(body.valueDivisor) } : {}) }; const nextConfig = { ...config, providers: [...config.providers.filter(item => item.id !== data.provider.id), saved], bindings }; setConfig(nextConfig); state.config = nextConfig; setForm(blankForm); setEditing(null); setMessage(form.route ? `已保存并绑定到 ${modelProviders.find(item => item.id === form.route)?.name || form.route}` : form.credentialRef ? "供应商已保存；将复用模型页的凭据" : "供应商已保存；密钥已写入系统钥匙串"); loadSummary(); refreshBar(); } catch (error) { setMessage(error.message); setMessageKind("error"); } };
      const beginAdd = (source) => { setForm(source ? { ...blankForm, id: source.id.replace(/[^a-z0-9_-]/gi, "-").slice(0, 64), name: source.name, credentialRef: source.credentialRef, route: source.id, endpointBase: source.baseURL || "", endpoint: source.baseURL || "" } : blankForm); setEditing(source?.id || "__new"); };
      const beginPreset = (source, preset = "deepseek") => { setForm({ ...blankForm, id: source.id.replace(/[^a-z0-9_-]/gi, "-").slice(0, 64), name: source.name, credentialRef: source.credentialRef, preset, route: source.id, endpointBase: "", endpoint: "" }); setEditing(source.id); };
      const beginNeco = (source) => { const base = String(source.baseURL || "").replace(/\/+$/, ""); const endpoint = /\/v1$/i.test(base) ? "/usage" : "/v1/usage"; setForm({ ...blankForm, id: source.id.replace(/[^a-z0-9_-]/gi, "-").slice(0, 64), name: source.name, credentialRef: source.credentialRef, route: source.id, endpointBase: base, endpoint, responsePath: "$.wallet.remaining", currency: "USD", headersText: "Content-Type: application/json\nUser-Agent: cc-switch/1.0", conversionEnabled: true, valueDivisor: 500000 }); setEditing(source.id); };
      const beginEdit = (provider) => { const route = boundRoute(provider.id); const mp = modelProviders.find(m => m.id === route || m.id === provider.id); setForm({ ...provider, apiKey: "", headersText: toHeadersText(provider), method: provider.method || "GET", route, endpointBase: mp?.baseURL || "", timeoutSeconds: provider.timeoutSeconds ?? 10, queryIntervalMinutes: provider.queryIntervalMinutes ?? 30, valueDivisor: provider.valueDivisor ?? (provider.id === "neco" ? 500000 : 1), conversionEnabled: Number(provider.valueDivisor ?? (provider.id === "neco" ? 500000 : 1)) !== 1 }); setEditing(route || provider.id); };
      const remove = async (id) => { try { await api(`/provider/${encodeURIComponent(id)}`, { method: "DELETE" }); const nextConfig = { ...config, providers: config.providers.filter(item => item.id !== id), bindings: Object.fromEntries(Object.entries(config.bindings || {}).filter(([, providerId]) => providerId !== id)) }; setConfig(nextConfig); state.config = nextConfig; if (state.selectedProviderId === id) { state.selectedProviderId = null; sessionStorage.removeItem("dsh-balance:selected-provider"); } setMessage("供应商已删除"); } catch (error) { setMessage(error.message); setMessageKind("error"); } };
      const field = (key, label, type = "text", wide = false) => h("div", { className: `db-field${wide ? " wide" : ""}` }, h("label", { htmlFor: `db-${key}` }, label), h("input", { id: `db-${key}`, type: key === "endpoint" && form.endpointBase ? "text" : type, required: key !== "apiKey", min: key === "timeoutSeconds" ? 1 : key === "queryIntervalMinutes" ? 0 : undefined, max: key === "timeoutSeconds" ? 300 : key === "queryIntervalMinutes" ? 1440 : undefined, step: type === "number" ? 1 : undefined, value: form[key], onChange: event => setForm({ ...form, [key]: event.target.value }) }));
      const toHeadersText = (provider) => Object.entries(provider.headers || {}).map(([k, v]) => `${k}: ${v}`).join("\n");
      const headerRows = () => form.headersText ? form.headersText.split(/\r?\n/).map(line => { const at = line.indexOf(":"); return at < 0 ? { name: line, value: "" } : { name: line.slice(0, at).trim(), value: line.slice(at + 1).trim() }; }) : [];
      // 请求头使用结构化行编辑，保存时仍转换为原有文本格式，保持配置兼容。
      const updateHeaderRows = (rows) => setForm({ ...form, headersText: rows.map(row => `${row.name}: ${row.value}`).join("\n") });
      const headersEditor = () => { const rows = headerRows(); return h("div", { className: "db-field wide" }, h("label", null, "请求头（Authorization 自动注入，无需填写）"), h("div", { className: "db-header-list" }, rows.map((row, index) => h("div", { className: "db-header-row", key: index }, h("input", { type: "text", placeholder: "名称", value: row.name, onChange: event => { const next = [...rows]; next[index] = { ...row, name: event.target.value }; updateHeaderRows(next); } }), h("input", { type: "text", placeholder: "值", value: row.value, onChange: event => { const next = [...rows]; next[index] = { ...row, value: event.target.value }; updateHeaderRows(next); } }), h("button", { className: "db-header-remove", type: "button", title: "删除请求头", "aria-label": "删除请求头", onClick: () => updateHeaderRows(rows.filter((_, rowIndex) => rowIndex !== index)) }, h("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, h("path", { d: "M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" }))))), h("button", { className: "db-header-add", type: "button", onClick: () => updateHeaderRows([...rows, { name: "", value: "" }]) }, "+ 添加请求头"))); };
      // 编辑区内嵌在当前供应商卡片中，保持其余供应商可见并与模型设置的展开方式一致。
      const inlineEditor = () => h("div", { className: "db-inline-editor" }, h("form", { className: "db-form", onSubmit: saveProvider }, field("name", "显示名称"), form.preset === "deepseek" ? h("p", { className: "db-message db-field wide" }, "已使用 DeepSeek 官方余额接口，无需填写查询地址或字段路径。") : form.preset === "opencode-go" ? h("p", { className: "db-message db-field wide" }, "已使用 OpenCode Go 官方额度接口，自动查询 5 小时、每周和每月用量。") : [field("endpoint", form.endpointBase ? "余额查询地址（以 / 开头时将拼接基础地址）" : "余额查询 HTTPS 地址", "url", true), form.endpointBase && h("p", { className: "db-message db-field wide" }, "已复用模型页基础地址：", form.endpointBase, "，仅需在下方追加路径（如 /usage）；或保留为完整地址。" ), h("div", { className: "db-field" }, h("label", { htmlFor: "db-method" }, "请求方式"), h("select", { id: "db-method", className: "db-select", value: form.method, onChange: event => setForm({ ...form, method: event.target.value }) }, h("option", { value: "GET" }, "GET"), h("option", { value: "POST" }, "POST（无请求体）"))), field("responsePath", "余额 JSON 路径"), h("p", { className: "db-field-help" }, "支持 ?? 回退链与可选链，如 $.remaining ?? $.quota?.remaining ?? $.balance；根节点也可写作 response"), field("currency", "币种"), h("p", { className: "db-field-help" }, "可填固定币种（如 USD），或用表达式读取响应单位，如 $.unit ?? \"USD\""), h("div", { className: "db-field wide" }, h("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, h("label", null, "金额换算"), h("button", { className: `db-toggle${form.conversionEnabled ? " on" : ""}`, type: "button", "aria-pressed": form.conversionEnabled, onClick: () => setForm({ ...form, conversionEnabled: !form.conversionEnabled }) }, h("i"))), h("p", { className: "db-field-help" }, "接口返回的是额度单位而非实际金额时开启。")), form.conversionEnabled && h("div", { className: "db-field wide" }, field("valueDivisor", "换算除数", "number", true), h("p", { className: "db-field-help" }, "接口原始值 ÷ 换算除数 = 最终显示金额")), headersEditor()], !form.credentialRef && field("apiKey", "API Key（仅写入钥匙串）", "password", true), form.credentialRef && h("p", { className: "db-message db-field wide" }, "已复用模型页凭据：", form.credentialRef), field("timeoutSeconds", "超时时间（秒）", "number"), field("queryIntervalMinutes", "自动查询间隔（分钟，0 表示不自动查询）", "number"), h("div", { className: "db-form-actions" }, h("button", { className: "db-quiet", type: "button", onClick: () => setEditing(null) }, "取消"), h("button", { className: "db-primary", type: "submit" }, "保存"))));
      const providerByModel = new Map();
      for (const provider of config.providers) {
        const route = boundRoute(provider.id);
        if (route && !providerByModel.has(route)) providerByModel.set(route, provider);
        else if (!route && modelProviders.some(model => model.id === provider.id) && !providerByModel.has(provider.id)) providerByModel.set(provider.id, provider);
      }
      const mergedProviderIds = new Set([...providerByModel.values()].map(provider => provider.id));
      const providerCard = (provider, modelProvider) => { const editingKey = modelProvider?.id || boundRoute(provider.id) || provider.id; const meta = balanceMeta(provider.id); return h("div", { className: "db-provider-row db-provider-card", key: modelProvider ? `model-${modelProvider.id}` : provider.id }, h("div", { className: "db-row-line" }, h("span", { className: "db-provider-name" }, modelProvider?.name || provider.name), h("span", { className: statuses[provider.id] && statuses[provider.id].status !== "ok" ? "db-live error" : "db-live" }), h("span", { className: "db-tag" }, "已开启查询"), OFFICIAL_PRESETS.has(provider.preset) && h("span", { className: "db-tag" }, "官方内置"), !modelProvider && modelProviders.length > 0 && h("select", { className: "db-bind", value: boundRoute(provider.id), onChange: event => bindRoute(provider.id, event.target.value), title: "绑定到此模型供应商后，状态栏随所选模型显示该余额" }, h("option", { value: "" }, "未绑定模型"), modelProviders.map(mp => h("option", { key: mp.id, value: mp.id }, mp.name))), h("div", { className: "db-spacer" }), h("button", { className: "db-quiet", type: "button", onClick: () => beginEdit(provider) }, "编辑"), h("button", { className: "db-delete", type: "button", onClick: () => remove(provider.id) }, "删除")), h("div", { className: "db-row-meta" }, ...(Array.isArray(meta) ? meta : meta ? [meta] : [])), editing === editingKey && inlineEditor()); };
      const mergedRows = modelProviders.map(modelProvider => {
        const provider = providerByModel.get(modelProvider.id);
        if (provider) return providerCard(provider, modelProvider);
        const deepseek = /deepseek/i.test(`${modelProvider.id} ${modelProvider.name}`); const opencodeGo = /opencode[-_ ]?go/i.test(`${modelProvider.id} ${modelProvider.name}`); const neco = /^neco$/i.test(modelProvider.id) || /^neco$/i.test(modelProvider.name); const officialPreset = deepseek || opencodeGo;
        return h("div", { className: "db-provider-row db-provider-card", key: `model-${modelProvider.id}` }, h("div", { className: "db-row-line" }, h("span", { className: "db-provider-name" }, modelProvider.name), h("span", { className: "db-live" }), h("span", { className: "db-tag" }, "未开启查询"), officialPreset && h("span", { className: "db-tag" }, "官方内置"), h("div", { className: "db-spacer" }), h("button", { className: "db-quiet", type: "button", onClick: () => officialPreset ? beginPreset(modelProvider, opencodeGo ? "opencode-go" : "deepseek") : neco ? beginNeco(modelProvider) : beginAdd(modelProvider) }, officialPreset ? "使用官方方案" : "接入余额查询")), editing === modelProvider.id && inlineEditor());
      });
      const customRows = config.providers.filter(provider => !mergedProviderIds.has(provider.id)).map(provider => providerCard(provider));
      return h("section", { className: "db-settings" }, h("header", { className: "db-simple-head" }, h("h2", null, "供应商"), h("p", null, "优先复用“模型”页已配置的供应商和凭据。已验证官方余额/额度方案：DeepSeek、OpenCode Go；其他供应商可接入其公开 HTTPS 余额接口。")), h("div", { className: "db-provider-list" }, ...mergedRows, ...customRows), h("div", { className: "db-bottom-settings" }, h("span", null, "状态栏"), h("button", { className: `db-toggle${config.statusBar ? " on" : ""}`, "aria-pressed": config.statusBar, onClick: async () => { const statusBar = !config.statusBar; try { await api("/preferences", { method: "POST", body: JSON.stringify({ statusBar, bindings: config.bindings }) }); const nextConfig = { ...config, statusBar }; setConfig(nextConfig); state.config = nextConfig; setMessage(""); refreshBar(); } catch (error) { setMessage(error.message); setMessageKind("error"); } } }, h("i")), h("div", { className: "db-spacer" }), h("button", { className: "db-quiet", type: "button", onClick: () => { loadSummary(); refreshBar(); } }, "刷新")), message && h("p", { className: messageKind === "error" ? "db-message error" : "db-message", role: "status" }, message));
    } catch (error) { try { window.__balanceSectionError = (error && error.stack) || String(error); } catch {} return h("div", { className: "db-settings" }, h("p", { className: "db-message error" }, "余额查询分区渲染失败: " + String((error && error.message) || error))); }
    }
function BalancePluginCard() {
      const [open, setOpen] = React.useState(false);
      return h("li", { className: `db-plugin-card${open ? " open" : ""}` },
        h("button", { className: "db-plugin-card-head", type: "button", "aria-expanded": open, onClick: () => setOpen(!open) },
          h("span", { className: "db-plugin-card-copy" },
            h("span", { className: "db-plugin-card-title" }, "余额查询"),
            h("span", { className: "db-plugin-card-desc" }, "查询并展示模型供应商的余额与额度。")
          ),
          h("span", { className: "db-plugin-card-chevron", "aria-hidden": "true" }, "⌄")
        ),
        open && h("div", { className: "db-plugin-card-body" }, h(SettingsSection))
      );
    }
    function apply(ctx) {
      state.connection = ctx.get("connection");
      ensureSettingsStyle();
      ctx.effect(() => { const refreshIfDue = () => { if (document.visibilityState !== "visible") return; const provider = state.provider; if (!provider || refreshDue(provider, provider.syncedAt)) refreshBar(false, false, provider?.id); else renderBar(state.config || { statusBar: true }, state.providers); }; const onVisibilityChange = () => { if (document.visibilityState === "visible") refreshIfDue(); }; refreshIfDue(); state.timer = setInterval(refreshIfDue, 30_000); state.clock = setInterval(() => { if (document.visibilityState === "visible" && state.provider) renderBar(state.config || { statusBar: true }, state.providers); }, 30_000); document.addEventListener("visibilitychange", onVisibilityChange); const stopObserving = observeMenuDismissal(); return () => { clearInterval(state.timer); clearInterval(state.clock); document.removeEventListener("visibilitychange", onVisibilityChange); stopObserving(); state.bar?.remove(); document.querySelector(".dsh-balance-provider-menu")?.remove(); state.style?.remove(); state.bar = state.style = state.provider = null; state.dockListeners.clear(); }; }, "dsh-balance: status bar");
      // 使用 DSH composer dock 插槽，由宿主负责状态栏挂载与会话切换，不再扫描页面 DOM。
      ctx.effect(() => ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({ name: "conversation.composer.dock", id: "dsh-balance", order: 40 }, BalanceDock)), "dsh-balance: composer dock");
      ctx.effect(() => ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({ name: "settings.plugin.item", id: "dsh-balance", order: 40, label: () => "余额查询" }, BalancePluginCard)), "dsh-balance: settings");
    }
    exports.apply = apply; exports.inject = inject; return module.exports;
  }
});
