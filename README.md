# 🎲 Wizix Degenerates - Football Office Pool

A production-ready, fully-featured NFL office pool application with real-time ESPN integration, multi-user authentication, and a degenerate gambling theme.

![Wizix Degenerates](./public/logo.png)

## Features

- ✅ **Multi-User Authentication** - Secure sign up/login with Supabase
- 🏈 **Real-Time ESPN Integration** - Live scores, team logos, and game data
- 📊 **Pick'em Pool Format** - Pick winners straight up each week
- 🔴 **Live Score Updates** - Auto-refreshing scores every 30 seconds
- 📈 **Leaderboards** - Track your ranking against other players
- 🎨 **Degenerate Theme** - Vegas-style aesthetic with neon accents
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- ⚡ **Fast & Lightweight** - Built with Vite and vanilla JavaScript
- 🚀 **Static Hosting Ready** - Deploy to Netlify or GitHub Pages

## Tech Stack

- **Frontend**: Vite + Vanilla JavaScript
- **Styling**: Custom CSS with degenerate Vegas theme
- **Backend**: Supabase (PostgreSQL + Real-time)
- **API**: ESPN Hidden API (unofficial)
- **Hosting**: Netlify / GitHub Pages

## Prerequisites

Before you begin, you'll need:

1. **Node.js** (v18 or higher)
2. **Supabase Account** (free tier available at [supabase.com](https://supabase.com))
3. **Git** (for deployment)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (2-3 minutes)
3. Go to **Settings** > **API** and copy:
   - Project URL
   - Anon/Public Key

#### Create Database Tables

Go to the **SQL Editor** in your Supabase dashboard and run these commands:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pools table
CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  pool_type TEXT NOT NULL CHECK (pool_type IN ('pickem', 'confidence', 'spread', 'survivor')),
  season INTEGER NOT NULL,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pool members table
CREATE TABLE pool_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  paid BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pool_id, user_id)
);

-- Picks table
CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  picked_team_id TEXT NOT NULL,
  confidence_points INTEGER,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pool_id, user_id, game_id, week, season)
);

-- Games cache table
CREATE TABLE games_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  espn_event_id TEXT UNIQUE NOT NULL,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  game_status TEXT NOT NULL,
  game_time TIMESTAMP WITH TIME ZONE NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE games_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for pools
CREATE POLICY "Anyone can view active pools" ON pools FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can create pools" ON pools FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- RLS Policies for pool_members
CREATE POLICY "Anyone can view pool members" ON pool_members FOR SELECT USING (true);
CREATE POLICY "Users can join pools" ON pool_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave pools" ON pool_members FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for picks
CREATE POLICY "Users can view picks in their pools" ON picks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pool_members 
    WHERE pool_members.pool_id = picks.pool_id 
    AND pool_members.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own picks" ON picks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own picks" ON picks FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for games_cache
CREATE POLICY "Anyone can view games" ON games_cache FOR SELECT USING (true);
CREATE POLICY "System can update games" ON games_cache FOR ALL USING (true);
```

#### Create a Default Pool

```sql
-- Insert a default pool for testing
INSERT INTO pools (name, pool_type, season, entry_fee, is_active)
VALUES ('2024 Office Pool', 'pickem', 2024, 20.00, true);
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Wizix Degenerates
VITE_CURRENT_SEASON=2024
```

### 4. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Deployment

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and create a new site
3. Connect your GitHub repository
4. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`
   - `VITE_CURRENT_SEASON`
6. Deploy!

### Deploy to GitHub Pages

1. Update `vite.config.js` with your repo name:
   ```js
   base: '/your-repo-name/'
   ```

2. Build and deploy:
   ```bash
   npm run build
   git add dist -f
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

## Usage Guide

### For Users

1. **Sign Up**: Create an account with email and password
2. **Join a Pool**: Browse available pools and join one
3. **Make Picks**: Select winners for each week's games
4. **Track Scores**: Watch live scores update in real-time
5. **Check Leaderboard**: See your ranking against other players

### For Admins

To create pools, you need admin access. Update your user in Supabase:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

Then you can create new pools from the Pools page.

## Features Breakdown

### Authentication
- Email/password sign up and login
- Secure session management with Supabase
- Protected routes requiring authentication

### Pick'em Pool
- Pick winners straight up (no spreads)
- Picks lock at game time
- Automatic result calculation when games complete

### Real-Time Updates
- Scores refresh every 30 seconds during game days
- Live game status indicators
- Instant leaderboard updates

### ESPN Integration
- Team logos and colors
- Game schedules and times
- Live scores and game status
- Automatic NFL week calculation

## Error Handling

The app includes comprehensive error handling:

- **ESPN API Failures**: Retry logic with exponential backoff
- **Network Issues**: Graceful degradation with cached data
- **Authentication Errors**: Clear error messages
- **Form Validation**: Client-side validation before submission

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### "Failed to fetch scores"
- Check your internet connection
- ESPN API may be temporarily down
- Try refreshing the page

### "Authentication error"
- Verify Supabase credentials in `.env`
- Check Supabase project is active
- Clear browser cache and try again

### Picks not saving
- Ensure you're logged in
- Check you've joined a pool
- Verify picks are submitted before game time

## Contributing

This is a personal project, but suggestions are welcome! Open an issue or submit a pull request.

## License

MIT License - feel free to use this for your own office pools!

## Acknowledgments

- ESPN for the unofficial API
- Supabase for the amazing backend platform
- All the degens who make office pools fun

---

**Built with ❤️ and 🎲 by a fellow degen**

Let's go! 🏈
