import { supabase } from '../supabase';

export const authService = {
  async getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  },
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  }
};
