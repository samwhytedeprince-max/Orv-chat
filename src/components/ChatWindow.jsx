import { useEffect, useRef, useState } from 'react';
import { useMessageStore } from '../lib/messageStore';
import { useAuthStore } from '../lib/authStore';
import { supabase } from '../lib/supabase';
import { Send, Paperclip, Mic, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatWindow({ conversation }) {
  const { messages, fetchMessages, sendMessage } = useMessageStore();
  const { user } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id);
      const subscription = supabase
        .channel(`messages:${conversation.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchMessages(conversation.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [conversation?.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !conversation?.id || !user) return;

    await sendMessage(conversation.id, user.id, messageText, 'text');
    setMessageText('');
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const getOtherUser = () => {
    return conversation.user_a_id === user?.id ? conversation.user_b : conversation.user_a;
  };

  const otherUser = getOtherUser();

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={otherUser?.avatar_url || `https://images.unsplash.com/photo-1534528741775-53a8fae89ca1?w=48&h=48&fit=crop`}
            alt={otherUser?.display_name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold text-gray-900">{otherUser?.display_name}</h2>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Voice call"
          >
            <Phone size={20} className="text-gray-600" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Video call"
          >
            <Video size={20} className="text-gray-600" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 ${
                  message.sender_id === user?.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3 items-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Attach file"
          >
            <Paperclip size={20} className="text-gray-600" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            className={`p-2 rounded-full transition ${isRecording ? 'bg-red-100' : 'hover:bg-gray-100'}`}
            title="Voice note"
          >
            <Mic size={20} className={isRecording ? 'text-red-600' : 'text-gray-600'} />
          </motion.button>

          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!messageText.trim()}
            className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-full transition"
          >
            <Send size={20} />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
