-- Add school_id foreign key to profiles table
ALTER TABLE profiles
ADD COLUMN school_id UUID REFERENCES efterskoler(id);

-- Create index for faster lookups
CREATE INDEX idx_profiles_school_id ON profiles(school_id);

-- Create school_suggestions table for users to suggest new schools
CREATE TABLE IF NOT EXISTS school_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  city TEXT,
  region TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  additional_info TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user suggestions
CREATE INDEX idx_school_suggestions_user_id ON school_suggestions(user_id);
CREATE INDEX idx_school_suggestions_status ON school_suggestions(status);
