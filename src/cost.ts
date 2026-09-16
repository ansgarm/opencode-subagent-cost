export type CostSession = {
  id: string
  parentID?: string
  cost?: number
}

export type SessionCost = {
  rootID: string
  own: number
  subagents: number
  total: number
}

export function replaceSession<Session extends CostSession>(sessions: readonly Session[], session: Session): Session[] {
  const index = sessions.findIndex((item) => item.id === session.id)
  if (index < 0) return [...sessions, session]
  return sessions.with(index, session)
}

export function sessionCost(sessions: readonly CostSession[], sessionID: string): SessionCost | undefined {
  const byID = new Map(sessions.map((session) => [session.id, session]))
  const current = byID.get(sessionID)
  if (!current) return

  let root = current
  const ancestors = new Set<string>()
  while (root.parentID && !ancestors.has(root.id)) {
    ancestors.add(root.id)
    const parent = byID.get(root.parentID)
    if (!parent) break
    root = parent
  }

  const children = new Map<string, CostSession[]>()
  for (const session of sessions) {
    if (!session.parentID) continue
    const siblings = children.get(session.parentID)
    if (siblings) siblings.push(session)
    else children.set(session.parentID, [session])
  }

  let total = 0
  const seen = new Set<string>()
  const stack = [root]
  while (stack.length > 0) {
    const session = stack.pop()
    if (!session || seen.has(session.id)) continue
    seen.add(session.id)
    total += Number.isFinite(session.cost) ? (session.cost ?? 0) : 0
    stack.push(...(children.get(session.id) ?? []))
  }

  const own = Number.isFinite(root.cost) ? (root.cost ?? 0) : 0
  return {
    rootID: root.id,
    own,
    subagents: total - own,
    total,
  }
}
