import { useState } from 'react';
import { useAuthStore } from '../lib/authStore';
import { useMessageStore } from '../lib/messageStore';
import { supabase } from '../lib/supabase';
import { X, Search, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export function AddContactModal({ onClose, onAdd }) {
  const { user } = useAuthStore();
  const { addContact } = useMessageStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, phone_number')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%,phone_number.ilike.%${term}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (profile) => {
    if (selectedUsers.find((u) => u.id === profile.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== profile.id));
    } else {
      setSelectedUsers([...selectedUsers, profile]);
    }
  };

  const handleAddContacts = async () => {
    for (const profile of selectedUsers) {
      await addContact(user.id, profile.id, profile.phone_number);
    }
    onAdd();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Contact</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, username, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Searching...</p>
            ) : results.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {searchTerm ? 'No users found' : 'Start typing to search'}
              </p>
            ) : (
              results.map((profile) => (
                <motion.button
                  key={profile.id}
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  onClick={() => handleSelectUser(profile)}
                  className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition ${
                    selectedUsers.find((u) => u.id === profile.id) ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <img
                    src={profile.avatar_url || `https://images.unsplash.com/photo-1534528741775-53a8fae89ca1?w=40&h=40&fit=crop`}
                    alt={profile.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{profile.display_name}</p>
                    <p className="text-xs text-gray-500">@{profile.username}</p>
                  </div>
                  {selectedUsers.find((u) => u.id === profile.id) && (
                    <Check size={20} className="text-blue-600" />
                  )}
                </motion.button>
              ))
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Selected: {selectedUsers.length} {selectedUsers.length === 1 ? 'contact' : 'contacts'}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddContacts}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Add Contact{selectedUsers.length > 1 ? 's' : ''}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
