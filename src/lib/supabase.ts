import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or ANON key missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

//export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Lightweight helpers that use Supabase APIs. These are minimal wrappers so the app
// can call the same functions while we migrate authentication to Supabase Auth.

/**
 * Attempt to authenticate a user.
 * Preferred: if `username` looks like an email, attempt Supabase Auth sign-in.
 * Fallback: query a legacy `users` table if present (keeps backward compatibility).
 */
export const authenticateUser = async (username: string, password: string) => {
  try {
    // If it's an email, use Supabase Auth (signInWithPassword)
    if (username.includes('@') && supabase.auth) {
      const res = await supabase.auth.signInWithPassword({ email: username, password });
      if (res.error) {
        return { success: false, error: res.error.message };
      }

      // fetch profile from public.profiles by auth user id (if available)
      const userId = res.data?.user?.id;
      if (userId) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        return { success: true, user: profile ?? { id: userId } };
      }

      return { success: true, user: res.data?.user };
    }

    // Legacy: try to find a row in `users` (if your project still has it)
    const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('is_active', true).maybeSingle();

    if (error) {
      // if table doesn't exist or other error, return a clear error
      console.error('Error querying legacy users table:', error.message || error);
      return { success: false, error: error.message || 'Auth error' };
    }

    if (!data) {
      return { success: false, error: 'User not found' };
    }

    // If legacy project stored password_hash, compare simply (this preserves legacy behavior).
    // Note: keep this only temporarily while migrating to Supabase Auth.
    const hashed = data.password_hash?.toString?.();
    if (hashed && (hashed === password || hashed === String(hashLegacy(password)))) {
      return { success: true, user: data };
    }

    return { success: false, error: 'Invalid credentials' };
  } catch (err: any) {
    console.error('authenticateUser error:', err.message || err);
    return { success: false, error: err.message || String(err) };
  }
};

// Simple legacy hash used only for compatibility with existing hashed passwords in the DB.
const hashLegacy = (password: string): number => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

/**
 * Create a legacy user row (keeps the old API). Prefer using Supabase Auth + profiles in new apps.
 */
export const createUser = async (userData: {
  fullName: string;
  username: string;
  password: string;
  department?: string;
  role?: string;
}) => {
  try {
    const hashed = String(hashLegacy(userData.password));
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          full_name: userData.fullName,
          username: userData.username,
          password_hash: hashed,
          department: userData.department || null,
          role: userData.role || 'staff',
          is_active: true
        }
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error('createUser error:', error.message || error);
      return { success: false, error: error.message || 'Failed to create user' };
    }

    return { success: true, user: data };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
};

export const testConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    return !error;
  } catch (err) {
    return false;
  }
};