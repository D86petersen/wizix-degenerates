-- Wizix Degenerates - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

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
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for pools
CREATE POLICY "Anyone can view active pools" ON pools FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can create pools" ON pools FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update pools" ON pools FOR UPDATE USING (
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
CREATE POLICY "Users can delete own picks" ON picks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for games_cache
CREATE POLICY "Anyone can view games" ON games_cache FOR SELECT USING (true);
CREATE POLICY "System can insert games" ON games_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update games" ON games_cache FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_pool_members_user_id ON pool_members(user_id);
CREATE INDEX idx_pool_members_pool_id ON pool_members(pool_id);
CREATE INDEX idx_picks_user_id ON picks(user_id);
CREATE INDEX idx_picks_pool_id ON picks(pool_id);
CREATE INDEX idx_picks_week_season ON picks(week, season);
CREATE INDEX idx_games_cache_week_season ON games_cache(week, season);
CREATE INDEX idx_games_cache_espn_event_id ON games_cache(espn_event_id);

-- Insert a default pool for testing
INSERT INTO pools (name, pool_type, season, entry_fee, is_active)
VALUES ('2024 Office Pool', 'pickem', 2024, 20.00, true);

-- Success message
SELECT 'Database setup complete! 🎲' AS message;
