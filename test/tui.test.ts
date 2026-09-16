import { expect, test } from "bun:test"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import plugin from "../src/tui.js"

test("registers the cost slot and live session event handlers", async () => {
  const events: string[] = []
  let slot: unknown
  let listParameters: unknown
  const api = {
    client: {
      session: {
        async list(parameters: unknown) {
          listParameters = parameters
          return { data: [] }
        },
      },
    },
    event: {
      on(type: string) {
        events.push(type)
        return () => {}
      },
    },
    slots: {
      register(value: unknown) {
        slot = value
        return "opencode-subagent-cost"
      },
    },
    state: {
      session: {
        get() {
          return undefined
        },
      },
    },
  } as unknown as TuiPluginApi

  await plugin.tui(api, undefined, {} as never)

  expect(plugin.id).toBe("opencode-subagent-cost")
  expect(listParameters).toEqual({ scope: "project", limit: 100_000 })
  expect(events).toEqual([
    "session.created",
    "session.updated",
    "session.deleted",
  ])
  expect(slot).toBeDefined()
})
