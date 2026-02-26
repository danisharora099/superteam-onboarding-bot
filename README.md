# Superteam Onboarding Bot

A Telegram bot that onboards new members to the Superteam community by requiring a proper introduction before they can participate in the main group.

## How It Works

1. **User joins the main group** → Bot mutes them and sends a welcome message with a link to the Intro Channel
2. **User posts an intro in the Intro Channel** → Bot validates the format heuristically (checks for who you are, location, contribution intent)
3. **Valid intro** → Bot unmutes the user in the main group, pins their intro, and confirms
4. **Invalid intro** → Bot replies with what's missing so the user can retry

As a secondary enforcement, any messages from pending users in the main group are auto-deleted with a reminder to complete their intro first.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: [Telegraf v4](https://telegraf.js.org/)
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (WAL mode)
- **Validation**: [Zod](https://zod.dev/) for environment config

## Project Structure

```
src/
  index.ts              — Entry point: config → DB → launch bot
  bot.ts                — Telegraf instance + handler registration
  config.ts             — Zod-validated env config
  logger.ts             — Structured JSON logger
  db/
    index.ts            — SQLite singleton (WAL mode)
    schema.ts           — Table migrations
    queries.ts          — All DB operations
  handlers/
    join.ts             — New member: mute + welcome message
    intro.ts            — Intro channel: validate + unmute
    gate.ts             — Auto-delete pending user messages in main group
    admin.ts            — Admin commands
    leave.ts            — Track member departures
  middleware/
    admin-guard.ts      — Admin-only command gating
    error-handler.ts    — Global error handler
  services/
    permissions.ts      — Telegram restrict/unrestrict wrappers
    validation.ts       — Intro format heuristic checking
    messages.ts         — Template rendering from config
    invite-link.ts      — Cached invite link generation
config/
  messages.json         — All bot messages (configurable)
  intro-format.json     — Intro format rules + keywords (configurable)
```

## Setup

### Prerequisites

- Node.js 20+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Two Telegram groups: a main group and an intro group
- Bot added as **admin** to both groups

### Bot Configuration (BotFather)

1. Create a bot via `/newbot` in BotFather
2. Disable **Group Privacy** via Bot Settings → Group Privacy → Disable
3. This allows the bot to read all messages (needed for intro validation)

### Group Setup

1. Create your main group and intro group
2. Add the bot to both groups
3. Promote it to admin in both with permissions:
   - **Restrict Members** (main group — for muting/unmuting)
   - **Delete Messages** (both groups)
   - **Pin Messages** (intro group — for pinning intros)

### Environment Variables

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Telegram bot token from BotFather |
| `MAIN_GROUP_ID` | Chat ID of the main group (e.g. `-100xxxxxxxxxx`) |
| `INTRO_CHANNEL_ID` | Chat ID of the intro group |
| `DB_PATH` | Path to SQLite database file (default: `./data/bot.db`) |
| `LOG_LEVEL` | `debug`, `info`, `warn`, or `error` (default: `info`) |

**Getting chat IDs**: Add the bot to each group, send a message, then call:
```
https://api.telegram.org/bot<TOKEN>/getUpdates
```
Look for the `chat.id` field in the response.

### Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm run build
npm start
```

### Docker

```bash
docker compose up -d
```

## Commands

### Public
| Command | Description |
|---------|-------------|
| `/example` | Show an example intro |

### Admin Only
| Command | Description |
|---------|-------------|
| `/stats` | Show member counts |
| `/status <id>` | Check a member's onboarding status |
| `/approve <id>` | Manually approve a user (skip intro) |
| `/resetintro <id>` | Reset a user's intro (re-mute them) |
| `/testjoin` | Simulate the join flow for yourself |

## Configurable

- **`config/messages.json`** — All bot messages (welcome, accepted, rejected, etc.)
- **`config/intro-format.json`** — Intro validation rules: minimum length, required sections, and keywords to match

## Design Decisions

- **Dual enforcement**: Users are both muted via Telegram permissions AND have messages auto-deleted. This handles edge cases where restriction fails (e.g. admin users in testing).
- **Heuristic validation**: Intros are validated by checking for keywords related to each required section. This is lenient enough to not reject genuine intros while catching low-effort messages.
- **SQLite with WAL**: Lightweight, zero-config, and fast for the expected load. WAL mode allows concurrent reads.
- **Cached invite links**: The intro group invite link is generated once and cached to avoid hitting Telegram rate limits.
- **Event logging**: All actions (join, leave, intro accepted/rejected, admin actions) are logged to an `events` table for auditability.

## Edge Cases Handled

- **Rejoin**: If a user leaves and rejoins, their status resets to pending
- **Deleted intros**: Intro text is preserved in the database even if the message is deleted
- **DM fallback**: If the bot can't DM a user (they haven't started the bot), the welcome is sent in the group and auto-deleted after 2 minutes
- **Bot can't restrict**: If unmuting fails, the user is informed to contact an admin
