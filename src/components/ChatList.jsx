import { useEffect, useState } from 'react';
import { useMessageStore } from '../lib/messageStore';
import { useAuthStore } from '../lib/authStore';
import { supabase } from '../lib/supabase';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export function ChatList({ onSelectConversation }) {
  const { conversations, fetchConversations } = useMessageStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    if (user) {
      fetchConversations(user.id);
      const subscription = supabase
        .channel(`conversations:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          fetchConversations(user.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    const filtered = conversations.filter((conv) => {
      const otherUser = conv.user_a_id === user?.id ? conv.user_b : conv.user_a;
      return otherUser?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFiltered(filtered);
  }, [searchTerm, conversations, user?.id]);

  const getOtherUser = (conversation) => {
    return conversation.user_a_id === user?.id ? conversation.user_b : conversation.user_a;
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Chatteme</h1>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filtered.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              return (
                <motion.button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  className="w-full p-3 rounded-lg text-left transition group"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={otherUser?.avatar_url || `https://images.unsplash.com/photo-1534528741775-53a8fae89ca1?w=48&h=48&fit=crop`}
                      alt={otherUser?.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {otherUser?.display_name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
