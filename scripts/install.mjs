import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const profileIndex = process.argv.indexOf("--profile");
const profile = profileIndex >= 0 ? process.argv[profileIndex + 1] : "web";
if (!profile || profile.startsWith("-")) throw new Error("--profile requires a profile name");
const packageRoot = join(root, "packages", "dsh-balance");
await access(join(packageRoot, "package.json"));

const explicit = process.env.DSH_BIN;
const command = explicit || "dsh";
const args = explicit || command === "dsh"
  ? ["plugin", "--profile", profile, "add", packageRoot]
  : ["-y", "@deepseek-ai/dsh", "plugin", "--profile", profile, "add", packageRoot];
const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
if (result.error) {
  console.error(`Failed to start DSH CLI: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`DSH Balance installed into profile "${profile}". Restart dsh web to apply it.`);
