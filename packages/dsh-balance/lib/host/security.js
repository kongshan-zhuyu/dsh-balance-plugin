import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const LEGACY_SERVICE = "dsh.balance";

function legacyAccount(id) { return `provider:${id}`; }

export function balanceCredentialRef(id) {
  return `DSH_BALANCE_${id.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()}`;
}

export function credentialRefForProvider(provider) {
  return typeof provider?.credentialRef === "string" && provider.credentialRef
    ? provider.credentialRef
    : balanceCredentialRef(provider?.id || "");
}

export function ownsCredential(provider) {
  return provider?.credentialOwner === "balance";
}

/**
 * Read-only compatibility for keys saved by versions before 0.3. New keys are
 * always stored through DSH's cross-platform credentials service.
 */
export async function readLegacyMacKeychain(id) {
  if (process.platform !== "darwin") return null;
  try {
    const { stdout } = await exec("security", ["find-generic-password", "-s", LEGACY_SERVICE, "-a", legacyAccount(id), "-w"], { timeout: 5000 });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function removeLegacyMacKeychain(id) {
  if (process.platform !== "darwin") return;
  try {
    await exec("security", ["delete-generic-password", "-s", LEGACY_SERVICE, "-a", legacyAccount(id)], { timeout: 5000 });
  } catch {
    // An absent legacy item is already the desired state.
  }
}
