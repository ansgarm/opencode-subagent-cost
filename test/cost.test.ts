import { describe, expect, test } from "bun:test"
import { replaceSession, sessionCost } from "../src/cost.js"

describe("replaceSession", () => {
  test("adds a missing session and replaces an existing session", () => {
    expect(replaceSession([{ id: "a", cost: 1 }], { id: "b", cost: 2 })).toEqual([
      { id: "a", cost: 1 },
      { id: "b", cost: 2 },
    ])
    expect(replaceSession([{ id: "a", cost: 1 }], { id: "a", cost: 2 })).toEqual([{ id: "a", cost: 2 }])
  })
})

describe("sessionCost", () => {
  test("includes every descendant from any node in the tree", () => {
    const sessions = [
      { id: "root", cost: 0.01 },
      { id: "child-a", parentID: "root", cost: 0.04 },
      { id: "child-b", parentID: "root", cost: 0.02 },
      { id: "grandchild", parentID: "child-a", cost: 0.03 },
      { id: "unrelated", cost: 10 },
    ]

    const root = sessionCost(sessions, "root")
    expect(root?.rootID).toBe("root")
    expect(root?.own).toBeCloseTo(0.01)
    expect(root?.subagents).toBeCloseTo(0.09)
    expect(root?.total).toBeCloseTo(0.1)

    const grandchild = sessionCost(sessions, "grandchild")
    expect(grandchild?.rootID).toBe("root")
    expect(grandchild?.own).toBeCloseTo(0.01)
    expect(grandchild?.subagents).toBeCloseTo(0.09)
    expect(grandchild?.total).toBeCloseTo(0.1)
  })

  test("uses the highest available ancestor when a parent is missing", () => {
    const sessions = [
      { id: "child", parentID: "missing", cost: 1 },
      { id: "grandchild", parentID: "child", cost: 2 },
    ]

    expect(sessionCost(sessions, "grandchild")).toEqual({
      rootID: "child",
      own: 1,
      subagents: 2,
      total: 3,
    })
  })

  test("does not double-count malformed cycles", () => {
    const sessions = [
      { id: "a", parentID: "b", cost: 1 },
      { id: "b", parentID: "a", cost: 2 },
    ]

    expect(sessionCost(sessions, "a")).toEqual({
      rootID: "a",
      own: 1,
      subagents: 2,
      total: 3,
    })
  })

  test("ignores missing sessions and invalid costs", () => {
    expect(sessionCost([], "missing")).toBeUndefined()
    expect(
      sessionCost(
        [
          { id: "root", cost: Number.NaN },
          { id: "child", parentID: "root", cost: Number.POSITIVE_INFINITY },
        ],
        "root",
      ),
    ).toEqual({ rootID: "root", own: 0, subagents: 0, total: 0 })
  })
})
