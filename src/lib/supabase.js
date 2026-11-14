import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const DEFAULT_MACHINES = [
  { id: 1, label: 'Machine 1', status: 'AVAILABLE' },
  { id: 2, label: 'Machine 2', status: 'AVAILABLE' },
  { id: 3, label: 'Machine 3', status: 'AVAILABLE' },
  { id: 4, label: 'Machine 4', status: 'AVAILABLE' },
  { id: 5, label: 'Machine 5', status: 'AVAILABLE' },
];

export const DEFAULT_USERS = [
  { id: 'demo-1', name: 'Aarav Sharma', room_number: 'B-204', phone_number: '9876543210' },
  { id: 'demo-2', name: 'Priya Nair', room_number: 'A-102', phone_number: '9876543211' },
  { id: 'demo-3', name: 'Rohan Verma', room_number: 'C-305', phone_number: '9876543212' },
  { id: 'demo-4', name: 'Ananya Iyer', room_number: 'A-108', phone_number: '9876543213' },
  { id: 'demo-5', name: 'Kabir Menon', room_number: 'B-210', phone_number: '9876543214' },
  { id: 'demo-6', name: 'Sneha Kulkarni', room_number: 'C-312', phone_number: '9876543215' },
  { id: 'demo-7', name: 'Vikram Joshi', room_number: 'B-201', phone_number: '9876543216' },
  { id: 'demo-8', name: 'Meera Pillai', room_number: 'A-115', phone_number: '9876543217' },
  { id: 'demo-9', name: 'Aditya Rao', room_number: 'C-301', phone_number: '9876543218' },
  { id: 'demo-10', name: 'Divya Hegde', room_number: 'B-215', phone_number: '9876543219' },
];
