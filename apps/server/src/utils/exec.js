import { execFile } from "node:child_process";

export function execFileAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 1024 * 1024, ...options }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(
            [`Command failed: ${command} ${args.join(" ")}`, stderr, stdout].filter(Boolean).join("\n")
          )
        );
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}
