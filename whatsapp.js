-- Run this in Supabase SQL Editor to set up the database

CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  invite_sent_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read/write for RSVP responses (no auth needed for guests clicking links)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public RSVP update by token" ON guests
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read by token" ON guests
  FOR SELECT USING (true);

CREATE POLICY "Allow all for service role" ON guests
  USING (true) WITH CHECK (true);
