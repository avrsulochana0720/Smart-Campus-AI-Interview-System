import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase environment validation.
 * Returns true only when both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are set to real values (not empty, not placeholder strings).
 */
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase is not configured. Google OAuth login will be hidden.\n' +
    'To enable it, create a .env file in the frontend/ directory with:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key\n' +
    'Then restart the dev server.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const signUp = async (email, password) => {
  return supabase.auth.signUp({ email, password });
};

export const signIn = async (email, password) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const resetPassword = async (email) => {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
