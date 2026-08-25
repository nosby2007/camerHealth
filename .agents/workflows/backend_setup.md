---
description: Build and clean Supabase backend for CameroHealth
---

# Overview
This workflow guides you through:
1. **Cleaning all existing Supabase tables** (both locally and in the hosted Supabase project).
2. **Setting up a fresh Supabase backend** – authentication, database schema, Row‑Level Security (RLS), and API.
3. **Integrating the backend with the Nuxt front‑end**.
4. **Deploying to production**.

---
## Prerequisites
- Node.js (v20+) installed.
- Supabase CLI installed globally (`npm i -g supabase`).
- A Supabase account and a project created (you already have a `supabase/` folder in the repo).
- Git configured and remote repository set up (already done).

---
## Step‑by‑step workflow

### 1️⃣ Clean existing Supabase tables
```bash
# 1.1 Stop any running local Supabase containers (if any)
// turbo
supabase stop

# 1.2 Reset the local database – this drops **all** tables and data
// turbo
supabase db reset

# 1.3 (Optional) Reset the remote database – **dangerous!**
#    Only run if you are sure you want to wipe the production schema.
#    This uses the Supabase CLI to truncate all tables via a SQL script.
#    Review the script before executing.
#    Create a file `reset_remote.sql` with:
#    ```sql
#    DO $$ DECLARE r RECORD;
#    BEGIN
#      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
#        EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
#      END LOOP;
#    END $$;
#    ```
#    Then run:
# // turbo
# supabase db remote reset --file reset_remote.sql
```

### 2️⃣ Define the fresh database schema
```bash
# 2.1 Create a new migration file (replace <name> with a descriptive name)
// turbo
supabase migration new init_schema

# 2.2 Edit the generated SQL file under `supabase/migrations/` to define your tables, e.g.:
#    ```sql
#    create table patients (
#      id uuid primary key default uuid_generate_v4(),
#      name text not null,
#      dob date,
#      created_at timestamp with time zone default now()
#    );
#
#    create table clinical_reports (
#      id uuid primary key default uuid_generate_v4(),
#      patient_id uuid references patients(id),
#      report jsonb,
#      created_at timestamp with time zone default now()
#    );
#    ```

# 2.3 Apply the migration locally
// turbo
supabase db push
```

### 3️⃣ Enable Row‑Level Security (RLS) and policies
```bash
# 3.1 Turn on RLS for each table (run inside `supabase db remote sql` or via dashboard)
# Example for `patients` table:
# // turbo
# supabase db remote sql "ALTER TABLE patients ENABLE ROW LEVEL SECURITY;"

# 3.2 Add policies – e.g., allow authenticated users to select their own rows:
# // turbo
# supabase db remote sql "CREATE POLICY "allow_select_own" ON patients FOR SELECT USING (auth.uid() = id);"
```

### 4️⃣ Set up Supabase Auth (email/password, magic link, etc.)
1. In the Supabase dashboard → **Authentication → Settings**, enable the providers you need (Email, Google, etc.).
2. Configure redirect URLs (e.g., `http://localhost:3000` for dev, Vercel URL for prod).
3. Optionally, add custom claims via **Auth > Policies** if you need role‑based access.

### 5️⃣ Connect Nuxt front‑end to Supabase
```bash
# 5.1 Install the Supabase client library
npm i @supabase/supabase-js

# 5.2 Create a plugin `plugins/supabase.js`:
# ```js
# import { createClient } from '@supabase/supabase-js'
# export default defineNuxtPlugin(() => {
#   const config = useRuntimeConfig()
#   const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
#   return { provide: { supabase } }
# })
# ```
# Add the keys to `nuxt.config.ts` under `runtimeConfig.public`.
```

### 6️⃣ Local development workflow
```bash
# 6.1 Start Supabase locally (includes Postgres, Auth, Realtime, Storage)
// turbo
supabase start

# 6.2 In another terminal, run the Nuxt dev server (already running)
npm run dev
```
- The front‑end will now talk to the local Supabase instance (`http://localhost:54321`).
- Use the Supabase dashboard (`http://localhost:54323`) to inspect tables.

### 7️⃣ Deploying to production
1. **Push schema to remote** (if you haven’t already):
   ```bash
   // turbo
   supabase db push
   ```
2. **Deploy Edge Functions (if any)**:
   ```bash
   // turbo
   supabase functions deploy <function-name>
   ```
3. **Set environment variables** in Vercel (or your hosting platform):
   - `SUPABASE_URL` – your project’s API URL.
   - `SUPABASE_ANON_KEY` – the public anon key.
   - `SUPABASE_SERVICE_ROLE_KEY` – for server‑side operations (keep secret).
4. **Redeploy the Nuxt app** (Vercel will pick up the env vars automatically).

---
## Quick reference commands (copy‑paste)
```bash
# Stop local Supabase
supabase stop

# Reset local DB (drops all tables)
supabase db reset

# Create initial migration
supabase migration new init_schema

# Apply migration locally
supabase db push

# Start local Supabase stack
supabase start

# Push schema to remote
supabase db push

# Deploy an Edge Function (example)
supabase functions deploy my-function
```
---
## Notes & Tips
- **Never run `supabase db remote reset` on a production project** unless you truly want to wipe everything.
- Keep a **SQL backup** (`supabase db dump`) before destructive actions.
- Use **Row‑Level Security** to protect patient data.
- For CI/CD, you can add the Supabase CLI commands to GitHub Actions.

---
**End of workflow**
