const { spawn } = require("node:child_process")

// ECS injects the password separately so it never enters a CloudFormation URL.
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const password = process.env.DB_PASSWORD
  if (!password) throw new Error("DB_PASSWORD must be injected by ECS")

  const url = new URL(`postgresql://${process.env.DB_HOST}:5432`)
  url.username = process.env.DB_USER || "commerce"
  url.password = password
  url.pathname = process.env.DB_NAME || "commerce"
  url.searchParams.set("sslmode", "verify-full")
  process.env.DATABASE_URL = url.toString()
}

const args = process.argv.slice(2)
const command = args.length ? args.shift() : "node"
const child = spawn(
  command,
  args.length ? args : ["../../../../node_modules/@medusajs/cli/cli.js", "start"],
  { stdio: "inherit", env: process.env }
)

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => child.kill(signal))
}

child.on("error", () => {
  console.error("Unable to start backend process")
  process.exit(1)
})
child.on("exit", (code, signal) => {
  process.exit(signal ? 1 : (code ?? 1))
})
