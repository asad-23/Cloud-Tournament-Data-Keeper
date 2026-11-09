# PlaDa — Playful Cloud Data

A global football tournament tracker for PES Mobile. Create a league, share a
6-character join code, add matches as they are played, and let anyone with the
app see live standings, matches, players and stats.

Dark UI, animated popups only, custom dialogs, and a public global feed.

## Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Mobile   | React Native (Expo SDK 58) + TypeScript + Expo Router |
| API      | Node.js + Express + TypeScript + Zod              |
| Database | PostgreSQL + Prisma                               |
| Anim     | React Native Reanimated                           |
| Data     | TanStack Query                                    |

```
.
├── app/            Expo React Native app
│   └── src/app/    file-based routes (Expo Router)
├── server/         Express API + Prisma schema (deploys to Vercel)
├── scripts/        helper scripts
├── .github/        GitHub Actions (builds the APK)
└── docker-compose.yml
```

## 1. Run the database

```bash
# If you have the Docker Compose plugin:
docker compose up -d

# Otherwise (this machine):
bash scripts/start-db.sh
```

Postgres listens on `localhost:5432` with user `pes` / password `pes_dev_password`.

## 2. Run the API

```bash
cd server
cp .env.example .env        # already created for local dev
npm install
npx prisma db push          # create tables
npm run dev                 # http://localhost:4000
```

Health check: `curl http://localhost:4000/api/health`

To run the API in the background (survives closing the terminal):

```bash
bash scripts/start-api.sh   # logs to $TMPDIR/pes-api.log
```

## 3. Run the app

```bash
cd app
cp .env.example .env        # leave EXPO_PUBLIC_API_URL empty for dev
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. The app automatically talks to
your laptop's LAN IP on port 4000, so phone and laptop must be on the same Wi-Fi.

> If the phone cannot reach the API, set `EXPO_PUBLIC_API_URL` in `app/.env` to
> `http://<your-laptop-ip>:4000/api` and restart Expo.

## How it works

1. **Register** with a unique nickname + first name (no password). The account is
   tied to the device, so one phone can only ever use one account.
2. **Create a tournament** — you become the admin and the first player. A
   6-character join code is generated immediately.
3. **Share the code** — friends tap *Join* and enter it. Every player competes
   under their account first name. The code works until the admin finishes the
   tournament.
4. **Add matches manually** — there are no fixtures. Any active player (or the
   admin) picks two active players and enters the final score; the match appears
   in the Matches tab and the table recalculates instantly.
5. **Fix scores** — only the two players in that match or the admin can edit or
   delete it. The table updates for everyone.
6. **Manage players** — the admin can add a player by name + nickname (no app
   needed yet), link that placeholder to a real account later without losing
   matches or stats (duplicate entries are merged automatically), disable/enable
   a player, or delete a player and their matches.
7. **Anyone** can open a tournament from the global *Explore* feed and view the
   table, matches, players and stats.

### Tournament page

The tournament screen has four bottom tabs:

| Tab | Contents |
| --- | -------- |
| **Table** | Join code, top-3 leaderboard, full standings with a compact/all-stats toggle |
| **Matches** | Match list with score edit/delete for the two players or admin; *Add match* for active players |
| **Players** | Player names only; tap one for info + stats; admin *Add player* and quick *Link* |
| **Stats** | Leaderboard, league-wide stats, biggest win, clean sheets and form guide |

### Identity note

There are no passwords by design. The server issues a device token stored in
SecureStore, and each account is locked to the device that created it. A second
account cannot be created on the same device, and an account cannot be used from
another device. Clearing app data resets the local device ID, so use the same
nickname + first name on *"I have a nickname"* to recover access on that phone.
This is simple, not bank-grade security — perfect for friend leagues.

