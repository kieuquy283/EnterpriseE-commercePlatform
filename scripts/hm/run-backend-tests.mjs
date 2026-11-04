// Run Linux Medusa tests against the isolated recommendation_test PostgreSQL.
import net from "node:net"
import { spawn } from "node:child_process"

const target = new URL(process.env.DATABASE_URL || "postgresql://invalid")
if (process.env.NODE_ENV !== "test" || target.pathname !== "/recommendation_test") {
  throw new Error("Use the dedicated recommendation-api test container")
}
const type = process.argv[2] || "integration:http"
if (!["unit", "integration:http", "integration:modules"].includes(type)) throw new Error("Invalid test type")
const sockets = new Set()
// The installed test-utils enables SSL for hostnames without 'localhost'.
// A local TCP proxy preserves its expected connection behavior without core edits.
const proxy = net.createServer((socket) => {
  const upstream = net.connect(Number(target.port || 5432), target.hostname)
  sockets.add(socket)
  socket.on("close", () => { sockets.delete(socket); upstream.destroy() })
  socket.on("error", () => upstream.destroy())
  upstream.on("error", () => socket.destroy())
  socket.pipe(upstream).pipe(socket)
})
await new Promise((resolve, reject) => { proxy.once("error", reject); proxy.listen(0, "127.0.0.1", resolve) })
const port = proxy.address().port
const local = new URL(target)
local.hostname = "localhost"
local.port = String(port)
const child = spawn(process.execPath, ["--experimental-vm-modules", "/app/node_modules/jest/bin/jest.js", "--runInBand", "--forceExit", ...process.argv.slice(3)], {
  cwd: "/app/apps/backend", stdio: "inherit",
  env: { ...process.env, TEST_TYPE: type, DATABASE_URL: local.toString(), DB_HOST: "localhost", DB_PORT: String(port), DB_USERNAME: decodeURIComponent(target.username), DB_PASSWORD: decodeURIComponent(target.password) },
})
const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (value) => resolve(value ?? 1)) })
for (const socket of sockets) socket.destroy()
await new Promise((resolve) => proxy.close(resolve))
process.exitCode = code
