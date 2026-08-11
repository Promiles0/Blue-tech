import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_API_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*');

  if (error) {
    throw error;
  }

  return data;
}

export default supabase;
