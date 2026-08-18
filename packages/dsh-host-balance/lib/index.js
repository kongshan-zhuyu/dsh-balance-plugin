import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import dns from "node:dns/promises";
import { SecretStore } from "./security.js";

export const name = "balance-host";
export const inject = ["webServer", "credentials"];
const CONFIG_FILE = join(homedir(), ".dsh", "balance", "config.json");
const MAX_BODY = 512 * 1024;
const REQUEST_TIMEOUT = 8000;
const CACHE_MS = 30_000;
const cache = new Map();
const secrets = new SecretStore();

const DEFAULT_CONFIG = { version: 1, theme: "system", statusBar: true, bindings: {}, providers: [] };
const badHost = /(^localhost$|\.local$|\.internal$)/i;
function privateIp(ip) {
  return ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd") || /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip);
}
function json(value, status, body) {
  const raw = JSON.stringify(body);
  value.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  value.end(raw);
}
function isId(value) { return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(value); }
function isCredentialRef(value) { return typeof value === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value); }
function safePath(value) { return typeof value === "string" && /^\$(?:\.[A-Za-z_$][A-Za-z0-9_$]*){1,8}$/.test(value) && !/(?:__proto__|constructor|prototype)/.test(value); }
function safeHeaders(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (!/^[A-Za-z0-9-]{1,64}$/.test(key) || /^(host|content-length|connection|proxy-)/i.test(key)) throw new Error("unsafe header");
    if (typeof val !== "string" || val.length > 512 || /[\r\n]/.test(val)) throw new Error("unsafe header value");
    out[key] = val;
  }
  return out;
}
async function publicEndpoint(raw) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443" || badHost.test(url.hostname)) throw new Error("endpoint must be public HTTPS");
  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => privateIp(record.address))) throw new Error("endpoint resolves to a private address");
  return url.toString();
}
export async function validateProvider(input) {
  if (!input || !isId(input.id) || typeof input.name !== "string" || input.name.length < 1 || input.name.length > 80) throw new Error("invalid provider identity");
  if (input.preset === "deepseek") return { id: input.id, name: input.name.trim(), endpoint: "https://api.deepseek.com/user/balance", method: "GET", responsePath: "$.balance_infos", currency: "CNY", auth: "bearer", authHeader: "Authorization", headers: {}, usageWindows: [], preset: "deepseek", ...(isCredentialRef(input.credentialRef) ? { credentialRef: input.credentialRef } : {}) };
  if (!safePath(input.responsePath)) throw new Error("responsePath must be a simple JSON path such as $.data.balance");
  const endpoint = await publicEndpoint(input.endpoint);
  const usageWindows = Array.isArray(input.usageWindows) ? input.usageWindows.slice(0, 3).map((item) => {
    if (!item || !["rolling", "weekly", "monthly"].includes(item.type) || !safePath(item.percentPath) || !safePath(item.resetAtPath)) throw new Error("invalid usage window");
    return { type: item.type, percentPath: item.percentPath, resetAtPath: item.resetAtPath };
  }) : [];
  return { id: input.id, name: input.name.trim(), endpoint, method: input.method === "POST" ? "POST" : "GET", responsePath: input.responsePath, currency: typeof input.currency === "string" && /^[A-Z]{3}$/.test(input.currency) ? input.currency : "CNY", auth: input.auth === "header" ? "header" : "bearer", authHeader: input.auth === "header" && /^[A-Za-z0-9-]{1,64}$/.test(input.authHeader) ? input.authHeader : "Authorization", headers: safeHeaders(input.headers), usageWindows, ...(isCredentialRef(input.credentialRef) ? { credentialRef: input.credentialRef } : {}) };
}
export function readJsonPath(data, path) {
  if (!safePath(path)) throw new Error("unsafe JSON path");
  return path.slice(2).split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, data);
}
export function redactProvider(provider) { const { apiKey, ...safe } = provider; return safe; }
async function loadConfig() { try { return { ...DEFAULT_CONFIG, ...JSON.parse(await readFile(CONFIG_FILE, "utf8")) }; } catch { return structuredClone(DEFAULT_CONFIG); } }
async function saveConfig(config) { await mkdir(dirname(CONFIG_FILE), { recursive: true, mode: 0o700 }); await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: "utf8", mode: 0o600 }); }
function body(req) { return new Promise((resolve, reject) => { const parts=[]; let size=0; req.on("data", part=>{ size+=part.length; if(size>MAX_BODY){reject(new Error("request body too large"));req.destroy();} else parts.push(part); }); req.on("end",()=>{try{resolve(JSON.parse(Buffer.concat(parts).toString("utf8")))}catch{reject(new Error("invalid JSON"))}}); req.on("error",reject); }); }
async function query(provider, credentials) {
  const existing = cache.get(provider.id); if (existing && Date.now() - existing.at < CACHE_MS) return existing.value;
  const inherited = provider.credentialRef ? await credentials.resolve(provider.credentialRef) : undefined;
  const secret = inherited?.value || await secrets.get(provider.id); if (!secret) throw new Error("credential is missing in DSH credentials or the system keychain");
  const headers = { accept: "application/json", ...provider.headers }; headers[provider.authHeader] = provider.auth === "bearer" ? `Bearer ${secret}` : secret;
  const response = await fetch(provider.endpoint, { method: provider.method, headers, redirect: "error", signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
  if (!response.ok) throw new Error(`provider returned HTTP ${response.status}`);
  const contentLength = Number(response.headers.get("content-length") || 0); if (contentLength > MAX_BODY) throw new Error("provider response too large");
  const text = await response.text(); if (Buffer.byteLength(text) > MAX_BODY) throw new Error("provider response too large");
  let data; try { data = JSON.parse(text); } catch { throw new Error("provider returned invalid JSON"); }
  const deepSeekBalance = provider.preset === "deepseek" && Array.isArray(data.balance_infos) ? data.balance_infos.find((item) => item?.currency === provider.currency) || data.balance_infos[0] : undefined;
  const available = Number(deepSeekBalance?.total_balance ?? readJsonPath(data, provider.responsePath)); if (!Number.isFinite(available)) throw new Error("balance response does not contain a numeric value");
  const usageWindows = provider.usageWindows.map((window) => ({ type: window.type, percent: Math.max(0, Math.min(100, Number(readJsonPath(data, window.percentPath)) || 0)), resetAt: String(readJsonPath(data, window.resetAtPath) || "") }));
  const value = { id: provider.id, name: provider.name, available, currency: provider.currency, usageWindows, syncedAt: new Date().toISOString(), status: "ok" };
  cache.set(provider.id, { at: Date.now(), value }); return value;
}
export function resolveBinding(config, model) {
  if (typeof model !== "string" || model.length === 0) return undefined;
  return config.bindings[model] || config.bindings[model.split("/")[0]];
}
async function summary(config, model, credentials) { const providerId = resolveBinding(config, model); const providers = providerId ? config.providers.filter((p) => p.id === providerId) : config.providers; return Promise.all(providers.map(async p => { try { return await query(p, credentials); } catch (error) { return { id:p.id, name:p.name, status:"error", error: error instanceof Error ? error.message : "request failed" }; } })); }
export function apply(ctx) {
  const registration = {
    kind: "prefix",
    path: "/dsh-balance",
    handler: async (req, res) => {
    try { const url = new URL(req.url || "/", "http://local"); const config = await loadConfig();
      if (req.method === "GET" && url.pathname === "/dsh-balance/config") return json(res, 200, { ok:true, config:{ ...config, providers:config.providers.map(redactProvider) } });
      if (req.method === "GET" && url.pathname === "/dsh-balance/summary") return json(res, 200, { ok:true, providers:await summary(config, url.searchParams.get("model"), ctx.credentials) });
      if (req.method === "POST" && url.pathname === "/dsh-balance/provider") { const input=await body(req); const provider=await validateProvider(input); if(typeof input.apiKey === "string" && input.apiKey.length > 0) await secrets.set(provider.id,input.apiKey); config.providers=[...config.providers.filter(p=>p.id!==provider.id),provider]; await saveConfig(config); cache.delete(provider.id); return json(res,200,{ok:true,provider:redactProvider(provider)}); }
      if (req.method === "POST" && url.pathname === "/dsh-balance/preferences") { const input=await body(req); config.statusBar=typeof input.statusBar === "boolean"?input.statusBar:config.statusBar; config.bindings=input.bindings && typeof input.bindings === "object" && !Array.isArray(input.bindings)?Object.fromEntries(Object.entries(input.bindings).filter(([model,id])=>typeof model==="string"&&/^[A-Za-z0-9][A-Za-z0-9_./-]{0,63}$/.test(model)&&isId(id)&&config.providers.some(p=>p.id===id))):config.bindings; await saveConfig(config); return json(res,200,{ok:true}); }
      if (req.method === "DELETE" && url.pathname.startsWith("/dsh-balance/provider/")) { const id=decodeURIComponent(url.pathname.slice("/dsh-balance/provider/".length)); if(!isId(id)) return json(res,400,{ok:false,error:"invalid id"}); config.providers=config.providers.filter(p=>p.id!==id); await saveConfig(config); await secrets.remove(id); cache.delete(id); return json(res,200,{ok:true}); }
      return json(res,404,{ok:false,error:"unknown endpoint"});
    } catch (error) { return json(res,400,{ok:false,error:error instanceof Error?error.message:"bad request"}); }
    }
  };
  ctx.effect(() => ctx.webServer.register(registration), "dsh-balance: routes");
}
