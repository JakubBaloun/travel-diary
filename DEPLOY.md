# Deploy

Production layout:

- **Backend** (Quarkus + Postgres) → Railway, Dockerfile build from `quarkus-server/`.
- **Frontend** (React/Vite) → Netlify, static build from `client/` (config in repo-root `netlify.toml`).
- **Photos** → Backblaze B2 (S3-compatible), unchanged.

No cold starts: Railway services stay warm 24/7.

---

## 1. Railway — backend + Postgres

1. **New Project → Deploy from GitHub repo** → pick `travel-diary`.
2. Service **Settings → Source**: set **Root Directory = `quarkus-server`**. Railway will pick up `Dockerfile` and `railway.json`.
3. **+ New → Database → PostgreSQL** in the same project.
4. On the Quarkus service open **Variables** and set:

   | Variable | Value |
   |---|---|
   | `DB_HOST` | `${{Postgres.PGHOST}}` |
   | `DB_PORT` | `${{Postgres.PGPORT}}` |
   | `DB_NAME` | `${{Postgres.PGDATABASE}}` |
   | `DB_USER` | `${{Postgres.PGUSER}}` |
   | `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
   | `JWT_SECRET` | long random string (≥32 chars) |
   | `READER_PASSWORD` | family password |
   | `ADMIN_PASSWORD` | your admin password |
   | `B2_ENDPOINT` | e.g. `https://s3.eu-central-003.backblazeb2.com` |
   | `B2_REGION` | e.g. `eu-central-003` |
   | `B2_ACCESS_KEY_ID` | from B2 |
   | `B2_SECRET_ACCESS_KEY` | from B2 |
   | `B2_BUCKET_NAME` | your bucket |
   | `B2_PUBLIC_URL` | `https://<bucket>.s3.<region>.backblazeb2.com` |
   | `CORS_ORIGIN` | _leave empty for now — fill after Netlify URL is known_ |

   `PORT` is injected by Railway automatically; `application.yaml` already reads `${PORT:8080}`.

5. Deploy. When it's green, **Settings → Networking → Generate Domain**. Copy the URL (e.g. `https://travel-diary-production.up.railway.app`).

---

## 2. Netlify — frontend

1. **Add new site → Import from Git** → pick `travel-diary`.
2. `netlify.toml` at repo root already sets base/command/publish — no need to type them in the UI. If the UI form asks: base `client`, build `npm run build`, publish `dist`.
3. **Site settings → Environment variables**:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE` | `https://<railway-url>/api` |

4. Trigger a deploy. Copy the Netlify URL (e.g. `https://travel-diary.netlify.app`).

---

## 3. Close the loop

1. **Railway** → Quarkus service → Variables → set `CORS_ORIGIN = https://<netlify-url>` (no trailing slash). Redeploy.
2. **B2 bucket** → Settings → CORS rules → add the Netlify origin for `GET` (so the browser can load photos). If `B2_PUBLIC_URL` points at a CDN/Cloudflare in front of B2, configure CORS there instead.
3. Open the Netlify URL, log in with `READER_PASSWORD`, verify pins + photos load.

---

## Day-to-day

- **Push to `main`** → both Railway and Netlify rebuild automatically.
- **Logs**: Railway service → Deployments → Logs. Netlify → Deploys → log.
- **DB schema**: Hibernate `update` mode is on — adding a column auto-migrates. Renames / drops need a manual SQL step.
- **Pausing after the trip**: Railway service → Settings → Remove (keeps Postgres + data). Or delete the whole project to stop billing.

## Cost sanity check

Hobby plan = $5/mo with $5 usage credit included. Expected monthly usage for this stack (1 small Quarkus + small Postgres, low traffic): roughly within the included credit. Watch the usage page after a few days; if Quarkus RAM creeps above ~512MB, lower `MaxRAMPercentage` in `Dockerfile`.
