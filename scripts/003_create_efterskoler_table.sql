-- Create efterskoler table to store all Danish eftersk oler
CREATE TABLE IF NOT EXISTS efterskoler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT,
  region TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster location searches
CREATE INDEX IF NOT EXISTS idx_efterskoler_city ON efterskoler(city);
CREATE INDEX IF NOT EXISTS idx_efterskoler_name ON efterskoler(name);
CREATE INDEX IF NOT EXISTS idx_efterskoler_coordinates ON efterskoler(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE efterskoler ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read efterskoler (public data)
CREATE POLICY "Allow public read access to efterskoler"
  ON efterskoler
  FOR SELECT
  TO public
  USING (true);
