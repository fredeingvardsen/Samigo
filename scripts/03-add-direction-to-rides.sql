-- Add direction field to rides table to specify if going to or from school
ALTER TABLE rides ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('to_school', 'from_school'));

-- Set default direction for existing rides
UPDATE rides SET direction = 'from_school' WHERE direction IS NULL;
