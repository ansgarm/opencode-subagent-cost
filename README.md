# opencode-subagent-cost

An OpenCode TUI plugin that shows the cost of the main session and all of its transitive subagents as one total. It works around [anomalyco/opencode#11027](https://github.com/anomalyco/opencode/issues/11027).

## What it does

The plugin adds the whole session tree's cost to the right side of the OpenCode prompt. The total includes the current session, its child sessions, and any deeper descendants.

When subagents have spent money, the prompt displays:

```text
$0.01 + $0.09 subagents = $0.10
```

The same whole-tree total is shown while viewing a subagent, so navigating into a child session does not make the reported run cost change.

## Install locally

Build the plugin:

```sh
bun install
bun run build
```

Add its TUI entrypoint to the project `.opencode/tui.json` or global `~/.config/opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["file:///absolute/path/to/opencode-subagent-cost/dist/tui.js"]
}
```

Quit and restart OpenCode after changing `tui.json`.

## Publish and install

After publishing to npm, install it through OpenCode:

```sh
opencode plugin opencode-subagent-cost
```

The package exposes only a TUI plugin. It does not mutate stored session costs or provider billing data.

## Compatibility

- OpenCode 1.18.31 or newer
- The new TUI plugin API
- Bun for local development

## Development

Install dependencies and run the type checks and tests:

```sh
bun install
bun run check
```

Build the distributable files:

```sh
bun run build
```

The package contains only `dist`, `README.md`, and `LICENSE` when packed for npm.

## License

[MIT](LICENSE)
