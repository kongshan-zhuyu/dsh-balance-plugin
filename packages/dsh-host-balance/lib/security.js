import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const SERVICE = "dsh.balance";

function account(id) { return `provider:${id}`; }

/**
 * Credentials never enter the JSON configuration file. On macOS they are held
 * in Keychain; on other systems an environment variable is the deliberate
 * fallback until a platform secret service adapter is supplied.
 */
export class SecretStore {
  async set(id, value) {
    if (typeof value !== "string" || value.length < 8 || value.length > 4096) throw new Error("invalid credential length");
    if (process.platform !== "darwin") throw new Error("this build requires a platform keychain; set DSH_BALANCE_SECRET_<ID> for ephemeral use");
    await exec("security", ["add-generic-password", "-U", "-s", SERVICE, "-a", account(id), "-w", value], { timeout: 5000 });
  }
  async get(id) {
    if (process.platform === "darwin") {
      try {
        const { stdout } = await exec("security", ["find-generic-password", "-s", SERVICE, "-a", account(id), "-w"], { timeout: 5000 });
        return stdout.trim() || null;
      } catch { return null; }
    }
    return process.env[`DSH_BALANCE_SECRET_${id.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()}`] ?? null;
  }
  async remove(id) {
    if (process.platform === "darwin") {
      try { await exec("security", ["delete-generic-password", "-s", SERVICE, "-a", account(id)], { timeout: 5000 }); } catch {}
    }
  }
}
