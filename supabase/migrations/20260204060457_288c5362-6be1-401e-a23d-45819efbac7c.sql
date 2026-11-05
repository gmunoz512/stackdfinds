-- Add city column to vendor_profiles for location-based filtering
ALTER TABLE vendor_profiles 
ADD COLUMN IF NOT EXISTS city text DEFAULT 'Tulum';

-- Update existing vendors to default city (Tulum)
UPDATE vendor_profiles SET city = 'Tulum' WHERE city IS NULL;

-- Create index for faster city-based queries
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_city ON vendor_profiles(city);