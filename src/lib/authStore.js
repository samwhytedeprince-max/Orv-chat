import { create } from 'zustand';
import { supabase } from './supabase';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      set({ profile: data });
    } catch (err) {
      set({ error: err.message });
    }
  },

  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      set({ profile: data });
      return { data, error: null };
    } catch (err) {
      set({ error: err.message });
      return { data: null, error: err };
    }
  },

  createProfile: async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) throw error;
      set({ profile: data });
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
}));
