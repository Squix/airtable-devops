import process from "node:process";
import { Buffer } from "node:buffer";
type RunCommandOptions = {
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  input?: string | Uint8Array;
};

type RunCommandResult = {
  code: number;
  stdout: Uint8Array;
  stderr: Uint8Array;
};

export async function runCommand(
  command: string,
  options: RunCommandOptions = {},
): Promise<RunCommandResult> {
  const args = options.args ?? [];
  const cwd = options.cwd;
  const env = options.env;

  // Deno environment
  if (typeof Deno !== "undefined" && typeof Deno.Command === "function") {
    const denoProcess = new Deno.Command(command, {
      args,
      cwd,
      env,
      stdin: options.input ? "piped" : "inherit",
      stdout: "piped",
      stderr: "piped",
    });
    const child = denoProcess.spawn();
    if (options.input) {
      const writer = child.stdin.getWriter();
      if (typeof options.input === "string") {
        await writer.write(new TextEncoder().encode(options.input));
      } else {
        await writer.write(options.input);
      }
      await writer.close();
    }
    const { code, stdout, stderr } = await child.output();
    return {
      code,
      stdout,
      stderr,
    };
  }

  // Node.js environment
  else if (
    typeof process !== "undefined" &&
    process.versions?.node
  ) {
    const { spawn } = await import("node:child_process");
    return new Promise<RunCommandResult>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        env: env ? { ...process.env, ...env } : process.env,
        shell: false,
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout.on("data", (chunk: Buffer) => {
        stdoutChunks.push(chunk);
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk);
      });

      child.on("error", (err: Error) => {
        reject(err);
      });

      child.on("close", (code: number) => {
        resolve({
          code,
          stdout: Buffer.concat(stdoutChunks),
          stderr: Buffer.concat(stderrChunks),
        });
      });

      if (options.input) {
        if (typeof options.input === "string") {
          child.stdin.write(options.input);
        } else {
          child.stdin.write(Buffer.from(options.input));
        }
        child.stdin.end();
      }
    });
  }

  throw new Error(
    "Unsupported runtime: neither Deno nor Node.js detected for runCommand.",
  );
}