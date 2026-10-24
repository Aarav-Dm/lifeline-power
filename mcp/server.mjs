// Stdio MCP server. Reads the committed kits. Never fetches. Never writes.

import { townCompany, ejMean, programSources, toolNames } from "./kits.mjs"

const tools = [
  {
    name: "town_company",
    description:
      "Look up one Massachusetts town in utilities.csv. Returns utility_code and the company names split on ', '. Does not decide eligibility.",
    inputSchema: {
      type: "object",
      properties: { town: { type: "string" } },
      required: ["town"],
      additionalProperties: false,
    },
  },
  {
    name: "ej_mean",
    description:
      "Unweighted mean of limited-English household percent for one town's EJ block groups, with n. Not a town-wide rate and not a language.",
    inputSchema: {
      type: "object",
      properties: { town: { type: "string" } },
      required: ["town"],
      additionalProperties: false,
    },
  },
  {
    name: "program_sources",
    description:
      "Source title and URL for each opened program of one company code. Records stay separate. No record means no form. Does not decide eligibility.",
    inputSchema: {
      type: "object",
      properties: { company_code: { type: "string" } },
      required: ["company_code"],
      additionalProperties: false,
    },
  },
]

function callTool(name, args) {
  if (name === "town_company") return townCompany(args?.town ?? "")
  if (name === "ej_mean") return ejMean(args?.town ?? "")
  if (name === "program_sources") return programSources(args?.company_code ?? "")
  return { error: `Unknown tool ${name}` }
}

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`)
}

function handle(msg) {
  if (!msg || msg.jsonrpc !== "2.0") return
  if (msg.method === "notifications/initialized" || msg.method === "initialized") return
  if (msg.id === undefined) return

  if (msg.method === "initialize") {
    const requested = msg.params?.protocolVersion
    send({
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        protocolVersion: typeof requested === "string" && requested ? requested : "2025-03-26",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "lifeline-kits", version: "0.1.0" },
      },
    })
    return
  }
  if (msg.method === "tools/list") {
    send({ jsonrpc: "2.0", id: msg.id, result: { tools } })
    return
  }
  if (msg.method === "tools/call") {
    const name = msg.params?.name
    const result = callTool(name, msg.params?.arguments ?? {})
    send({
      jsonrpc: "2.0",
      id: msg.id,
      result: { content: [{ type: "text", text: JSON.stringify(result) }], isError: false },
    })
    return
  }
  if (msg.method === "ping") {
    send({ jsonrpc: "2.0", id: msg.id, result: {} })
    return
  }
  send({
    jsonrpc: "2.0",
    id: msg.id,
    error: { code: -32601, message: `Method not found: ${msg.method}` },
  })
}

if (process.argv.includes("--list")) {
  process.stdout.write(`${toolNames().join("\n")}\n`)
  process.exit(0)
}

if (process.stdout._handle?.setBlocking) process.stdout._handle.setBlocking(true)

let buf = Buffer.alloc(0)

function dispatch(body) {
  try {
    handle(JSON.parse(body))
  } catch (err) {
    send({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: err instanceof Error ? err.message : "parse error" },
    })
  }
}

function takeMessage() {
  while (buf.length) {
    if (buf[0] === 0x0a || buf[0] === 0x0d) {
      buf = buf.subarray(1)
      continue
    }
    const head = buf.subarray(0, Math.min(buf.length, 15)).toString("utf8").toLowerCase()
    if (head.startsWith("content-length:")) {
      const sep = buf.indexOf("\r\n\r\n")
      if (sep === -1) return
      const match = buf.subarray(0, sep).toString("utf8").match(/Content-Length:\s*(\d+)/i)
      if (!match) {
        buf = buf.subarray(sep + 4)
        continue
      }
      const start = sep + 4
      const len = Number(match[1])
      if (buf.length < start + len) return
      dispatch(buf.subarray(start, start + len).toString("utf8"))
      buf = buf.subarray(start + len)
      continue
    }
    const nl = buf.indexOf(0x0a)
    if (nl === -1) return
    const line = buf.subarray(0, nl).toString("utf8").replace(/\r$/, "")
    buf = buf.subarray(nl + 1)
    if (line.trim()) dispatch(line)
  }
}

process.stdin.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk])
  takeMessage()
})
