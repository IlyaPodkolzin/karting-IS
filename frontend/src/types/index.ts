export interface User {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'admin';
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Kartodrome {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  image_url: string | null;
  phone: string | null;
  email: string | null;
  working_hours: Record<string, string> | null;
  created_at: string;
}

export interface Session {
  id: number;
  kartodrome_id: number;
  session_number: number;
  session_type: 'usual' | 'kids';
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  price: number;
  available_slots?: number;
}

export interface Booking {
  id: number;
  user_id: number;
  session_id: number;
  kart_id: number | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  created_at: string;
  updated_at: string;
  session?: Session;
}

export interface Lap {
  id: number;
  booking_id: number;
  lap_number: number;
  lap_time: number;
  timestamp: string;
}

export interface Statistic {
  id: number;
  user_id: number;
  kartodrome_id: number;
  best_lap_time: number | null;
  average_lap_time: number | null;
  total_laps: number;
  last_updated: string;
}

export interface Kart {
  id: number;
  number: string;
  type: string;
  status: 'available' | 'booked' | 'maintenance' | 'retired';
  engine_type: string | null;
  last_maintenance: string | null;
  kartodrome_id: number;
}

export interface AnalyticsLoad {
  kartodrome_id: number;
  kartodrome_name: string;
  total_slots: number;
  taken_slots: number;
  occupancy_pct: number;
}
