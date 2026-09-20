import { spawn } from "node:child_process";

export const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => reject(new Error(`${command} did not start: ${error.message}`)));
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} stopped with code ${code}\n${stderr.trim().slice(-2000)}`));
    });
  });

export const requireCommands = async (commands) => {
  const missing = [];
  for (const command of commands) {
    try {
      await run("sh", ["-c", `command -v ${command}`]);
    } catch {
      missing.push(command);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Install these commands first: ${missing.join(", ")}`);
  }
};
