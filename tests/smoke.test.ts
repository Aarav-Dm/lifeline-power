import { describe, expect, it } from "vitest"
import { NO_INTERVAL } from "../src/types"

describe("smoke", () => {
  it("test runner finds tests/ and imports src/", () => {
    expect(NO_INTERVAL).toBe("No interval stated")
  })
})
