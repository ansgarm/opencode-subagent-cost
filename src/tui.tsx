/** @jsxImportSource @opentui/solid */
import type { Session } from "@opencode-ai/sdk/v2"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { createMemo, createSignal, Show } from "solid-js"
import { replaceSession, sessionCost } from "./cost.js"

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function Cost(props: { api: TuiPluginApi; sessionID: string; sessions: () => readonly Session[] }) {
  const value = createMemo(() => {
    const live = props.api.state.session.get(props.sessionID)
    const sessions = live ? replaceSession(props.sessions(), live) : props.sessions()
    return sessionCost(sessions, props.sessionID)
  })
  const theme = () => props.api.theme.current

  return (
    <Show when={value()?.total ? value() : undefined}>
      {(cost) => (
        <text fg={theme().textMuted} wrapMode="none">
          {cost().subagents > 0
            ? `${money.format(cost().own)} + ${money.format(cost().subagents)} subagents = ${money.format(cost().total)}`
            : `${money.format(cost().total)} total`}
        </text>
      )}
    </Show>
  )
}

async function loadSessions(api: TuiPluginApi) {
  const result = await api.client.session.list({ scope: "project", limit: 100_000 })
  return result.data ?? []
}

const tui: TuiPlugin = async (api) => {
  const [sessions, setSessions] = createSignal<readonly Session[]>([])

  const updateSession = (session: Session) => {
    setSessions((current) => replaceSession(current, session))
  }
  api.event.on("session.created", (event) => {
    updateSession(event.properties.info)
  })
  api.event.on("session.updated", (event) => {
    updateSession(event.properties.info)
  })
  api.event.on("session.deleted", (event) => {
    setSessions((current) => current.filter((session) => session.id !== event.properties.info.id))
  })

  // Subscribe before loading so updates that occur during the request are not lost.
  const loaded = await loadSessions(api)
  setSessions((current) => current.reduce((result, session) => replaceSession(result, session), loaded))

  api.slots.register({
    slots: {
      session_prompt_right(_context, props) {
        return <Cost api={api} sessionID={props.session_id} sessions={sessions} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "opencode-subagent-cost",
  tui,
}

export default plugin
