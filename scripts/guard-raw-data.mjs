// PreToolUse guard: block agent writes under public/data/ (exit 2 + reason on stderr).
// Reads the hook event JSON on STDIN. Reads are allowed; only write-like tools are checked.
let raw = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (c) => (raw += c))
process.stdin.on("end", () => {
  let event
  try {
    event = JSON.parse(raw || "{}")
  } catch {
    process.exit(0) // not JSON: nothing to check
  }
  const tool = String(event.tool_name ?? event.toolName ?? event.tool ?? "").toLowerCase()
  const isWrite = /write|replace|edit|delete|create|insert|move|rename|shell|bash|execute/.test(tool)
  if (!isWrite) process.exit(0)
  const text = JSON.stringify(event.tool_input ?? event.toolInput ?? event.input ?? event).replace(/\\\\/g, "/")
  const touchesKits = /public\/data\//i.test(text)
  const readOnlyShell = /shell|bash|execute/.test(tool) && !/(>|Set-Content|Out-File|Remove-Item|Move-Item|Copy-Item|del |rm |mv |cp )/i.test(text)
  if (touchesKits && !readOnlyShell) {
    process.stderr.write("Blocked: public/data/ holds the five saved kits; they are read-only (bans.md 12, tech.md).\n")
    process.exit(2)
  }
  process.exit(0)
})
