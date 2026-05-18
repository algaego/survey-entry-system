# Survey Data Entry System — GitHub Pages + Supabase Version

This project converts the original JSX survey-entry tool into a deployable **Vite React app** with **Supabase Authentication + PostgreSQL storage**.

It is designed for paper-questionnaire data entry:

- Clerks log in and enter paper surveys online.
- Each paper survey becomes one database row.
- Drafts are auto-saved to Supabase.
- Clerks can only view/edit their own entries.
- The administrator can view all entries and export CSV/JSON.
- The site can be deployed as a static front end on GitHub Pages.

## 1. Create Supabase project

1. Create a Supabase project.
2. Go to **SQL Editor**.
3. Run `supabase/schema.sql`.

This creates two tables:

- `profiles`: maps Supabase Auth users to roles and recorder codes.
- `survey_entries`: stores questionnaire entries.

It also enables Row Level Security (RLS), so each clerk can only access their own rows and admin can access all rows.

## 2. Create login accounts

In Supabase Dashboard:

1. Go to **Authentication → Users**.
2. Create users manually, for example:
   - `admin@example.com`
   - `recorder-a@example.com`
   - `recorder-b@example.com`
   - ...
3. Set passwords yourself.
4. Open `supabase/profile_seed_template.sql`.
5. Replace the example emails with the real emails.
6. Run the edited seed SQL in Supabase SQL Editor.

The app does **not** store passwords in frontend code. It uses Supabase Auth.

## 3. Get Supabase frontend keys

In Supabase Dashboard:

1. Go to **Project Settings → API**.
2. Copy:
   - Project URL
   - anon public key

The anon key is safe to use in browser apps only when RLS is enabled and correctly configured. Never put the service role key in frontend code.

## 4. Run locally

Create a local `.env` file based on `.env.example`:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-SUPABASE-ANON-KEY
```

Then run:

```bash
npm install
npm run dev
```

## 5. Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload all project files.
3. Go to **Settings → Secrets and variables → Actions → New repository secret**.
4. Add these two secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Go to **Settings → Pages**.
6. Set **Source** to **GitHub Actions**.
7. Push to the `main` branch.
8. GitHub Actions will build and deploy the site.

The workflow file is already included at `.github/workflows/deploy.yml`.

## 6. What to send to clerks

Send the deployed GitHub Pages URL and each clerk's login email/password.

Example message:

> Please use this link to enter paper-questionnaire data: [your link]. Log in with your assigned email and password. Click `+ New Survey Entry` for each paper questionnaire. Drafts are auto-saved, and you can return later using the same account. When one entry is complete, click `Save & Mark Complete`.

## 7. Data export

Admin account:

- can view all clerks' entries;
- can export all data as CSV or JSON;
- can see draft/submitted counts by clerk.

## 8. Important limitations

- This is a lightweight internal research tool, not a full enterprise data system.
- Data security depends on Supabase Auth and RLS. Do not disable RLS.
- Do not commit `.env` or service role keys to GitHub.
- The built frontend bundle necessarily contains the anon key; that is expected. RLS is what protects the database.
