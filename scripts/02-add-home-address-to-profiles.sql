-- Add home address fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS home_address TEXT,
ADD COLUMN IF NOT EXISTS home_address_lat NUMERIC,
ADD COLUMN IF NOT EXISTS home_address_lng NUMERIC;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_home_address ON profiles(home_address);
