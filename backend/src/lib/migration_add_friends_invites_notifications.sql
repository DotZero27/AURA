-- Migration: Add friends, tournament_invites, and notifications tables
-- Created for tournament team registration with invites feature

-- FRIENDS TABLE
-- Stores friend relationships between players
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT friends_unique_pair UNIQUE (player_id, friend_id),
  CONSTRAINT friends_no_self_reference CHECK (player_id != friend_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friends_player_id ON friends(player_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- TOURNAMENT INVITES TABLE
-- Stores tournament team invitations
CREATE TABLE IF NOT EXISTS tournament_invites (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  inviter_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  invitee_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT tournament_invites_invitee_or_token CHECK (
    (invitee_id IS NOT NULL AND token IS NULL) OR 
    (invitee_id IS NULL AND token IS NOT NULL)
  )
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tournament_invites_tournament_id ON tournament_invites(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_inviter_id ON tournament_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_invitee_id ON tournament_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_token ON tournament_invites(token);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_team_id ON tournament_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_status ON tournament_invites(status);

-- NOTIFICATIONS TABLE
-- Stores user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('friend_request', 'tournament_invite', 'team_invite', 'friend_accepted')),
  reference_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_player_id ON notifications(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Trigger to update updated_at for friends table
CREATE OR REPLACE FUNCTION update_friends_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_friends_updated_at();





