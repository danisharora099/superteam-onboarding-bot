# Superteam MY — Onboarding Bot

A Telegram bot for [Superteam Malaysia](https://t.me/SooouperBot) that onboards new members by requiring a proper introduction before they can participate in the main group.

**Bot**: [@SooouperBot](https://t.me/SooouperBot)

## How It Works

```
User joins main group
        │
        ▼
  Bot mutes user + sends welcome
  with link to Intro group
        │
        ▼
  User posts intro in Intro group
        │
        ▼
  ┌─────────────┐     ┌──────────────────┐
  │ Valid intro  │────▶│ Unmute in main   │
  │             │     │ Pin intro         │
  │             │     │ Send confirmation │
  └─────────────┘     └──────────────────┘
        │
  ┌─────────────┐     ┌──────────────────┐
  │ Invalid     │────▶│ Reply with       │
  │             │     │ what's missing    │
  └─────────────┘     └──────────────────┘
```

1. **User joins the main group** → Bot mutes them and sends a welcome message with a link to the Intro group
2. **User posts an intro** → Bot validates the format (who you are, location, contribution intent)
3. **Valid intro** → Bot unmutes the user, pins their intro, and confirms
4. **Invalid intro** → Bot replies with what's missing so the user can retry

As secondary enforcement, any messages from pending users in the main group are auto-deleted with a reminder to complete their intro first.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: [Telegraf v4](https://telegraf.js.org/)
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (WAL mode)
- **Config Validation**: [Zod](https://zod.dev/)

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

### 1. Bot Configuration (BotFather)

1. Create a bot via `/newbot` in BotFather
2. Disable **Group Privacy**: Bot Settings → Group Privacy → Disable
   - Required so the bot can read messages in the intro group
3. Remove and re-add the bot to groups after changing privacy mode

### 2. Group Setup

| Group | Bot Permissions Needed |
|-------|----------------------|
| Main group | Restrict Members, Delete Messages |
| Intro group | Delete Messages, Pin Messages |

### 3. Environment Variables

```bash
cp .env.example .env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from BotFather | `123456:ABC-DEF...` |
| `MAIN_GROUP_ID` | Chat ID of the main group | `-5132273750` |
| `INTRO_CHANNEL_ID` | Chat ID of the intro group | `-5181815538` |
| `DB_PATH` | SQLite database path | `./data/bot.db` |
| `LOG_LEVEL` | Log verbosity | `info` |

**Getting chat IDs**: Add the bot to each group, send a message, then call:
```
https://api.telegram.org/bot<TOKEN>/getUpdates
```
Look for the `chat.id` field in the response.

### 4. Run

```bash
npm install

# Development (auto-reload)
npm run dev

# Production
npm run build && npm start
```

### Docker

```bash
docker compose up -d
```

## Commands

### Public

| Command | Description |
|---------|-------------|
| `/example` | Show an example intro for reference |

### Admin Only

| Command | Description |
|---------|-------------|
| `/stats` | Member counts (total, pending, introduced, left) |
| `/status <id>` | Look up a member's onboarding status |
| `/approve <id>` | Manually approve a user (skip intro requirement) |
| `/resetintro <id>` | Reset a user's intro status (re-mutes them) |
| `/testjoin` | Simulate the join flow for yourself (for testing) |

## Configuration

All bot behavior is configurable without code changes:

### `config/messages.json`

Every user-facing message — welcome, accepted, rejected, reminders, admin responses. Uses `{variable}` placeholders for dynamic content.

### `config/intro-format.json`

Intro validation rules:
- `minLength` — Minimum character count
- `requiredSections` — Each section has a label, keyword list, and required flag
- Keywords are matched case-insensitively against the intro text

## Approach & Design Decisions

**Dual enforcement** — Users are both muted via Telegram's `restrictChatMember` AND have messages auto-deleted if they somehow bypass the restriction. Belt and suspenders.

**Heuristic validation** — Intros are validated by checking for keywords related to each required section (identity, location, contribution). Lenient enough to not reject genuine intros while catching low-effort "hi" messages. The keywords and sections are fully configurable via JSON.

**SQLite** — Zero-config, embedded, no external services needed. WAL mode for concurrent reads. Two tables: `members` for state, `events` for audit logging.

**Cached invite links** — The intro group invite link is generated once via `exportChatInviteLink` and cached in memory to avoid rate limits.

**Structured logging** — JSON logs with timestamps, levels, and context. Easy to pipe into any log aggregator.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User leaves and rejoins | Status resets to pending, must re-introduce |
| User deletes their intro | Intro text preserved in DB, status unchanged |
| Bot can't DM user | Welcome sent in group, auto-deleted after 2 min |
| Bot can't unmute | User informed to contact an admin |
| User posts in main group while pending | Message deleted, reminder sent (auto-deleted after 30s) |
| User already introduced posts in intro channel | Told they're already introduced |

## Demo

[Demo video →](#) <!-- TODO: Add Loom link -->
