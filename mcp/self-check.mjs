import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import { townCompany, ejMean, programSources, toolNames, NO_FORM_OPENED, NO_FORM_LOADED } from "./kits.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
let failed = 0
function check(name, ok) {
  if (!ok) {
    failed += 1
    process.stderr.write(`FAIL ${name}\n`)
  }
}

const fitchburg = townCompany("Fitchburg")
check("fitchburg code", fitchburg.utility_code === "Unitil (Fitchburg Gas & Electric)")
check("fitchburg one company", fitchburg.companies.length === 1)

const leominster = townCompany("Leominster")
check("leominster", leominster.companies[0] === "National Grid (Massachusetts Electric)")

const holyoke = townCompany("Holyoke")
check("holyoke code", holyoke.utility_code === "Holyoke Gas & Electric Department")

const nantucket = townCompany("Nantucket")
check("nantucket", nantucket.companies[0] === "National Grid (Nantucket Electric)")

const bellingham = townCompany("Bellingham")
check("bellingham two", bellingham.companies.length === 2)

const wellesley = ejMean("Wellesley")
check("wellesley n", wellesley.n === 2 && wellesley.meanPct === 0 && wellesley.setsLanguage === false)

const lawrence = ejMean("Lawrence")
check("lawrence", lawrence.n === 56 && lawrence.meanPct === 28.88)

const unitil = programSources("Unitil (Fitchburg Gas & Electric)")
check("unitil two records", unitil.records.length === 2)
check(
  "unitil purposes differ",
  new Set(unitil.records.map((r) => r.purpose)).size === 2,
)
const urls = unitil.records.flatMap((r) => r.sources.map((s) => s.url))
check("unitil pdf", urls.includes("https://unitil.com/sites/default/files/2021-08/MALFORM-MA.pdf"))

const sourcesText = readFileSync(join(root, "src/rules/sources.ts"), "utf8")
const allUrls = programSources("National Grid (Massachusetts Electric)").records
  .concat(unitil.records)
  .concat(programSources("Eversource Energy (NSTAR Electric)").records)
  .concat(programSources("Wellesley Municipal Light Plant").records)
  .flatMap((r) => r.sources.map((s) => s.url))
check("urls exist in sources.ts", allUrls.every((u) => sourcesText.includes(u)))

const ng = programSources("National Grid (Massachusetts Electric)")
check("ng separate", ng.records.map((r) => r.id).join() === "ng-outage,ng-medical")
check("no paper url", !ng.records.some((r) => r.sources.some((s) => s.url.includes("cm10226") || s.url.includes("life-sustaining"))))

check("holyoke sentence", programSources("Holyoke Gas & Electric Department").sentence === NO_FORM_OPENED)
check("nantucket sentence", programSources("National Grid (Nantucket Electric)").sentence === NO_FORM_LOADED)
check(
  "nantucket no ma form",
  !JSON.stringify(programSources("National Grid (Nantucket Electric)")).includes("MA-Electric-Outage"),
)

const listed = await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [join(root, "mcp/server.mjs"), "--list"], { stdio: ["ignore", "pipe", "inherit"] })
  let out = ""
  child.stdout.on("data", (c) => {
    out += c
  })
  child.on("exit", (code) => (code === 0 ? resolve(out.trim().split(/\r?\n/)) : reject(new Error(`list exit ${code}`))))
})
check("tool list", listed.join() === toolNames().join())

const rpcChild = spawn(process.execPath, [join(root, "mcp/server.mjs")], {
  stdio: ["pipe", "pipe", "inherit"],
})
let rpcBuf = ""
const pending = new Map()
let nextId = 1
rpcChild.stdout.setEncoding("utf8")
rpcChild.stdout.on("data", (chunk) => {
  rpcBuf += chunk
  let nl = rpcBuf.indexOf("\n")
  while (nl !== -1) {
    const line = rpcBuf.slice(0, nl)
    rpcBuf = rpcBuf.slice(nl + 1)
    nl = rpcBuf.indexOf("\n")
    if (!line.trim()) continue
    const msg = JSON.parse(line)
    const done = pending.get(msg.id)
    if (done) {
      pending.delete(msg.id)
      done(msg)
    }
  }
})
function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 8000)
    pending.set(id, (msg) => {
      clearTimeout(timer)
      resolve(msg)
    })
    rpcChild.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`)
  })
}
const init = await rpc("initialize", {
  protocolVersion: "2025-03-26",
  capabilities: {},
  clientInfo: { name: "self-check", version: "0" },
})
check("initialize", init.result?.serverInfo?.name === "lifeline-kits" && init.result?.protocolVersion === "2025-03-26")
rpcChild.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`)
const rpcList = await rpc("tools/list", {})
check("rpc tools", rpcList.result?.tools?.map((t) => t.name).join() === toolNames().join())
const rpcTown = await rpc("tools/call", {
  name: "town_company",
  arguments: { town: "Fitchburg" },
})
const rpcBody = JSON.parse(rpcTown.result?.content?.[0]?.text ?? "{}")
check("rpc fitchburg", rpcBody.utility_code === "Unitil (Fitchburg Gas & Electric)")
rpcChild.kill()

if (failed) {
  process.stderr.write(`${failed} failed\n`)
  process.exit(1)
}
process.stdout.write("mcp self-check ok\n")
