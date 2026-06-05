import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: 'customer' | 'admin';
  created_at: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type HallBooking = {
  id: string;
  user_id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  hall_type: 'party_hall' | 'conference_hall';
  event_date: string;
  end_date: string | null;
  event_type: string | null;
  guest_count: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: string;
  payment_reference: string | null;
  special_requests: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  image_url: string | null;
  images: string[];
  video_url: string | null;
  badge: string | null;
  stock: number;
  unit: string;
  is_organic: boolean;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  delivery_address: string | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  estimated_delivery: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
};

export type CottageBooking = {
  id: string;
  user_id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  cottage_type: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: string;
  special_requests: string | null;
  created_at: string;
};

export type FarmVisit = {
  id: string;
  user_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_email: string | null;
  visit_type: string;
  visit_date: string;
  time_slot: string;
  group_size: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: string;
  notes: string | null;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type GalleryItem = {
  id: string;
  title: string | null;
  description: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  category: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
