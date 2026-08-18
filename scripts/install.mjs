import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packages = [
  "dsh-bundle-balance",
  "dsh-client-balance",
  "dsh-host-balance",
].map((name) => join(root, "packages", name));

// shell=true lets Windows resolve dsh.cmd while keeping the same script usable
// on macOS and Linux. Paths remain separate arguments, so spaces are supported.
const result = spawnSync("dsh", ["plugin", "--profile", "web", "add", ...packages], {
  cwd: root,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(`Failed to start dsh: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) process.exit(result.status ?? 1);
console.log("DSH Balance installed. Restart dsh web to apply the plugin.");
