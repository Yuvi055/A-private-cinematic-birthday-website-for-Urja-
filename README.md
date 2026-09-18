# URJA — Secure Birthday Website ❤️

This version keeps photos/videos in a PRIVATE Supabase Storage bucket.

## Architecture

GitHub Pages (frontend)
        ↓
Supabase Auth
        ↓
RLS-protected memories table
        ↓
PRIVATE Storage bucket
        ↓
5-minute signed URLs

## Setup

### 1. Supabase
Create a Supabase project.

### 2. Authentication
Go to Authentication > Users and create the accounts that are allowed to view the birthday site.

Recommended:
- One viewer account for Urja.
- One separate admin account for yourself.

Do NOT share your admin password with Urja.

### 3. Database + storage security
Open SQL Editor and run `supabase.sql`.

Then create Storage bucket:
- Name: `urja-memories`
- Public: OFF / Private

Do not create a public storage policy.

### 4. Get browser credentials
Supabase Project Settings > API:
- Project URL
- Publishable/anon key

Put them into `app.js`:

const SUPABASE_URL = "...";
const SUPABASE_ANON_KEY = "...";

Never put a service_role/secret key in this file or GitHub.

### 5. GitHub
Upload:
- index.html
- style.css
- app.js

You can keep `supabase.sql` in a private repo or remove it after setup. It contains no secret credentials.

Enable GitHub Pages:
Settings > Pages > Deploy from branch > main > root.

### 6. Upload memories
Open the live site.
Sign in with your admin account.
Scroll to Private Admin.
Upload your 10 photos and 5 videos.

### Security notes
- Storage is private.
- Anonymous users cannot query the memories table.
- Anonymous users cannot read storage objects.
- Authenticated users receive signed URLs that expire after 5 minutes.
- The browser can still display/capture media; no website can technically prevent screenshots or screen recording.
- GitHub should contain code only, never your photos/videos or Supabase secret/service-role key.
