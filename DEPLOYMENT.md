# Deployment Guide - Wizix Degenerates

This guide will walk you through deploying your Wizix Degenerates app to production.

## Prerequisites Checklist

Before deploying, make sure you have:

- ✅ Supabase project created and configured
- ✅ Database tables created (run `supabase-setup.sql`)
- ✅ Environment variables ready
- ✅ Code pushed to GitHub (recommended)

## Step 1: Fix PowerShell Execution Policy (Windows)

If you're getting PowerShell script errors, run this command in PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then restart your terminal and try again.

## Step 2: Install Dependencies

```bash
npm install
```

This will install:
- `vite` - Build tool
- `@supabase/supabase-js` - Supabase client

## Step 3: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_NAME=Wizix Degenerates
   VITE_CURRENT_SEASON=2024
   ```

## Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
- ✅ Sign up / Login
- ✅ View pools
- ✅ Make picks (if games are available)
- ✅ View leaderboard

## Step 5: Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## Step 6: Deploy to Netlify (Recommended)

### Option A: Deploy via Netlify UI

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" > "Import an existing project"
3. Connect to your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: (leave empty)

5. Add environment variables:
   - Go to "Site settings" > "Environment variables"
   - Add each variable from your `.env` file:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_APP_NAME`
     - `VITE_CURRENT_SEASON`

6. Click "Deploy site"

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

## Step 7: Deploy to GitHub Pages (Alternative)

1. Update `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/wizixpool/', // Your repo name
     // ... rest of config
   })
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy to gh-pages:
   ```bash
   # Install gh-pages
   npm install -D gh-pages

   # Add deploy script to package.json
   # "deploy": "gh-pages -d dist"

   # Deploy
   npm run deploy
   ```

4. Enable GitHub Pages:
   - Go to your repo settings
   - Navigate to "Pages"
   - Select "gh-pages" branch
   - Save

5. Add environment variables:
   - GitHub Pages doesn't support environment variables
   - You'll need to hardcode them in `src/config.js` (not recommended for production)
   - **Recommendation**: Use Netlify instead for better environment variable support

## Step 8: Post-Deployment Setup

### Create Your First Admin User

1. Sign up through the app
2. Go to your Supabase dashboard
3. Navigate to "Table Editor" > "users"
4. Find your user and set `is_admin = true`

### Create Your First Pool

1. Log in as admin
2. Go to Pools page
3. Click "Create Pool" (admin only)
4. Fill in pool details:
   - Name: "2024 Office Pool"
   - Type: "pickem"
   - Season: 2024
   - Entry Fee: $20 (or whatever you want)

### Invite Users

Share your deployment URL with friends and colleagues!

## Troubleshooting

### Build Fails

**Error**: `Cannot find module '@supabase/supabase-js'`
- **Fix**: Run `npm install` again

**Error**: `VITE_SUPABASE_URL is not defined`
- **Fix**: Make sure environment variables are set in Netlify dashboard

### App Loads But Can't Connect to Supabase

**Symptoms**: Login fails, no data loads
- **Fix**: Check environment variables are correct
- **Fix**: Verify Supabase project is active
- **Fix**: Check browser console for errors

### ESPN API Not Working

**Symptoms**: No games showing, scores not updating
- **Fix**: ESPN API may be temporarily down - wait and try again
- **Fix**: Check browser console for CORS errors
- **Fix**: Run test script: `node scripts/test-espn-api.js`

### Picks Not Saving

**Symptoms**: Picks disappear after submission
- **Fix**: Check Supabase RLS policies are set correctly
- **Fix**: Verify user is logged in
- **Fix**: Make sure user has joined a pool

## Performance Optimization

### Enable Caching

In Netlify, add these headers in `netlify.toml`:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Enable Compression

Netlify automatically compresses files, but you can verify in:
- Site settings > Build & deploy > Post processing
- Enable "Asset optimization"

## Monitoring

### Netlify Analytics

- Enable Netlify Analytics in your site dashboard
- Track visitors, page views, and performance

### Supabase Monitoring

- Monitor database usage in Supabase dashboard
- Check API request counts
- Review error logs

## Updating the App

### Deploy Updates

1. Make changes to your code
2. Commit and push to GitHub
3. Netlify will automatically rebuild and deploy

### Manual Deploy

```bash
npm run build
netlify deploy --prod
```

## Security Checklist

- ✅ Environment variables not committed to Git
- ✅ Supabase RLS policies enabled
- ✅ HTTPS enabled (automatic with Netlify)
- ✅ API keys are anon keys (not service keys)
- ✅ User authentication required for all actions

## Backup Strategy

### Database Backups

Supabase automatically backs up your database. To manually export:

1. Go to Supabase dashboard
2. Database > Backups
3. Download backup

### Code Backups

- Code is backed up in GitHub
- Keep `.env` file backed up securely (not in Git!)

## Support

If you run into issues:

1. Check the README.md
2. Review Supabase documentation
3. Check Netlify deployment logs
4. Test ESPN API with the test script

## Success! 🎉

Your app is now live! Share the URL and start your office pool!

**Next Steps:**
- Customize the branding
- Add more pools
- Invite users
- Start making picks!

---

**Need help?** Check the main README.md for more detailed information.
