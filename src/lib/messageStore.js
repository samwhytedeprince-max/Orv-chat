import { create } from 'zustand';
import { supabase } from './supabase';

export const useMessageStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  contacts: [],
  loading: false,
  error: null,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  setContacts: (contacts) => set({ contacts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchConversations: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user_a:profiles!user_a_id(id, display_name, avatar_url),
          user_b:profiles!user_b_id(id, display_name, avatar_url)
        `)
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      set({ conversations: data || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, display_name, avatar_url),
          media(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  sendMessage: async (conversationId, senderId, content, messageType = 'text', mediaId = null) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          media_id: mediaId,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        messages: [...state.messages, data],
      }));

      return { data, error: null };
    } catch (err) {
      set({ error: err.message });
      return { data: null, error: err };
    }
  },

  markAsRead: async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchContacts: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_profile:contact_user_id(id, display_name, avatar_url, phone_number)
        `)
        .eq('user_id', userId)
        .eq('is_blocked', false);

      if (error) throw error;
      set({ contacts: data || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addContact: async (userId, contactUserId, phoneNumber = null) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          contact_user_id: contactUserId,
          phone_number: phoneNumber,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        contacts: [...state.contacts, data],
      }));

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  createOrGetConversation: async (userId, otherUserId) => {
    try {
      const [minId, maxId] = [userId, otherUserId].sort();

      let { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user_a_id.eq.${minId},user_b_id.eq.${maxId}),and(user_a_id.eq.${maxId},user_b_id.eq.${minId})`)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_a_id: minId,
            user_b_id: maxId,
          })
          .select()
          .single();

        if (createError) throw createError;
        data = newConv;
      }

      set({ currentConversation: data });
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
}));
