/*
  # Chatteme Messaging App Schema

  1. New Tables
    - `profiles` - User profiles with contact info
    - `contacts` - User's contact list
    - `conversations` - Messaging conversations
    - `messages` - Individual messages with media support
    - `call_logs` - Voice and video call records
    - `media` - Media files (photos, videos, voice notes)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Implement proper ownership checks

  3. Features
    - Real-time messaging
    - Media sharing (photos, videos, voice notes)
    - Call logging
    - Message read status
    - User presence
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  phone_number text UNIQUE,
  status text DEFAULT 'offline',
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contact_user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  phone_number text,
  custom_name text,
  is_blocked boolean DEFAULT false,
  added_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_contact CHECK (user_id != contact_user_id),
  CONSTRAINT unique_contact UNIQUE (user_id, contact_user_id)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_conversation CHECK (user_a_id != user_b_id),
  CONSTRAINT unique_conversation UNIQUE (user_a_id, user_b_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  file_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'voice')),
  file_size integer,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media"
  ON media FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create media"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content text,
  media_id uuid REFERENCES media ON DELETE SET NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'call')),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Create call logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations ON DELETE CASCADE,
  caller_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('voice', 'video')),
  duration_seconds integer DEFAULT 0,
  status text NOT NULL DEFAULT 'missed' CHECK (status IN ('completed', 'missed', 'declined')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation call logs"
  ON call_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = call_logs.conversation_id
      AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can create call logs"
  ON call_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = caller_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_profiles_phone ON profiles(phone_number);
CREATE INDEX idx_conversations_users ON conversations(user_a_id, user_b_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_call_logs_conversation ON call_logs(conversation_id, started_at DESC);
