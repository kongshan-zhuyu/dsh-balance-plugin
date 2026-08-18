import test from "node:test";
import assert from "node:assert/strict";
import { validateProvider, readJsonPath, redactProvider, resolveBinding } from "./index.js";

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
test("binding resolves an exact route first, then the provider prefix", () => {
  const config = { bindings: { "deepseek/deepseek-chat": "relay-a", "openai": "relay-b" } };
  assert.equal(resolveBinding(config, "deepseek/deepseek-chat"), "relay-a");
  assert.equal(resolveBinding(config, "openai/gpt-4o"), "relay-b");
  assert.equal(resolveBinding(config, "deepseek/deepseek-reasoner"), undefined);
  assert.equal(resolveBinding(config, ""), undefined);
  assert.equal(resolveBinding(config, undefined), undefined);
});
