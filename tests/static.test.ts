import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}

const SRC = join(import.meta.dirname, "..", "src")
const uiFiles = [join(SRC, "App.tsx"), ...files(join(SRC, "components")).filter((f) => !f.includes(join("components", "ui")))]

describe("static checks (task 5)", () => {
  it("no rule text, fax, address or phone string in components or App (13.3)", () => {
    for (const f of uiFiles) {
      const t = readFileSync(f, "utf8")
      expect(t, f).not.toMatch(/\d{3}-\d{3}-\d{4}/)
      expect(t, f).not.toMatch(/Concord|McGuire|Syracuse|Westwood|No interval stated|220 CMR|quarterly|six months/)
    }
  })
  it("no network calls anywhere under src/ (13.5)", () => {
    for (const f of files(SRC)) {
      const t = readFileSync(f, "utf8")
      expect(t, f).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon/)
    }
  })
})
