# Hunter Bot

A multi-purpose Discord bot similar to Dyno, with moderation, utility, fun commands, and a per-server custom commands system.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server + Discord bot (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `DISCORD_BOT_TOKEN` — Discord bot token

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Discord: discord.js v14
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Bot entry point: `artifacts/api-server/src/bot/index.ts`
- Bot events & command routing: `artifacts/api-server/src/bot/events.ts`
- Commands: `artifacts/api-server/src/bot/commands/`
- Reminder loop: `artifacts/api-server/src/bot/reminders.ts`
- DB schema: `lib/db/src/schema/index.ts`

## Architecture decisions

- Bot runs inside the same Express server process — avoids a separate worker process.
- Per-guild prefix stored in `guild_settings` table; fetched on each message.
- Custom commands are stored in `custom_commands` table; looked up after built-in commands fail to match.
- Discord timeout API used for mute (no muted role needed).
- Reminder loop polls every 10 seconds using `remindAt` timestamp.

## Product

- **Moderation**: ban, kick, warn, warnings, clear/purge, mute (timeout), unmute
- **Utility**: ping, remind, prefix change, welcome message setup, custom command management
- **Info**: serverinfo, userinfo, avatar
- **Fun**: roll (dice), coinflip
- **Custom commands**: per-server commands created with `!addcmd`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Bot requires **Message Content Intent** and **Server Members Intent** enabled in the Discord Developer Portal under Bot → Privileged Gateway Intents.
- Run `pnpm --filter @workspace/db run push` after any schema changes.
- Bot token is stored as a Replit Secret (`DISCORD_BOT_TOKEN`).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
