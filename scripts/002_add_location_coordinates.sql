-- Add location coordinate columns to rides table
ALTER TABLE rides 
ADD COLUMN departure_lat DECIMAL(10, 8),
ADD COLUMN departure_lng DECIMAL(11, 8),
ADD COLUMN destination_lat DECIMAL(10, 8),
ADD COLUMN destination_lng DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX idx_rides_departure_location ON rides(departure_lat, departure_lng);
CREATE INDEX idx_rides_destination_location ON rides(destination_lat, destination_lng);

-- Add comments for documentation
COMMENT ON COLUMN rides.departure_lat IS 'Latitude coordinate for departure location';
COMMENT ON COLUMN rides.departure_lng IS 'Longitude coordinate for departure location';
COMMENT ON COLUMN rides.destination_lat IS 'Latitude coordinate for destination';
COMMENT ON COLUMN rides.destination_lng IS 'Longitude coordinate for destination';
