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
├── server/         Express API + Prisma schema
├── scripts/        helper scripts
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

## Make the API global (public URL)

The APK cannot reach `localhost` or your laptop's LAN IP, so deploy the API first.

### 1. Create a PostgreSQL database

Use a free hosted Postgres such as [Neon](https://neon.tech) or
[Supabase](https://supabase.com). Copy the connection string, for example:

```text
postgresql://user:password@host/dbname?sslmode=require
```

### 2. Deploy the server

The simplest option is [Render](https://render.com). Railway and Fly.io work the
same way.

1. Push this repository to GitHub.
2. Render → **New → Web Service** → connect the repository.
3. Set **Root Directory** to `server`.
4. Render detects the `Dockerfile`. If it asks for commands instead, use:
   - Build: `npm install && npm run build`
   - Start: `node dist/index.js`
5. Add an environment variable `DATABASE_URL` = your hosted Postgres URL.
   Do **not** set `PORT` — Render provides it automatically and the server
   reads it.
6. Deploy and open `https://<your-service>.onrender.com/api/health`. It should
   return `{"ok":true}`.

### 3. Create the database tables

Run this once from your machine against the hosted database:

```bash
cd server
DATABASE_URL="postgresql://...your hosted url..." npx prisma db push
```

You can also run `npx prisma db push` from the host's shell.

### 4. Point the app at the public API

Set this before building the APK:

```text
EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com/api
```

The value must include `/api` and must not end with a slash.

## Build an APK and share it

EAS cloud builds need no Android Studio:

```bash
cd app
npx eas-cli@latest login
npx eas-cli@latest init          # first time only: creates the EAS project
```

Set the API URL for the build. Either add it to the `preview` profile in
`eas.json`:

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" },
  "env": {
    "EXPO_PUBLIC_API_URL": "https://<your-service>.onrender.com/api"
  }
}
```

Or set `EXPO_PUBLIC_API_URL` in the EAS dashboard under
**Project → Environment Variables** for the `preview` environment.

Then build:

```bash
npx eas-cli@latest build -p android --profile preview
```

`eas.json` is already configured to output an **APK** for the `preview` profile.
EAS prints an installable URL when it finishes. Share that URL, or download the
`.apk` and send it directly. On Android, the recipient must allow **Install
unknown apps** for their browser or file manager. The APK talks to the public
API, so it works on any network.

For a Play Store release, use `--profile production`; that profile builds an
AAB instead of an APK.

## Useful commands

```bash
# API
cd server && npm run build          # type-check + compile
cd server && npx prisma studio      # browse the database

# App
cd app && npx tsc --noEmit          # type-check
cd app && npx expo start --clear    # restart with a clean cache
```