## API

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/api/auth/register` | – | create profile (nickname, first name, deviceId) |
| POST | `/api/auth/login` | – | recover on the same device |
| GET | `/api/auth/me` | ✅ | current user |
| PATCH | `/api/auth/me` | ✅ | update first name / nickname |
| GET | `/api/tournaments` | ✅ | my tournaments |
| GET | `/api/tournaments/explore` | – | global public feed |
| GET | `/api/tournaments/:id` | optional | detail + standings + matches |
| POST | `/api/tournaments` | ✅ | create (creator becomes admin + player) |
| POST | `/api/tournaments/join` | ✅ | join with code |
| POST | `/api/tournaments/:id/finish` | admin | finish |
| POST | `/api/tournaments/:id/code` | admin | rotate code |
| POST | `/api/tournaments/:id/participants` | admin | add a player |
| PATCH | `/api/tournaments/:id/participants/:participantId` | admin | rename, disable/enable |
| POST | `/api/tournaments/:id/participants/:participantId/link` | admin | link/merge placeholder with an account |
| DELETE | `/api/tournaments/:id/participants/:participantId` | admin | delete player + their matches |
| POST | `/api/tournaments/:id/matches` | player/admin | add a played match with a score |
| DELETE | `/api/tournaments/:id/matches/:matchId` | match player/admin | delete a match |
| POST | `/api/tournaments/:id/matches/:matchId/result` | match player/admin | edit a score |
| DELETE | `/api/tournaments/:id` | admin | delete the tournament |

Standings rules: 3 points for a win, 1 for a draw. Tie-break by goal difference,
then goals scored, then player name. Form = last 5 results.

## Deploy the API to Vercel

The APK cannot reach `localhost` or your laptop's LAN IP, so deploy the API first.

### 1. Create a PostgreSQL database

Use a free hosted Postgres such as [Neon](https://neon.tech) or
[Supabase](https://supabase.com). You need two connection strings:

- **Pooled** URL (Neon: the host contains `-pooler`) — used by the API on Vercel.
- **Direct** URL — used once to create the tables.

They look like this:

```text
postgresql://user:password@host-pooler.region.aws.neon.tech/db?sslmode=require
postgresql://user:password@host.region.aws.neon.tech/db?sslmode=require
```

### 2. Create the tables

Run this once from your machine, using the **direct** URL:

```bash
cd server
DATABASE_URL="postgresql://...direct url..." npx prisma db push
```

### 3. Push the project to GitHub

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin master
```

(If `origin` already exists, just run `git push -u origin master`.)

### 4. Import the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. **Root Directory:** `server`
3. **Framework Preset:** Express (Vercel detects it automatically).
4. Leave the build settings on their defaults. If Vercel asks:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: leave empty
5. Add an environment variable:
   - `DATABASE_URL` = your **pooled** Postgres URL
6. Click **Deploy**.

`postinstall` runs `prisma generate`, so the client is rebuilt on every deploy.
The server uses Prisma's Rust-free driver adapter, so there are no engine
binaries to bundle.

### 5. Verify

Open:

```text
https://<your-project>.vercel.app/api/health
```

It should return `{"ok":true}`. Then check the global feed:

```text
https://<your-project>.vercel.app/api/tournaments/explore
```

> Render/Railway/Fly.io still work too: deploy the `server/` folder with the
> included `Dockerfile`, set `DATABASE_URL`, and run `node dist/index.js`.

## Build the APK with GitHub Actions

The workflow in `.github/workflows/android-apk.yml` builds an installable APK on
GitHub's runners — no Android Studio, no Expo account, and no build minutes on
your machine.

### 1. Add the API URL as a repository variable

GitHub → your repo → **Settings → Secrets and variables → Actions → Variables
tab → New repository variable**

- Name: `EXPO_PUBLIC_API_URL`
- Value: `https://<your-project>.vercel.app/api`

It must include `/api` and must not end with a slash. The workflow fails with a
clear error if this variable is missing.

### 2. Run the build

Push a change inside `app/`, or open **Actions → Build Android APK → Run
workflow**. The first build takes roughly 10–15 minutes.

### 3. Download and share the APK

Open the finished workflow run and download the **plada-apk** artifact, then
unzip it. The APK is `app-release.apk`.

Send that file to anyone (WhatsApp, Drive, Telegram, …). On the recipient's
phone they must allow **Install unknown apps** for the app they downloaded it
with. The APK talks to the public Vercel API, so it works on any network.

The APK is signed with the debug key, which is fine for sharing with friends.
For the Play Store, build an AAB with EAS (`--profile production`) or configure a
release keystore.

### EAS alternative

```bash
cd app
npx eas-cli@latest login
npx eas-cli@latest init          # first time only
npx eas-cli@latest build -p android --profile preview
```

`eas.json` already outputs an APK for the `preview` profile. Set
`EXPO_PUBLIC_API_URL` in the `preview` profile or in the EAS dashboard under
**Project → Environment Variables**.

## Useful commands

```bash
# API
cd server && npm run build          # type-check + compile
cd server && npx prisma studio      # browse the database

# App
cd app && npx tsc --noEmit          # type-check
cd app && npx expo start --clear    # restart with a clean cache
```
