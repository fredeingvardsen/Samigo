-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  school_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rides table for ride offers
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  departure_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats > 0),
  price_per_seat DECIMAL(10,2),
  pickup_spots TEXT[], -- Array of pickup locations
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ride_requests table for passengers requesting rides
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pickup_location TEXT NOT NULL,
  seats_requested INTEGER DEFAULT 1 CHECK (seats_requested > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ride_id, passenger_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Rides policies
CREATE POLICY "Anyone can view active rides" ON public.rides
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create their own rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update their own rides" ON public.rides
  FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Users can delete their own rides" ON public.rides
  FOR DELETE USING (auth.uid() = driver_id);

-- Ride requests policies
CREATE POLICY "Users can view requests for their rides" ON public.ride_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT driver_id FROM public.rides WHERE id = ride_id
    ) OR auth.uid() = passenger_id
  );

CREATE POLICY "Users can create ride requests" ON public.ride_requests
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can update their own requests" ON public.ride_requests
  FOR UPDATE USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update requests for their rides" ON public.ride_requests
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT driver_id FROM public.rides WHERE id = ride_id
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rides_departure_time ON public.rides(departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_id ON public.ride_requests(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_passenger_id ON public.ride_requests(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON public.ride_requests(status);
