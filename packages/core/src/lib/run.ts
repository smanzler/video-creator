import { type SpawnOptions, spawn } from "node:child_process";

export type CommandResult = { stdout: string; stderr: string };

export const run = (command: string, args: string[], options: SpawnOptions = {}): Promise<CommandResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk;
    });
    child.on("error", (error: Error) => reject(new Error(`${command} did not start: ${error.message}`)));
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} stopped with code ${code}\n${stderr.trim().slice(-2000)}`));
    });
  });

export const requireCommands = async (commands: string[]): Promise<void> => {
  const missing: string[] = [];
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
