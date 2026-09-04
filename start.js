import { spawn } from "node:child_process";

console.log("\x1b[36m%s\x1b[0m", "Starting MarketPulse Full-Stack (Backend + Frontend)...");

const backend = spawn("node", ["backend/server.js"], { stdio: "inherit", shell: true });
const frontend = spawn("npx", ["vite"], { stdio: "inherit", shell: true });

function cleanup() {
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
