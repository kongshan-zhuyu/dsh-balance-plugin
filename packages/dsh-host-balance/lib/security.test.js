import test from "node:test";
import assert from "node:assert/strict";
import { validateProvider, readJsonPath, readJsonPathExpr, redactProvider, resolveBinding } from "./index.js";

test("rejects insecure or local endpoints", async () => {
  await assert.rejects(() => validateProvider({ id: "a", name: "a", endpoint: "http://example.com", responsePath: "$.balance" }));
  await assert.rejects(() => validateProvider({ id: "a", name: "a", endpoint: "https://127.0.0.1/a", responsePath: "$.balance" }));
});
test("allows a normal HTTPS provider and only safe JSON paths", async () => {
  const p = await validateProvider({ id: "open-code", name: "OpenCode", endpoint: "https://example.com/balance", responsePath: "$.data.balance" });
  assert.equal(p.id, "open-code");
  assert.equal(readJsonPath({ data: { balance: 12 } }, "$.data.balance"), 12);
  assert.throws(() => readJsonPath({}, "$['constructor']"));
  assert.equal(redactProvider({ ...p, apiKey: "never" }).apiKey, undefined);
});
test("path expressions support ?? fallback chains, optional chaining, and the response alias", () => {
  const data = { balance: 0.28, quota: { remaining: 5, unit: "CNY" } };
  assert.equal(readJsonPathExpr(data, "$.remaining ?? $.quota.remaining ?? $.balance"), 5);
  assert.equal(readJsonPathExpr({ balance: 0.28 }, "$.remaining ?? $.quota.remaining ?? $.balance"), 0.28);
  assert.equal(readJsonPathExpr({ remaining: 3, quota: { remaining: 5 }, balance: 0.28 }, "$.remaining ?? $.quota.remaining ?? $.balance"), 3);
  assert.equal(readJsonPathExpr(data, "$.quota?.remaining ?? $.balance"), 5);
  assert.equal(readJsonPathExpr(data, "response?.quota?.remaining ?? response?.balance"), 5);
  assert.equal(readJsonPathExpr({ quota: { remaining: 0 } }, "$.quota.remaining ?? $.balance"), 0);
  assert.equal(readJsonPathExpr({ unit: "USD" }, "$.unit ?? $.quota?.unit ?? \"USD\""), "USD");
  assert.equal(readJsonPathExpr({ quota: { unit: "USD" } }, "$.unit ?? $.quota?.unit ?? \"CNY\""), "USD");
  assert.equal(readJsonPathExpr({}, "$.unit ?? $.quota?.unit ?? \"USD\""), "USD");
  assert.equal(readJsonPathExpr({}, "$.unit ?? \"USD\""), "USD");
  assert.equal(readJsonPathExpr({ balance: "0.5" }, "$.balance"), "0.5");
  assert.equal(readJsonPathExpr({ remaining: null, balance: 1 }, "$.remaining ?? $.balance"), 1);
  assert.throws(() => readJsonPathExpr({}, "$.constructor ?? $.x"));
  assert.throws(() => readJsonPathExpr({}, "$.a.__proto__.b"));
  assert.throws(() => readJsonPathExpr({}, "eval(\"1\")"));
  assert.throws(() => readJsonPathExpr({}, "`${x}`"));
  assert.throws(() => readJsonPathExpr({}, "$[0]"));
  assert.throws(() => readJsonPathExpr({}, "$.a ?? $.b ?? $.c ?? $.d ?? $.e ?? $.f"));
  assert.throws(() => readJsonPathExpr({}, "response"));
  assert.throws(() => readJsonPathExpr({}, "$..a"));
  assert.throws(() => readJsonPathExpr({}, "$.a?"));
  assert.throws(() => readJsonPathExpr({}, 42));
});
test("validateProvider accepts expression responsePath and dynamic currency", async () => {
  const p = await validateProvider({ id: "relay", name: "Relay", endpoint: "https://example.com/usage", responsePath: "$.remaining ?? $.quota?.remaining ?? $.balance", currency: "$.unit ?? \"USD\"" });
  assert.equal(p.responsePath, "$.remaining ?? $.quota?.remaining ?? $.balance");
  assert.equal(p.currency, "$.unit ?? \"USD\"");
  await assert.rejects(() => validateProvider({ id: "relay", name: "Relay", endpoint: "https://example.com/usage", responsePath: "$.constructor", currency: "USD" }));
  const coerced = await validateProvider({ id: "relay", name: "Relay", endpoint: "https://example.com/usage", responsePath: "$.balance", currency: "`USD`" });
  assert.equal(coerced.currency, "CNY");
  await assert.rejects(() => validateProvider({ id: "relay", name: "Relay", endpoint: "https://example.com/usage", responsePath: "$.balance ?? process", currency: "USD" }));
});
test("binding resolves an exact route first, then the provider prefix", () => {
  const config = { bindings: { "deepseek/deepseek-chat": "relay-a", "openai": "relay-b" } };
  assert.equal(resolveBinding(config, "deepseek/deepseek-chat"), "relay-a");
  assert.equal(resolveBinding(config, "openai/gpt-4o"), "relay-b");
  assert.equal(resolveBinding(config, "deepseek/deepseek-reasoner"), undefined);
  assert.equal(resolveBinding(config, ""), undefined);
  assert.equal(resolveBinding(config, undefined), undefined);
});
